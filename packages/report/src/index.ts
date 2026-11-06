/**
 * Groundwork's report page: blocks built as markup on the server, put
 * together by `reportPage` into one HTML file with the standard header,
 * every theme and the desktop's Omarchy theme. `reportAssets` from
 * `@timmo001/groundwork-report/assets` builds the CSS and script it inlines.
 *
 * @module
 */
export * from "./blocks.ts";

export {
  table,
  type CellBadge,
  type CellChip,
  type CellText,
  type CellValue,
  type TableCell,
  type TableColumn,
  type TableFilter,
  type TableOptions,
  type TableRowInput,
} from "./table.ts";

export {
  escape,
  html,
  Html,
  json,
  prose,
  raw,
  render,
  type Content,
  type Json,
} from "./html.ts";

export {
  reportConfigId,
  reportPage,
  type ReportAssets,
  type ReportConfig,
  type ReportPageOptions,
} from "./page.ts";
