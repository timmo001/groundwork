/**
 * The menu list: two-line rows with icons, group headings, paging and fuzzy
 * filtering, either as you type or after `/`. Rows update in place when the
 * items change but the layout doesn't, so the list never jumps.
 *
 * @module
 */
import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextRenderable,
  bold,
  fg,
  t,
} from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import Fuse from "fuse.js";
import type { Theme } from "./theme.ts";

/** What a menu row shows; apps extend it with their own action fields. */
export interface MenuListItem {
  /** Stable id, used to keep the selection across updates */
  readonly id: string;
  /** Primary display text */
  readonly title: string;
  /** Secondary text shown below the title */
  readonly description: string;
  /** Nerd Font icon character */
  readonly icon: string;
  /** A heading is drawn above the first item of each run of the same group */
  readonly group?: string;
  /** Extra words the filter matches */
  readonly keywords?: readonly string[];
}

/** Width of the left icon column in characters */
const ICON_COLUMN_WIDTH = 4;

/** What a row stands for: an item, a group heading or a page step. */
type RowEntry<Item> =
  | { readonly kind: "item"; readonly item: Item }
  | { readonly kind: "group"; readonly title: string }
  | { readonly kind: "previous" }
  | { readonly kind: "next" };

interface MenuRow<Item> {
  readonly container: BoxRenderable;
  readonly iconText: TextRenderable;
  readonly titleText: TextRenderable;
  readonly descText: TextRenderable;
  /** Replaced when rows update in place */
  entry: RowEntry<Item>;
}

/** Configuration for the {@link MenuList} component */
export interface MenuListOptions<Item extends MenuListItem> {
  /** Unique renderable ID */
  readonly id: string;
  /** Menu items to display */
  readonly items: readonly Item[];
  /** Active color theme */
  readonly theme: Theme;
  /** Called when the user presses Enter on an item, or clicks it */
  readonly onSelect: (item: Item) => void;
  /** Called when the highlighted item changes */
  readonly onSelectionChanged?: (item: Item) => void;
  /** Called when the filter text changes, or `/` filtering starts or ends */
  readonly onFilterChange?: (filter: string) => void;
  /** Called when Escape is pressed with an empty filter */
  readonly onEscape?: () => void;
  /** Called when Backspace is pressed with an empty filter */
  readonly onBack?: () => void;
  /** Index of the initially selected row */
  readonly initialSelectedIndex?: number;
  /** Whether navigation wraps around (default: true) */
  readonly wrapSelection?: boolean;
  /**
   * The most items on a page. Longer lists get "Previous page" and "Next
   * page" rows, and Page Up and Page Down step through them. No paging when
   * unset.
   */
  readonly pageSize?: number;
  /** Called when the page changes, for a page indicator */
  readonly onPageChange?: (page: number, totalPages: number) => void;
  /**
   * Leave filtering to the app: the list only collects the filter text and
   * reports it through `onFilterChange`, and the app calls
   * `setFilteredItems` with the results.
   */
  readonly externalFilter?: boolean;
  /** Sees each key first; return true when it handled the key. */
  readonly onKeyPress?: (key: KeyEvent) => boolean;
  /** `type` filters on any printable key (the default), `slash` after `/`. */
  readonly filterActivation?: "type" | "slash";
}

const isPrintable = (key: KeyEvent): boolean =>
  key.sequence.length === 1 && !key.ctrl && !key.meta && key.sequence >= " ";

/**
 * A scrolling menu of two-line rows: the icon and title, then the
 * description. Up and Down move, Enter or a click selects, Escape clears the
 * filter or goes back, and Backspace removes a filter character or goes back.
 */
export class MenuList<
  Item extends MenuListItem = MenuListItem,
> extends ScrollBoxRenderable {
  private allItems: readonly Item[];
  private items: readonly Item[];
  private selectedIndex: number;
  private rows: MenuRow<Item>[] = [];
  private filterText = "";
  private slashFilterOpen = false;
  private fuse: Fuse<Item>;
  private page = 0;
  private readonly menuRenderer: CliRenderer;
  private readonly menuTheme: Theme;
  private readonly options: MenuListOptions<Item>;
  private readonly wrapSelection: boolean;
  private readonly filterActivation: "type" | "slash";

  constructor(renderer: CliRenderer, options: MenuListOptions<Item>) {
    super(renderer, {
      id: options.id,
      flexGrow: 1,
      width: "100%",
      scrollY: true,
      scrollX: false,
      viewportCulling: true,
      backgroundColor: options.theme.bgElevated,
      focusable: true,
    });

    this.menuRenderer = renderer;
    this.menuTheme = options.theme;
    this.options = options;
    this.allItems = options.items;
    this.items = options.items;
    this.selectedIndex = options.initialSelectedIndex ?? 0;
    this.wrapSelection = options.wrapSelection ?? true;
    this.filterActivation = options.filterActivation ?? "type";
    this.fuse = this.createFuse(options.items);
    this.buildRows();
  }

  /** Replaces the items and resets the selection, filter and page. */
  setItems(items: readonly Item[]): void {
    this.clearRows();
    this.allItems = items;
    this.items = items;
    this.filterText = "";
    this.slashFilterOpen = false;
    this.page = 0;
    this.fuse = this.createFuse(items);
    this.selectedIndex = 0;
    this.buildRows();
    this.options.onFilterChange?.("");
    this.emitPageChange();
  }

  /**
   * Shows items filtered by the app, keeping the filter text, page and
   * selected item. Rows update in place when the layout is unchanged.
   */
  setFilteredItems(
    items: readonly Item[],
    options?: { readonly resetSelection?: boolean },
  ): void {
    const previousId = options?.resetSelection
      ? undefined
      : this.getSelectedItem()?.id;

    this.items = items;
    let targetPage = this.page;
    const pageSize = this.options.pageSize;

    if (items.length === 0) targetPage = 0;
    else if (previousId && pageSize !== undefined && this.isPaginated()) {
      const index = items.findIndex((item) => item.id === previousId);
      targetPage = index >= 0 ? Math.floor(index / pageSize) : 0;
    }

    if (
      targetPage === this.page &&
      this.rows.length > 0 &&
      this.canPatchInPlace(this.pageItemsFor(targetPage))
    ) {
      this.patchRowsInPlace();
      this.emitPageChange();

      return;
    }

    this.clearRows();
    this.page = targetPage;
    this.selectedIndex = 0;
    this.buildRows();

    if (previousId) this.selectItemRow(previousId);

    this.emitPageChange();
  }

  /** Selects a row by index. */
  setSelectedIndex(index: number): void {
    if (index < 0 || index >= this.rows.length || index === this.selectedIndex)
      return;

    this.applySelection(index);
  }

  /** Whether the first selectable row is selected. */
  isFirstSelectableSelected(): boolean {
    if (this.rows.length === 0) return true;

    return this.selectedIndex === this.nextSelectableIndex(-1, 1);
  }

  /** The highlighted item, or nothing on a heading or page row. */
  getSelectedItem(): Item | undefined {
    const entry = this.rows[this.selectedIndex]?.entry;

    return entry?.kind === "item" ? entry.item : undefined;
  }

  /** Clears the filter and shows every item. */
  resetFilter(): void {
    if (this.filterText.length === 0) return;

    this.filterText = "";
    this.slashFilterOpen = false;
    this.page = 0;
    this.applyFilter();
  }

  /** Selects the first item. */
  resetSelection(): void {
    const first = this.rows.findIndex((row) => row.entry.kind === "item");

    if (first >= 0 && first !== this.selectedIndex) this.applySelection(first);
  }

  /** The page shown, from 0 */
  get currentPage(): number {
    return this.page;
  }

  /** How many pages there are, 1 without paging */
  get totalPages(): number {
    if (!this.options.pageSize || !this.isPaginated()) return 1;

    return Math.ceil(this.items.length / this.options.pageSize);
  }

  /** How many items match the filter */
  get filteredCount(): number {
    return this.items.length;
  }

  /** Whether there's filter text */
  get hasFilter(): boolean {
    return this.filterText.length > 0;
  }

  /** Whether `/` filtering is taking keys */
  get filterActive(): boolean {
    return this.slashFilterOpen;
  }

  /**
   * Changes one item's title or description in place, keeping the
   * selection, scroll position and filter. Filtered-out items change too, so
   * the next filter sees the new text.
   */
  patchItemById(
    id: string,
    patch: Partial<Pick<Item, "title" | "description">>,
  ): void {
    const current = this.allItems.find((item) => item.id === id);

    if (current === undefined) return;

    const updated: Item = { ...current, ...patch };
    const swap = (item: Item): Item => (item.id === id ? updated : item);

    this.allItems = this.allItems.map(swap);
    this.items = this.items.map(swap);
    this.fuse = this.createFuse(this.allItems);

    const index = this.rows.findIndex(
      (row) => row.entry.kind === "item" && row.entry.item.id === id,
    );

    const row = this.rows[index];

    if (row === undefined) return;

    row.entry = { kind: "item", item: updated };
    this.paintRow(row, index === this.selectedIndex);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this.filterActivation === "slash" && this.handleSlashFilter(key))
      return true;

    if (this.options.onKeyPress?.(key)) return true;

    if (key.name === "escape") {
      if (this.filterText.length > 0) {
        this.filterText = "";
        this.page = 0;
        this.applyFilter();

        return true;
      }

      this.options.onEscape?.();

      return this.options.onEscape !== undefined;
    }

    if (key.name === "backspace") {
      if (this.filterText.length > 0) {
        this.filterText = this.filterText.slice(0, -1);
        this.page = 0;
        this.applyFilter();

        return true;
      }

      this.options.onBack?.();

      return this.options.onBack !== undefined;
    }

    if (key.name === "pagedown" || key.name === "pageup") {
      this.turnPage(key.name === "pagedown" ? 1 : -1);

      return true;
    }

    if (key.name === "up" || key.name === "down") {
      this.moveSelection(key.name === "up" ? -1 : 1);

      return true;
    }

    if (key.name === "return") {
      this.activate(this.selectedIndex);

      return true;
    }

    if (this.filterActivation === "type" && isPrintable(key)) {
      this.filterText += key.sequence;
      this.page = 0;
      this.applyFilter();

      return true;
    }

    return super.handleKeyPress(key);
  }

  /** Runs a row: selects its item, or turns the page. */
  private activate(index: number): void {
    const entry = this.rows[index]?.entry;

    if (entry?.kind === "item") this.options.onSelect(entry.item);
    else if (entry?.kind === "next") this.turnPage(1);
    else if (entry?.kind === "previous") this.turnPage(-1);
  }

  /** `/` opens the filter, which then takes every key until Escape or Enter. */
  private handleSlashFilter(key: KeyEvent): boolean {
    if (!this.slashFilterOpen) {
      if (key.sequence !== "/" || key.ctrl || key.meta) return false;

      this.slashFilterOpen = true;
      this.options.onFilterChange?.(this.filterText);

      return true;
    }

    if (
      key.name === "escape" ||
      key.name === "return" ||
      (key.name === "backspace" && this.filterText.length === 0)
    ) {
      this.slashFilterOpen = false;
      this.options.onFilterChange?.(this.filterText);

      return true;
    }

    if (key.name === "backspace") {
      this.filterText = this.filterText.slice(0, -1);
      this.page = 0;
      this.applyFilter();

      return true;
    }

    if (!isPrintable(key)) return false;

    this.filterText += key.sequence;
    this.page = 0;
    this.applyFilter();

    return true;
  }

  private isPaginated(): boolean {
    const pageSize = this.options.pageSize;

    return pageSize !== undefined && this.items.length > pageSize;
  }

  private pageItemsFor(page: number): readonly Item[] {
    const pageSize = this.options.pageSize;

    if (pageSize === undefined || !this.isPaginated()) return this.items;

    return this.items.slice(page * pageSize, (page + 1) * pageSize);
  }

  private turnPage(direction: 1 | -1): void {
    const target = this.page + direction;

    if (!this.isPaginated() || target < 0 || target >= this.totalPages) return;

    this.page = target;
    this.clearRows();
    this.selectedIndex = 0;
    this.buildRows();

    if (direction === -1) {
      const last = this.rows.findLastIndex((row) => row.entry.kind === "item");

      if (last >= 0 && last !== this.selectedIndex) this.applySelection(last);
    }

    this.emitPageChange();
  }

  private emitPageChange(): void {
    if (this.isPaginated())
      this.options.onPageChange?.(this.page, this.totalPages);
  }

  private createFuse(items: readonly Item[]): Fuse<Item> {
    return new Fuse([...items], {
      keys: [
        { name: "title", weight: 4 },
        { name: "keywords", weight: 1.5 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }

  /** Re-filters the items, keeping the selected item when the filter clears. */
  private applyFilter(): void {
    if (this.options.externalFilter) {
      this.options.onFilterChange?.(this.filterText);

      return;
    }

    const selectedId = this.getSelectedItem()?.id;
    this.clearRows();
    this.selectedIndex = 0;

    if (this.filterText.length === 0) {
      this.items = this.allItems;
      this.buildRows();

      if (selectedId) this.selectItemRow(selectedId);
    } else {
      this.items = this.fuse.search(this.filterText).map(({ item }) => item);
      this.buildRows();
    }

    this.options.onFilterChange?.(this.filterText);
    this.emitPageChange();
  }

  /** Whether the rows on screen have the same layout as these items. */
  private canPatchInPlace(pageItems: readonly Item[]): boolean {
    let index = 0;

    for (const { entry } of this.rows) {
      const next = pageItems[index];

      if (entry.kind === "group") {
        if (next?.group !== entry.title) return false;
      } else if (entry.kind === "item") {
        if (next?.id !== entry.item.id || next.group !== entry.item.group)
          return false;

        index++;
      }
    }

    return index === pageItems.length;
  }

  private patchRowsInPlace(): void {
    const pageItems = this.pageItemsFor(this.page);
    let index = 0;

    for (const [rowIndex, row] of this.rows.entries()) {
      if (row.entry.kind !== "item") continue;

      const item = pageItems[index];

      if (item === undefined) break;

      row.entry = { kind: "item", item };
      this.paintRow(row, rowIndex === this.selectedIndex);
      index++;
    }
  }

  private selectItemRow(id: string): void {
    const index = this.rows.findIndex(
      (row) => row.entry.kind === "item" && row.entry.item.id === id,
    );

    if (index >= 0 && index !== this.selectedIndex) this.applySelection(index);
  }

  /** Moves by `delta` selectable rows, skipping group headings. */
  private moveSelection(delta: number): void {
    let next = this.selectedIndex;

    for (let step = 0; step < Math.abs(delta); step++)
      next = this.nextSelectableIndex(next, delta > 0 ? 1 : -1);

    if (next !== this.selectedIndex) this.applySelection(next);
  }

  /** The next row that isn't a group heading, or `from` when there's none. */
  private nextSelectableIndex(from: number, direction: 1 | -1): number {
    const length = this.rows.length;
    let index = from;

    for (let attempt = 0; attempt < length; attempt++) {
      index += direction;

      if (this.wrapSelection) index = (index + length) % length;
      else if (index < 0 || index >= length) return from;

      if (this.rows[index]?.entry.kind !== "group") return index;
    }

    return from;
  }

  private applySelection(index: number): void {
    const previous = this.rows[this.selectedIndex];
    const row = this.rows[index];

    if (previous) this.paintRow(previous, false);

    this.selectedIndex = index;

    if (row === undefined) return;

    this.paintRow(row, true);
    this.scrollChildIntoView(row.container.id);

    if (row.entry.kind === "item")
      this.options.onSelectionChanged?.(row.entry.item);
  }

  private clearRows(): void {
    for (const row of this.rows) this.remove(row.container);

    this.rows = [];
  }

  private buildRows(): void {
    const entries: RowEntry<Item>[] = [];

    if (this.isPaginated() && this.page > 0) entries.push({ kind: "previous" });

    let lastGroup: string | undefined;

    for (const item of this.pageItemsFor(this.page)) {
      if (item.group !== undefined && item.group !== lastGroup)
        entries.push({ kind: "group", title: item.group });

      lastGroup = item.group;
      entries.push({ kind: "item", item });
    }

    if (this.isPaginated() && this.page < this.totalPages - 1)
      entries.push({ kind: "next" });

    for (const [index, entry] of entries.entries()) {
      const row = this.createRow(entry, index);
      this.rows.push(row);
      this.add(row.container);
    }

    if (this.rows[this.selectedIndex]?.entry.kind === "group")
      this.selectedIndex = this.nextSelectableIndex(this.selectedIndex, 1);

    for (const [index, row] of this.rows.entries())
      this.paintRow(row, index === this.selectedIndex);
  }

  private createRow(entry: RowEntry<Item>, index: number): MenuRow<Item> {
    const id = `${this.id}-row-${index}`;

    const container = new BoxRenderable(this.menuRenderer, {
      id,
      flexDirection: "row",
      width: "100%",
      flexShrink: 0,
      paddingTop: entry.kind === "group" && index > 0 ? 1 : 0,
    });

    const iconCol = new BoxRenderable(this.menuRenderer, {
      id: `${id}-icol`,
      width: ICON_COLUMN_WIDTH,
      paddingLeft: 1,
    });

    const textCol = new BoxRenderable(this.menuRenderer, {
      id: `${id}-tcol`,
      flexGrow: 1,
      flexDirection: "column",
    });

    const text = (part: string): TextRenderable =>
      new TextRenderable(this.menuRenderer, {
        id: `${id}-${part}`,
        content: "",
      });

    const iconText = text("icon");
    const titleText = text("title");
    const descText = text("desc");

    iconCol.add(iconText);
    textCol.add(titleText);
    textCol.add(descText);
    container.add(iconCol);
    container.add(textCol);

    const row: MenuRow<Item> = {
      container,
      iconText,
      titleText,
      descText,
      entry,
    };

    // A click selects the row and runs it, as Enter does
    container.onMouseDown = (event) => {
      const rowIndex = this.rows.indexOf(row);

      if (event.button !== 0 || rowIndex < 0 || row.entry.kind === "group")
        return;

      this.focus();

      if (rowIndex !== this.selectedIndex) this.applySelection(rowIndex);

      this.activate(rowIndex);
    };

    return row;
  }

  private paintRow(row: MenuRow<Item>, selected: boolean): void {
    const theme = this.menuTheme;
    const { entry } = row;

    row.container.backgroundColor =
      selected && entry.kind !== "group" ? theme.bgSelected : theme.bgElevated;

    if (entry.kind === "group") {
      row.iconText.content = "";
      row.titleText.content = t`${bold(fg(theme.fgSubtle)(entry.title))}`;
      row.descText.content = "";

      return;
    }

    if (entry.kind !== "item") {
      const color = selected ? theme.accent : theme.fgSubtle;
      const next = entry.kind === "next";

      row.iconText.content = t`${fg(color)(next ? "→" : "←")}`;
      row.titleText.content = t`${fg(color)(next ? "Next page" : "Previous page")}`;
      row.descText.content = "";

      return;
    }

    const color = selected ? theme.accent : theme.fg;

    row.iconText.content = t`${fg(color)(entry.item.icon)}`;
    row.titleText.content = t`${fg(color)(entry.item.title)}`;
    row.descText.content = t`${fg(theme.fgMuted)(entry.item.description)}`;
  }
}
