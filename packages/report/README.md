# @timmo001/groundwork-report

Groundwork's report page: blocks built as markup where the report is made,
put together into one self-contained HTML file with the standard header,
every Groundwork theme and the desktop's own themes. Open it from disk, mail
it or attach it; it needs no server.

```ts
import { reportAssets } from "@timmo001/groundwork-report/assets" with { type: "macro" };
import { readReportThemes } from "@timmo001/groundwork-report/desktop";
import { alert, reportPage, section, table } from "@timmo001/groundwork-report";

const html = reportPage({
  title: "Weekly migration report",
  assets: await reportAssets(),
  ...(await readReportThemes()),
  body: [
    alert({ tone: "info", heading: "This week" }, "Nine more files moved."),
    section(
      { id: "checks", title: "Checks" },
      table({ label: "Checks", columns, rows }),
    ),
  ],
});
```

- `reportPage` lays out the app bar (brand and theme picker), the page
  header and the blocks. It starts on Glazing; the picker offers the core
  themes, the optional ones by family, and a Desktop group.
- Blocks are plain functions that return markup, so a report arranges and
  nests them freely: `section`, `heading`, `paragraph`, `note`, `alert`,
  `stats`, `breakdown`, `progress`, `facts`, `cards`, `expansion`, `list`,
  `chip`, `chips`, `badge` and `link`. Text is escaped; `html` and `raw`
  mark markup.
- `table` is `gw-table`, sorting, searching, grouping and windowing its
  rows. Cells are described as data (text, links, a second line, badges,
  chips or a breakdown bar), and `filters` add a Filters button and sheet.
  `groupsCollapsed` starts every group folded away, and `contained` scrolls a
  long table in its own frame, up to `maxHeight`, with the header and group
  headings pinned. `searchLabel`, `empty`
  and `filtersLabel` set its words, for a report in another language.
- States go on `badge`, with an icon for each tone. Chips are for counts,
  names, dates and links.
- `reportAssets` bundles the page script and reads the themes' CSS. It
  needs Bun and the package's source, so an app compiled to one binary calls
  it as a Bun macro.
- `readReportThemes` reads the desktop's Omarchy theme, and translates the
  other installed Omarchy and terminal themes (Ghostty, kitty, Alacritty,
  foot) into the Desktop group, leaving out any that match a built-in one.
  `desktopLabel` names that group and `pickerLabels` passes the theme
  picker's label attributes on, for a report in another language.
- The page remembers the theme picked and where it was scrolled to, in
  local storage.

`templates/report` is a sample report on made-up data, and runs with
`mise run report:dev`.
