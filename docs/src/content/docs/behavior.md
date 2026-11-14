---
title: Behavior
description: How CLIs, agent tools, status, notifications and interfaces behave, so every tool works alike.
---

The parts that aren't pixels. A new system follows these, and the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool) shows each one working.

## CLIs

- One Effect CLI tree per system. The same tree feeds the CLI, Code Mode and MCP, so a new command reaches all three at once.
- Every command that returns data takes `--json`, which is the agent interface.
- When there's nothing to do, say so in one line and exit 0.
- Choices are a multi-select with the sensible ones ticked, and Enter runs them. `--yes`, `--json` or no terminal skips the picker.
- Long runs print numbered sections with one line each (`[3/7] mise tools`) and stream as they go.
- `--check` lists what would change without changing anything; `--force` skips the check.
- Help, completions and a generated reference come from the tree.
- Plain output uses the terminal's 16 ANSI colors and respects `NO_COLOR`.

## Agents

Every system gets the same agent surface:

| Surface | What it is |
| --- | --- |
| Code Mode | A manifest from `<tool> agent tools --json`, the shape `dot` already prints |
| MCP | A server on stdio from the same operations |
| Skill | A tool-owned skill in the repository's `skills/`, published on skills.sh and as a Claude Code marketplace |

An agent tries Code Mode first, then MCP, then the CLI with `--json`, and the skill says so.

Each operation has one access class, which decides how agents may use it:

| Access | Code Mode | MCP |
| --- | --- | --- |
| Read | Read | A read-only tool |
| Write | Write | A tool |
| Ask every time (fixes, anything destructive) | Write, always asks | A tool marked destructive |
| Power (reboot, shut down) | Write, always asks | Left out unless the server starts with `--allow-power` |

Long commands run as jobs only, so an agent starts them and comes back for the result.

### Publishing the skill

Two files at the repository's root publish `skills/`, and the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool) has both:

| File | For |
| --- | --- |
| `skills.sh.json` | The [Skills CLI](https://skills.sh), grouping the skills into those for using the tool and those for working on it |
| `.claude-plugin/marketplace.json` | Claude Code, with one plugin whose source is `./skills` |

The docs site gets an Agents page listing each surface, every operation with its access, and how to install the skill:

```bash
npx skills add timmo001/<repo> --skill <tool>
```

```text
/plugin install <tool> --marketplace timmo001/<repo>
```

## Status and notifications

- One status source per system, as `dot updates status --json` is for updates. The bar widget, the OpenCode footer, the CLI and the panel all read it, so each shows the same counts.
- The bar counts what needs you, and hides in quiet hours.
- Avoid toasts. Show an outcome where it happened (the button, a popover from it, or the page), app-wide state in a slim bar, and anything that needs you as a notification. A toast never has an action. Nothing for green runs.

## Notifications

The notification center is the one place an app tells you it needs you. A notification is a pointer to a page: clicking it goes there, and the page has the details.

- **It's yours if** you caused it, you need to decide something, or it's about something you own: a restart after your update, an update to install, a device found, a failed sign-in. How the system works (startup steps, logs, background jobs) stays out.
- **The app decides how loud it is.** An alert shows by the notifications entry until you act on it or hide it; a passive one only goes to the center. Both are the same card in both places, with the same actions.
- **Hiding isn't dismissing.** A hidden alert moves to the center and comes back only when its state changes.
- **System notifications clear themselves.** A pending restart goes when you restart; you dismiss your own.
- **Like ones stack.** One restart notification lists everything that asked; "3 devices discovered" is one card.
- Decisions go to the Plannotator Inbox; reviews go through Plannotator, not GitHub.

## Push

One way for a service to reach phones when its app is closed, so the PWA and the Android shell share one client and every service sends one shape. The Schemas are in `@timmo001/groundwork-pwa/push`.

| Route | Does |
| --- | --- |
| `GET push/vapid-key` | The service's VAPID public key, `{ publicKey }`, for the client to subscribe with |
| `POST push/subscriptions` | Keeps a `PushSubscription`: the endpoint, its `p256dh` and `auth` keys, and the client (`id`, `name`, `platform`). A known client's new one replaces its last |
| `DELETE push/subscriptions` | Drops the subscription with `{ endpoint }` |

- **Subscribing.** The PWA subscribes through its service worker's `pushManager` with the VAPID key. The shell registers with UnifiedPush, falling back to the embedded FCM distributor, and posts that endpoint the same way.
- **Sending.** The service encrypts each `PushPayload` with a Web Push library and its VAPID keys, which reaches the browser's push service and a UnifiedPush endpoint alike. A `404` or `410` from the endpoint means the subscription is gone, so the service drops it.
- **The payload.** `title`, then optional `body`, `tone`, `link` (a page in the app, relative to its scope), `tag` (like ones replace each other), `level` (`alert` or `passive`, as in [Notifications](#notifications)), `ongoing` and the app's own `data`.
- **Ongoing work.** `ongoing` has an `id`, a `status`, an optional `progress` of `{ value, max }` and `done`. Each push with the same id updates one notification, shown as a Live Update on Android 16 and a plain ongoing one below it, until `done`.
- Clients read a push with `decodePushPayload`, which turns anything else away rather than showing it.

## Pairing

Connecting a phone to a service without typing an address or a credential. The Schemas and helpers are in `@timmo001/groundwork-pwa/pairing`.

1. **The link.** The service makes a one-time code and shows its base URL with `?pair=<code>`, as text and a QR code (`pairingUrl`). The code works once and expires a few minutes after it's made.
2. **Opening it.** The app opens the link, or scans it with `scanPairingLink` from the camera, where the browser has the Barcode Detection API (`canScan`). The page starts the camera and owns the permission prompt; the Android shell passes it through.
3. **The handshake.** The app posts `{ code, client }` to `POST pair`. The service checks the code, forgets it, and answers with `{ token, service: { id, name } }`. `pair` does the round trip.
4. **After.** The app sends `Authorization: Bearer <token>` from then on. The service records the client with when it paired and when it was last seen, and lists them so one can be removed, which ends its token.

The same client `id` goes in the pairing and in the push subscription, so removing a client stops its pushes too.

## Interfaces

How an app's pages hold up as they grow. Groundwork's components do most of this themselves, so a page gets it by using them: [tables](/components/display#table) and [expansion panels](/components/display#expansion-panel) keep their own view state and draw on open, and long lists are windowed.

### View state

How someone has set a view up to read it: the sort, the search, folded sections, filters and the chosen tab. It isn't data, which comes from the server, and it isn't a setting, which is an app-wide preference.

- The page sets how a view starts. The browser keeps only what someone changes, so a new default still reaches anyone who never touched it.
- It comes back as it was left, in that browser, under a `storage-key`. Keys read `app:view:part`, such as `upkeep:jobs:table`.
- A component with a `storage-key` keeps its own view state, so the page never has to. Code that keeps something of its own reads and writes through the same `getStorage()`.
- It goes in the URL only when a link should carry it, such as a search someone would share.

### Unsaved changes

A form that saves with a button, such as a settings page, holds edits until it's saved.

- Save is disabled until something changes, and again once it's saved.
- Leaving with unsaved changes asks first: a link to another page, back or forward, and closing or reloading the tab. Leaving puts the form back as it was saved.
- `DirtyState` and `confirmLeave` in groundwork-ui do both, and the router's `beforeLeave` holds the page while it asks. A dialog or popover that holds edits asks in place instead, through its own `dirty`.

### Folds

Expansion panels, and the groups in a table or list.

- Each starts as the page chooses: folded for long or reference content, open for what needs you.
- What's in a fold is drawn the first time it opens, never with the page, and stays drawn after that. With `gw-expansion`, that's its `draw`.
- Group headings sit on the page's own surface, the bottom layer, and the rows or cards in them sit raised on top.

### Long content

Anything that can grow past a screen, such as a table, a list, a feed or a diff, draws only the part in view. Inside a fold or a panel, it scrolls in its own frame up to a maximum height (`contained`), rather than stretching the page. Scrolling past either end of the frame scrolls the page, and so does scrolling over a frame with nothing more to show.

### Respond first

A press shows its result in the same frame: the fold opens and the chevron turns. The work it starts, such as a request, marking something read or drawing heavy content, waits until after that frame. A write shows at once and rolls back if it fails.

### Loading

- A skeleton shaped like the content, for each part rather than the whole page, so nothing jumps when the data arrives.
- A refresh keeps the last data on screen.
- A spinner is only for an action in progress, never for content.

### Refreshing

Polling and live changes redraw only what changed, keyed by each item's id. They never reset view state, the scroll position or open folds.

### Text

Written text from people or agents, such as a description, a reason or a summary, renders as markdown, sanitized. Short plain values, such as a name or a version, stay plain text.

### Touch

One set of gestures on a touch screen, so a swipe does the same thing in every app. They belong on a surface that fills the view, such as a player's picture or a photo, never on a page that scrolls.

| Gesture | Does |
| --- | --- |
| 1 finger up or down | Shows or hides the controls over the picture, in full screen or a phone on its side |
| 1 finger left or right | The next or previous item, or a seek |
| 2 fingers left or right | The next or previous larger step, such as a day or a chapter |
| 3 fingers up or down | Opens or closes the help |
| Pinch | Zooms in or out |
| Double tap | Focuses one item, such as showing one camera alone |

Left goes forward, as a finger pulls the next item in from the right. An app leaves out the gestures it has nothing for, and never gives one of these a different meaning.

The rules:

- **Never on what a drag already moves.** A zoomed picture, a camera being steered, a slider, a popover or the controls themselves take their own drags, so a touch that starts on one isn't a swipe.
- **Never also a click.** The tap that ends a swipe presses nothing, and a pinch or a touch the browser takes over, such as to scroll, is no gesture at all.
- **A swipe is a clear one.** At least 48px, along one axis twice as far as across it, with every finger moving the same way and two fingers spreading or closing no more than 40px.
- **The surface owns its touches.** Give it `touch-action: none`, or `pan-y` where the page still scrolls through it, so the browser doesn't scroll or zoom the page under a gesture.

`onSwipe(element, listener, options?)` in groundwork-ui recognizes them, with the rules above built in. Every listener on an element shares one recognizer, so the controls and the page can each listen to the same surface, and it returns a function that stops listening. `ignore` is a selector for what a drag already moves, and `distance` and `pinch` change the thresholds. `swipeOf(fingers, options?)` reads a swipe from fingers an app tracks itself.

```ts
import { onSwipe } from "@timmo001/groundwork-ui";

onSwipe(
  stage,
  ({ fingers, direction }) => {
    if (fingers === 1 && direction === "left") next();
    if (fingers === 1 && direction === "right") previous();
    if (fingers === 3 && direction === "up") help.show();
    if (fingers === 3 && direction === "down") help.close();
  },
  { ignore: "[data-movable], gw-range, gw-popover" },
);
```

#### Help

A page's help popover lists the gestures where there's a touch screen and the keys where there's likely a keyboard. A laptop with a touch screen shows both; a phone shows only the gestures.

```css
/* The gestures, where any pointer is a finger */
@media not (any-pointer: coarse) {
  .touch-only {
    display: none;
  }
}

/* The keys, unless a finger is the only way to point */
@media (any-pointer: coarse) and (any-hover: none) {
  .keys-only {
    display: none;
  }
}
```

#### Controls over a picture

In full screen, or on a phone on its side, a player's controls sit over its picture and fade once they've been left alone a moment while it plays, as a video player's do. They stay while it's paused, or while more of their rows are open.

- **Only what does nothing else wakes them:** a tap where there's nothing to press (one that moved less than 10px), a 1 finger swipe up (down hides them), a key, a mouse moving, or a handle at the bottom in the middle that shows while they're hidden, at least 64 by 44px so a finger finds it.
- **A press on a control does its own thing.** A button, a slider, a tile or a camera's own controls never wake or hide the bar, and their press is never swallowed. A tap that does toggle the bar presses nothing else.
- **Keep clear of the screen's edges.** Everything that can be pressed stays out of a phone's rounded corners and the middle of its sides, where a punch hole or notch sits in landscape: an inline margin of at least `1.5rem`, or the safe area where that's wider, and the bottom safe area under the bar and the handle.

```css
[data-overlay] {
  --safe-inline: max(
    1.5rem,
    env(safe-area-inset-left, 0px),
    env(safe-area-inset-right, 0px)
  );
  --safe-bottom: max(var(--gw-space-2), env(safe-area-inset-bottom, 0px));
}
```
