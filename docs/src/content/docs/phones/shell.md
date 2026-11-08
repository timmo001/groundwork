---
title: The Android shell
description: The page side of the Android shell, how one app runs in the shell and as a PWA, the bridge's requests and messages, and adding the app's own.
---

The Android shell is a small Kotlin app around the system WebView. `@timmo001/groundwork-mobile` is its page side, as `@timmo001/groundwork-desktop`'s view is on the desktop. It works out whether the page runs in the shell, talks to the shell over the bridge when it does, and falls back to the [PWA](/phones/pwa) pieces when it doesn't, so one app runs in both.

```ts
import { connectMobile } from "@timmo001/groundwork-mobile/view";
import { pageTheme } from "@timmo001/groundwork-tokens/page";

import mobileConfig from "../mobile.config.ts";
import pwaConfig from "../pwa.config.ts";

const page = pageTheme({ key: "my-app", defaultTheme: "base", themes });

const mobile = await connectMobile(mobileConfig, {
  pwa: pwaConfig,
  onShare: (share) => openDraft(share),
  onDeepLink: (url) => route(url),
  onAndroidTheme: (colors) => void page.setAndroidTheme(colors),
});
```

`mobile.shell` reads `true` inside the shell. Either way, shares arrive as a `gw-share` event and deep links as `gw-deep-link`, so the app listens in one place.

## Options

`mobile.config.ts` keeps each default on unless it turns it off, so an empty config gives all of them. The shell reads the same file, as JSON, when it's built.

```ts
import { defineMobileConfig } from "@timmo001/groundwork-mobile";

export default defineMobileConfig({ origins: ["https://service.example"] });
```

| Option | Default | Does |
| --- | --- | --- |
| `url` | None | A hosted page to open instead of the bundled build; its origin may use the bridge |
| `origins` | None | Origins besides the app's own whose pages may use the bridge |
| `shares` | On | Shares from other apps, as `gw-share` |
| `notifications` | On | System notifications from the view and from pushes |
| `push` | On | UnifiedPush, with the embedded FCM distributor where there's no distributor |
| `deepLinks` | On | Deep links and App Links, passed to the view |
| `externalLinks` | On | Links outside the allowed origins open in the browser |
| `externalSchemes` | `mailto`, `tel` | Schemes besides http(s) that open outside the app |
| `back` | On | Back steps through the page's history before leaving the app |
| `downloads` | On | Downloads go to Downloads, with a notification when they finish |
| `media` | On | The camera and microphone, when the page asks and the person allows it |
| `files` | On | The file chooser for `<input type="file">` |
| `androidTheme` | On | The phone's dynamic color, passed to the view on start and on every change |
| `devTools` | On | WebView debugging through Chrome, in debug builds only |
| `labels` | English | The notification channels' names, the download notice and the saved file notice |

## What works where

| | In the shell | As a PWA |
| --- | --- | --- |
| `notify` | A system notification | A service worker notification once allowed, otherwise `onNotice` |
| `subscribePush` | UnifiedPush, registered through the push contract | Web Push |
| `openExternal` | The browser or the app that handles the link | A new tab |
| Shares | The share sheet, through the shell | The share target |
| Dynamic color | `onAndroidTheme` | None |
| `localNetwork` | Asks for `ACCESS_LOCAL_NETWORK` on Android 17 | `granted`; the browser decides |
| `discoverServices` | mDNS through NsdManager, or the system's picker | Rejects |
| `scanQr` | The shell's scanner | Rejects; scan in the page with `scanPairingLink` |
| `setShortcuts` | The launcher's long-press menu and the share sheet | Answers 0; the manifest's `shortcuts` give the menu |
| `pinShortcut` | Asks the launcher to pin one | Answers false |
| `disableShortcuts` | Removes them, greying out pinned ones | Does nothing |
| `saveFile` | Saves a file the page made to Downloads | The browser's download |
| `call` | The app's own Kotlin handlers | Rejects |

Both push paths post the same subscription to the service, as the [push contract](/behavior#push) describes, so a service doesn't care which one a client uses.

## The bridge

The shell injects a `groundworkShell` object into allowed pages with `WebViewCompat.addWebMessageListener`. Each side sends JSON text with a `type`:

| `type` | From | Carries |
| --- | --- | --- |
| `request` | The view | `id`, `name` and `params` |
| `reply` | The shell | The request's `id`, `ok`, and `value` or `error` |
| `message` | The shell | `name` and `data`, whenever it has news |

The shell's own requests are `info`, `openExternal`, `notify`, `androidTheme`, `subscribePush`, `unsubscribePush`, `pushState`, `localNetwork`, `discoverServices`, `scanQr`, `setShortcuts`, `pinShortcut`, `disableShortcuts` and `saveFile`, and its messages are `notice`, `deepLink`, `share` and `androidTheme`. `@timmo001/groundwork-mobile/bridge` exports each one's schema, and every reply and message is parsed with it as it comes in.

## The local network, discovery and QR codes

An app that pairs with a service on the person's network, such as a computer, finds it, scans its pairing code and reaches it through three requests:

```ts
if ((await mobile.localNetwork()) !== "granted") showWhyItNeedsTheNetwork();

const [found] = await mobile.discoverServices({ type: "_my-service._tcp" });
const service = found && `http://${found.host}:${found.port}`;

const text = await mobile.scanQr({ hint: "Scan the code on your computer" });
const link = text === undefined ? undefined : parsePairingLink(text);
```

- **`localNetwork`.** From Android 17, an app that targets it can't reach the local network, from its own code or its WebView, until the person allows it. The app declares `ACCESS_LOCAL_NETWORK` in its manifest; this asks for it and answers `granted`, `denied`, or `undeclared` when the manifest lacks it. Before Android 17 it answers `granted`.
- **`discoverServices`.** Finds mDNS services of a type through NsdManager. With the permission it browses for `timeoutMs` (3 seconds by default) and lists every service it resolved. Without it, the system's picker asks the person to choose one, which grants the app that device alone, and the list holds it or nothing. `mode: "browse"` or `"picker"` picks one way. Each service has its `name`, `type`, `hostname`, a `host` ready for a URL (IPv4 first, IPv6 in brackets), every address, its `port` and its TXT record as `txt`.
- **`scanQr`.** Opens the shell's scanner, CameraX with zxing-cpp, and answers the first QR code's text, or `undefined` when the person backs out. It needs no Google Play services: the WebView's `BarcodeDetector` relies on them on Android, so it finds nothing on a phone without them. The app declares `CAMERA`.

A page served over plain http, such as a service's own UI on the network, needs the app to allow cleartext in its own manifest or network security config; the shell sets neither.

## Shortcuts

Shortcuts open a page from outside the app: on a long press of the app's icon, pinned to the home screen, or in the share sheet's direct row. Each opens its `url` as a deep link, an allowed origin's page or the app's own scheme, through the same `deepLinkUrl` as any other link, so an open app gets it as `onDeepLink` without reloading.

```ts
await mobile.setShortcuts([
  { id: "updates", label: "Updates", url: "my-app://updates", icon: mdiUpdate },
  { id: "office", label: "Office PC", url: "my-app://office", share: true },
]);

const pinned = await mobile.pinShortcut({ id: "logs", label: "Logs", url: "my-app://logs" });

await mobile.disableShortcuts(["office"], "Office PC was removed");
```

- **`setShortcuts`** replaces the dynamic shortcuts, ranked in order. Most launchers show the first 4 on a long press, and the launcher caps the whole list, often at 15; it answers how many it took.
- **`pinShortcut`** asks the launcher to put one on the home screen, and answers false where it can't. A pinned shortcut lasts until the person removes it, so keep its `id` stable.
- **`disableShortcuts`** removes the shortcuts with those ids. Pinned ones stay, greyed out, showing the message when tapped, until `setShortcuts` or `pinShortcut` publishes the same id again.
- **`icon`** is an SVG path on a 24 unit grid, such as a Material Design Icon's, drawn in `gw_shortcut_foreground` on `gw_shortcut_background`. Without one, the shortcut shows the app's icon. Override either color as the notification icon's are.
- **Sharing shortcuts.** One with `share: true` shows in the share sheet's direct row, and a share sent to it arrives with its id as `shortcutId`. Android only offers the share sheet shortcuts the launcher can show too, so list sharing shortcuts after the ones meant for the long-press menu. The activity needs a `share-target` with the shell's category, in `res/xml/shortcuts.xml`, named by an `android.app.shortcuts` meta-data entry on the activity:

```xml
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <share-target android:targetClass="com.example.app.MainActivity">
    <data android:mimeType="text/plain" />
    <category android:name="dev.timmo.groundwork.shell.SHARE_TARGET" />
  </share-target>
</shortcuts>
```

The app's own Kotlin can publish them too, through the activity's `shortcuts`, whose `ids()` lists every dynamic and pinned one.

## Saving files

A file the page makes itself, such as an export, goes through `saveFile`, which saves it to the phone's Downloads in the shell and downloads it in a browser:

```ts
await mobile.saveFile({ name: "readings.csv", type: "text/csv", contents: csv });
```

`contents` is text or a `Blob`. The shell writes it through MediaStore, which needs no permission, and shows the `fileSaved` label. The Android WebView ignores `<a download>` on the `blob:` and `data:` links a page makes, so such a link does nothing in the shell; use `saveFile` instead.

## The app's own requests

An app adds its own requests in its own Kotlin module, beside the synced shell, and calls them by name with the schema to read the reply:

```ts
import { Schema } from "effect";

const level = await mobile.call("battery", Schema.Number);
```

Messages the app's Kotlin sends, under names the shell doesn't use, go to `onMessage` with their JSON data, for the app to parse with its own schema.

## The Kotlin side

The shell is a Gradle library module, `packages/mobile/android/shell`, for Android 14 and up. The app's own module depends on it and subclasses `ShellActivity`, so the synced copy is never edited:

```kotlin
class MainActivity : ShellActivity() {
  override fun onBridgeReady(bridge: Bridge) {
    bridge.handle("battery") { _, reply ->
      reply.ok(getSystemService(BatteryManager::class.java)
        .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY))
    }
  }
}
```

`bridge.send(name, data)` sends a message to the view, held until the page connects. A handler under one of the shell's names replaces the shell's own, and `bridge.remove(name)` takes one away. Every other hook, such as `startUrl`, `allowedOrigins`, `createWebView`, `deepLinkUrl` and `openExternal`, is open to override.

The WebView reads the allowed origins only when the bridge is injected. When they change at run time, such as after pairing with a new service, `refreshOrigins(url)` injects it again with the current `allowedOrigins()` and loads `url`, `startUrl` by default:

```kotlin
override val startUrl get() = paired?.url ?: super.startUrl
override fun allowedOrigins() = super.allowedOrigins() + listOfNotNull(paired?.origin)

fun onPaired(service: Service) {
  paired = service
  refreshOrigins()
}
```

An origin is a scheme, host and port, such as `http://192.168.1.5:9170`, with IPv6 hosts in brackets.

`withPermission`, `withNotificationPermission`, `withLocalNetwork`, `scanQr` and `declares` are there for the app's own handlers too.

The app's build writes `mobile.config.ts` as JSON to `assets/groundwork/mobile.config.json`, and its web build to `assets/web/`, which the shell serves from `https://appassets.androidplatform.net`. In debug builds a `groundwork.devUrl` meta-data entry in the app's manifest points the shell at the dev server instead.

The app's manifest declares the activity, its deep link and App Link intent filters, and the permissions it wants: the camera or microphone for the page and `scanQr`, and `ACCESS_LOCAL_NETWORK` for the local network. The shell's own manifest asks only for the internet and notifications, and declares the scanner's activity.

The page follows the phone's dark mode through the theme's `isLightTheme`, which the WebView passes on as `prefers-color-scheme`, and the WebView never darkens it itself.

The shell draws edge to edge, under the status bar, the cutout and the navigation bar, and only the keyboard resizes the page. With `viewport-fit=cover` in the page's viewport meta, the WebView fills in `env(safe-area-inset-*)`: `gw-app-bar` reaches up under the status bar so it takes the bar's surface, and the page pads its sides and bottom with the other insets, as the template's `index.css` does.

## Shares, tiles, Live Updates and push

- **Shares.** Give the activity an `ACTION_SEND` intent filter for `text/plain`. A shared link arrives as `url`, other text as `text`, the subject as `title`, and the [sharing shortcut](#shortcuts) it was sent to as `shortcutId`, through the `share` message and the `gw-share` event.
- **Tiles.** Declare a service extending `ShellTileService` with the `BIND_QUICK_SETTINGS_TILE` permission, its label and icon, and a `groundwork.tileLink` meta-data entry for the page a tap opens. Override `onClick` to act without opening the app. Keep to two tiles at most.
- **Notification icon.** Notifications show `gw_notification_icon`, a white Groundwork mark the system tints, on `gw_notification_color`, which has a light and a dark mode value. Override either by adding a drawable or color of the same name to the app, with a `values-night` color for dark mode.
- **Live Updates.** A push whose payload has `ongoing` updates one notification per `id`, promoted to a Live Update with `ProgressStyle` on Android 16 and a plain ongoing notification with a progress bar below it, until `done`.
- **Push.** `subscribePush` asks for notifications, fetches the service's VAPID key, and registers with UnifiedPush under the service's URL. Where the phone has no distributor app, the embedded FCM distributor takes over. The endpoint and its keys go to `push/subscriptions` as the [push contract](/behavior#push) describes, and each `PushPayload` that arrives shows as a notification. The shell declares its `ShellPushService` itself.
