---
title: Building apps
description: Starting a desktop app from the Electrobun template, and how it handles the system's mode and scale.
---

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

## Scaling

GTK 3 only takes whole numbers in `GDK_SCALE`, so on Linux a fractional scale such as 1.6 renders at 1 and the app looks too small. The template's main process makes up the difference with the page zoom: it divides `GDK_SCALE` by its whole part and zooms the webview by the rest.

Set `GROUNDWORK_DESKTOP_ZOOM` to scale on top of that, such as `0.8` to match a browser started with `--force-device-scale-factor=0.8`. It defaults to 1.

Both are read when the app starts, from its own environment, so they reach a built app the same way as a dev build. A desktop session sets them once for every app, such as with Hyprland's `env`.
