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

That keeps an app small and light on memory. The cost is three engines to test against, and WebKitGTK lags the other two. An app that needs one engine everywhere can set `bundleCEF` for its platforms and ship Chromium instead, at the memory cost that comes with it.

Qt Quick, Wails, Slint, Tauri and Electron were compared against it in [#41](https://github.com/timmo001/groundwork/issues/41). Omarchy panels stay on QML, with `Themes.qml` and the [shared panel components](/sync).

## Building one

`templates/desktop-app` is the desktop demo and a starting point. Its layout:

| File | Does |
| --- | --- |
| `src/bun/index.ts` | The main process: opens the window |
| `src/mainview/index.html` | The view's page, with `data-gw-theme` on `<html>` |
| `src/mainview/index.ts` | Imports the theme CSS, the components and the app |
| `electrobun.config.ts` | How the app and its views are bundled |
| `hutch.config.ts` | Pins the Electrobun release and leaves dependencies to Bun |

The `electrobun` package from npm only starts Hutch, Electrobun's build tool, which downloads the release's SDK and core into `.hutch/`. Its APIs come from there, not from `node_modules`, so type-checking runs `electrobun prepare` first.

| Script | Does |
| --- | --- |
| `bun run start` | Builds and opens the app |
| `bun run dev` | The same, rebuilding on every change |
| `bun run build` | A release build for the system it runs on |

Electrobun doesn't cross-compile, so a release for every system needs a CI runner on each.

On Linux the app needs GTK 3, WebKitGTK 4.1, Ayatana AppIndicator and librsvg installed, even with CEF.

## Theme and mode

The view sets `data-gw-theme` and leaves out `data-gw-mode`, so it follows the system's light or dark mode through `prefers-color-scheme`. An app with its own setting sets `data-gw-mode` instead, as on the web.

On Linux, WebKitGTK takes the mode from GTK 3, not from the desktop's color scheme setting. A desktop that only sets the color scheme, as Omarchy does, shows the light mode. Setting `gtk-application-prefer-dark-theme=true` in `~/.config/gtk-3.0/settings.ini`, or running the app with `GTK_THEME=Adwaita:dark`, gives the dark one.

## Demo

The desktop demo runs `gw-demo-app` from `@timmo001/groundwork-demo/web`, the same element as the [web demo](/demo), on the shared `Items` service:

```sh
mise run demo:desktop
```

## References

- Electrobun: [Docs](https://docs.electrobun.dev) · [Code](https://github.com/blackboardsh/electrobun)
- Wails: [Docs](https://wails.io) · [Code](https://github.com/wailsapp/wails)
- Qt Quick: [Docs](https://doc.qt.io/qt-6/qtquick-index.html)
