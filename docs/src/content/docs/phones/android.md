---
title: Building Android apps
description: Why Groundwork has its own Android shell, and starting an app from the Android template, building it and running it on a phone or the emulator.
---

An Android app is the web app in Groundwork's Kotlin shell: a small activity around the system WebView that serves the bundled page, answers the bridge's requests and adds what the web can't do on Android.

## Why our own shell

The shell is a few hundred lines of Kotlin on the platform's own pieces: the system WebView, `WebViewAssetLoader`, notification channels, `TileService` and UnifiedPush. That keeps it:

- **Small.** No cross-platform runtime or plugin system to carry, update or debug; the APK is the page and the shell.
- **Open.** Every part is a class or `open` member an app extends or overrides, from the WebView client to how a share or deep link maps onto a page.
- **The same app.** The page is the PWA's page, sending the same events, so one app runs installed from the browser and in the shell, and moves between them without a rewrite.
- **Free of Google Play.** Releases are signed APKs on GitHub and an F-Droid repository, and push goes through UnifiedPush, falling back to an embedded FCM distributor only where the phone has no distributor.

An app starts as a PWA and moves into the shell once it needs something from the shell's column on [Phones](/phones).

## The template

`templates/android-app` is the starting point:

- `mobile.config.ts` is the shell's config, every piece on unless it's turned off. The build writes it into the assets as JSON for the shell.
- `src/` is the page: `build.ts` bundles it into `android/app/src/main/assets/web/` with the theme boot script inlined, and `index.ts` connects with `connectMobile`.
- `android/` is the Gradle project: the `app` module with `MainActivity`, the manifest and the icon, and the `shell` module from `packages/mobile/android/shell`.

Copy the folder, rename `android-app` in `package.json`, and in `android/` change the `namespace`, `applicationId`, app name, deep link scheme and the package of `MainActivity`. Swap the icon, replace `gw-demo-app` in `src/index.html` with your own view, and point `settings.gradle.kts` at the app's synced copy of the shell.

## Build and run

The root `mise.toml` pins the Android SDK command-line tools, the JDK, Gradle and Kotlin. `mise run android:setup` installs the SDK packages and creates the emulator, and `mise run android:emulator` starts it in dark mode.

```sh
bun run build                          # build the page into the app's assets
cd android && gradle :app:installDebug # build the app and install it
```

From the repository root, `mise run demo:android` does both and opens the demo, and `mise run android:build` builds the debug and release APKs, as the Android workflow does on every change.

Debug builds load `GROUNDWORK_DEV_URL` instead of the bundled page when it's set at build time, such as a dev server the emulator reaches through `adb reverse`.

## The app's own code

`MainActivity` extends `ShellActivity` and adds requests beside the shell's in `onBridgeReady`, each answered with `reply.ok` or `reply.error` and called from the page with `mobile.call` and a schema for the reply. The template's `battery` and `ongoing` requests show both directions: one reads from Android, the other posts a Live Update. [The Android shell](/phones/shell) covers every request, message and override.

## Safe areas

The shell draws edge to edge. With `viewport-fit=cover` in the viewport meta, `gw-app-bar` reaches under the status bar so it takes the bar's surface, and the page pads its sides and bottom with `env(safe-area-inset-*)`, as the template's `index.css` does.

## References

- Android WebView: [Docs](https://developer.android.com/develop/ui/views/layout/webapps)
- Edge to edge: [Docs](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- UnifiedPush: [Docs](https://unifiedpush.org/developers/android/)
