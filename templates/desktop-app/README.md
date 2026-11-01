# desktop-app template

A starting point for a desktop app on [Electrobun](https://github.com/blackboardsh/electrobun). It's also the desktop target of Groundwork's [demo app](https://groundwork.timmo.dev/demo): `gw-demo-app` from `@timmo001/groundwork-demo/web` in a native window, on the demo's shared `Items` service. `mise run demo:desktop` runs it from the repository root.

Copy the folder, rename `desktop-app` in `package.json` and the app's name and identifier in `electrobun.config.ts`, then replace `gw-demo-app` in `src/mainview/` with your own view. Drop the `@timmo001/groundwork-demo` dependency.

```sh
bun run start    # build and open the app
bun run dev      # the same, rebuilding on every change
bun run build    # a release build for this system
```

What it shows:

- `src/bun/index.ts` is the main process, which opens the window. A tray, menus and the connection to a backend go here.
- `src/mainview/` is the view: the theme CSS, Base's fonts, the components and the app, in the system's own webview.
- With no `data-gw-mode` on the page, the theme follows the system's light or dark mode.
- `hutch.config.ts` pins the Electrobun release and leaves dependencies to Bun. The SDK comes from `.hutch/`, which `electrobun prepare` fills in, so type-checking runs that first.

See [Desktop](https://groundwork.timmo.dev/desktop) for the details, including what Linux needs installed.
