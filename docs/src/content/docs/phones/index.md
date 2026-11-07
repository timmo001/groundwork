---
title: Phones
description: Groundwork's phone apps, starting as installable web apps and moving into a Kotlin shell around the system WebView for what the web can't do.
---

Phone apps start as the web app, installed as a PWA. It's the same [web components](/components) and theme CSS as every web app, with `@timmo001/groundwork-pwa` adding what makes it installable and usable on a phone: a manifest from the theme, an install offer, launcher shortcuts, a share target and offline starts.

What the web can't do on Android comes from a Kotlin shell around the system WebView, which loads the same page. The shell sends the page the same events the PWA does, such as `gw-share` for a received share, so an app handles each once.

![The demo installed on Android, on Base, dark](/screenshots/phones/installed-base-dark.png)

## The floor and the shell

| Piece | PWA | Shell |
| --- | --- | --- |
| Install, icon and splash colors from the theme | Yes | Yes |
| Light and dark following the system | Yes | Yes |
| Launcher shortcuts | Yes | Yes |
| Taking shares from other apps | Text and links | Text, links and files |
| Starting offline | Yes | Yes |
| Push notifications | Web Push, through the browser | UnifiedPush, with FCM where it's missing |
| Home screen widgets, quick settings tiles | No | Yes |
| Background work, foreground services | No | Yes |
| Biometrics and the system keystore | Passkeys only | Yes |
| Releases | Wherever the page is hosted | GitHub releases and an F-Droid repository |

An app ships as a PWA until it needs something from the shell's column.

## Demo

The phone demo runs `gw-demo-app` from `@timmo001/groundwork-demo/web`, the same element as the [web demo](/templates/app), installed as a PWA:

```sh
mise run demo:pwa
```

It serves the built template in the background at `https://pwa.groundwork.localhost`, and to a running emulator at `http://localhost:7370/`. Below the demo, a "This phone" card shows whether it's installed, whether it starts offline and the last share it took, with an install button while the browser can offer one.

[Building PWAs](/phones/pwa) covers the template and every option.

## References

- Web app manifest: [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)
- PWA capabilities: [web.dev](https://web.dev/learn/pwa/capabilities)
- Android WebView: [Docs](https://developer.android.com/develop/ui/views/layout/webapps)
