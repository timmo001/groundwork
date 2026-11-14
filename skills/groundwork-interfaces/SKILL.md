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
| `/foundations/motion` | Durations, easing, and moving things across the view |
| `/behavior` (Interfaces) | Respond first, modes, one press one thing, keys, touch, help, controls over a picture |
| `/components/overlays` | Popover, sheet or dialog, and staying out of the way |

Use Groundwork's elements and helpers wherever one does the job, as each already follows these rules. Write an app's own only where none fits, and follow the same page.

## Checklist

Go through it for each screen, at a desktop width, a phone upright and a phone on its side, with a mouse and with touch.

1. **Nothing gets in the way.** What the person watches or reads has the most room. Controls sit beside or under it, except over a picture on a phone on its side or in full screen. Overlays leave live content in view.
2. **Grouped by what they act on.** Each group sits together, with a separator or a bigger gap between groups, and controls for different things only share a row when there's no better place.
3. **Fewest rows.** A bar tightens in the page's order (labels, More, shrinking, two rows, the phone layout) and never wraps unevenly.
4. **Touch targets.** Every control reaches `--gw-target-min` without growing its look, and no two hit areas overlap.
5. **Every press answers at once.** A result, pending for actions that wait on a device, or loading for ones that mustn't run twice.
6. **One press, one thing.** Closing an overlay presses nothing beneath it, the button that opened a popover closes it, and a control inside something pressable does only its own thing.
7. **Keys.** Shortcuts skip fields, controls that own their keys and open overlays. Esc closes the topmost overlay first. Single-key shortcuts can be turned off. `?` and a Help button list the keys and gestures.
8. **Modes are obvious.** Turned on by a labeled control, named while on, with Done and Esc to leave, and their controls off the content.
9. **The right overlay.** Chosen by how much it holds, from the table on the overlays page.
10. **Motion travels.** Moves and resizes go through `withViewTransition()` with a name from `transitionName()`, arrivals come from their edge or anchor, fades only for content arriving in place, and nothing moves under reduced motion.
11. **Media and the window.** Pictures fill their box as the layout page says, a full view fills the window under the app bar, and nothing that can be pressed sits in a phone's corners or cutout.

Report each item that fails with the page and section it breaks. When a rule doesn't fit the app for a good reason, or Groundwork is missing a piece the app has to write itself, raise it as a Groundwork change following `groundwork-changes` rather than only working around it in the app.
