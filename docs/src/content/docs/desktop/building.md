---
title: Building apps
description: Starting a desktop app from the Electrobun template, its desktop defaults, and how it handles the system's mode and scale.
---

`templates/desktop-app` is the desktop demo and a starting point. Its layout:

| File | Does |
| --- | --- |
| `src/bun/index.ts` | The main process: opens the window and answers the view's requests |
| `src/mainview/index.html` | The view's page, with `data-gw-theme` on `<html>` |
| `src/mainview/index.ts` | Imports the theme CSS, the components and the app, and connects to the main process |
| `src/shared/requests.ts` | The app's own requests, typed for both sides |
| `desktop.config.ts` | Which desktop defaults the app keeps |
| `electrobun.config.ts` | How the app and its views are bundled |
| `hutch.config.ts` | Pins the Electrobun release and leaves dependencies to Bun |

The `electrobun` package from npm only starts Hutch, Electrobun's build tool, which downloads the release's SDK and core into `.hutch/`. Its APIs come from there, not from `node_modules`, so type-checking runs `electrobun prepare` first.

| Script | Does |
| --- | --- |
| `bun run start` | Builds and opens the app |
| `bun run dev` | The same, rebuilding on every change |
| `bun run build` | A release build for the system it runs on |

Electrobun doesn't cross-compile, so a release for every system needs a CI runner on each. The repository's `Desktop` workflow builds the template on Linux, macOS and Windows and uploads each build, and makes a starting point for an app's own.

On Linux the app needs GTK 3, WebKitGTK 4.1, Ayatana AppIndicator and librsvg installed, even with CEF. On Ubuntu, building needs their `-dev` packages:

```sh
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
```

## Desktop defaults

`@timmo001/groundwork-desktop` gives a webview window what people expect from a browser, so an app doesn't rebuild them. Each is on unless `desktop.config.ts` turns it off, so an empty config keeps them all:

```ts
import { defineDesktopConfig } from "@timmo001/groundwork-desktop";

export default defineDesktopConfig({ tray: false });
```

| Option | Default | Does |
| --- | --- | --- |
| `tray` | On | A tray icon that shows the window and quits. Takes `{ image, title }` to change its icon |
| `notifications` | Off | System notifications instead of notices in the app |
| `zoom` | `1` | The page zoom on top of the system's scale |
| `zoomKeys` | On | Ctrl + and - zoom, Ctrl+0 resets, remembered across launches |
| `contextMenu` | On | Cut, copy, paste, select all and link actions on right click |
| `find` | On | Find in the page with Ctrl+F, F3 and Ctrl+G for the next match |
| `clipboard` | On | Reading and writing the clipboard from the view |
| `reload` | On | F5 and Ctrl+R reload, Ctrl+Shift+R hard reloads |
| `history` | On | Back and forward with Alt+Left and Right and the mouse's side buttons |
| `externalLinks` | On | Links out of the app open in the system browser |
| `externalSchemes` | `["mailto"]` | Schemes besides http(s) that open outside the app |
| `downloads` | On | A notice when a download finishes, with where it went |
| `singleInstance` | On | Opening a second copy brings the first to the front |
| `windowState` | On | The window opens at the size and place it closed at |
| `devTools` | On | F12 and Ctrl+Shift+I open the dev tools, in dev builds only |
| `spellcheck` | On | The system spell checker in text fields |
| `deepLinks` | On | Passes the app's deep links (`urlSchemes`) to the view |

Notices in the app sit in the bottom end corner, the find bar in the top end corner, and neither moves the page. The window's size, place and zoom are kept in `desktop-state.json` in the app's data folder.

Some depend on the system:

| Default | Linux | macOS | Windows |
| --- | --- | --- | --- |
| Spell check | Not yet | Yes | Not yet |
| Deep links | Not yet | Yes | Not yet |
| Passkeys | Not in WebKitGTK 2.54 | Yes | Yes |

Spell check and deep links follow Electrobun as it adds them. WebKitGTK gained WebAuthn in mid 2026, so passkeys reach Linux with the WebKitGTK release that ships it.

## Main process and view

The package has an entry point for each side. The main process opens the window with `openDesktopWindow`, and the view connects with `connectDesktop`. The app defines its RPC with its own `electrobun` import, so it keeps Electrobun's types for the release it pins, and adds its own requests beside the desktop ones:

```ts
// src/shared/requests.ts
export type AppRequests = {
  readonly systemInfo: () => { readonly platform: string };
};
```

```ts
// src/bun/index.ts
import Electrobun, { BrowserView } from "electrobun/main";
import { openDesktopWindow, type DesktopRequests, type DesktopSchema } from "@timmo001/groundwork-desktop/main";

import config from "../../desktop.config.ts";
import type { AppRequests } from "../shared/requests.ts";

const appRequests: AppRequests = { systemInfo: () => ({ platform: process.platform }) };

await openDesktopWindow(Electrobun, {
  title: "My app",
  url: "views://mainview/index.html",
  frame: { width: 760, height: 640, x: 200, y: 160 },
  config,
  createRPC: (requests: DesktopRequests) =>
    BrowserView.defineRPC<DesktopSchema<AppRequests>>({
      maxRequestTime: 10_000,
      handlers: { requests: { ...requests, ...appRequests } },
    }),
});
```

```ts
// src/mainview/index.ts
import { connectDesktop, type DesktopSchema } from "@timmo001/groundwork-desktop/view";
import { Electroview } from "electrobun/view";

import type { AppRequests } from "../shared/requests.ts";

const desktop = await connectDesktop<AppRequests>((messages) => {
  const rpc = Electroview.defineRPC<DesktopSchema<AppRequests>>({ maxRequestTime: 10_000, handlers: { messages } });

  new Electroview({ rpc });

  return rpc;
});

const { platform } = await desktop.request.systemInfo();
```

`desktop.request` also has the desktop requests, such as `openExternal`, `clipboardRead` and `clipboardWrite`. `desktop.notify` shows a notice, as a system notification when the config turns them on. `desktop.config` and `desktop.dev` say what's on and whether it's a dev build.

The demo's "This machine" card uses each of these: it asks the main process what it runs on, copies the details, sends a notice and opens these docs in the browser.

## Theme and mode

The view sets `data-gw-theme` and leaves out `data-gw-mode`, so it follows the system's light or dark mode through `prefers-color-scheme`. An app with its own setting sets `data-gw-mode` instead, as on the web.

On Linux, WebKitGTK takes the mode from GTK 3, not from the desktop's color scheme setting. A desktop that only sets the color scheme, as Omarchy does, shows the light mode. Setting `gtk-application-prefer-dark-theme=true` in `~/.config/gtk-3.0/settings.ini`, or running the app with `GTK_THEME=Adwaita:dark`, gives the dark one.

## Scaling

GTK 3 only takes whole numbers in `GDK_SCALE`, so on Linux a fractional scale such as 1.6 renders at 1 and the app looks too small. `openDesktopWindow` makes up the difference with the page zoom: it divides `GDK_SCALE` by its whole part and zooms the webview by the rest.

Set `GROUNDWORK_DESKTOP_ZOOM` to scale on top of that, such as `0.8` to match a browser started with `--force-device-scale-factor=0.8`. It defaults to 1. The config's `zoom` and the zoom keys multiply on top again.

Both are read when the app starts, from its own environment, so they reach a built app the same way as a dev build. A desktop session sets them once for every app, such as with Hyprland's `env`.
