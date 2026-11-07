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
| `labels` | English | The notification channels' names and the download notice |

## What works where

| | In the shell | As a PWA |
| --- | --- | --- |
| `notify` | A system notification | A service worker notification once allowed, otherwise `onNotice` |
| `subscribePush` | UnifiedPush, registered through the push contract | Web Push |
| `openExternal` | The browser or the app that handles the link | A new tab |
| Shares | The share sheet, through the shell | The share target |
| Dynamic color | `onAndroidTheme` | None |
| `call` | The app's own Kotlin handlers | Rejects |

Both push paths post the same subscription to the service, as the [push contract](/behavior#push) describes, so a service doesn't care which one a client uses.

## The bridge

The shell injects a `groundworkShell` object into allowed pages with `WebViewCompat.addWebMessageListener`. Each side sends JSON text with a `type`:

| `type` | From | Carries |
| --- | --- | --- |
| `request` | The view | `id`, `name` and `params` |
| `reply` | The shell | The request's `id`, `ok`, and `value` or `error` |
| `message` | The shell | `name` and `data`, whenever it has news |

The shell's own requests are `info`, `openExternal`, `notify`, `androidTheme`, `subscribePush`, `unsubscribePush` and `pushState`, and its messages are `notice`, `deepLink`, `share` and `androidTheme`. `@timmo001/groundwork-mobile/bridge` exports each one's schema, and every reply and message is parsed with it as it comes in.

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

The app's build writes `mobile.config.ts` as JSON to `assets/groundwork/mobile.config.json`, and its web build to `assets/web/`, which the shell serves from `https://appassets.androidplatform.net`. In debug builds a `groundwork.devUrl` meta-data entry in the app's manifest points the shell at the dev server instead.

The app's manifest declares the activity, its deep link and App Link intent filters, and the camera or microphone permissions it wants the page to have. The shell's own manifest asks only for the internet and notifications.

The page follows the phone's dark mode through the theme's `isLightTheme`, which the WebView passes on as `prefers-color-scheme`, and the WebView never darkens it itself.

The shell draws edge to edge, under the status bar, the cutout and the navigation bar, and only the keyboard resizes the page. With `viewport-fit=cover` in the page's viewport meta, the WebView fills in `env(safe-area-inset-*)`: `gw-app-bar` reaches up under the status bar so it takes the bar's surface, and the page pads its sides and bottom with the other insets, as the template's `index.css` does.

## Shares, tiles, Live Updates and push

- **Shares.** Give the activity an `ACTION_SEND` intent filter for `text/plain`. A shared link arrives as `url`, other text as `text`, and the subject as `title`, through the `share` message and the `gw-share` event.
- **Tiles.** Declare a service extending `ShellTileService` with the `BIND_QUICK_SETTINGS_TILE` permission, its label and icon, and a `groundwork.tileLink` meta-data entry for the page a tap opens. Override `onClick` to act without opening the app. Keep to two tiles at most.
- **Live Updates.** A push whose payload has `ongoing` updates one notification per `id`, promoted to a Live Update with `ProgressStyle` on Android 16 and a plain ongoing notification with a progress bar below it, until `done`.
- **Push.** `subscribePush` asks for notifications, fetches the service's VAPID key, and registers with UnifiedPush under the service's URL. Where the phone has no distributor app, the embedded FCM distributor takes over. The endpoint and its keys go to `push/subscriptions` as the [push contract](/behavior#push) describes, and each `PushPayload` that arrives shows as a notification. The shell declares its `ShellPushService` itself.
