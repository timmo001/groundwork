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
- `formatBreadcrumb` and `formatHelpBar` build the title trail and the key
  hints along the bottom.

`templates/tui-menu` uses every component, and runs with `mise run demo:tui`.
