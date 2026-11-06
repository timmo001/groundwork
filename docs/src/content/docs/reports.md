---
title: Reports
description: The report page from @timmo001/groundwork-report, one self-contained HTML file built from blocks, with every theme and the desktop's own.
---

A report is one HTML file that a tool writes, such as a weekly migration report or a review summary. `@timmo001/groundwork-report` builds it from blocks on Groundwork's elements and tokens, so every report has the same header, sections, tables and states, and every theme. The file carries its CSS and script inline, so it opens from disk, a mail or an attachment, with no server.

![The sample report's summary on Glazing, light](/screenshots/report/summary-glazing-light.png)

![Its tables and states on GitHub Dimmed, dark](/screenshots/report/tables-github-dimmed-dark.png)

## Layout

Every report has the standard header: a `gw-app-bar` with the brand and the theme picker, then a `gw-page-header` with the title, a line under it, and chips such as the date and the commit it read. Sections follow, each under a level 2 `gw-page-header`. The order and nesting are the report's own. Blocks are plain functions that return markup, so a report arranges them however its content reads best.

```ts
import { reportAssets } from "@timmo001/groundwork-report/assets" with { type: "macro" };
import { readReportThemes } from "@timmo001/groundwork-report/desktop";
import { alert, reportPage, section, stats } from "@timmo001/groundwork-report";

const page = reportPage({
  title: "Weekly migration report",
  description: "Where the move to the new data layer stands.",
  assets: await reportAssets(),
  ...(await readReportThemes()),
  body: [
    alert({ tone: "info", heading: "This week" }, "Nine more files moved."),
    section({ id: "migration", title: "Migration" }, stats(numbers)),
  ],
});
```

## Blocks

| Block | Shows | On |
| --- | --- | --- |
| `section`, `heading` | A titled part of the page, a heading within one | `gw-page-header` |
| `alert`, `note` | A message with a tone, a quiet aside | `gw-alert` |
| `stats`, `breakdown`, `progress` | Headline numbers, how a whole splits, one value of many | Report styles, `gw-meter` |
| `facts`, `list`, `paragraph` | Label and value pairs, lists, text | `gw-facts` |
| `cards`, `expansion` | Linked cards, a section that folds away | `gw-card`, `gw-expansion` |
| `badge` | A state, such as Migrated or Blocking, with its tone's icon | `gw-badge` |
| `chip`, `chips` | Counts, names, dates and links | `gw-chip` |
| `table` | Rows that sort, search, group and filter | `gw-table`, `gw-sheet`, `gw-filter` |

Text is escaped. `html` marks a template as markup and `raw` a string. Only the stats tiles and the breakdown bar have styles of their own, since Groundwork has no element for them, and they're on the `--gw-*` tokens like everything else.

## Tables

`table` is `gw-table`, so long tables window their rows and keep scrolling smooth. Cells are described as data, and the page's script draws them: text, a link, monospace, a quieter color, a second line, badges, chips or a breakdown bar. A cell's `value` is what it sorts and searches by.

`group` groups the rows by a column, and `groupsCollapsed` starts every group folded away, for long lists. `filters` add a Filters button beside the search field, opening a sheet of `gw-filter`s, each matched against values the rows carry under the filter's id.

## Themes

The picker offers the [core themes](/themes), then the [optional ones](/themes/optional) by family, then a Desktop group. The Import item is hidden (`no-import` on `gw-theme-picker`), since the desktop's themes come in on their own. A report starts on Glazing until one is picked.

`readReportThemes` reads the machine where the report is made:

- The Omarchy theme in use, offered as Omarchy, and kept only as a choice: the report doesn't follow it (`followOmarchy: false`).
- Every installed Omarchy theme, from its `colors.toml`, or its Alacritty, Ghostty or kitty file in older themes.
- The terminals' own themes: Ghostty, kitty, Alacritty and foot.

Each is translated onto the roles with `translatePalette` from `@timmo001/groundwork-tokens/translate`, and any that match a built-in theme or the Omarchy one are left out. A desktop theme is solved the first time it's picked, then cached so it's on before the first paint next time. The page remembers the theme picked, and where it was scrolled to, in local storage.

## Building

`reportAssets` bundles the page script and reads the themes' CSS. It needs Bun and the package's source, so an app compiled to one binary calls it at build time, as a Bun macro. `templates/report` is a sample report on made-up data and a starting point:

```sh
mise run report:dev
mise run report:build
```

## References

- [Bun: Macros](https://bun.sh/docs/bundler/macros)
- [Omarchy: Themes](https://learn.omacom.io/2/the-omarchy-manual/52/themes)
- [GitHub's VS Code themes](https://github.com/primer/github-vscode-theme), the source of the GitHub optional themes
