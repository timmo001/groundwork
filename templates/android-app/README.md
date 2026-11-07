# android-app template

A starting point for an Android app: the web page in Groundwork's Kotlin shell from `packages/mobile/android/shell`, with `@timmo001/groundwork-mobile` on the page side. It's also the Android target of Groundwork's [demo app](https://groundwork.timmo.dev/templates/app): `gw-demo-app` from `@timmo001/groundwork-demo/web`, in the shell. `mise run demo:android` builds it and opens it on a running emulator (`mise run android:emulator`), from the repository root.

Copy the folder, rename `android-app` in `package.json`, and in `android/` change the `namespace`, `applicationId`, app name, deep link scheme and package of `MainActivity`. Swap the icon in `res/drawable/`, then replace `gw-demo-app` in `src/index.html` with your own view and drop the `@timmo001/groundwork-demo` dependency. Point `settings.gradle.kts` at the synced copy of the shell in your app.

```sh
bun run build                          # build the page into android/app/src/main/assets/
cd android && gradle :app:installDebug # build the app and install it on a phone or emulator
```

What it shows:

- `mobile.config.ts` keeps every piece on. Turn one off or rename the notification channels there; the build writes it to the assets as JSON for the shell.
- `src/build.ts` bundles the page into the app's assets with the theme boot script inlined. The shell serves them at `https://appassets.androidplatform.net`, so the page is a secure context with no server.
- `src/index.ts` connects with `connectMobile`, offers the phone's dynamic color in the theme picker, and shows shares, deep links, notifications and a Live Update in a "This phone" card. Outside the shell the same page runs as a plain web page.
- `MainActivity.kt` extends `ShellActivity` and adds the app's own requests beside the shell's: `battery` and `ongoing`. Override any `open` member to change what the shell does.
- `AndroidManifest.xml` declares the share and deep link intent filters, a quick settings tile through `ShellTileService`, and the camera for the page.
- Debug builds load `GROUNDWORK_DEV_URL` instead of the bundled page when it's set, such as a dev server reached through `adb reverse`.
