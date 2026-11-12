/**
 * `gw-sortable`: a list someone puts in order, by dragging each item's
 * handle or moving it with the arrow keys.
 * Docs: https://groundwork.timmo.dev/components/inputs/#sortable-list
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type { GwButton } from "./gw-button.js";
import { base, createIcon, setIconPath } from "./styles.js";

export interface SortableItem {
  readonly value: string;
  readonly label: string;
  /** A second line under the label. */
  readonly description?: string;
  /** SVG path data for an icon before the label. */
  readonly icon?: string;
}

// MDI's drag-vertical
const handleIcon =
  "M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";

/** Fills `{name}` placeholders in a label from `values`. */
const fill = (template: string, values: Readonly<Record<string, string>>) =>
  template.replaceAll(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? (values[name] ?? match) : match,
  );

/** An item's row and the pieces of it that change. */
interface Row {
  readonly row: HTMLLIElement;
  readonly handle: GwButton;
  readonly icon: SVGSVGElement;
  readonly label: HTMLSpanElement;
  readonly description: HTMLSpanElement;
  readonly slot: HTMLSlotElement;
}

/** The row being dragged and where the pointer took hold of it. */
interface Drag {
  readonly value: string;
  readonly pointer: number;
  /** How far down the row the pointer took hold. */
  readonly grip: number;
}

/**
 * A list someone puts in order. Each item has a handle: drag it with a
 * mouse, pen or finger, or focus it and move the item with the arrow keys,
 * Home and End. The other items make way as it passes, and each move by key
 * is announced. It fires `change` once an item lands somewhere new, with
 * `items` in the new order.
 *
 * Items take a label, and optionally a description and an icon. Content of
 * the page's own, such as a chip or a button, goes at the end of an item in
 * the slot named `end-` and its value.
 *
 * @element gw-sortable
 * @summary A list put in order by dragging, or with the arrow keys.
 *
 * @attr {string} label - The list's accessible name.
 * @attr {SortableItem[]} items - The items, in order, as JSON.
 * @attr {boolean} disabled - Stops the items moving.
 * @attr {string} handle-icon - SVG path data for the handles' icon. Defaults to a grip.
 * @attr {string} handle-label - Each handle's name, with `{label}` for its item's. Defaults to `Move {label}`.
 * @attr {string} moved-label - What's announced after a move by key, with `{label}`, `{position}` and `{count}`. Defaults to `{label}, {position} of {count}`.
 * @attr {string} empty-label - What it says with no items. Defaults to `Nothing to sort`.
 *
 * @slot end-{value} - Content of the page's own at the end of the item with that value.
 *
 * @csspart list - The list.
 * @csspart item - Each item's row, also named `dragging` while it's dragged.
 * @csspart handle - Each item's handle, a `gw-button`.
 * @csspart item-icon - An item's icon.
 * @csspart label - An item's label.
 * @csspart description - An item's second line.
 * @csspart none - What it says with no items.
 *
 * @cssprop --gw-sortable-gap - The space between items. Defaults to `--gw-space-2`.
 * @cssprop --gw-sortable-item-background - An item's background. Defaults to `--gw-color-surface-raised`.
 * @cssprop --gw-sortable-item-radius - An item's corners. Defaults to `--gw-radius-control`.
 * @cssprop --gw-sortable-handle-scale - Scales the handles, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-sortable-dragging-shadow - The shadow under the item being dragged. Defaults to `--gw-shadow-m`.
 *
 * @fires {Event} change - When an item moves somewhere new. Read `items`.
 */
export class GwSortable extends GwElement {
  static override properties = {
    label: {},
    items: { type: "json" },
    disabled: { type: "boolean", reflect: true },
    handleIcon: { attribute: "handle-icon" },
    handleLabel: { attribute: "handle-label" },
    movedLabel: { attribute: "moved-label" },
    emptyLabel: { attribute: "empty-label" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      ol {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--gw-sortable-gap, var(--gw-space-2));
        padding: 0;
        margin: 0;
        list-style: none;
      }

      li {
        position: relative;
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        padding: var(--gw-space-1) var(--gw-space-3) var(--gw-space-1)
          var(--gw-space-1);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-strong);
        background: var(
          --gw-sortable-item-background,
          var(--gw-color-surface-raised)
        );
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-sortable-item-radius, var(--gw-radius-control));
      }

      /* Making way for the item being dragged, from where it was */
      li.settling {
        transition: translate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      li.dragging {
        z-index: 1;
        box-shadow: var(--gw-sortable-dragging-shadow, var(--gw-shadow-m));
      }

      .handle {
        --gw-button-scale: var(--gw-sortable-handle-scale, 0.8);

        cursor: grab;
        touch-action: none;
      }

      li.dragging .handle {
        cursor: grabbing;
      }

      :host([disabled]) .handle {
        cursor: not-allowed;
      }

      li > .icon {
        color: var(--gw-color-text-primary);
      }

      .text {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .text span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .description {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      .none {
        padding: var(--gw-space-6) var(--gw-space-4);
        color: var(--gw-color-text-secondary);
        text-align: center;
      }

      .status {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      /* Forced colors drop the shadow, so the dragged item takes an outline
         in the system's selection color instead */
      @media (forced-colors: active) {
        li.dragging {
          outline: var(--gw-focus-width) solid Highlight;
        }
      }
    `,
  ];

  declare label: string;
  declare items: readonly SortableItem[];
  declare disabled: boolean;
  declare handleIcon: string;
  declare handleLabel: string;
  declare movedLabel: string;
  declare emptyLabel: string;

  constructor() {
    super();
    this.label = "";
    this.items = [];
    this.disabled = false;
    this.handleIcon = handleIcon;
    this.handleLabel = "Move {label}";
    this.movedLabel = "{label}, {position} of {count}";
    this.emptyLabel = "Nothing to sort";
  }

  readonly #list = h("ol", { part: "list" });

  readonly #none = h("div", { class: "none", part: "none", hidden: true });

  readonly #status = h("div", { class: "status", role: "status" });

  /** Each item's row, by value, kept across updates so focus stays put. */
  readonly #rows = new Map<string, Row>();

  #drag: Drag | undefined;

  /** The items with a value, the first of each, as the list shows them. */
  #shown(): readonly SortableItem[] {
    const items = Array.isArray(this.items) ? this.items : [];
    const seen = new Set<string>();

    return items.filter((item) => {
      if (seen.has(item.value)) return false;

      seen.add(item.value);

      return true;
    });
  }

  #rowFor(item: SortableItem) {
    const existing = this.#rows.get(item.value);

    if (existing !== undefined) return existing;

    const handle = h("gw-button", {
      class: "handle",
      part: "handle",
      variant: "neutral",
      appearance: "plain",
      labels: "hide",
    });

    const parts = {
      handle,
      icon: createIcon("", { part: "item-icon" }),
      label: h("span", { part: "label" }),
      description: h("span", { class: "description", part: "description" }),
      slot: h("slot"),
    };

    const row = h(
      "li",
      { part: "item" },
      handle,
      parts.icon,
      h("span", { class: "text" }, parts.label, parts.description),
      parts.slot,
    );

    handle.addEventListener("keydown", (event) => this.#key(event, item.value));
    handle.addEventListener("pointerdown", (event) =>
      this.#grab(event, item.value),
    );

    const made: Row = { row, ...parts };

    this.#rows.set(item.value, made);

    return made;
  }

  /** The values in the order the rows stand in now. */
  #order() {
    const byRow = new Map<Element, string>(
      [...this.#rows].map(([value, { row }]) => [row, value]),
    );

    return [...this.#list.children].flatMap((row) => {
      const value = byRow.get(row);

      return value === undefined ? [] : [value];
    });
  }

  /** Puts the items in the rows' order, firing `change` if it moved. */
  #commit() {
    const order = this.#order();
    const shown = this.#shown();

    if (order.every((value, index) => shown[index]?.value === value)) return;

    const byValue = new Map(shown.map((item) => [item.value, item]));

    this.items = order.flatMap((value) => {
      const item = byValue.get(value);

      return item === undefined ? [] : [item];
    });
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  /**
   * Moves a row to `index`, sliding the rows it passes from where they
   * were, so they make way rather than jump.
   */
  #place(row: HTMLLIElement, index: number) {
    const rows = [...this.#list.children].flatMap((each) =>
      each instanceof HTMLElement && each !== row ? [each] : [],
    );

    const before = new Map(rows.map((each) => [each, each.offsetTop]));

    this.#list.insertBefore(row, rows[index] ?? null);

    for (const [each, top] of before) {
      const shift = top - each.offsetTop;

      if (shift === 0) continue;

      each.classList.remove("settling");
      each.style.translate = `0 ${shift}px`;
      // Read back, so the browser takes the shift before it slides away
      void each.offsetTop;
      each.classList.add("settling");
      each.style.translate = "";
    }
  }

  #key(event: KeyboardEvent, value: string) {
    if (this.disabled) return;

    const found = this.#rows.get(value);
    const order = this.#order();
    const index = order.indexOf(value);
    const last = order.length - 1;

    const to = {
      ArrowUp: index - 1,
      ArrowDown: index + 1,
      Home: 0,
      End: last,
    }[event.key];

    if (found === undefined || to === undefined) return;

    event.preventDefault();

    if (to < 0 || to > last || to === index) return;

    this.#place(found.row, to);
    // Moving the row takes the focus off its handle
    found.handle.focus();
    this.#commit();

    const item = this.#shown().find((each) => each.value === value);

    this.#status.textContent = fill(this.movedLabel, {
      label: item?.label ?? value,
      position: String(to + 1),
      count: String(order.length),
    });
  }

  #grab(event: PointerEvent, value: string) {
    const found = this.#rows.get(value);

    if (
      this.disabled ||
      found === undefined ||
      this.#drag !== undefined ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    const { row } = found;

    this.#drag = {
      value,
      pointer: event.pointerId,
      grip: event.clientY - row.getBoundingClientRect().top,
    };

    // The host takes the pointer, since moving the row out of the way
    // would drop a capture held by its handle
    this.setPointerCapture(event.pointerId);
    // It follows the pointer straight away, rather than sliding after it
    row.classList.remove("settling");
    row.classList.add("dragging");
    row.part.add("dragging");

    const move = (moved: PointerEvent) => {
      if (moved.pointerId === this.#drag?.pointer) this.#follow(moved);
    };

    const release = (released: PointerEvent) => {
      if (released.pointerId !== this.#drag?.pointer) return;

      this.removeEventListener("pointermove", move);
      this.removeEventListener("pointerup", release);
      this.removeEventListener("pointercancel", release);
      this.#drop();
    };

    this.addEventListener("pointermove", move);
    this.addEventListener("pointerup", release);
    this.addEventListener("pointercancel", release);
  }

  /** Keeps the dragged row under the pointer, moving it past the rows it crosses. */
  #follow(event: PointerEvent) {
    const drag = this.#drag;

    const row =
      drag === undefined ? undefined : this.#rows.get(drag.value)?.row;

    if (drag === undefined || row === undefined) return;

    const top =
      event.clientY - this.#list.getBoundingClientRect().top - drag.grip;

    const middle = top + row.offsetHeight / 2;

    const others = [...this.#list.children].filter(
      (each): each is HTMLElement =>
        each !== row && each instanceof HTMLElement,
    );

    // Where its middle falls among the others' middles
    const index = others.filter(
      (each) => each.offsetTop + each.offsetHeight / 2 < middle,
    ).length;

    if ((others[index] ?? null) !== row.nextElementSibling) {
      this.#place(row, index);
    }

    row.style.translate = `0 ${top - row.offsetTop}px`;
  }

  #drop() {
    const drag = this.#drag;

    const row =
      drag === undefined ? undefined : this.#rows.get(drag.value)?.row;

    this.#drag = undefined;

    if (row === undefined) return;

    row.classList.remove("dragging");
    row.part.remove("dragging");
    // Slides into its place from where it was let go
    row.classList.add("settling");
    row.style.translate = "";
    this.#commit();
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#list, this.#none, this.#status);
  }

  protected override update(changed: ReadonlySet<string>) {
    const shown = this.#shown();

    setAttribute(this.#list, "aria-label", this.label || null);
    this.#none.hidden = shown.length > 0;
    this.#none.textContent = this.emptyLabel;

    if (changed.has("items")) {
      const values = new Set(shown.map((item) => item.value));

      for (const [value, { row }] of this.#rows) {
        if (!values.has(value)) {
          row.remove();
          this.#rows.delete(value);
        }
      }

      // Only rows out of place move, so a focused handle keeps its focus
      let at = this.#list.firstElementChild;

      for (const item of shown) {
        const { row } = this.#rowFor(item);

        if (at === row) at = row.nextElementSibling;
        else this.#list.insertBefore(row, at);
      }
    }

    for (const item of shown) {
      const found = this.#rowFor(item);

      setIconPath(found.icon, item.icon ?? "");
      setAttribute(found.icon, "hidden", !item.icon);
      found.label.textContent = item.label;
      found.description.textContent = item.description ?? "";
      found.description.hidden = !item.description;
      found.slot.name = `end-${item.value}`;
      found.handle.icon = this.handleIcon;
      found.handle.disabled = this.disabled;
      found.handle.textContent = fill(this.handleLabel, { label: item.label });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-sortable": GwSortable;
  }
}
