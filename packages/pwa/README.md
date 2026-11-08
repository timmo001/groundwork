# @timmo001/groundwork-pwa

Groundwork's pieces for a web app installable on phones: a web app manifest
and icons from the Groundwork theme, the page's install, share and offline
pieces, a service worker, and the push and pairing contracts every service
uses to reach phones.

```ts
import { definePwaConfig } from "@timmo001/groundwork-pwa";

export default definePwaConfig({ name: "My app" });
```

- `.` defines the app's PWA config. Every piece is on unless the config turns
  it off.
- `./build` writes the manifest, the icons rendered from the app's logo and
  the page's head tags, under Bun or Node.
- `./view` registers the service worker, holds the install prompt, takes
  shares and subscribes to push in the page.
- `./worker` is the service worker side: keeping the app shell for offline
  starts, and showing pushes as notifications.
- `./push` is the push contract: the subscription a client posts to a
  service, and the payload a service sends back.
- `./pairing` is the pairing contract: the link a service shows as a QR code
  and the helpers that read it.

The docs are at
[groundwork.timmo.dev/phones/pwa](https://groundwork.timmo.dev/phones/pwa),
with the contracts at
[groundwork.timmo.dev/behavior](https://groundwork.timmo.dev/behavior).
`templates/pwa-app` is a starting point.
