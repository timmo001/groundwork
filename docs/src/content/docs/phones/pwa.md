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
| `manifestCredentials` | Off | Fetches the manifest with the page's cookies (`crossorigin="use-credentials"`), for an app behind a sign-in such as Cloudflare Access, which would otherwise refuse the manifest and stop the install |

Everything the package writes is a default to build on. Anything the options don't cover goes in `manifest`, and each build function below works alone, so an app with its own build or bundler takes the parts it wants.

## Build

The package's `./build` entry point runs at build time. Once the page is built, `buildPwa` adds the rest under Bun:

```ts
import { buildPwa } from "@timmo001/groundwork-pwa/build";

import config from "../pwa.config.ts";

// After the page is built into dist/
const { version, shell } = await buildPwa(config, {
  outDir: "dist",
  worker: "src/sw.ts",
  logo: "src/logo.svg",
});
```

It writes the manifest and icons, adds the head tags to `index.html`, finds the page's hashed files for the worker to keep for offline starts, and bundles the worker with them and the build's version. The tags go in place of a `<!-- pwa:head -->` comment, or straight after `<head>`. The version is `GROUNDWORK_PWA_VERSION` from the environment, or else a hash of the built files, so a build that changes nothing keeps the cache. `page`, `version`, `shell`, `define` and `minify` change each step.

The parts work alone too, under Bun or Node, for a build that does its own steps:

```ts
import { headTags, writePwa } from "@timmo001/groundwork-pwa/build";

await writePwa(config, { outDir: "dist", logo: "src/logo.svg" });

const head = headTags(config);
```

`writePwa` writes `manifest.webmanifest` and, given a logo, the icons. The manifest's `theme_color` and `background_color` are the theme's `surface-default`, and the maskable icon sits on the same color, inside the middle 60% every launcher shape keeps. `headTags` returns the manifest link and the color tags for the page's `<head>`, so the browser's bars match the page in either mode, and `addHeadTags` puts them in a page. `webManifest` and `writeIcons` do each part alone. `findShell(outDir)` lists the hashed files, and `pwaDefine(version, shell)` gives the defines to bundle the worker with.

### Vite

An app built with Vite adds the plugin from `./vite`, which does the same after the client build:

```ts
import { pwa } from "@timmo001/groundwork-pwa/vite";
import { defineConfig } from "vite";

import config from "./pwa.config.ts";

export default defineConfig({
  plugins: [pwa(config, { worker: "src/sw.ts", logo: "public/icons/icon.svg" })],
});
```

It bundles the worker with Vite, from the build's hashed files. Pass `environment` when the page builds in another Vite environment than `client`.

## Page

The page connects with `connectPwa` from `./view`. Offer the install with [`gw-install-banner`](/components/feedback#install-banner), and keep an Install button on the app's Settings page, the one place left to install from once the banner's turned down:

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

### Embedded

A page served inside another app's frame, at an address that can change, has nothing to install or keep offline. Home Assistant's ingress is one. Pass `embedded`, which turns off `install` and `offline` and still takes shares. `underIngress()` says whether the page is served under Home Assistant's ingress:

```ts
import { connectPwa, underIngress } from "@timmo001/groundwork-pwa/view";

const pwa = connectPwa(config, { embedded: underIngress() });
```

### Shares

A share opens the app's share page with `share-title`, `share-text` and `share-url` in the address. `connectPwa` takes them off the address, so a reload doesn't deliver the share again, and passes `{ title, text, url }` to `onShare`. It also sends a `gw-share` event on `window`, the same event the Android shell sends, so code listening there handles both:

```ts
window.addEventListener("gw-share", (event) => showShare(event.detail));
```

`shareText(share)` gives a share as one block of text, its title, text and link one to a line, for a field to put it in. Android apps often put the link in the text too, so it leaves out a line another already holds.

![A link shared to the demo, on Base, dark](/screenshots/phones/share-base-dark.png)

## Offline

The worker comes from `./worker`, bundled to the config's `worker` file beside the page:

```ts
import { serveShell, type ShellWorkerScope } from "@timmo001/groundwork-pwa/worker";

import config from "../pwa.config.ts";

declare const self: ShellWorkerScope;

serveShell(self, config);
```

It caches the shell when it installs. Pages come from the network first, falling back to the cached start page, so an installed app always opens. Other files from the app's own origin come from the cache and refresh behind it. Built with `buildPwa` or the Vite plugin, it takes its cache `version` and the page's hashed files from the build, and the new worker drops the old cache when it takes over. A worker built another way passes `version`, such as the commit, and `extraShell`, the files to cache beside the config's `shell`; `buildVersion` and `buildShell` hold what the build set.

The app's own `routes` run first, in order. Each returns a response to answer the request, or `undefined` to pass it on. The shell's strategies are exported to reuse in them:

```ts
import { networkFirst, serveShell } from "@timmo001/groundwork-pwa/worker";

serveShell(self, config, {
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

A worker that does more imports `serveShell` beside its own listeners.

![The install prompt, with the icon rendered from the logo](/screenshots/phones/install-base-dark.png)

## Updates

An installed app keeps a page open for days, so after the server updates, an old page can call a new server. `./update` keeps the page on the server's release. The server says which version it runs in the index it serves, as a meta tag named for the app:

```html
<meta name="kestrel-version" content="1.2.3" />
```

The page sends that version with each call, and the server answers a call from another version with `426 Upgrade Required`:

```ts
import { watchVersion } from "@timmo001/groundwork-pwa/update";

const update = watchVersion({
  app: "kestrel",
  worker: pwa.worker,
  onStale: () => (staleBanner.open = true),
});

const response = await fetch("api/cameras", { headers: update.headers });

if (update.check(response)) return;
```

On a 426 the page asks the worker for the new build, waits up to 10 seconds for it to take over, and reloads onto it. It does this once per version. If the page is still refused after that, it's stale: `onStale` runs and the window gets a `gw-version-stale` event, for a banner with a Reload button rather than a reload loop.

| Option | Default | Does |
| --- | --- | --- |
| `app` | Required | Names the header (`x-<app>-version`), the meta tag (`<app>-version`) and the stored key |
| `version` | The meta tag's | The page's version. Without one the page sends none, and the server holds it to no version, as on a dev server |
| `worker` | None | `connectPwa`'s `worker`, to take the new build from |
| `onStale` | None | Called when the page couldn't move by itself |
| `takeOverTimeout` | `10000` | How long a new worker gets before the page reloads anyway |

The watch has `headers`, `check(response)`, `mismatched()` for a refusal that isn't a `Response` (such as a WebSocket's close), `stale()` and `reload()`.

### Server

`./server` is the server's side. `versionGuard` is Effect HTTP middleware that answers a call from another version with the 426:

```ts
import { versionGuard } from "@timmo001/groundwork-pwa/server";

const VersionGuard = HttpRouter.middleware(
  Effect.succeed(
    versionGuard({
      app: "kestrel",
      version,
      anyVersion: ["/api/health"],
      guards: (path) => path.startsWith("/api/"),
    }),
  ),
).layer;
```

A call without the header isn't held to a version, so a CLI, a host or an event stream gets through. `anyVersion` keeps the paths a page uses to learn the version, such as its health check or its translations, open to any version, and `guards` limits the check to some paths, such as the API's. The server still puts the meta tag in the index it serves.

A server on the fetch API, such as a Cloudflare Worker, calls `refuseOtherVersion(request, options)` first, which returns the 426 `Response` or `undefined`. A server in another language follows the same contract:

- read `x-<app>-version` from the request;
- when it's there and isn't the server's version, and the path isn't one open to any version, answer `426` with a JSON body of `message`, `server` (the server's version) and `client` (the page's);
- otherwise, handle the call as usual.

The built files need the right cache headers too. `fileOptions(name)` gives a file's content type and `cache-control`: a year for a name with a content hash, such as `index-r20khhep.js`, and `no-cache` for the rest, so the browser rechecks `sw.js`, the manifest and the icons on each load and notices a new release. `fileResponse(name, body)` makes the Effect response, and `isPwaFile(name)` picks out the files the PWA build wrote. Pass `hashed` when the app's bundler names hashed files another way.

## Push

Pushes follow the [push contract](/behavior#push): the service keeps `push/vapid-key` and `push/subscriptions`, and sends a `PushPayload`. The worker shows them with `servePush`, beside `serveShell`:

```ts
import { servePush, serveShell, type PushWorkerScope, type ShellWorkerScope } from "@timmo001/groundwork-pwa/worker";

declare const self: ShellWorkerScope & PushWorkerScope;

serveShell(self, config);
servePush(self, config);
```

A push shows its title and body, with its `tag` so like ones replace each other, quiet when it's `passive`. Ongoing work shows its status and progress and stays until it's `done`. A tap opens the payload's `link`, bringing an open window forward rather than opening another.

![The demo's test push in the shade, on Base, dark](/screenshots/phones/push-base-dark.png)

Each part can be replaced:

| Option | Replaces |
| --- | --- |
| `show(payload)` | The notification, `{ title, options }`. `pushNotification` is the default, to build on |
| `open(payload)` | The page a tap opens. `undefined` falls back to the `link`, then the start page |
| `onOther(text)` | What happens to a push that isn't a payload, which shows nothing by default |

The page subscribes from `./view`. Browsers only ask for notifications from a tap, so offer it as a button, as the install offer is:

```ts
import { pushState, subscribePush } from "@timmo001/groundwork-pwa/view";

const registration = await pwa.worker;
const service = { service: "https://bridge.local:9170/", client, headers: { authorization: `Bearer ${token}` } };

if ((await pushState(registration)) === "default")
  button.onclick = async () => showState(await subscribePush(registration, service));
```

`pushState` is `unsupported`, `default`, `denied` or `subscribed`. `subscribePush` asks, subscribes with the service's key, replacing a subscription made with another, and posts it with the same `client` the [pairing](/behavior#pairing) sent. `unsubscribePush` stops it here and at the service.

The template's server keeps the routes in memory for the demo, and `POST push/test` sends every subscription a sample. A real service uses a Web Push library the same way, with its VAPID keys kept.
