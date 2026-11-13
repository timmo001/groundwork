---
title: Desktop
description: Groundwork's desktop apps, built with Electrobun around the same web components as the web apps.
---

Desktop apps are built with [Electrobun](https://github.com/blackboardsh/electrobun). A Bun main process opens the window and owns anything native, such as the tray, menus and the connection to a backend. The window shows a view built from the same [web components](/components) and theme CSS as every web app, so there's one set of components for the browser and the desktop.

![The desktop demo on Base, dark, in WebKitGTK on Linux](/screenshots/desktop/demo-base-dark.png)

![The same demo on Base, light](/screenshots/desktop/demo-base-light.png)

## Why Electrobun

It runs on Linux, macOS and Windows, keeps apps in TypeScript on Bun, and uses each system's own webview rather than shipping a browser:

| System | Webview |
| --- | --- |
| Linux | WebKitGTK 4.1 |
| macOS 14 or later | WKWebView |
| Windows | WebView2 |

That keeps an app small and light on memory. The cost is three engines to test against, and WebKitGTK lags the other two.

### Choosing the webview

Each app chooses between the system's webview and Chromium. There's no default for every app, so setup asks the owner which one an app uses:

| | System webview | Bundled Chromium (CEF) |
| --- | --- | --- |
| Download and memory | Small | Hundreds of MB more on disk, and a browser's memory |
| Engines to test | Three | One |
| H.264, H.265 and AAC | Through the system's codecs: GStreamer on Linux, the OS on macOS and Windows | None in MSE or `<video>`. WebRTC H.264 works |
| Newest web features | WebKitGTK lags | Same everywhere |

Electrobun bundles the stock CEF build, which leaves out the patent-encumbered codecs. An app that plays H.264 or H.265 video, such as recordings or most camera streams, stays on the system webview, unless it builds and ships its own CEF with those codecs. An app that needs one engine everywhere and plays no such video sets `bundleCEF` for its platforms in `electrobun.config.ts`.

Qt Quick, Wails, Slint, Tauri and Electron were compared against it in [#41](https://github.com/timmo001/groundwork/issues/41). Omarchy panels stay on QML, with `Themes.qml` and the [shared panel components](/desktop/panels).

## Demo

The desktop demo runs `gw-demo-app` from `@timmo001/groundwork-demo/web`, the same element as the [web demo](/templates/app), on the shared `Items` service:

```sh
mise run demo:desktop
```

Beside the demo, a "This machine" card calls the main process: what the app runs on, copying to the clipboard, a notice and a link out to the browser. The window has the browser defaults from `@timmo001/groundwork-desktop`, such as find, zoom, a right-click menu and a tray icon.

[Building apps](/desktop/building) covers the template it runs from and every default.

## References

- Electrobun: [Docs](https://docs.electrobun.dev) · [Code](https://github.com/blackboardsh/electrobun)
- Wails: [Docs](https://wails.io) · [Code](https://github.com/wailsapp/wails)
- Qt Quick: [Docs](https://doc.qt.io/qt-6/qtquick-index.html)
