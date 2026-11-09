/**
 * `gw-table`: rows of data that sort and search, windowed so long lists stay
 * quick, on TanStack Table and TanStack Virtual.
 * Docs: https://groundwork.timmo.dev/components/display/#table
 *
 * @module
 */
import {
  columnFilteringFeature,
  columnGroupingFeature,
  constructTable,
  createColumnHelper,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from "@tanstack/table-core";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
import {
  defaultRangeExtractor,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  type Range,
  Virtualizer,
  windowScroll,
} from "@tanstack/virtual-core";
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-chip.js";
import type {} from "./gw-input.js";
import type {} from "./gw-skeleton.js";
import { isText, keep, keptAt, textsOf } from "./kept.js";
import { base, createIcon } from "./styles.js";

/** A value a cell holds, which sorting and search read. */
export type TableValue = string | number | boolean | null | undefined;

/** A row as plain data, such as JSON gives it, read by property. */
export type TableRow = Readonly<Record<string, TableValue>>;

/** One column of a `gw-table`. */
export interface TableColumn<T = TableRow> {
  /** The column's id, which `sort` names. */
  readonly id: string;
  /** The header's text. */
  readonly header: string;
  /**
   * The cell's value, which sorting and search read. Defaults to the row's
   * property named by `id`.
   */
  readonly value?: (row: T) => TableValue;
  /** What the cell shows, such as a link or a badge. Defaults to `value` as text. */
  readonly cell?: (row: T) => Node | string;
  /** Whether a header press sorts by it. Defaults to `true`. */
  readonly sortable?: boolean;
  /** Whether search matches it. Defaults to `true`. */
  readonly searchable?: boolean;
  /** Aligns the cell to the end, with tabular figures, for numbers. */
  readonly numeric?: boolean;
  /** Lets the cell wrap and take the spare width, for long text. */
  readonly wide?: boolean;
  /** A group's name from its value, when `group` names this column. Defaults to the value. */
  readonly groupLabel?: (value: TableValue) => string;
}

// MDI's chevron-right, arrow-up, arrow-down and magnify
const chevronIcon =
  "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";

const upIcon =
  "M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z";

const downIcon =
  "M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z";

const searchIcon =
  "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";

/** From this many rows, `search="auto"` adds a search field by default. */
const searchFrom = 8;

/** A table's view state as kept: only the parts someone has changed. */
type Kept = {
  readonly sort?: string;
  readonly descending?: boolean;
  readonly query?: string;
  readonly toggledGroups?: readonly string[];
};

const features = tableFeatures({
  coreReactivityFeature: storeReactivityBindings(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text,
  },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
});

/** A row the body draws: a group's heading, or one of the rows. */
type Shown =
  | {
      readonly kind: "group";
      readonly key: string;
      readonly value: string;
      readonly label: string;
      readonly count: number;
      readonly expanded: boolean;
    }
  | { readonly kind: "row"; readonly key: string; readonly row: TableRow };

/**
 * Rows of data in a table that sorts by a header press and searches every
 * column, built on TanStack Table. Only the rows on screen are drawn, by
 * TanStack Virtual against the window's scroll, so a table of thousands
 * stays quick; rows can be any height. With `contained` it scrolls inside
 * its own frame instead, up to `--gw-table-max-height`, with its header kept
 * in view, and draws only the rows in that frame.
 *
 * Give it `columns` and `rows`, as JSON attributes for plain data or as
 * properties. Each column says how to read a row's value, which sorting and
 * search use, and, set as a property, can draw its cell as any node, such as
 * a link or a `gw-chip`. `row-key` names the row property
 * that identifies it, so a row keeps its place across updates. The sort and
 * search are the table's own, set from their attributes to start with; it
 * fires `change` when they change. With `storage-key` it keeps them, and the
 * folded groups, in this browser itself: only what someone changed, so the
 * page's attributes still set the rest.
 *
 * `group` gathers the rows under a heading for each value of a column, such
 * as a state, with its name (from the column's `groupLabel`) and a chip
 * counting its rows. Pressing a heading folds its rows away. That column
 * doesn't show, since each heading names its value. `toggled-groups` lists
 * the groups, by value, pressed from how they start, and fires `change` too,
 * so the folded groups can be kept with the sort. In a `contained` table a
 * group's heading stays pinned under the column headings while its rows
 * scroll past.
 *
 * `more` says there are rows still to load after these, such as older pages
 * from a server. Skeleton rows stand in for them after the last row, and as
 * they come within `more-margin` pixels of view the table fires `more`, once,
 * and is `aria-busy` until its `rows` change: append the next page then, and
 * take `more` off once there's nothing left to load.
 *
 * @element gw-table
 * @summary Rows of data that sort and search, windowed for long lists.
 *
 * @attr {TableColumn[]} columns - The columns, as JSON or a property. Functions (`value`, `cell`) only work set as a property.
 * @attr {object[]} rows - The rows, as JSON or a property.
 * @attr {string} label - The table's accessible name.
 * @attr {string} sort - The column it sorts by, by id.
 * @attr {boolean} descending - Sorts from the highest or latest first.
 * @attr {string} query - The search text.
 * @attr {string} group - The column whose values it groups the rows by, by id.
 * @attr {boolean} groups-collapsed - Starts with every group folded away, for long lists.
 * @attr {string[]} toggled-groups - The groups, by value, toggled from how they start: folded away, or opened with `groups-collapsed`. As JSON or a property.
 * @attr {boolean} contained - Scrolls inside its own frame, up to `--gw-table-max-height`, rather than with the page.
 * @attr {string} storage-key - Keeps the sort, search and folded groups someone set in `localStorage` under this key.
 * @attr {"auto"|"always"|"never"} search - Whether it has a search field; `auto` adds one from `search-from` rows. Defaults to `auto`.
 * @attr {number} search-from - How many rows `search="auto"` adds a search field from. Defaults to `8`.
 * @attr {string} search-label - The search field's name and placeholder. Defaults to `Search`.
 * @attr {string} row-key - The row property that identifies each row.
 * @attr {string} empty-label - What it says with no rows. Defaults to `Nothing to show`.
 * @attr {string} no-match-label - What it says when the search matches nothing. Defaults to `No rows match the search`.
 * @attr {boolean} more - There are more rows to load after these: skeleton rows follow the last, and `more` fires as they come into view.
 * @attr {number} more-rows - How many skeleton rows stand in for the rows still to load. Defaults to `3`.
 * @attr {number} more-margin - How many pixels before the skeleton rows come into view it fires `more`. Defaults to `400`.
 *
 * @slot toolbar - Controls beside the search field, such as a Filters button.
 *
 * @csspart toolbar - The row with the search field and the `toolbar` slot.
 * @csspart search - The search field, a `gw-input`.
 * @csspart table - The table.
 * @csspart header - Each column's heading cell.
 * @csspart sort - Each sortable column's heading button.
 * @csspart sort-icon - The arrow on the column it sorts by.
 * @csspart row - Each row.
 * @csspart cell - Each cell.
 * @csspart group - Each group's heading row.
 * @csspart group-toggle - The button that folds a group.
 * @csspart group-chevron - The chevron that turns as a group folds.
 * @csspart group-label - A group's name.
 * @csspart group-count - The chip counting a group's rows, a `gw-chip`.
 * @csspart none - What it says with no rows, or none matching the search.
 * @csspart skeleton-row - Each row standing in for the rows still to load, with `more`.
 * @csspart skeleton - Each cell's skeleton in those rows, a `gw-skeleton-text`.
 *
 * @cssprop --gw-table-max-height - How tall a `contained` table grows before it scrolls. Defaults to `70vh`.
 * @cssprop --gw-table-count-scale - Scales the group count chips, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-table-search-scale - Scales the search field, as `--gw-field-scale` does a `gw-input`. Defaults to `0.9`.
 * @cssprop --gw-table-search-width - The search field's starting width, before it grows into the toolbar. Defaults to `14rem`.
 * @cssprop --gw-table-search-max-width - The widest the search field grows. Defaults to `24rem`.
 * @cssprop --gw-table-header-height - The column headings' height. Defaults to `2.5rem`.
 * @cssprop --gw-table-sort-icon-size - The sort arrow's size. Defaults to `0.875rem`.
 * @cssprop --gw-table-scrollbar-size - Its scrollbars' thickness. Defaults to `--gw-scrollbar-inner-size`, `0.25rem`.
 * @cssprop --gw-table-scrollbar-radius - Its scrollbar thumbs' corners. Defaults to `--gw-scrollbar-inner-radius`, the thickness, fully round.
 * @cssprop --gw-table-scrollbar-thumb - Its scrollbar thumbs' fill. Defaults to `--gw-scrollbar-inner-thumb`.
 * @cssprop --gw-table-scrollbar-thumb-hovered - A thumb's fill under the pointer. Defaults to `--gw-scrollbar-inner-thumb-hovered`.
 * @cssprop --gw-table-scrollbar-track - Its scrollbars' track. Defaults to `--gw-scrollbar-inner-track`, clear.
 *
 * @fires {Event} change - When the sort, search or folded groups change. Read `sort`, `descending`, `query` and `toggledGroups`.
 * @fires {Event} more - When the skeleton rows that `more` adds come near view, once until the `rows` change. Load the next page then.
 */
export class GwTable extends GwElement {
  static override properties = {
    label: {},
    sort: { reflect: true },
    descending: { type: "boolean", reflect: true },
    query: {},
    group: { reflect: true },
    groupsCollapsed: { type: "boolean", attribute: "groups-collapsed" },
    toggledGroups: { type: "json", attribute: "toggled-groups" },
    contained: { type: "boolean", reflect: true },
    storageKey: { attribute: "storage-key" },
    search: {},
    searchFrom: { type: "number", attribute: "search-from" },
    searchLabel: { attribute: "search-label" },
    rowKey: { attribute: "row-key" },
    emptyLabel: { attribute: "empty-label" },
    noMatchLabel: { attribute: "no-match-label" },
    columns: { type: "json" },
    rows: { type: "json" },
    more: { type: "boolean", reflect: true },
    moreRows: { type: "number", attribute: "more-rows" },
    moreMargin: { type: "number", attribute: "more-margin" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-3);
        min-width: 0;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        align-items: center;
      }

      .toolbar[hidden] {
        display: none;
      }

      /* The search is a gw-input, a little smaller than a form's fields to
         sit in a toolbar */
      .search {
        --gw-field-scale: var(--gw-table-search-scale, 0.9);
        flex: 1 1 var(--gw-table-search-width, 14rem);
        max-width: var(--gw-table-search-max-width, 24rem);
      }

      .search[hidden] {
        display: none;
      }

      .scroller {
        overflow-x: auto;
        overscroll-behavior-x: contain;
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
      }

      /* The header's fill, the pinned group heading's and their borders run
         on under the scrollbar, as bands in the frame's own background that
         stay put as it scrolls, so the header keeps both its corners */
      :host([contained]) .scroller {
        --_head: var(--_gw-table-head, var(--gw-table-header-height, 2.5rem));
        --_group: var(--_gw-table-group, 0px);
        max-height: var(--gw-table-max-height, 70vh);
        overflow-y: auto;
        background:
          linear-gradient(
              var(--gw-color-border-quiet),
              var(--gw-color-border-quiet)
            )
            0 calc(var(--_head) - var(--gw-border-width)) / 100%
            var(--gw-border-width) no-repeat,
          linear-gradient(
              var(--gw-color-border-normal),
              var(--gw-color-border-normal)
            )
            0 calc(var(--_head) + var(--_group) - var(--gw-border-width)) / 100%
            min(var(--_group), var(--gw-border-width)) no-repeat,
          linear-gradient(
              var(--gw-color-surface-default),
              var(--gw-color-surface-default)
            )
            0 var(--_head) / 100% var(--_group) no-repeat,
          linear-gradient(
              var(--gw-color-surface-lower, transparent),
              var(--gw-color-surface-lower, transparent)
            )
            top / 100% var(--_head) no-repeat,
          var(--gw-color-surface-raised);
      }

      /* The scrollbar's track starts under the header and pinned group
         heading, so its thumb never sits over them */
      :host([contained]) .scroller::-webkit-scrollbar-track:vertical {
        margin-block-start: calc(var(--_head) + var(--_group));
      }

      /* The header stays in view as a contained table scrolls */
      :host([contained]) thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background:
          linear-gradient(
            var(--gw-color-surface-lower, transparent),
            var(--gw-color-surface-lower, transparent)
          ),
          var(--gw-color-surface-raised);
      }

      /* Whatever a cell raises with a z-index stays in its own row, under
         the header and the pinned group headings */
      tbody {
        isolation: isolate;
        /* Solid, so the rows read against one color rather than the
           frame's bands, which contrast checkers can't resolve */
        background: var(--gw-color-surface-raised);
      }

      tbody tr:not(.group) {
        isolation: isolate;
      }

      /* A group's heading stays pinned under the header while its rows
         scroll past, and the next group's heading takes its place */
      :host([contained]) tr.group td {
        position: sticky;
        top: var(--_gw-table-head, var(--gw-table-header-height, 2.5rem));
        z-index: 1;
      }

      /* Separate borders belong to their cells, so a pinned header or group
         heading takes its border with it; collapsed ones stay put and let
         the rows show through */
      table {
        width: 100%;
        border-spacing: 0;
        border-collapse: separate;
        font-size: var(--gw-font-size-s);
      }

      th,
      td {
        padding: var(--gw-space-2) var(--gw-space-3);
        text-align: start;
        vertical-align: middle;
        white-space: nowrap;
        border-block-end: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      td.wide {
        width: 100%;
        white-space: normal;
      }

      tbody tr:not(.spacer, .skeleton):hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      tr.spacer td {
        padding: 0;
        border: 0;
      }

      th {
        height: var(--gw-table-header-height, 2.5rem);
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        background: var(--gw-color-surface-lower, transparent);
      }

      th button {
        display: inline-flex;
        gap: var(--gw-space-1);
        align-items: center;
        padding: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        background: none;
        border: 0;
        --gw-icon-size: var(--gw-table-sort-icon-size, 0.875rem);
      }

      th button:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      th[aria-sort] button {
        color: var(--gw-color-text-primary);
      }

      .numeric {
        font-variant-numeric: tabular-nums;
        text-align: end;
      }

      th.numeric button {
        flex-direction: row-reverse;
      }

      /* A group's heading sits on the page's own surface, darker than the
         rows, so the groups read as sections */
      tr.group td {
        padding: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-default);
        border-block-end: var(--gw-border-width) solid
          var(--gw-color-border-normal);
      }

      tbody tr.group:hover {
        background: none;
      }

      .group-toggle {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        width: 100%;
        padding: var(--gw-space-3);
        font: inherit;
        color: inherit;
        text-align: start;
        cursor: pointer;
        background: none;
        border: 0;
        --gw-icon-size: 1.35em;
      }

      .group-toggle:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .group-toggle:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: calc(-1 * var(--gw-focus-width));
      }

      .group-toggle .icon {
        color: var(--gw-color-accent);
        transition: rotate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      .group-toggle[aria-expanded="true"] .icon {
        rotate: 90deg;
      }

      .group-toggle gw-chip {
        --gw-chip-scale: var(--gw-table-count-scale, 0.8);
        margin-inline-start: auto;
      }

      tr.skeleton gw-skeleton-text {
        --gw-skeleton-width: 70%;
      }

      tr.skeleton td.wide gw-skeleton-text {
        --gw-skeleton-width: 50%;
      }

      tr.skeleton td.numeric gw-skeleton-text {
        --gw-skeleton-width: 2.5rem;
      }

      .none {
        padding: var(--gw-space-8) var(--gw-space-4);
        color: var(--gw-color-text-secondary);
        text-align: center;
      }

      .none[hidden] {
        display: none;
      }
    `,
  ];

  declare label: string;
  declare sort: string;
  declare descending: boolean;
  declare query: string;
  declare group: string;
  declare groupsCollapsed: boolean;
  declare toggledGroups: readonly string[];
  declare contained: boolean;
  declare storageKey: string;
  declare search: "auto" | "always" | "never";
  declare searchFrom: number;
  declare searchLabel: string;
  declare rowKey: string;
  declare emptyLabel: string;
  declare noMatchLabel: string;
  declare columns: readonly TableColumn[];
  declare rows: readonly TableRow[];
  declare more: boolean;
  declare moreRows: number;
  declare moreMargin: number;

  /** The search field, a `gw-input`, so it looks and sizes as every field does. */
  readonly #search = h("gw-input", {
    type: "search",
    class: "search",
    part: "search",
    "label-hidden": true,
    icon: searchIcon,
  });

  readonly #toolbar: HTMLDivElement = h(
    "div",
    { class: "toolbar", part: "toolbar" },
    this.#search,
    h("slot", { name: "toolbar" }),
  );

  readonly #head = h("thead");

  readonly #body = h("tbody");

  readonly #table = h("table", { part: "table" }, this.#head, this.#body);

  readonly #none = h("div", { class: "none", part: "none" });

  readonly #scroller: HTMLDivElement = h(
    "div",
    { class: "scroller" },
    this.#table,
    this.#none,
  );

  /**
   * The group headings and sorted, searched rows the body draws, rebuilt
   * only when what they depend on changes.
   */
  #shown: readonly Shown[] = [];

  /** For each shown row, the index of the group heading it falls under, or -1. */
  #headingOf: readonly number[] = [];

  /** How many rows there are after the search, without the headings. */
  #matched = 0;

  /**
   * How tall a row and a group's heading were when last measured, which the
   * rows not yet drawn are taken to be, so the scroll's length holds as they
   * come into view.
   */
  #typical = { row: 41, group: 41 };

  /** The rows standing in for those still to load, with `more`. */
  #skeletons: HTMLTableRowElement[] = [];

  /** Watches for the skeleton rows coming near view. */
  #nearEnd: IntersectionObserver | undefined;

  /** Whether `more` has fired for these rows. */
  #asked = false;

  /** Keeps the header's height for what's pinned under it. */
  readonly #headSize = new ResizeObserver(() => {
    this.#scroller.style.setProperty(
      "--_gw-table-head",
      `${this.#head.getBoundingClientRect().height}px`,
    );
  });

  /**
   * Each shown row's element, kept while it stands so scrolling moves rows
   * rather than building them again.
   */
  #drawnRows = new WeakMap<Shown, HTMLTableRowElement>();

  readonly #beforeCell = h("td");

  readonly #before = h(
    "tr",
    { class: "spacer", "aria-hidden": "true" },
    this.#beforeCell,
  );

  readonly #gapCell = h("td");

  /** Between a pinned group heading and the rows in view below it. */
  readonly #gap = h(
    "tr",
    { class: "spacer", "aria-hidden": "true" },
    this.#gapCell,
  );

  readonly #afterCell = h("td");

  readonly #after = h(
    "tr",
    { class: "spacer", "aria-hidden": "true" },
    this.#afterCell,
  );

  /** The frame booked to measure the rows just drawn. */
  #measuring = 0;

  /** Draws the rows on screen as the page scrolls. */
  readonly #windowed = new Virtualizer<Window, HTMLTableRowElement>({
    count: 0,
    getScrollElement: () => window,
    estimateSize: (index) => this.#estimate(index),
    overscan: 10,
    observeElementRect: observeWindowRect,
    observeElementOffset: observeWindowOffset,
    scrollToFn: windowScroll,
    initialOffset: () => window.scrollY,
    onChange: () => this.requestUpdate("window"),
  });

  /** Draws the rows in view as a `contained` table's own frame scrolls. */
  readonly #framed = new Virtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: 0,
    getScrollElement: () => this.#scroller,
    estimateSize: (index) => this.#estimate(index),
    overscan: 10,
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    initialOffset: () => this.#scroller.scrollTop,
    onChange: () => this.requestUpdate("window"),
  });

  #cleanup: () => void = () => {};

  /** Whether the frame's virtualizer is the one mounted, once connected. */
  #mounted: boolean | undefined;

  constructor() {
    super();
    this.label = "";
    this.sort = "";
    this.descending = false;
    this.query = "";
    this.group = "";
    this.groupsCollapsed = false;
    this.toggledGroups = [];
    this.contained = false;
    this.storageKey = "";
    this.search = "auto";
    this.searchFrom = searchFrom;
    this.searchLabel = "Search";
    this.rowKey = "";
    this.emptyLabel = "Nothing to show";
    this.noMatchLabel = "No rows match the search";
    this.columns = [];
    this.rows = [];
    this.more = false;
    this.moreRows = 3;
    this.moreMargin = 400;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#mount();
    this.#headSize.observe(this.#head);
    this.#watchEnd();
  }

  override disconnectedCallback() {
    this.#unmount();
    this.#headSize.disconnect();
    this.#nearEnd?.disconnect();
    this.#nearEnd = undefined;
    super.disconnectedCallback();
  }

  /** What a row not yet drawn is taken to measure, from those last drawn. */
  #estimate(index: number) {
    return this.#shown[index]?.kind === "group"
      ? this.#typical.group
      : this.#typical.row;
  }

  /**
   * The rows to draw: those in view, and in a contained table the heading of
   * the group the first of them falls under, so it can stay pinned.
   */
  #pinned(range: Range) {
    const indexes = defaultRangeExtractor(range);
    const heading = this.#headingOf[range.startIndex] ?? -1;

    if (!this.contained || heading === -1 || indexes.includes(heading)) {
      return indexes;
    }

    return [heading, ...indexes];
  }

  /**
   * Watches the skeleton rows, against the frame a contained table scrolls
   * in or the window, to fire `more` as they come near. Watching them again
   * reports where they are now, so a page too short to fill the view asks
   * for the next at once.
   */
  #watchEnd() {
    this.#nearEnd?.disconnect();
    this.#nearEnd = undefined;

    const [first] = this.#skeletons;

    if (!this.isConnected || !this.more || first === undefined) return;

    this.#nearEnd = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        if (!this.more || this.#asked) return;

        this.#asked = true;
        setAttribute(this.#table, "aria-busy", "true");
        this.dispatchEvent(
          new Event("more", { bubbles: true, composed: true }),
        );
      },
      {
        root: this.contained ? this.#scroller : null,
        rootMargin: `0px 0px ${Math.max(0, this.moreMargin)}px 0px`,
      },
    );

    this.#nearEnd.observe(first);
  }

  /** The skeleton rows for the rows still to load, a cell for each column. */
  #renderSkeletons() {
    const drawn = this.#drawn();

    this.#skeletons = this.more
      ? Array.from({ length: Math.max(1, this.moreRows || 1) }, () =>
          h(
            "tr",
            { class: "skeleton", part: "skeleton-row", "aria-hidden": "true" },
            ...drawn.map((column) =>
              h(
                "td",
                {
                  class: [
                    column.numeric ? "numeric" : "",
                    column.wide ? "wide" : "",
                  ]
                    .join(" ")
                    .trim(),
                },
                h("gw-skeleton-text", { part: "skeleton" }),
              ),
            ),
          ),
        )
      : [];
  }

  /** Mounts the virtualizer for how it scrolls, swapping out the other. */
  #mount() {
    if (this.#mounted === this.contained) return;

    this.#unmount();

    if (this.contained) {
      this.#cleanup = this.#framed._didMount();
      this.#framed._willUpdate();
    } else {
      this.#cleanup = this.#windowed._didMount();
      this.#windowed._willUpdate();
    }

    this.#mounted = this.contained;
  }

  #unmount() {
    this.#cleanup();
    this.#cleanup = () => {};

    this.#mounted = undefined;
  }

  /** Fires `change`, and keeps what changed under `storage-key`. */
  #change(part: Kept) {
    if (this.storageKey !== "") keep(this.storageKey, part);

    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  /**
   * Puts back what was kept under `storage-key`, checked against what each
   * part can be, since anyone can edit what's kept.
   */
  #restore() {
    const kept = keptAt(this.storageKey);

    if (kept === undefined) return;

    const { sort, descending, query, toggledGroups } = kept;

    if (isText(sort)) this.sort = sort;

    if (descending === true || descending === false) {
      this.descending = descending;
    }

    if (isText(query)) this.query = query;

    this.toggledGroups = textsOf(toggledGroups) ?? this.toggledGroups;
  }

  /** A cell's value: its column's `value`, or the row's property by the column's id. */
  #valueOf(column: TableColumn, row: TableRow) {
    return column.value === undefined ? row[column.id] : column.value(row);
  }

  /** What identifies a row, so it keeps its place across updates. */
  #keyOf(row: TableRow, index: number) {
    return this.rowKey === "" ? String(index) : String(row[this.rowKey]);
  }

  /** Sorts, searches and groups the rows through TanStack Table. */
  #process() {
    const grouping = this.columns.find((column) => column.id === this.group);
    const helper = createColumnHelper<typeof features, TableRow>();

    const columns = helper.columns(
      this.columns.map((column) =>
        helper.accessor((row) => this.#valueOf(column, row) ?? "", {
          id: column.id,
          header: column.header,
          enableSorting: column.sortable !== false,
          enableGlobalFilter: column.searchable !== false,
          sortFn: column.numeric ? "basic" : "alphanumeric",
        }),
      ),
    );

    const table = constructTable({
      features,
      columns,
      data: [...this.rows],
      getRowId: (row, index) => this.#keyOf(row, index),
      globalFilterFn: "includesString",
      getColumnCanGlobalFilter: (column) =>
        this.columns.find((entry) => entry.id === column.id)?.searchable !==
        false,
      enableSortingRemoval: false,
      groupedColumnMode: false,
      initialState: {
        sorting:
          this.sort === "" ? [] : [{ id: this.sort, desc: this.descending }],
        globalFilter: this.query,
        grouping: grouping === undefined ? [] : [grouping.id],
      },
    });

    this.#matched = table.getFilteredRowModel().rows.length;

    // Each group's heading, then its rows unless it's folded away
    this.#shown = table.getRowModel().rows.flatMap((row): Shown[] => {
      if (!row.getIsGrouped()) {
        return [{ kind: "row", key: row.id, row: row.original }];
      }

      const value: TableValue = row.original[row.groupingColumnId ?? ""];
      const name = String(value ?? "");

      const expanded =
        this.toggledGroups.includes(name) === this.groupsCollapsed;

      const heading: Shown = {
        kind: "group",
        key: row.id,
        value: name,
        label: grouping?.groupLabel?.(value) ?? name,
        count: row.subRows.length,
        expanded,
      };

      if (!expanded) return [heading];

      return [
        heading,
        ...row.subRows.map((sub): Shown => ({
          kind: "row",
          key: sub.id,
          row: sub.original,
        })),
      ];
    });

    let heading = -1;

    this.#headingOf = this.#shown.map((shown, index) => {
      if (shown.kind === "group") heading = index;

      return heading;
    });
  }

  #toggleGroup(value: string) {
    this.toggledGroups = this.toggledGroups.includes(value)
      ? this.toggledGroups.filter((each) => each !== value)
      : [...this.toggledGroups, value];

    this.#change({ toggledGroups: this.toggledGroups });
  }

  #sortBy(column: TableColumn) {
    if (this.sort === column.id) {
      this.descending = !this.descending;
    } else {
      this.sort = column.id;
      this.descending = Boolean(column.numeric);
    }

    this.#change({ sort: this.sort, descending: this.descending });
  }

  /** The columns it draws: all but the one it groups by, which each heading names. */
  #drawn() {
    return this.columns.filter((column) => column.id !== this.group);
  }

  #renderHead() {
    this.#head.replaceChildren(
      h(
        "tr",
        {},
        ...this.#drawn().map((column) => {
          const sorted = this.sort === column.id;

          const th = h("th", {
            class: column.numeric ? "numeric" : "",
            part: "header",
            "aria-sort": sorted
              ? this.descending
                ? "descending"
                : "ascending"
              : null,
          });

          if (column.sortable === false) {
            th.textContent = column.header;

            return th;
          }

          const button = h(
            "button",
            { type: "button", part: "sort" },
            column.header,
          );

          if (sorted)
            button.append(
              createIcon(this.descending ? downIcon : upIcon, {
                part: "sort-icon",
              }),
            );

          button.addEventListener("click", () => this.#sortBy(column));
          th.append(button);

          return th;
        }),
      ),
    );
  }

  /** A group's heading: a button that folds it, its name and a chip counting its rows. */
  #renderGroup(
    group: Extract<Shown, { readonly kind: "group" }>,
    index: number,
  ) {
    const count = h("gw-chip", { part: "group-count" }, String(group.count));

    const toggle = h(
      "button",
      {
        type: "button",
        class: "group-toggle",
        part: "group-toggle",
        "aria-expanded": String(group.expanded),
      },
      createIcon(chevronIcon, { part: "group-chevron" }),
      h("span", { part: "group-label" }, group.label),
      count,
    );

    toggle.addEventListener("click", () => this.#toggleGroup(group.value));

    return h(
      "tr",
      { class: "group", part: "group", "data-index": index },
      h("td", { colspan: this.#drawn().length }, toggle),
    );
  }

  /** Where the body starts, on the scale the virtualizer scrolls on. */
  #bodyOffset() {
    const top = this.#body.getBoundingClientRect().top;

    return this.contained
      ? top -
          this.#scroller.getBoundingClientRect().top +
          this.#scroller.scrollTop
      : top + window.scrollY;
  }

  #renderBody() {
    if (this.contained) this.#renderRows(this.#framed);
    else this.#renderRows(this.#windowed);
  }

  #renderRows<S extends Window | HTMLDivElement>(
    virtualizer: Virtualizer<S, HTMLTableRowElement>,
  ) {
    virtualizer.setOptions({
      ...virtualizer.options,
      count: this.#shown.length,
      getItemKey: (index) => this.#shown[index]?.key ?? index,
      // New each time, as the headings it reads change with the rows
      rangeExtractor: (range) => this.#pinned(range),
      scrollMargin: this.#bodyOffset(),
    });

    const items = virtualizer.getVirtualItems();
    const before = items[0]?.start ?? virtualizer.options.scrollMargin;
    const after = items.at(-1)?.end ?? before;
    const drawn = this.#drawn();

    // A pinned group heading can sit well above the rows in view, with the
    // rows between them left out
    const [first, second] = items;
    const gap = first && second ? Math.max(0, second.start - first.end) : 0;

    const rows = items.flatMap((item) => {
      const shown = this.#shown[item.index];

      if (shown === undefined) return [];

      const kept = this.#drawnRows.get(shown);

      if (kept !== undefined) return [kept];

      const row =
        shown.kind === "group"
          ? this.#renderGroup(shown, item.index)
          : this.#renderRow(shown.row, item.index, drawn);

      // A new row starts at the height its key last had, until it's measured:
      // what's in its cells can draw later, and until then the frame would
      // shrink and its scroll clamp, as new data rebuilds every row
      row.style.height = `${item.size}px`;
      this.#drawnRows.set(shown, row);

      return [row];
    });

    const margin = virtualizer.options.scrollMargin;

    this.#beforeCell.colSpan = drawn.length;
    this.#beforeCell.style.height = `${Math.max(0, before - margin)}px`;
    this.#gapCell.colSpan = drawn.length;
    this.#gapCell.style.height = `${gap}px`;
    this.#afterCell.colSpan = drawn.length;
    this.#afterCell.style.height = `${Math.max(0, virtualizer.getTotalSize() - (after - margin))}px`;

    const [head, ...rest] = rows;

    const next = [
      this.#before,
      ...(gap > 0 && head !== undefined ? [head, this.#gap, ...rest] : rows),
      this.#after,
      ...this.#skeletons,
    ];

    const wanted = new Set<Element>(next);

    // Only the rows coming into view or leaving it are added or taken off:
    // moving the rest too makes the browser style and lay them all out again,
    // which drops frames as it scrolls
    const leaving = [...this.#body.children].filter(
      (child) => !wanted.has(child),
    );

    for (const child of leaving) child.remove();

    let at = this.#body.firstElementChild;

    for (const row of next) {
      if (at === row) {
        at = row.nextElementSibling;
      } else {
        this.#body.insertBefore(row, at);
      }
    }

    // Measured a frame later, once what's in the rows has drawn: measured at
    // once, a new row is short, and the frame's scroll clamps to fit it
    cancelAnimationFrame(this.#measuring);
    this.#measuring = requestAnimationFrame(() => {
      for (const row of rows) row.style.removeProperty("height");

      const connected = rows.filter((row) => row.isConnected);

      // The rows not yet drawn are taken to be as tall as these, so the
      // scroll's length is near right before they come into view
      for (const kind of ["row", "group"] as const) {
        const heights = connected
          .filter(
            (row) => row.classList.contains("group") === (kind === "group"),
          )
          .map((row) => row.getBoundingClientRect().height)
          .filter((height) => height > 0);

        if (heights.length > 0) {
          this.#typical[kind] =
            heights.reduce((sum, height) => sum + height, 0) / heights.length;
        }
      }

      // A grouped table always has a heading pinned under the header, whose
      // fill runs on under the scrollbar
      this.#scroller.style.setProperty(
        "--_gw-table-group",
        this.#headingOf[0] === 0 ? `${this.#typical.group}px` : "0px",
      );

      for (const row of connected) virtualizer.measureElement(row);
    });

    virtualizer._willUpdate();
  }

  /** A row of cells, each its column's `cell` or its value as text. */
  #renderRow(row: TableRow, index: number, drawn: readonly TableColumn[]) {
    const tr = h("tr", { part: "row", "data-index": index });

    for (const column of drawn) {
      const cell =
        column.cell === undefined
          ? String(this.#valueOf(column, row) ?? "")
          : column.cell(row);

      tr.append(
        h(
          "td",
          {
            class: [column.numeric ? "numeric" : "", column.wide ? "wide" : ""]
              .join(" ")
              .trim(),
            part: "cell",
          },
          cell,
        ),
      );
    }

    return tr;
  }

  protected override create(root: ShadowRoot) {
    this.#search.addEventListener("input", () => {
      this.query = this.#search.value;
      this.#change({ query: this.query });
    });
    root.append(this.#toolbar, this.#scroller);
  }

  protected override update(changed: ReadonlySet<string>) {
    const data = [
      "columns",
      "rows",
      "sort",
      "descending",
      "query",
      "group",
      "groupsCollapsed",
      "toggledGroups",
      "rowKey",
    ];

    // A new starting state starts every group from it again, unless the
    // groups toggled from it came with it
    if (changed.has("groupsCollapsed") && !changed.has("toggledGroups")) {
      this.toggledGroups = [];
    }

    // What was kept wins over how the page starts it
    if (changed.has("storageKey") && this.storageKey !== "") this.#restore();

    if (changed.has("contained") && this.isConnected) this.#mount();

    if (data.some((name) => changed.has(name))) this.#process();

    if (
      changed.has("columns") ||
      changed.has("sort") ||
      changed.has("descending") ||
      changed.has("group")
    ) {
      this.#renderHead();
    }

    setAttribute(this.#table, "aria-label", this.label || null);

    if (this.#search.value !== this.query) this.#search.value = this.query;

    this.#search.label = this.searchLabel;
    this.#search.placeholder = this.searchLabel;
    this.#search.hidden =
      this.search === "never" ||
      (this.search !== "always" && this.rows.length < this.searchFrom);

    // Skeleton rows stand in for what's still to load, rather than saying
    // there's nothing
    this.#none.hidden = this.#matched > 0 || this.more;
    this.#none.textContent =
      this.rows.length === 0 ? this.emptyLabel : this.noMatchLabel;

    // New skeleton rows with each page, rather than the old ones pushed down
    // past the rows that took their place, which reads as a layout shift
    const skeletons = ["more", "moreRows", "columns", "group", "rows"].some(
      (name) => changed.has(name),
    );

    if (skeletons) this.#renderSkeletons();

    // New rows, or none left to load, answer what was asked
    if (changed.has("rows") || changed.has("more")) {
      this.#asked = false;
      setAttribute(this.#table, "aria-busy", null);
    }

    this.#renderBody();

    if (
      skeletons ||
      changed.has("rows") ||
      changed.has("contained") ||
      changed.has("moreMargin")
    ) {
      this.#watchEnd();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-table": GwTable;
  }
}
