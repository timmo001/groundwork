/**
 * The status list: two-row items colored by their state, with optional
 * section headings, that scroll by whole rows and keep a row's section in
 * view when they can.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import { ScrollSurface } from "./scroll-surface.ts";
import { surfaceBackground } from "./styles.ts";
import type { Theme } from "./theme.ts";

export interface StatusListItem<T> {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** The title's color, usually a state slot such as `theme.green`. */
  readonly color: string;
  /** Starts a new section heading when it differs from the row above. */
  readonly section?: string;
  readonly value: T;
}

export interface StatusListOptions<T> {
  readonly id: string;
  readonly theme: Theme;
  readonly items?: readonly StatusListItem<T>[];
  /** Called on Enter or a click. */
  readonly onSelect: (item: StatusListItem<T>) => void;
  /** Called when the highlighted row changes. */
  readonly onSelectionChanged?: (item: StatusListItem<T>) => void;
  /** Whether Enter selects, true by default. */
  readonly selectOnEnter?: boolean;
}

interface StatusListRow<T> {
  readonly container: BoxRenderable;
  readonly marker: TextRenderable;
  readonly title: TextRenderable;
  readonly description: TextRenderable;
  readonly item: StatusListItem<T>;
  readonly sectionHeader: BoxRenderable | undefined;
}

/** A two-row list of items with a state color and section headings. */
export class StatusList<T> extends ScrollSurface {
  private readonly listRenderer: CliRenderer;
  private readonly listTheme: Theme;
  private readonly onSelectItem: (item: StatusListItem<T>) => void;
  private readonly onItemSelectionChanged:
    ((item: StatusListItem<T>) => void) | undefined;
  private readonly selectOnEnter: boolean;
  private rows: StatusListRow<T>[] = [];
  private items: readonly StatusListItem<T>[] = [];
  private selectedIndex = 0;
  private active = false;

  constructor(renderer: CliRenderer, options: StatusListOptions<T>) {
    super(renderer, {
      id: options.id,
      theme: options.theme,
      flexGrow: 1,
      flexShrink: 1,
      minHeight: 0,
      scrollY: true,
      scrollX: false,
      focusable: true,
      backgroundColor: surfaceBackground(options.theme),
      contentOptions: { flexDirection: "column", width: "100%" },
    });
    this.listRenderer = renderer;
    this.listTheme = options.theme;
    this.onSelectItem = options.onSelect;
    this.onItemSelectionChanged = options.onSelectionChanged;
    this.selectOnEnter = options.selectOnEnter ?? true;
    this.setItems(options.items ?? []);
  }

  /** Replaces the rows, keeping `preferredId` or the current row selected. */
  setItems(
    items: readonly StatusListItem<T>[],
    preferredId?: string | null,
  ): void {
    const selectedId = preferredId ?? this.getSelectedItem()?.id;

    for (const row of this.scrollBox.getChildren()) this.scrollBox.remove(row);

    this.items = items;

    this.selectedIndex = Math.max(
      0,
      selectedId ? items.findIndex((item) => item.id === selectedId) : 0,
    );

    this.rows = [];
    let section: string | undefined;
    let sectionHeader: BoxRenderable | undefined;

    for (const [index, item] of items.entries()) {
      if (item.section && item.section !== section) {
        section = item.section;
        sectionHeader = this.createSection(item.section, index);
        this.addContent(sectionHeader);
      }

      const row = this.createRow(item, index, sectionHeader);
      this.rows.push(row);
      this.addContent(row.container);
    }

    this.refresh();
    this.ensureSelectionVisible();
    this.emitSelection();
  }

  getSelectedItem(): StatusListItem<T> | undefined {
    return this.items[this.selectedIndex];
  }

  /** Marks the list as the focused pane, and focuses it unless told not to. */
  setActive(active: boolean, options?: { readonly focus?: boolean }): void {
    this.active = active;

    if (active && (options?.focus ?? true)) this.focus();
    else this.blur();

    this.refresh();
  }

  selectNext(): void {
    this.moveSelection(1);
  }

  selectPrevious(): void {
    this.moveSelection(-1);
  }

  /** Scrolls the selected row back into view, such as after a resize. */
  realign(): void {
    this.ensureSelectionVisible();
    this.syncMarker();
  }

  override focus(): void {
    this.listRenderer.focusRenderable(this);
  }

  override blur(): void {
    this.listRenderer.blurRenderable(this);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name === "up" || key.name === "down") {
      this.moveSelection(key.name === "up" ? -1 : 1);

      return true;
    }

    if (key.name === "pageup" || key.name === "pagedown") {
      const page = this.completeItemsPerPage();
      this.moveSelection(key.name === "pageup" ? -page : page, false);

      return true;
    }

    if (key.name === "return" && this.selectOnEnter) {
      const item = this.getSelectedItem();

      if (item) this.onSelectItem(item);

      return true;
    }

    return this.scrollBox.handleKeyPress(key);
  }

  private moveSelection(delta: number, wrap = true): void {
    if (!this.items.length) return;

    const next = wrap
      ? (this.selectedIndex + delta + this.items.length) % this.items.length
      : Math.max(
          0,
          Math.min(this.items.length - 1, this.selectedIndex + delta),
        );

    if (next === this.selectedIndex) return;

    this.selectedIndex = next;
    this.refresh();
    this.ensureSelectionVisible();
    this.emitSelection();
  }

  private activate(index: number): void {
    if (index !== this.selectedIndex) {
      this.selectedIndex = index;
      this.refresh();
      this.ensureSelectionVisible();
      this.emitSelection();
    }

    const item = this.items[index];

    if (item) this.onSelectItem(item);
  }

  private createSection(label: string, index: number): BoxRenderable {
    const header = new BoxRenderable(this.listRenderer, {
      id: `${this.id}-section-${index}`,
      width: "100%",
      height: 1,
      flexShrink: 0,
      paddingLeft: 1,
    });

    header.add(
      new TextRenderable(this.listRenderer, {
        content: t`${bold(fg(this.listTheme.fgSubtle)(label))}`,
        height: 1,
        wrapMode: "none",
        truncate: true,
      }),
    );

    return header;
  }

  private createRow(
    item: StatusListItem<T>,
    index: number,
    sectionHeader: BoxRenderable | undefined,
  ): StatusListRow<T> {
    const container = new BoxRenderable(this.listRenderer, {
      id: `${this.id}-row-${index}`,
      flexDirection: "row",
      width: "100%",
      height: 2,
      flexShrink: 0,
      overflow: "hidden",
      onMouseDown: (event) => {
        if (event.button !== 0) return;

        event.stopPropagation();
        this.activate(index);
      },
    });

    const marker = new TextRenderable(this.listRenderer, {
      width: 2,
      height: 2,
      flexShrink: 0,
      content: "",
    });

    const content = new BoxRenderable(this.listRenderer, {
      flexDirection: "column",
      flexGrow: 1,
      minWidth: 0,
      height: 2,
    });

    const line = {
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
      overflow: "hidden",
      content: "",
    } as const;

    const title = new TextRenderable(this.listRenderer, line);
    const description = new TextRenderable(this.listRenderer, line);

    content.add(title);
    content.add(description);
    container.add(marker);
    container.add(content);

    return { container, marker, title, description, item, sectionHeader };
  }

  private refresh(): void {
    const theme = this.listTheme;

    for (const [index, row] of this.rows.entries()) {
      const selected = index === this.selectedIndex;
      const { color, title, description } = row.item;

      row.container.backgroundColor =
        selected && this.active ? theme.bgSelected : surfaceBackground(theme);

      row.marker.content = t`${fg(selected ? color : theme.fgGhost)(selected ? "▌\n▌" : "  \n  ")}`;
      row.title.content = t`${selected ? bold(fg(color)(title)) : fg(color)(title)}`;
      row.description.content = t`${fg(theme.fgMuted)(description)}`;
    }
  }

  private ensureSelectionVisible(): void {
    const row = this.rows[this.selectedIndex];

    if (!row) return;

    const viewport = this.scrollBox.viewport.height;
    const rowStart = this.childStart(row.container);

    const contextStart = row.sectionHeader
      ? this.childStart(row.sectionHeader)
      : rowStart;

    const rowEnd = rowStart + row.container.height;

    const targetStart =
      rowEnd - contextStart <= viewport ? contextStart : rowStart;

    const current = this.scrollBox.scrollTop;
    let target = current;

    if (targetStart < current) target = targetStart;
    else if (rowEnd > current + viewport) target = rowEnd - viewport;

    this.scrollBox.scrollTop = this.completeChildBoundary(target);
    this.syncMarker();
  }

  private completeItemsPerPage(): number {
    const viewport = this.scrollBox.viewport.height;

    if (viewport <= 0) return 1;

    return Math.max(1, Math.floor(viewport / 2));
  }

  /** Rounds an offset down to the start of a whole child. */
  private completeChildBoundary(offset: number): number {
    const extent = Math.max(
      0,
      this.scrollBox.scrollHeight - this.scrollBox.viewport.height,
    );

    const bounded = Math.max(0, Math.min(offset, extent));
    const starts: number[] = [];
    let start = 0;

    for (const child of this.scrollBox.getChildren()) {
      if (start <= bounded) starts.push(start);

      start += child.height;
    }

    return Math.max(0, ...starts);
  }

  private childStart(target: BoxRenderable): number {
    let start = 0;

    for (const child of this.scrollBox.getChildren()) {
      if (child === target) return start;

      start += child.height;
    }

    return start;
  }

  private emitSelection(): void {
    const item = this.getSelectedItem();

    if (item) this.onItemSelectionChanged?.(item);
  }
}
