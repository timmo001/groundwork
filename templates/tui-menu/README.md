# tui-menu template

A starting point for a terminal menu app, built with [OpenTUI](https://github.com/sst/opentui), [Effect](https://effect.website) and [Fuse.js](https://www.fusejs.io/), on Groundwork's terminal tokens. It moved here from timmo001/starter-tui-menu, and becomes the TUI target of Groundwork's [demo app](https://groundwork.timmo.dev/demo).

```sh
bun src/index.ts                     # the main menu
bun src/index.ts settings display    # open a submenu, or run an item, by its path
GW_THEME=glazing GW_MODE=light bun src/index.ts
```

From the repository root, `mise run demo:tui` runs it.

What it shows:

- Fuzzy type-to-filter search, with weighted keys and keyword aliases.
- Nested submenus with a breadcrumb trail, and a popup for items with variants.
- Commands run suspended (with the terminal handed over), silently in the background, or with toasts for progress and result.
- Subcommands that resolve to menu items by greedy longest match.
- Colors from Groundwork's terminal tokens (`@timmo001/groundwork-tokens/opentui`), picked with `GW_THEME` and `GW_MODE`, Base and dark by default.

Copy the folder, rename `tui-menu`, and replace the items in `src/menu.ts` with your tool's own.
