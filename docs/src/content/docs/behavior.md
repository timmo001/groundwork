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

Connecting a phone or another device to a service without typing an address or a credential. The device trades a one-time code for a key of its own, so pairing is how a client gets a key. The Schemas and helpers are in `@timmo001/groundwork-pwa/pairing`, and the screens are [`gw-pairing`](/components/display#pairing), [`gw-copy`](/components/display#copy) and [`gw-qr`](/components/display#qr-code).

1. **The link.** The service makes a one-time code and shows its base URL with `?pair=<code>`, or `#pair=<code>` to keep it out of request logs (`pairingUrl`). The code works once and expires a few minutes after it's made.
2. **Opening it.** The app opens the link, or scans it with `scanPairingLink` from the camera, where the browser has the Barcode Detection API (`canScan`). The page starts the camera and owns the permission prompt; the Android shell passes it through. An app opened by the link reads it with `takePairingLink`, which takes the code out of the address bar.
3. **The handshake.** The app posts `{ code, client }` to `POST pair`. The service checks the code, forgets it, and answers with `{ token, service: { id, name } }`. `pair` does the round trip.
4. **After.** The app sends `Authorization: Bearer <token>` from then on. The service records the client with when it paired and when it was last seen, and lists them so one can be removed, which ends its token.

The same client `id` goes in the pairing and in the push subscription, so removing a client stops its pushes too.

### Showing a code

The service's own page, on a laptop or a phone already paired, shows the code three ways at once, so whatever's in hand works:

- **A QR code of the link**, always, since a laptop's camera scans too. It's black on white with a quiet zone of four modules on every side in every theme, mode and forced colors, and at least `10rem` across, so a phone reads each module.
- **The code in large monospace text, in groups of four**, such as `4F9C-82KD`, to type on a device with no camera.
- **A Copy button for the link**, which says `Copied` for a moment and announces it, to send it to a device by message.
- **A countdown** of when it stops working, such as `Works once. Expires in 4:07`. When it runs out, the code is hidden, it says the code expired, and Make a new code brings another. Making a new one ends the last.
- **The paired state, in place.** Once a device uses the code, it says which, such as `Paired with Pixel 9`, then goes back to the list of devices.

`gw-pairing` is all of this, given the app's function that makes a code and one that waits for it to be used.

### Entering a code

The device that pairs has one field that takes either a pasted link or a typed code, so nobody has to know which they have. It ignores case, spaces and dashes, so `4f9c 82kd` is `4F9C82KD`, and a bare code pairs with the service the app already knows. `parsePairingInput(text, service)` reads both; `normalizePairingCode` is the typed part alone.

Codes avoid characters that read alike: Crockford's base32 (digits and capitals without I, L, O and U) gives 40 bits in 8 characters. A service that takes I, L and O as typos for 1, 1 and 0 accepts what someone reads off the screen.

### Devices

The service lists every paired device: its name and kind, when it paired, when it was last seen, and Remove, which ends that device's key at once. A device that's removed has to pair again.

### Security

- **Codes come from a CSPRNG and work once.** The service forgets a code as it's used, and when a new one is made.
- **Short expiry.** Five minutes: long enough to fetch a phone and scan, short enough that a code someone saw over a shoulder or in a screenshot has gone.
- **Lockout.** After repeated wrong codes, such as 10 in 5 minutes, the service stops taking codes for a while and drops the open ones, counted on the service rather than per address, so a guesser can't spread out. With 40 bits and a lockout, guessing a live code is out of reach.
- **Nothing secret in logs.** Codes, links that carry them and keys never go in a log, an error or analytics. A fragment link never reaches the server's request log, and the app takes it out of the address bar once it's read.
- **One key per client, stored hashed.** Each device gets its own key, at least 256 bits from a CSPRNG, sent as a Bearer token. The service keeps only its SHA-256 hash, compares in constant time, and shows a key once, if a person ever needs to see it.
- **Show what's being paired.** The paired state names the device, so the person who made the code sees whether the one they meant used it.

Sources: [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628) on device codes (§5.1 brute forcing, §5.4 phishing and lifetime, §6.1 characters and dashes), OWASP's [Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) (single-use expiring tokens), [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout) (lockout) and [Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude) (what to leave out) cheat sheets, DENSO WAVE on the [QR quiet zone](https://www.qrcode.com/en/howto/code.html) (ISO/IEC 18004), and ML Kit's [barcode scanning](https://developers.google.com/ml-kit/vision/barcode-scanning/android#input-image-guidelines) guidance on module size.

## Interfaces

How an app's pages hold up as they grow. Groundwork's components do most of this themselves, so a page gets it by using them: [tables](/components/display#table) and [expansion panels](/components/display#expansion-panel) keep their own view state and draw on open, and long lists are windowed.

Agents building, laying out or reviewing a page or app on Groundwork load the `groundwork-interfaces` skill, which checks these rules with the [foundations](/foundations) they rest on: [touch targets](/foundations/spacing#touch-targets), [layout](/foundations/layout) and [motion](/foundations/motion).

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

Every press shows something at once: its result, or that it's on its way. Under a tenth of a second feels instant and needs nothing more; anything longer shows it's waiting. Every Groundwork control shows it's pressed within `--gw-motion-instant` (75ms), a tint and, on a button, a slight shrink, so the press is seen before the action answers.

- **Pending, for an action that waits on a device or a server and can be pressed again**, such as moving a camera a step. The control gently pulses until the answer comes, and keeps taking presses, each one counted, until the last has answered. Under reduced motion the pulse is a steady dim. `gw-button`'s `pending` attribute draws it, and `button.waitFor(request)` sets it until every press has answered.
- **Loading, for an action that mustn't run twice**, such as saving or signing in. The button shows a ring and takes no more presses until it's done, as `gw-button`'s `loading` does.
- **A result that takes longer than a few seconds** shows its progress where it was asked for, and the person can go on with other things meanwhile.

### Loading

- A skeleton shaped like the content, for each part rather than the whole page, so nothing jumps when the data arrives.
- A refresh keeps the last data on screen.
- A spinner is only for an action in progress, never for content.

### Refreshing

Polling and live changes redraw only what changed, keyed by each item's id. They never reset view state, the scroll position or open folds.

### Text

Written text from people or agents, such as a description, a reason or a summary, renders as markdown, sanitized. Short plain values, such as a name or a version, stay plain text.

### Modes

A mode changes what a drag or a key does, such as Move, where a drag on a camera's picture steers it rather than panning. A mode no one notices is one that surprises them, so:

- **Turned on by a labeled control on what it acts on**, never by a gesture or a hidden key alone.
- **Named in text while it's on**, beside its controls, with a clear Done that turns it off. Esc turns it off too.
- **Its controls sit off the content**, beside or under it, never over the picture they steer.
- **Settings that rarely change go in a settings sheet**, not among the mode's controls.

### One press, one thing

A press does what it's on, and only that.

- A press that closes an overlay, such as one outside a popover, never also presses what's under it. Groundwork's popups lay a [scrim](/components/overlays#clicks-outside) that takes it.
- Pressing the button that opened a popover closes it, rather than closing it and opening it again. The scrim takes that press, so it does. A key that opens it, such as `?`, calls `popover.toggle(button)`.
- A tap that ends a swipe presses nothing, as [Touch](#touch) sets out.
- A press on a control inside something pressable, such as a button on a tile, does the control's thing and never the tile's too.

### Keys

A page's own shortcuts, such as `k` to play or the arrows to step, never take a key from something that already uses it:

- **Typing.** Nothing fires while a field, a text area or anything editable has the focus.
- **Controls that own their keys.** The arrows stay with a toggle, a slider, a list or a menu that has the focus, and Space and Enter with a button.
- **Overlays.** While a popover, a sheet or a dialog is open, its keys are its own, and the page's shortcuts wait until it closes.
- **Esc closes only the topmost overlay**, one at a time, then ends a mode.
- **Modifier keys** (Ctrl, Cmd, Alt) belong to the browser and the system, unless a shortcut is written with one.
- **Single keys belong to a region.** A shortcut that's one letter, number or symbol, such as `k` or `?`, works only while the focus is in what it acts on, such as the player, since speech input types letters and would set them off anywhere else. Give the region `tabindex="0"`, so a click or Tab into it gives it the focus. An app whose one-letter shortcuts work page-wide instead gives people a setting that turns them off.

`?` opens the page's help where there are shortcuts, as [Help](#help) sets out.

`shortcutKey(event, { within, singleKeys })` from `@timmo001/groundwork-ui` follows these rules: it gives the shortcut a key press asks for, or `undefined` where the key belongs to something else. `within` is the region, and a key outside it counts for nothing; `singleKeys: false` is the setting's off.

```ts
import { shortcutKey } from "@timmo001/groundwork-ui";

player.tabIndex = 0;

player.addEventListener("keydown", (event) => {
  const key = shortcutKey(event, { within: player });

  if (key === "k") togglePlay();
  else if (key === "?") help.toggle(helpButton);
  else return;

  event.preventDefault();
});
```

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

Every page with gestures or shortcuts has help: a plain button with a `?` icon, labeled Help, and the `?` key. Pressing either again closes it. It lists the gestures where there's a touch screen and the keys where there's likely a keyboard, in sections by what they act on, such as the player, the timeline and the page, with each key drawn as a key (`<kbd>`). A laptop with a touch screen shows both; a phone shows only the gestures.

A [key list](/components/overlays#key-list) lays the list out, with `input="touch"` or `input="keys"` to show it only where it applies. `touchQuery` and `noKeyboardQuery` from `@timmo001/groundwork-ui` are the same tests as media queries, for an app's own styles:

```css
/* The gestures, where any pointer is a finger (touchQuery) */
@media not (any-pointer: coarse) {
  .touch-only {
    display: none;
  }
}

/* The keys, unless a finger is the only way to point (noKeyboardQuery) */
@media (any-pointer: coarse) and (any-hover: none) {
  .keys-only {
    display: none;
  }
}
```

#### Controls over a picture

In full screen, or on a phone on its side, a player's controls sit over its picture and slide down off the bottom edge once they've been left alone for 3 seconds while it plays, as a video player's do, while the handle rises in their place. They stay while it's paused, or while more of their rows are open: only the first row shows at first, and a tab at its edge opens the rest, which grow in rather than appear.

- **Only what does nothing else wakes them:** a tap where there's nothing to press (one that moved less than 10px), a 1 finger swipe up (down hides them), a key, a mouse moving, or a handle at the bottom in the middle that shows while they're hidden, at least 64 by 44px so a finger finds it.
- **A press on a control does its own thing.** A button, a slider, a tile or a camera's own controls never wake or hide the bar, and their press is never swallowed. A tap that does toggle the bar presses nothing else. Only what's inside the stage counts as a control: the stage itself, and anything around it, can be focusable, such as with `tabindex="0"` for [single keys](#keys), and a tap on the picture still wakes or hides the bar.
- **Keep clear of the screen's edges.** Everything that can be pressed stays out of a phone's rounded corners and the middle of its sides, where a punch hole or notch sits in landscape: an inline margin of `--gw-safe-inline`, at least `1.5rem` or the safe area where that's wider, and `--gw-safe-bottom` under the bar and the handle. [A phone on its side](/foundations/layout#a-phone-on-its-side) has the tokens and the viewport setting they need.
- **Turning a phone on its side** goes full screen, and turning it back upright leaves.

`overlayControls(bar, options?)` from `@timmo001/groundwork-ui` does all of this. It puts `bar` over the bottom of `stage` (its parent by default) while the phone is on its side (`sidewaysQuery`) or the player is in full screen, and under it otherwise. It marks the stage `data-overlay` and the bar `data-over`, and `data-hidden` while the bar is away, for an app's own styles. A [control bar](/components/actions#control-bar) gets `expandable` while it's over the picture, so only its first row shows until its tab opens the rest. It returns a function that stops it and puts the bar back.

```ts
import { overlayControls } from "@timmo001/groundwork-ui";

overlayControls(controls, {
  stage: player,
  fullscreen: player,
  stays: () => video.paused,
  pressable: ".tile",
  ignore: "[data-movable]",
});
```

| Option | What it does |
| --- | --- |
| `stage` | What the controls sit over. Defaults to the bar's parent |
| `fullscreen` | What goes full screen when a phone turns on its side, and leaves it when it turns back. Leave it out to keep full screen to the app's own button. Browsers mostly allow full screen only from a tap, so turning may not be enough |
| `hideAfter` | How long the controls stay after the last touch, in milliseconds (`3000`) |
| `stays` | Whether they should stay anyway, such as while paused. They always stay while a menu or popover in them is open, or a control bar's other rows are |
| `pressable` | A selector for more that a press does something on, such as a tile, added to `overlayPressables` |
| `ignore` | A selector for what a drag already moves, where a swipe never starts |
| `handleLabel` | The handle's name (`Show the controls`) |

The handle is a `gw-button` with the `gw-overlay-handle` class, and `--gw-overlay-controls-background` sets the bar's and the handle's see-through fill. The bar and the handle keep the safe margins themselves; the picture under them needs them too, where it has anything to press:

```css
[data-overlay] > .picture {
  padding-inline: var(--gw-safe-inline);
}
```

#### Text over media

A name or a caption over a picture never hides it. On a large tile it sits in a corner, on a dark band that reads over any picture. On a tile too small for that, under 200px wide as a container query on the tile, it shrinks to a small chip on one line in the corner, and fades with the controls when they hide. The picture comes first; a name that matters goes beside or under it instead.

## References

- Nielsen Norman Group: [Response times: the 3 important limits](https://www.nngroup.com/articles/response-times-3-important-limits/), [Modes in user interfaces](https://www.nngroup.com/articles/modes/)
- WAI-ARIA Authoring Practices: [Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- WCAG 2.2: [Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html), [Pointer Cancellation](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html)
- GitHub: [Keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts)
- Apple Human Interface Guidelines: [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video)
- MDN: [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)
