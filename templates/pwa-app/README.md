# pwa-app template

A starting point for a web app installable on phones, with `@timmo001/groundwork-pwa`. It's also the phone target of Groundwork's [demo app](https://groundwork.timmo.dev/templates/app): `gw-demo-app` from `@timmo001/groundwork-demo/web`, installed as a PWA. `mise run demo:pwa` serves it from the repository root, and to a running Android emulator.

Copy the folder, rename `pwa-app` in `package.json` and the app's name in `pwa.config.ts`, swap `src/logo.svg` for your own, then replace `gw-demo-app` in `src/index.html` with your own view. Drop the `@timmo001/groundwork-demo` dependency.

```sh
bun run build    # build into dist/, for any static host
bun run start    # build and serve it on 127.0.0.1:7370
```

What it shows:

- `pwa.config.ts` keeps every piece on. Turn one off, override the colors or add manifest members there.
- `src/build.ts` bundles the page and worker, then writes the manifest, the icons from the logo and the page's head tags. Each step is its own function, so another bundler can take the parts it wants.
- `src/sw.ts` keeps the app shell for offline starts and shows pushes as notifications. Add the app's own `routes` there, ahead of the shell's, and pass `show` or `open` to `servePush` to change a push.
- `src/index.ts` connects the install offer, shares and notifications, shown in the "This phone" card.
- `src/serve.ts` is also a small push service for the demo, keeping the push contract's routes in memory. "Send a test", or `POST push/test`, pushes a sample to every subscription. Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to keep keys between runs.

See [Phones](https://groundwork.timmo.dev/phones) for the details.
