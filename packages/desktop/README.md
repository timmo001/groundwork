# @timmo001/groundwork-desktop

Groundwork's desktop defaults for an
[Electrobun](https://github.com/blackboardsh/electrobun) app: what people
expect from a browser window, such as find in page, zoom
keys, the right-click menu, a tray icon, one instance and the system's dark
mode and scale. An app that keeps working with its window closed, such as one
that runs a server, can run in the tray and start at login.

```ts
// src/bun/index.ts
import Electrobun, { BrowserView } from "electrobun/main";
import {
  openDesktopWindow,
  type DesktopRequests,
  type DesktopSchema,
} from "@timmo001/groundwork-desktop/main";

import config from "../../desktop.config.ts";

await openDesktopWindow(Electrobun, {
  title: "My app",
  url: "views://mainview/index.html",
  frame: { width: 760, height: 640 },
  config,
  createRPC: (requests: DesktopRequests) =>
    BrowserView.defineRPC<DesktopSchema>({ handlers: { requests } }),
});
```

- `.` defines the app's desktop config. Every default is on unless the config
  turns it off.
- `./main` opens the window from the main process, with the tray and the
  requests the view makes.
- `./view` connects the page: find, the right-click menu, the browser keys,
  in-app notices and the Omarchy theme.

The app brings its own `electrobun`, so it keeps the release it pins. The docs
are at
[groundwork.timmo.dev/desktop/building](https://groundwork.timmo.dev/desktop/building),
and `templates/desktop-app` is a starting point.
