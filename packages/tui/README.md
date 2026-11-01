# @timmo001/groundwork-tui

Groundwork's terminal components: [OpenTUI](https://opentui.com) renderables
and formatters on the terminal tokens, so every Groundwork TUI has the same
look and keys.

```ts
import { AppHeader, formatHelpBar, loadTheme } from "@timmo001/groundwork-tui";
```

- `loadTheme` reads `GW_THEME` and `GW_MODE` (Base and dark by default), and
  `themeFor` picks a theme and mode directly.
- `AppHeader` and `PaneHeader` are one-row titles.
- `formatBreadcrumb`, `formatFilterBar` and `formatHelpBar` build the title
  trail, the filter line and the key hints along the bottom.
- `MenuList` is a filterable list of two-line rows, with group headings and
  paging. `StatusList` is a plain list of labelled values.
- `MenuGrid` lays out `Tile` cards under `SectionHeading` rows, with arrow
  keys moving to the nearest tile.
- `ScrollSurface` is a themed scroll box, and `surfaceBackground` its color.

`templates/tui-menu` shows the components, and runs with `mise run demo:tui`.
