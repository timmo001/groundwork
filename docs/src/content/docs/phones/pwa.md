---
title: Building PWAs
description: Starting a phone app from the PWA template, the manifest it writes from the theme, and the install, share and offline pieces in the page.
---

`templates/pwa-app` is the phone demo and a starting point. Its layout:

| File | Does |
| --- | --- |
| `pwa.config.ts` | The app's name and which PWA pieces it keeps |
| `src/index.html` | The page, with `<!-- pwa:head -->` where the build puts the PWA's tags |
| `src/index.ts` | Imports the theme CSS, the components and the app, and connects the PWA pieces |
| `src/sw.ts` | The service worker |
| `src/logo.svg` | The square logo the icons are rendered from |
| `src/build.ts` | Bundles the page and worker into `dist/`, and writes the manifest and icons |
| `src/serve.ts` | Serves `dist/` for trying it out |

| Script | Does |
| --- | --- |
| `bun run build` | Builds into `dist/`, ready for any static host |
| `bun run start` | Builds and serves it on `127.0.0.1:7370` |

Browsers only install over HTTPS or from `localhost`. To try it on an Android emulator, `adb reverse tcp:7370 tcp:7370` makes the desktop's port the emulator's `localhost`, which `mise run demo:pwa` does when one is running.

## Options

`@timmo001/groundwork-pwa` keeps each piece on unless `pwa.config.ts` turns it off, so a config only needs the name:

```ts
import { definePwaConfig } from "@timmo001/groundwork-pwa";

export default definePwaConfig({ name: "My app", offline: false });
```

| Option | Default | Does |
| --- | --- | --- |
| `name` | Required | The app's name, in the install prompt and app list |
| `shortName` | `name` | The name under the launcher icon |
| `description` | None | What the app is, for app stores and install sheets |
| `theme` | `base` | The Groundwork theme the colors come from |
| `mode` | `light` | The mode for the manifest's one color, used by the splash screen and task switcher. A theme without it uses its nearest mode |
| `themeColor`, `backgroundColor` | The theme's `surface-default` | The browser bar and splash screen colors, for an app with its own brand color. A `themeColor` replaces the per-mode `theme-color` tags too |
| `id`, `startUrl`, `scope` | `./` | The app's identity, first page and the URLs it owns, relative to the manifest |
| `display` | `standalone` | How the installed app opens |
| `icons` | Rendered from the logo | `icon-192.png`, `icon-512.png` and a maskable `maskable-512.png` |
| `shortcuts` | None | Entries in the launcher icon's long-press menu |
| `colorScheme` | On | `color-scheme: dark light`, and a `theme-color` for each of the system's modes |
| `install` | On | Holds the browser's install prompt for the app to offer |
| `shareTarget` | On | Takes text and links shared from other apps. Takes `{ action }` to send them to another page |
| `offline` | On | A service worker that keeps the app shell. Takes `{ worker, shell }` to change its script or what it caches |
| `manifest` | None | Manifest members to add or replace, written over the generated ones, such as `orientation`, `categories` or `screenshots` |

Everything the package writes is a default to build on. Anything the options don't cover goes in `manifest`, and each build function below works alone, so an app with its own build or bundler takes the parts it wants.

## Build

The package's `./build` entry point runs at build time, under Bun or Node:

```ts
import { headTags, writePwa } from "@timmo001/groundwork-pwa/build";

import config from "../pwa.config.ts";

await writePwa(config, { outDir: "dist", logo: "src/logo.svg" });

const head = headTags(config);
```

`writePwa` writes `manifest.webmanifest` and, given a logo, the icons. The manifest's `theme_color` and `background_color` are the theme's `surface-default`, and the maskable icon sits on the same color, inside the middle 60% every launcher shape keeps. `headTags` returns the manifest link and the color tags for the page's `<head>`, so the browser's bars match the page in either mode. `webManifest` and `writeIcons` do each part alone.

## Page

The page connects with `connectPwa` from `./view`:

```ts
import { connectPwa } from "@timmo001/groundwork-pwa/view";

import config from "../pwa.config.ts";

const pwa = connectPwa(config, {
  onShare: (share) => showShare(share),
  onInstallChange: (canInstall) => (installButton.hidden = !canInstall),
});

installButton.addEventListener("click", () => void pwa.install());
```

| Member | Does |
| --- | --- |
| `pwa.installed()` | True when the app runs installed, in its own window |
| `pwa.canInstall()` | True while the browser has an install prompt to show |
| `pwa.install()` | Shows the install prompt, which only a tap or click may do. Resolves to `accepted`, `dismissed` or `unavailable` |
| `pwa.worker` | The service worker's registration, or `undefined` where there isn't one |

Only Chromium browsers offer an install prompt to the page. Elsewhere `canInstall()` stays false and people install from the browser's menu, so offer the button only while it's true.

### Shares

A share opens the app's share page with `share-title`, `share-text` and `share-url` in the address. `connectPwa` takes them off the address, so a reload doesn't deliver the share again, and passes `{ title, text, url }` to `onShare`. It also sends a `gw-share` event on `window`, the same event the Android shell sends, so code listening there handles both:

```ts
window.addEventListener("gw-share", (event) => showShare(event.detail));
```

![A link shared to the demo, on Base, light](/screenshots/phones/share-base-light.png)

## Offline

The worker comes from `./worker`, bundled to the config's `worker` file beside the page:

```ts
import { serveShell, type ShellWorkerScope } from "@timmo001/groundwork-pwa/worker";

import config from "../pwa.config.ts";

declare const self: ShellWorkerScope;

serveShell(self, config, { version: process.env.GROUNDWORK_PWA_VERSION ?? "dev" });
```

It caches the shell when it installs. Pages come from the network first, falling back to the cached start page, so an installed app always opens. Other files from the app's own origin come from the cache and refresh behind it. Give each build its own `version`, such as the commit, and the new worker drops the old cache when it takes over.

The app's own `routes` run first, in order. Each returns a response to answer the request, or `undefined` to pass it on. The shell's strategies are exported to reuse in them:

```ts
import { networkFirst, serveShell } from "@timmo001/groundwork-pwa/worker";

serveShell(self, config, {
  version,
  routes: [
    // Keep the last answer from the app's API for offline starts
    (event, cache) =>
      new URL(event.request.url).pathname.startsWith("/api/")
        ? networkFirst(cache, event.request)
        : undefined,
  ],
});
```

| Export | Does |
| --- | --- |
| `networkFirst(cache, request, fallback?)` | The network, then the cached copy, then `fallback` |
| `staleWhileRevalidate(cache, event)` | The cached copy, fetching a fresh one for next time |
| `keepResponse(cache, request, response)` | Caches a good same-origin response and passes it on |

A worker that does more, such as push, imports `serveShell` beside its own listeners.

![The install prompt, with the icon rendered from the logo](/screenshots/phones/install-base-dark.png)
