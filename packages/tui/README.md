# @timmo001/groundwork-tui

Groundwork's terminal components: [OpenTUI](https://opentui.com) renderables
and formatters on the terminal tokens, so every Groundwork TUI has the same
look and keys.

```ts
import { AppHeader, formatHelpBar, loadTheme } from "@timmo001/groundwork-tui";
```

- `loadTheme` reads `GW_THEME` and `GW_MODE`. Without `GW_THEME` it's the
  desktop's Omarchy theme where there is one, otherwise Base and dark.
  `themeFor` picks a theme and mode directly, and `omarchyThemeFor` maps an
  Omarchy `colors.toml`.
- `AppHeader` and `PaneHeader` are one-row titles. `HeaderBlock` is the
  app's name as ASCII art over `formatHeaderBar`, a breadcrumb with a status
  dot and details that drop off when the terminal is narrow.
- `formatBreadcrumb`, `formatFilterBar` and `formatHelpBar` build the title
  trail, the filter line and the key hints along the bottom.
- `MenuList` is a filterable list of two-line rows, with group headings and
  paging. `StatusList` is a plain list of labelled values.
- `MenuGrid` lays out `Tile` cards under `SectionHeading` rows, with arrow
  keys moving to the nearest tile.
- `ScrollSurface` is a themed scroll box, and `surfaceBackground` its color.
- `Button`, `Input`, `RadioGroup` and `Collapsible` are the focusable
  controls: Enter or Space (or a click) presses, picks or toggles.
- `Dialog` is a centered panel, one open at a time, closed by Escape or a
  click outside. `ConfirmDialog` asks yes or no (Cancel has focus), and
  `ChoiceDialog` picks from a list. `Toast` is a single self-closing message
  for results nothing else on screen can show.

`templates/tui-menu` shows the components, and runs with `mise run demo:tui`.
