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
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  Virtualizer,
  windowScroll,
} from "@tanstack/virtual-core";
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-chip.js";
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

/** From this many rows, `search="auto"` adds a search field. */
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
 * so the folded groups can be kept with the sort.
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
 * @attr {"auto"|"always"|"never"} search - Whether it has a search field; `auto` adds one from 8 rows. Defaults to `auto`.
 * @attr {string} search-label - The search field's name and placeholder. Defaults to `Search`.
 * @attr {string} row-key - The row property that identifies each row.
 * @attr {string} empty-label - What it says with no rows. Defaults to `Nothing to show`.
 * @attr {string} no-match-label - What it says when the search matches nothing. Defaults to `No rows match the search`.
 *
 * @slot toolbar - Controls beside the search field, such as a Filters button.
 *
 * @csspart table - The table.
 * @csspart row - Each row.
 * @csspart group - Each group's heading row.
 *
 * @cssprop --gw-table-max-height - How tall a `contained` table grows before it scrolls. Defaults to `70vh`.
 *
 * @fires {Event} change - When the sort, search or folded groups change. Read `sort`, `descending`, `query` and `toggledGroups`.
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
    searchLabel: { attribute: "search-label" },
    rowKey: { attribute: "row-key" },
    emptyLabel: { attribute: "empty-label" },
    noMatchLabel: { attribute: "no-match-label" },
    columns: { type: "json" },
    rows: { type: "json" },
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

      .search {
        position: relative;
        flex: 1 1 14rem;
        max-width: 24rem;
        --gw-icon-size: 1.1rem;
      }

      .search[hidden] {
        display: none;
      }

      .search .icon {
        position: absolute;
        inset-block: 0;
        inset-inline-start: var(--gw-space-3);
        margin-block: auto;
        color: var(--gw-color-text-secondary);
        pointer-events: none;
      }

      .search input {
        box-sizing: border-box;
        width: 100%;
        min-height: 2.25rem;
        padding: 0 var(--gw-space-3) 0 calc(var(--gw-space-3) * 2 + 1.1rem);
        font: inherit;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-lower, transparent);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-control);
      }

      .search input:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      .scroller {
        overflow-x: auto;
        overscroll-behavior-x: contain;
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
      }

      :host([contained]) .scroller {
        max-height: var(--gw-table-max-height, 70vh);
        overflow-y: auto;
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

      table {
        width: 100%;
        border-collapse: collapse;
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

      tbody tr:not(.spacer):hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      tr.spacer td {
        padding: 0;
        border: 0;
      }

      th {
        height: 2.5rem;
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
        --gw-icon-size: 0.875rem;
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
        margin-inline-start: auto;
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
  declare searchLabel: string;
  declare rowKey: string;
  declare emptyLabel: string;
  declare noMatchLabel: string;
  declare columns: readonly TableColumn[];
  declare rows: readonly TableRow[];

  readonly #input = h("input", { type: "search" });

  readonly #search = h(
    "label",
    { class: "search" },
    createIcon(searchIcon),
    this.#input,
  );

  readonly #toolbar: HTMLDivElement = h(
    "div",
    { class: "toolbar" },
    this.#search,
    h("slot", { name: "toolbar" }),
  );

  readonly #head = h("thead");

  readonly #body = h("tbody");

  readonly #table = h("table", { part: "table" }, this.#head, this.#body);

  readonly #none = h("div", { class: "none" });

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

  /** How many rows there are after the search, without the headings. */
  #matched = 0;

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
    estimateSize: () => 41,
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
    estimateSize: () => 41,
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
    this.searchLabel = "Search";
    this.rowKey = "";
    this.emptyLabel = "Nothing to show";
    this.noMatchLabel = "No rows match the search";
    this.columns = [];
    this.rows = [];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#mount();
  }

  override disconnectedCallback() {
    this.#unmount();
    super.disconnectedCallback();
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

          const button = h("button", { type: "button" }, column.header);

          if (sorted)
            button.append(createIcon(this.descending ? downIcon : upIcon));

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
    const count = h("gw-chip", { size: "small" }, String(group.count));

    const toggle = h(
      "button",
      {
        type: "button",
        class: "group-toggle",
        "aria-expanded": String(group.expanded),
      },
      createIcon(chevronIcon),
      h("span", {}, group.label),
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
      scrollMargin: this.#bodyOffset(),
    });

    const items = virtualizer.getVirtualItems();
    const before = items[0]?.start ?? virtualizer.options.scrollMargin;
    const after = items.at(-1)?.end ?? before;
    const drawn = this.#drawn();

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
    this.#afterCell.colSpan = drawn.length;
    this.#afterCell.style.height = `${Math.max(0, virtualizer.getTotalSize() - (after - margin))}px`;

    const next = [this.#before, ...rows, this.#after];
    const { children } = this.#body;

    // Rows stay put when the same ones are in view, so what's in them isn't
    // taken off the page and put back on every scroll
    if (
      next.length !== children.length ||
      next.some((row, index) => children[index] !== row)
    ) {
      this.#body.replaceChildren(...next);
    }

    // Measured a frame later, once what's in the rows has drawn: measured at
    // once, a new row is short, and the frame's scroll clamps to fit it
    cancelAnimationFrame(this.#measuring);
    this.#measuring = requestAnimationFrame(() => {
      for (const row of rows) row.style.removeProperty("height");

      for (const row of rows) {
        if (row.isConnected) virtualizer.measureElement(row);
      }
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
          },
          cell,
        ),
      );
    }

    return tr;
  }

  protected override create(root: ShadowRoot) {
    this.#input.addEventListener("input", () => {
      this.query = this.#input.value;
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

    if (this.#input.value !== this.query) this.#input.value = this.query;

    setAttribute(this.#input, "aria-label", this.searchLabel);
    setAttribute(this.#input, "placeholder", this.searchLabel);
    this.#search.hidden =
      this.search === "never" ||
      (this.search !== "always" && this.rows.length < searchFrom);

    this.#none.hidden = this.#matched > 0;
    this.#none.textContent =
      this.rows.length === 0 ? this.emptyLabel : this.noMatchLabel;

    this.#renderBody();
  }
}

GwTable.define("gw-table");

declare global {
  interface HTMLElementTagNameMap {
    "gw-table": GwTable;
  }
}
