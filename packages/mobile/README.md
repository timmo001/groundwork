# @timmo001/groundwork-mobile

The page side of Groundwork's Android shell, a small Kotlin app around the
system WebView. It works out whether the page runs in the shell, talks to the
shell over a typed bridge when it does, and falls back to
`@timmo001/groundwork-pwa` when it doesn't, so one app runs in both.

```ts
import { connectMobile } from "@timmo001/groundwork-mobile/view";

import mobileConfig from "../mobile.config.ts";
import pwaConfig from "../pwa.config.ts";

const mobile = await connectMobile(mobileConfig, {
  pwa: pwaConfig,
  onShare: (share) => openDraft(share),
  onDeepLink: (url) => route(url),
});
```

- `.` defines the app's mobile config, which the shell also reads as JSON
  when it's built: a hosted `url`, extra `origins`, and which of shares,
  notifications, push, deep links, downloads and the rest it keeps.
- `./view` connects the page: notifications, push, shares, deep links, the
  phone's dynamic color, and the app's own requests to its Kotlin handlers.
- `./bridge` is the bridge's message shapes and the Schema for each of the
  shell's requests and messages.

The Kotlin shell itself is the Gradle library in `packages/mobile/android`,
taken into an app by Groundwork's sync rather than from npm. The docs are at
[groundwork.timmo.dev/phones/shell](https://groundwork.timmo.dev/phones/shell),
and `templates/android-app` is a starting point.
