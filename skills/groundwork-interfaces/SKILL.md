---
name: groundwork-interfaces
description: Build, lay out or review an app's screens on Groundwork so nothing gets in the way, everything can be pressed with a finger, one press does one thing and things travel rather than jump. Use when designing or changing a page, a bar of controls, an overlay, a player or a mode, when fitting a screen to a phone, or when reviewing a UI on Groundwork. Not for changing Groundwork itself.
---

# Groundwork interfaces

The rules live in the docs, with their numbers and sources. Read each page fresh through the `docs-groundwork` MCP server (`get_page`), or the site, when you reach the item that needs it, rather than working from memory:

| Page | For |
| --- | --- |
| `/principles` (Interfaces) | The goals every item below serves |
| `/foundations/spacing` (Touch targets) | Hit areas and the gap between them |
| `/foundations/layout` | Grouping, the fewest rows, thresholds, a phone on its side, media fit, filling the window |
| `/foundations/motion` | Durations, easing, reduced motion, moving things across the view, pages and tabs |
| `/behavior` (Interfaces) | Respond first, modes, one press one thing, keys, touch, help, controls over a picture |
| `/behavior` (Pairing) | Connecting a phone or another device: showing and entering a code, the device list, security |
| `/components/overlays` | Popover, sheet or dialog, and staying out of the way |

Use Groundwork's elements and helpers wherever one does the job, as each already follows these rules. Write an app's own only where none fits, and follow the same page.

## Checklist

Go through it for each screen, at a desktop width, a phone upright and a phone on its side, with a mouse and with touch.

1. **Nothing gets in the way.** What the person watches or reads has the most room. Controls sit beside or under it, except over a picture on a phone on its side or in full screen (`overlayControls()`). Overlays leave live content in view, with `live` on a popover or sheet over it.
2. **Grouped by what they act on.** Each group sits together, with a separator (`gw-divider`) or a bigger gap between groups, and controls for different things only share a row when there's no better place.
3. **Fewest rows.** A bar tightens in the page's order (labels, More, shrinking, two rows, the phone layout) and never wraps unevenly. `gw-control-bar` does it for a bar in start, middle and end groups, with `data-overflow` on what folds into More.
4. **Touch targets.** Every control reaches `--gw-target-min` without growing its look, and no two hit areas overlap. Where controls sit too close for that, they or their gap grow on a touch screen only: `gw-row`'s gap does by itself, and an app's own tight toolbar takes `max(gap, --gw-target-min less the controls' height)`, not a hand-tuned number.
5. **Every press answers at once.** A result, pending for actions that wait on a device (`gw-button`'s `waitFor()`), or loading for ones that mustn't run twice.
6. **One press, one thing.** Closing an overlay presses nothing beneath it, the button that opened a popover closes it, and a control inside something pressable does only its own thing.
7. **Keys.** Shortcuts read through `shortcutKey()`, so they skip fields, controls that own their keys and open overlays. Esc closes the topmost overlay first. One-letter shortcuts work only while their region has the focus (`within`), or can be turned off. `?` and a Help button list the keys and gestures, each in a `gw-key-list` with `input="keys"` or `input="touch"`.
8. **Modes are obvious.** Turned on by a labeled control, named while on, with Done and Esc to leave, and their controls off the content.
9. **The right overlay.** Chosen by how much it holds, from the table on the overlays page.
10. **Motion travels.** Use the motion tokens, travel rather than jump, never animate a resize. Moves and resizes go through `withViewTransition()` with a name from `transitionName()` and a `view-transition-class` (`gw-travel`, `gw-from-*` for an edge, `gw-page` for page and tab content with a `gw-forward` or `gw-back` type), leaving the timing to those classes rather than one duration on every group. Arrivals come from their edge or anchor and leave the way they came, a quicker step; lists make room and close their gaps (`animateLayout()`, or `measureLayout()` around an element's own update); fades only for content arriving in place. Motion answers a person's action: what a resize or turning the device changes snaps. A second press never waits, a drag follows the finger and `dragCloses()` decides where it goes when let go, every press shows within `--gw-motion-instant`, and under reduced motion nothing moves but views still crossfade on `--gw-motion-fade`.
11. **Media and the window.** Pictures show all of themselves (`contain`) wherever the layout sets the shape and their edge may matter, a full view fills the window under the app bar (`fillWindow()`), and nothing that can be pressed sits in a phone's corners or cutout. Layout changes follow the shared media queries (`sheetQuery()`, `sidewaysQuery`, `labelsHiddenQuery`).
12. **Pairing.** A screen that connects another device shows the code with `gw-pairing` (the QR code of the link, the grouped code with Copy, a countdown, then the paired device by name), and the device that pairs has one field for a link or a code, read with `parsePairingInput`. Devices are listed with Remove, and nothing asks anyone to type an address or a password.

Report each item that fails with the page and section it breaks. When a rule doesn't fit the app for a good reason, or Groundwork is missing a piece the app has to write itself, raise it as a Groundwork change following `groundwork-changes` rather than only working around it in the app.
