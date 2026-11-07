/**
 * The shell's activity: a WebView on the app's bundled web build, or its dev
 * server in debug builds, with the bridge and every default `mobile.config`
 * turns on. An app subclasses it, registers its own handlers in
 * `onBridgeReady`, and overrides any hook rather than editing this file.
 */
package io.github.timmo001.groundwork.shell

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

open class ShellActivity : ComponentActivity() {
  lateinit var webView: WebView
    private set

  lateinit var config: ShellConfig
    private set

  lateinit var bridge: Bridge
    private set

  lateinit var notifications: Notifications
    private set

  private lateinit var assetLoader: WebViewAssetLoader
  private var lastTheme: String? = null
  private var pendingFiles: ValueCallback<Array<Uri>>? = null
  private var pendingPermission: PermissionRequest? = null

  /** True in debug builds of the app. */
  val dev: Boolean
    get() = applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0

  /**
   * The page the shell opens: the dev server in debug builds when the app's
   * manifest names one in `groundwork.devUrl`, otherwise the bundled build
   * under `assets/web/`.
   */
  open val startUrl: String
    get() = devUrl.takeIf { dev } ?: "$APP_ORIGIN/index.html"

  /** The app's own origin, always allowed to use the bridge. */
  val appOrigin: String
    get() = devUrl?.takeIf { dev }?.let(::originOf) ?: APP_ORIGIN

  private val devUrl: String?
    get() =
      packageManager
        .getApplicationInfo(packageName, PackageManager.GET_META_DATA)
        .metaData
        ?.getString("groundwork.devUrl")

  private val chooseFiles =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      pendingFiles?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
      pendingFiles = null
    }

  private val askMedia =
    registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { granted ->
      val request = pendingPermission ?: return@registerForActivityResult
      pendingPermission = null
      val allowed = request.resources.filter { granted[permissionFor(it)] == true }.toTypedArray()

      if (allowed.isEmpty()) request.deny() else request.grant(allowed)
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    config = loadConfig()
    notifications = Notifications(this, config).also { if (config.notifications) it.createChannels() }
    bridge = Bridge { allowedOrigins() }
    assetLoader =
      WebViewAssetLoader.Builder()
        .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this).let { assets ->
          WebViewAssetLoader.PathHandler { path -> assets.handle("web/$path") }
        })
        .build()

    WebView.setWebContentsDebuggingEnabled(dev && config.devTools)
    webView = createWebView()
    setContentView(webView)
    ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
      view.updatePadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }

    registerShellHandlers()
    onBridgeReady(bridge)
    bridge.attach(webView)

    if (config.back) onBackPressedDispatcher.addCallback(this, backCallback)

    if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
      webView.loadUrl(deepLinkUrl(intent) ?: startUrl)
      shareOf(intent)?.let { bridge.send("share", it) }
    }
  }

  /** Reads `mobile.config`; override to build one in code. */
  protected open fun loadConfig(): ShellConfig = ShellConfig.load(this)

  /** Every origin the bridge answers: the app's own and `config.origins`. */
  protected open fun allowedOrigins(): Set<String> = setOf(appOrigin) + config.origins

  /** Registers the app's own handlers, or replaces the shell's, by name. */
  protected open fun onBridgeReady(bridge: Bridge) = Unit

  /** Makes the WebView; override to change its settings after calling this. */
  @SuppressLint("SetJavaScriptEnabled")
  protected open fun createWebView(): WebView =
    WebView(this).apply {
      layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.mediaPlaybackRequiresUserGesture = false
      settings.allowFileAccess = false
      settings.allowContentAccess = false

      // The page follows the theme's isLightTheme through prefers-color-scheme
      // and is never darkened by the WebView.
      if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
        WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
      }

      CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)
      webViewClient = ShellWebViewClient()
      webChromeClient = ShellChromeClient()
      if (config.downloads) setDownloadListener(::download)
    }

  private fun registerShellHandlers() {
    bridge.handle("info") { _, reply ->
      reply.ok(JSONObject().put("dev", dev).put("version", VERSION))
    }
    bridge.handle("openExternal") { request, reply ->
      reply.ok(openExternal(Uri.parse(request.paramsObject.getString("url"))))
    }
    bridge.handle("notify") { request, reply ->
      reply.ok(notifications.show(request.paramsObject))
    }
    bridge.handle("androidTheme") { _, reply -> reply.ok(currentTheme()) }

    if (!config.push) {
      bridge.handle("pushState") { _, reply -> reply.ok("unsupported") }
      bridge.handle("subscribePush") { _, reply -> reply.ok("unsupported") }
      bridge.handle("unsubscribePush") { _, reply -> reply.ok(false) }
      return
    }

    bridge.handle("pushState") { _, reply -> reply.ok(Push.state(this)) }
    bridge.handle("subscribePush") { request, reply ->
      withNotificationPermission { granted ->
        if (granted) Push.subscribe(this, request.paramsObject) { reply.ok(it) } else reply.ok("denied")
      }
    }
    bridge.handle("unsubscribePush") { request, reply ->
      Push.unsubscribe(this, request.paramsObject) { reply.ok(true) }
    }
  }

  private var pendingNotificationPermission: ((Boolean) -> Unit)? = null

  private val askNotifications =
    registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
      pendingNotificationPermission?.invoke(granted)
      pendingNotificationPermission = null
    }

  /** Asks for notifications when they aren't allowed yet, then calls `then`. */
  protected fun withNotificationPermission(then: (Boolean) -> Unit) {
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
      then(true)
      return
    }

    pendingNotificationPermission = then
    askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
  }

  /**
   * A share from another app (`ACTION_SEND` with text or a link), as the
   * view's `ShellShare`. Null when the intent isn't one or `shares` is off.
   */
  protected open fun shareOf(intent: Intent?): JSONObject? {
    if (!config.shares || intent?.action != Intent.ACTION_SEND) return null

    val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return null
    val title = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: intent.getStringExtra(Intent.EXTRA_TITLE)
    val share = JSONObject()

    title?.let { share.put("title", it) }

    if (URLUtil.isNetworkUrl(text.trim())) share.put("url", text.trim()) else share.put("text", text)

    return share
  }

  private fun currentTheme(): JSONObject =
    if (config.androidTheme) AndroidTheme.read(this) else AndroidTheme.none

  /** Sends the dynamic color again when it changed, such as with a new wallpaper. */
  private fun sendThemeIfChanged() {
    if (!config.androidTheme) return

    val theme = currentTheme()
    val text = theme.toString()

    if (lastTheme != null && lastTheme != text) bridge.send("androidTheme", theme)
    lastTheme = text
  }

  override fun onResume() {
    super.onResume()
    sendThemeIfChanged()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    sendThemeIfChanged()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    shareOf(intent)?.let {
      bridge.send("share", it)
      return
    }

    val url = deepLinkUrl(intent) ?: return

    bridge.send("deepLink", JSONObject().put("url", url))
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    webView.saveState(outState)
  }

  override fun onDestroy() {
    webView.destroy()
    super.onDestroy()
  }

  /**
   * The page a deep link or App Link opens: links on an allowed origin open
   * as they are, the app's own scheme maps onto its pages. Null when the
   * intent isn't one, or `deepLinks` is off.
   */
  protected open fun deepLinkUrl(intent: Intent?): String? {
    if (!config.deepLinks || intent?.action != Intent.ACTION_VIEW) return null

    val data = intent.data ?: return null

    if (isAllowed(data)) return data.toString()

    val path = listOfNotNull(data.host, data.path?.trimStart('/')).joinToString("/")
    val query = data.encodedQuery?.let { "?$it" } ?: ""
    val fragment = data.encodedFragment?.let { "#$it" } ?: ""

    return "$appOrigin/$path$query$fragment"
  }

  /** Opens a URL in the browser or the app that handles it. */
  protected open fun openExternal(uri: Uri): Boolean =
    try {
      startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE))
      true
    } catch (_: ActivityNotFoundException) {
      false
    }

  private fun isAllowed(uri: Uri): Boolean = originOf(uri.toString()) in allowedOrigins()

  private fun download(url: String, userAgent: String, disposition: String, mimeType: String, length: Long) {
    val name = URLUtil.guessFileName(url, disposition, mimeType)
    val request =
      DownloadManager.Request(Uri.parse(url))
        .setMimeType(mimeType)
        .addRequestHeader("User-Agent", userAgent)
        .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url) ?: "")
        .setTitle(name)
        .setDescription(config.labels.downloadFinished)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)

    getSystemService(DownloadManager::class.java).enqueue(request)
  }

  private val backCallback =
    object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        if (webView.canGoBack()) {
          webView.goBack()
          return
        }

        isEnabled = false
        onBackPressedDispatcher.onBackPressed()
        isEnabled = true
      }
    }

  /** Serves the bundled build, keeps allowed pages in the app and opens the rest outside. */
  protected open inner class ShellWebViewClient : WebViewClientCompat() {
    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
      assetLoader.shouldInterceptRequest(request.url)

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
      val uri = request.url

      if (isAllowed(uri)) return false

      val scheme = uri.scheme?.lowercase()
      val external =
        (scheme == "http" || scheme == "https") && config.externalLinks ||
          scheme in config.externalSchemes

      if (external) openExternal(uri)

      return true
    }

    override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
      bridge.detach()
    }
  }

  /** The camera and microphone, and the file chooser, when the config allows them. */
  protected open inner class ShellChromeClient : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
      val wanted = request.resources.mapNotNull(::permissionFor)

      if (!config.media || !isAllowed(request.origin) || wanted.isEmpty()) {
        request.deny()
        return
      }

      pendingPermission?.deny()
      pendingPermission = request
      askMedia.launch(wanted.toTypedArray())
    }

    override fun onShowFileChooser(
      webView: WebView,
      callback: ValueCallback<Array<Uri>>,
      params: FileChooserParams,
    ): Boolean {
      if (!config.files) return false

      pendingFiles?.onReceiveValue(null)
      pendingFiles = callback

      return try {
        chooseFiles.launch(params.createIntent())
        true
      } catch (_: ActivityNotFoundException) {
        pendingFiles = null
        false
      }
    }
  }

  companion object {
    /** The bundled build's origin, served from `assets/web/` by the asset loader. */
    const val APP_ORIGIN = "https://${WebViewAssetLoader.DEFAULT_DOMAIN}"

    /** The shell's version, reported to the view by `info`. */
    const val VERSION = "0.1.0"

    private fun originOf(url: String): String =
      Uri.parse(url).let { uri ->
        val port = if (uri.port == -1) "" else ":${uri.port}"
        "${uri.scheme}://${uri.host}$port"
      }

    private fun permissionFor(resource: String): String? =
      when (resource) {
        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
        else -> null
      }
  }
}
