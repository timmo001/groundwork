/**
 * The report's table: Groundwork's `gw-table`, which sorts, searches, groups
 * and windows its rows, with cells described as data (text, links, a second
 * line, chips or a breakdown bar) that the page's script draws, and
 * optional filters in a sheet of `gw-filter`s behind a Filters button.
 *
 * @module
 */
import { Predicate } from "effect";

import type { Segment, Tone } from "./blocks.ts";
import { html, json } from "./html.ts";

/** A value a cell sorts and searches by. */
export type CellValue = string | number | boolean | null | undefined;

// The cell and column shapes are types rather than interfaces, so they fit
// `Json` on their way to the page

/** A chip in a cell. */
export type CellChip = {
  readonly text: string;
  readonly tone?: Tone | undefined;
  readonly href?: string | undefined;
};

/** A state badge in a cell, with its tone's icon unless it has its own. */
export type CellBadge = {
  readonly text: string;
  readonly tone?: Tone | undefined;
  /** SVG path data, in place of the tone's own icon. */
  readonly icon?: string | undefined;
};

/** A line of text in a cell, linked with `href`, in the monospace font with `mono`. */
export type CellText = {
  readonly text: string;
  readonly href?: string | undefined;
  readonly mono?: boolean | undefined;
};

/** What a cell shows, beyond plain text. */
export type TableCell = {
  /** What it sorts and searches by. Defaults to `text`. */
  readonly value?: CellValue;
  readonly text?: string | undefined;
  readonly href?: string | undefined;
  readonly mono?: boolean | undefined;
  /** Shows the text in the quieter color. */
  readonly muted?: boolean | undefined;
  /** A second line under the text, such as the file a check is about. */
  readonly detail?: CellText | undefined;
  /** States after the text, on `gw-badge`. */
  readonly badges?: readonly CellBadge[] | undefined;
  /** Chips after the text, for counts, names and links. */
  readonly chips?: readonly CellChip[] | undefined;
  /** A breakdown bar, for how a whole splits into parts. */
  readonly segments?: readonly Segment[] | undefined;
};

export type TableColumn = {
  /** The key each row's cell is under. */
  readonly id: string;
  readonly header: string;
  /** Aligns to the end with tabular figures, for numbers. */
  readonly numeric?: boolean | undefined;
  /** Lets it wrap and take the spare width, for long text. */
  readonly wide?: boolean | undefined;
  readonly sortable?: boolean | undefined;
  readonly searchable?: boolean | undefined;
};

/** One filter in the Filters sheet, matched against each row's value under `id`. */
export interface TableFilter {
  readonly id: string;
  readonly label: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    readonly description?: string | undefined;
  }[];
  /** What it starts on and clears back to. Defaults to everything. */
  readonly defaultValue?: readonly string[] | undefined;
}

/**
 * A row: its cells by column id, and the values its filters match by filter
 * id, one or several each.
 */
export type TableRowInput = Readonly<
  Record<string, CellValue | TableCell | readonly string[]>
>;

export interface TableOptions {
  /** The table's name, for assistive technology. */
  readonly label: string;
  readonly columns: readonly TableColumn[];
  readonly rows: readonly TableRowInput[];
  /** The column it sorts by, by id. */
  readonly sort?: string | undefined;
  readonly descending?: boolean | undefined;
  /** The column whose values it groups the rows by, by id. */
  readonly group?: string | undefined;
  /** Starts with every group folded away, for long lists. */
  readonly groupsCollapsed?: boolean | undefined;
  /**
   * Scrolls inside its own frame rather than with the page, for long tables:
   * the header and each group's heading stay pinned while the rows scroll.
   */
  readonly contained?: boolean | undefined;
  /** How tall a `contained` table grows before it scrolls, as a CSS length. Defaults to `70vh`. */
  readonly maxHeight?: string | undefined;
  /** Whether it has a search field. Defaults to `auto`, from 8 rows. */
  readonly search?: "auto" | "always" | "never" | undefined;
  readonly searchLabel?: string | undefined;
  readonly empty?: string | undefined;
  readonly filters?: readonly TableFilter[] | undefined;
  /** The Filters button's text and its sheet's heading, for a report in another language. "Filters" by default. */
  readonly filtersLabel?: string | undefined;
}

/** The key a row's described cells travel under, for the page's script. */
export const cellsKey = "$cells";

/** A row as the page gets it: plain values to sort and search, and described cells. */
export type TableRowData = Readonly<
  Record<
    string,
    CellValue | readonly string[] | Readonly<Record<string, TableCell>>
  >
>;

// Plain objects only: a filter's values are an array
const isCell = (value: TableRowInput[string]): value is TableCell =>
  Predicate.isObject(value);

/** A table on `gw-table`, with filters in a sheet when it has any. */
export const table = (options: TableOptions) => {
  const rows = options.rows.map((row): TableRowData => {
    const plain: Record<string, CellValue | readonly string[]> = {};
    const cells: Record<string, TableCell> = {};

    for (const [key, value] of Object.entries(row)) {
      if (isCell(value)) {
        cells[key] = value;
        plain[key] = value.value ?? value.text ?? null;
      } else {
        plain[key] = value;
      }
    }

    return Object.keys(cells).length === 0
      ? plain
      : { ...plain, [cellsKey]: cells };
  });

  const filters = options.filters ?? [];

  // Named after the table, so two tables' sheets don't clash
  const sheet = `gw-report-filters-${options.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  const count = (filter: TableFilter, value: string) =>
    options.rows.filter((row) => {
      const values = row[filter.id];

      return Array.isArray(values) ? values.includes(value) : values === value;
    }).length;

  return html`<gw-table
      data-gw-report-table
      label="${options.label}"
      row-key="$index"
      ${
        options.sort === undefined ? "" : html` sort="${options.sort}"`
      }${options.descending === true ? html` descending` : ""}${
        options.group === undefined ? "" : html` group="${options.group}"`
      }${options.groupsCollapsed === true ? html` groups-collapsed` : ""}${
        options.contained === true ? html` contained` : ""
      }${
        options.maxHeight === undefined
          ? ""
          : html` style="--gw-table-max-height: ${options.maxHeight}"`
      }
      search="${options.search ?? "auto"}"
      ${
        options.searchLabel === undefined
          ? ""
          : html` search-label="${options.searchLabel}"`
      }${
        options.empty === undefined ? "" : html` empty-label="${options.empty}"`
      }${filters.length === 0 ? "" : html` data-filters="${sheet}"`}
      columns="${json(options.columns)}"
      rows="${json(rows.map((row, index) => ({ ...row, $index: index })))}"
      >${
        filters.length === 0
          ? ""
          : html`<gw-button
              slot="toolbar"
              variant="neutral"
              appearance="outlined"
              icon="M6,13H18V11H6M3,6V8H21V6M10,18H14V16H10V18Z"
              data-opens="${sheet}"
              >${options.filtersLabel ?? "Filters"}</gw-button
            >`
      }</gw-table
    >${
      filters.length === 0
        ? ""
        : html`<gw-sheet
            id="${sheet}"
            heading="${options.filtersLabel ?? "Filters"}"
            style="--gw-filter-inset: var(--gw-space-4)"
            >${filters.map(
              (filter) =>
                html`<gw-filter
                  data-filter="${filter.id}"
                  label="${filter.label}"
                  options="${json(
                    filter.options.map((option) => ({
                      ...option,
                      count: count(filter, option.value),
                    })),
                  )}"
                  ${
                    filter.defaultValue === undefined
                      ? ""
                      : html` value="${json(filter.defaultValue)}"
                        default-value="${json(filter.defaultValue)}"`
                  }
                ></gw-filter>`,
            )}</gw-sheet
          >`
    }`;
};
