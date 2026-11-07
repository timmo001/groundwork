---
title: Terminal
description: Groundwork's terminal components for full-screen TUIs, built on OpenTUI and the terminal tokens.
---

Full-screen terminal apps use `@timmo001/groundwork-tui`: [OpenTUI](https://opentui.com) renderables and formatters on the terminal tokens, so every Groundwork TUI has the same header, lists, controls, dialogs and keys. Plain CLI output doesn't use it. That stays on the terminal's 16 ANSI colors, as [Targets](/targets) sets out.

![The TUI demo's main menu on Base, dark](/screenshots/terminal/menu-base-dark.png)

![The same menu on Slate, light](/screenshots/terminal/menu-slate-light.png)

## Themes

A TUI takes its colors from any theme: one of Groundwork's, the desktop's Omarchy theme, an app's own, or a theme file. Environment variables pick it:

| Variable | Values | Default |
| --- | --- | --- |
| `GW_THEME` | A Groundwork theme's id, such as `slate` or `catppuccin-mocha`, `omarchy`, an app theme's id, or a path to a theme document or an Omarchy `colors.toml` | `omarchy` where Omarchy is installed, otherwise `base` |
| `GW_MODE` | `light`, `dark` or `darker` | The theme's own mode, otherwise `dark` |
| `GW_TRANSPARENT` | `true` to leave panels unpainted, so the terminal's background shows through | `false` |

A theme file that can't be read or decoded falls back to the default, with a warning on stderr.

The Omarchy theme is the one in use, read from `~/.local/state/omarchy/current/theme/colors.toml`. It has its own mode, plus Darker for a dark one, so a `GW_MODE` it doesn't have falls back to its own.

```ts
import { Effect } from "effect";
import { loadTheme } from "@timmo001/groundwork-tui";

const theme = await Effect.runPromise(loadTheme);
```

An app with themes of its own passes their documents to `loadThemeWith(themes)`, which picks them by id too. `themeFor(id, mode)` picks one of Groundwork's directly, `themeFromDocument(document, mode)` places any theme document, and `themeFromFile(path, mode)` reads one through Effect's `FileSystem`. Each takes `{ transparent }`. For a theme picker, `themeOptionsWith(themes)` lists the app's themes, then the Omarchy theme, then Groundwork's core and optional themes, with the modes each has, and `resolveTheme({ theme, mode, transparent }, themes)` turns the pick into colors. The demo's Theme item does this and keeps the pick in `~/.config/tui-menu/theme.json`. Since every view is built in its theme, it opens the renderer again in the new one.

## Keys

Every view lists its keys along the bottom with `formatHelpBar`, so nothing has to be remembered.

| Key | Does |
| --- | --- |
| Up and Down | Move through a list |
| Left, Right, Up and Down | Move to the nearest tile in a grid |
| Typing | Filters the list |
| Enter | Selects, presses or applies |
| Tab and Shift+Tab | Move between controls and dialog buttons |
| Esc | Clears the filter, then closes a dialog or goes back |
| Ctrl+C | Quits from anywhere |

The mouse works too, once the app creates its renderer with `useMouse: true`, as the template does. A click runs a list row or a grid tile, presses a button, picks a choice or opens a collapsible, and the wheel scrolls. A grid passes clicks to its `onActivate` option.

## Effect

OpenTUI has no Effect integration, so the components are plain renderables. Effect sits around them: `loadTheme` reads its config through `Config`, and the app's services run in a `ManagedRuntime` wrapped as promises for the views. See [Services](/effect/services).

## Demo

`templates/tui-menu` is the TUI demo and a starting point for a new app. It runs on the shared `Items` service, like every [demo](/templates):

```sh
mise run demo:tui
GW_THEME=slate GW_MODE=light mise run demo:tui
```

## References

- OpenTUI: [Docs](https://opentui.com) · [Code](https://github.com/anomalyco/opentui)
- Charm: [Bubbles](https://github.com/charmbracelet/bubbles) · [Lip Gloss](https://github.com/charmbracelet/lipgloss)
- Textual: [Widgets](https://textual.textualize.io/widget_gallery/) · [Code](https://github.com/Textualize/textual)
