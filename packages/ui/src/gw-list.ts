/**
 * `gw-list`: a long list of anything the page draws, such as cards or
 * expansion panels, windowed with TanStack Virtual so only the items on
 * screen exist, with optional foldable groups.
 * Docs: https://groundwork.timmo.dev/components/display/#list
 *
 * @module
 */
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
import type {} from "./gw-chip.js";
import { keep, keptAt, textsOf } from "./kept.js";
import { base, createIcon } from "./styles.js";

/** Draws one item into its container, which sits in the page's light DOM. */
export type ListDraw<T> = (item: T, target: HTMLElement) => void;

// MDI's chevron-right
const chevronIcon =
  "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";

/** A row the list shows: a group's heading, or one of the items. */
type Shown<T> =
  | {
      readonly kind: "group";
      readonly key: string;
      readonly value: string;
      readonly label: string;
      readonly count: number;
      readonly expanded: boolean;
    }
  | { readonly kind: "item"; readonly key: string; readonly item: T };

/** An item's container in the light DOM, and what was last drawn into it. */
interface Drawn<T> {
  readonly target: HTMLElement;
  item: T | undefined;
  draw: ListDraw<T> | undefined;
}

/**
 * A long list of items the page draws itself, such as cards or expansion
 * panels. Only the items on screen exist, drawn by TanStack Virtual against
 * the window's scroll, or its own frame with `contained`, so a list of
 * thousands stays quick, and items can be any height.
 *
 * Set `items` and `draw` as properties. `draw(item, target)` draws an item
 * into a container in the light DOM, so the page's own styles and
 * components work in it, the first time it scrolls into view and again when
 * the item or `draw` changes. An item scrolled away keeps what was drawn, so
 * it comes back as it was left, such as with a panel open. `keyOf` names
 * each item, so it keeps its place and its drawing across updates.
 *
 * `groupOf` gathers the items under a heading for each value it returns, in
 * the order they first appear, with a chip counting each group's items.
 * Headings sit flat on the page's own surface, and pressing one folds its
 * items away. With `storage-key` it keeps which groups someone folded.
 *
 * @element gw-list
 * @summary A long list of anything, windowed, with foldable groups.
 *
 * @attr {string} label - The list's accessible name.
 * @attr {boolean} groups-collapsed - Starts with every group folded away, for long lists.
 * @attr {string[]} toggled-groups - The groups, by value, toggled from how they start. As JSON or a property.
 * @attr {boolean} contained - Scrolls inside its own frame, up to `--gw-list-max-height`, rather than with the page.
 * @attr {string} storage-key - Keeps the groups someone folded or opened in `localStorage` under this key.
 * @attr {number} estimate - How tall an item is likely to be, in pixels, before it's measured. Defaults to `56`.
 * @attr {string} empty-label - What it says with no items. Defaults to `Nothing to show`.
 *
 * @prop {readonly T[]} items - The items, in order.
 * @prop {ListDraw<T>} draw - Draws an item into its container.
 * @prop {(item: T) => string} keyOf - What identifies an item. Defaults to its position.
 * @prop {(item: T) => string} groupOf - The group an item belongs to.
 * @prop {(value: string) => string} groupLabel - A group's name from its value. Defaults to the value.
 *
 * @csspart list - The list.
 * @csspart item - Each item's row.
 * @csspart group - Each group's heading.
 * @csspart group-count - The chip counting a group's items, a `gw-chip`.
 * @csspart none - What it says with no items.
 *
 * @cssprop --gw-list-max-height - How tall a `contained` list grows before it scrolls. Defaults to `70vh`.
 * @cssprop --gw-list-gap - The space after each item. Defaults to `--gw-space-2`.
 * @cssprop --gw-list-count-scale - Scales the group count chips, around 1 for medium. Defaults to `0.8`, small.
 *
 * @fires {Event} change - When a group is folded or opened. Read `toggledGroups`.
 *
 * @slot - Takes nothing of the page's: the list places each item's container in a slot of its own.
 */
export class GwList<T extends object = object> extends GwElement {
  static override properties = {
    label: {},
    groupsCollapsed: { type: "boolean", attribute: "groups-collapsed" },
    toggledGroups: { type: "json", attribute: "toggled-groups" },
    contained: { type: "boolean", reflect: true },
    storageKey: { attribute: "storage-key" },
    estimate: { type: "number" },
    emptyLabel: { attribute: "empty-label" },
    items: { attribute: false },
    draw: { attribute: false },
    keyOf: { attribute: false },
    groupOf: { attribute: false },
    groupLabel: { attribute: false },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      :host([contained]) .scroller {
        max-height: var(--gw-list-max-height, 70vh);
        overflow-y: auto;
      }

      .item {
        padding-block-end: var(--gw-list-gap, var(--gw-space-2));
      }

      /* A group's heading sits flat on the page's own surface, under the
         items raised on it */
      .group {
        padding-block: var(--gw-space-3) var(--gw-space-2);
      }

      .group-toggle {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        width: 100%;
        padding: var(--gw-space-1) var(--gw-space-2);
        font: inherit;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-align: start;
        cursor: pointer;
        background: none;
        border: 0;
        border-radius: var(--gw-radius-control);
        --gw-icon-size: 1.35em;
      }

      .group-toggle gw-chip {
        --gw-chip-scale: var(--gw-list-count-scale, 0.8);
      }

      .group-toggle:hover {
        color: var(--gw-color-text-primary);
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

      .none {
        padding: var(--gw-space-8) var(--gw-space-4);
        color: var(--gw-color-text-secondary);
        text-align: center;
      }
    `,
  ];

  declare label: string;
  declare groupsCollapsed: boolean;
  declare toggledGroups: readonly string[];
  declare contained: boolean;
  declare storageKey: string;
  declare estimate: number;
  declare emptyLabel: string;
  declare items: readonly T[];
  declare draw: ListDraw<T> | undefined;
  declare keyOf: ((item: T) => string) | undefined;
  declare groupOf: ((item: T) => string) | undefined;
  declare groupLabel: ((value: string) => string) | undefined;

  readonly #body = h("div", { role: "list", part: "list" });

  readonly #none = h("div", { class: "none", part: "none", hidden: true });

  readonly #scroller: HTMLDivElement = h(
    "div",
    { class: "scroller" },
    this.#body,
    this.#none,
  );

  readonly #before = h("div", { "aria-hidden": "true" });

  readonly #after = h("div", { "aria-hidden": "true" });

  /** The headings and items it shows, rebuilt when what they depend on changes. */
  #shown: readonly Shown<T>[] = [];

  /** Each row's element in the shadow root, by key, kept while it's shown. */
  readonly #rows = new Map<string, HTMLDivElement>();

  /** Each item's container and what's drawn in it, by key. */
  readonly #drawn = new Map<string, Drawn<T>>();

  /** The frame booked to measure the rows just drawn. */
  #measuring = 0;

  /** Draws the items on screen as the page scrolls. */
  readonly #windowed = new Virtualizer<Window, HTMLDivElement>({
    count: 0,
    getScrollElement: () => window,
    estimateSize: () => this.estimate,
    overscan: 6,
    observeElementRect: observeWindowRect,
    observeElementOffset: observeWindowOffset,
    scrollToFn: windowScroll,
    initialOffset: () => window.scrollY,
    onChange: () => this.requestUpdate("window"),
  });

  /** Draws the items in view as a `contained` list's own frame scrolls. */
  readonly #framed = new Virtualizer<HTMLDivElement, HTMLDivElement>({
    count: 0,
    getScrollElement: () => this.#scroller,
    estimateSize: () => this.estimate,
    overscan: 6,
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
    this.groupsCollapsed = false;
    this.toggledGroups = [];
    this.contained = false;
    this.storageKey = "";
    this.estimate = 56;
    this.emptyLabel = "Nothing to show";
    this.items = [];
    this.draw = undefined;
    this.keyOf = undefined;
    this.groupOf = undefined;
    this.groupLabel = undefined;
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

  #keyOf(item: T, index: number) {
    return this.keyOf === undefined ? String(index) : this.keyOf(item);
  }

  /** Gathers the items into their groups, then each group's heading and items. */
  #process() {
    const { groupOf } = this;

    const keyed = this.items.map((item, index): Shown<T> => ({
      kind: "item",
      key: this.#keyOf(item, index),
      item,
    }));

    if (groupOf === undefined) {
      this.#shown = keyed;

      return;
    }

    const groups = new Map<string, Shown<T>[]>();

    for (const shown of keyed) {
      if (shown.kind !== "item") continue;

      const value = groupOf(shown.item);
      const group = groups.get(value) ?? [];

      group.push(shown);
      groups.set(value, group);
    }

    this.#shown = [...groups].flatMap(([value, members]): Shown<T>[] => {
      const expanded =
        this.toggledGroups.includes(value) === this.groupsCollapsed;

      const heading: Shown<T> = {
        kind: "group",
        key: `group:${value}`,
        value,
        label: this.groupLabel?.(value) ?? value,
        count: members.length,
        expanded,
      };

      return expanded ? [heading, ...members] : [heading];
    });
  }

  #toggleGroup(value: string) {
    this.toggledGroups = this.toggledGroups.includes(value)
      ? this.toggledGroups.filter((each) => each !== value)
      : [...this.toggledGroups, value];

    if (this.storageKey !== "") {
      keep(this.storageKey, { toggledGroups: this.toggledGroups });
    }

    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  /** A group's heading row, made once and brought up to date. */
  #groupRow(group: Extract<Shown<T>, { readonly kind: "group" }>) {
    const existing = this.#rows.get(group.key);

    const row =
      existing ??
      h(
        "div",
        { class: "group", part: "group" },
        h(
          "button",
          { type: "button", class: "group-toggle" },
          createIcon(chevronIcon),
          h("span"),
          h("gw-chip", { part: "group-count" }),
        ),
      );

    if (existing === undefined) {
      row
        .querySelector("button")
        ?.addEventListener("click", () => this.#toggleGroup(group.value));
      this.#rows.set(group.key, row);
    }

    const toggle = row.querySelector("button");

    setAttribute(toggle ?? row, "aria-expanded", String(group.expanded));

    const label = row.querySelector("span");

    if (label !== null && label.textContent !== group.label) {
      label.textContent = group.label;
    }

    const count = row.querySelector("gw-chip");
    const text = String(group.count);

    if (count !== null && count.textContent !== text) count.textContent = text;

    return row;
  }

  /**
   * An item's row, with a slot for its container, which is drawn into the
   * first time it shows and again when the item or `draw` changes.
   */
  #itemRow(shown: Extract<Shown<T>, { readonly kind: "item" }>) {
    const name = `item-${shown.key}`;

    const row =
      this.#rows.get(shown.key) ??
      h(
        "div",
        { class: "item", part: "item", role: "listitem" },
        h("slot", { name }),
      );

    this.#rows.set(shown.key, row);

    const drawn: Drawn<T> = this.#drawn.get(shown.key) ?? {
      target: h("div", { slot: name }),
      item: undefined,
      draw: undefined,
    };

    this.#drawn.set(shown.key, drawn);

    if (drawn.target.parentNode !== this) this.append(drawn.target);

    if (
      this.draw !== undefined &&
      (drawn.item !== shown.item || drawn.draw !== this.draw)
    ) {
      drawn.item = shown.item;
      drawn.draw = this.draw;
      this.draw(shown.item, drawn.target);
    }

    return row;
  }

  /** Forgets the rows and drawings of items that are gone. */
  #prune() {
    const keys = new Set(this.#shown.map((shown) => shown.key));

    const items = new Set(
      this.items.map((item, index) => this.#keyOf(item, index)),
    );

    for (const key of this.#rows.keys()) {
      if (!keys.has(key)) this.#rows.delete(key);
    }

    for (const [key, drawn] of this.#drawn) {
      if (!items.has(key)) {
        drawn.target.remove();
        this.#drawn.delete(key);
      }
    }
  }

  /** Where the list starts, on the scale the virtualizer scrolls on. */
  #bodyOffset() {
    const top = this.#body.getBoundingClientRect().top;

    return this.contained
      ? top -
          this.#scroller.getBoundingClientRect().top +
          this.#scroller.scrollTop
      : top + window.scrollY;
  }

  #render() {
    if (this.contained) this.#renderRows(this.#framed);
    else this.#renderRows(this.#windowed);
  }

  #renderRows<S extends Window | HTMLDivElement>(
    virtualizer: Virtualizer<S, HTMLDivElement>,
  ) {
    virtualizer.setOptions({
      ...virtualizer.options,
      count: this.#shown.length,
      getItemKey: (index) => this.#shown[index]?.key ?? index,
      scrollMargin: this.#bodyOffset(),
    });

    const visible = virtualizer.getVirtualItems();
    const margin = virtualizer.options.scrollMargin;
    const before = visible[0]?.start ?? margin;
    const after = visible.at(-1)?.end ?? before;
    const showing = new Set<string>();

    const rows = visible.flatMap((each) => {
      const shown = this.#shown[each.index];

      if (shown === undefined) return [];

      showing.add(shown.key);

      const row =
        shown.kind === "group" ? this.#groupRow(shown) : this.#itemRow(shown);

      row.dataset["index"] = String(each.index);

      return [row];
    });

    // Items scrolled away leave the page but keep what was drawn
    for (const [key, drawn] of this.#drawn) {
      if (!showing.has(key) && drawn.target.parentNode === this) {
        drawn.target.remove();
      }
    }

    this.#before.style.height = `${Math.max(0, before - margin)}px`;
    this.#after.style.height = `${Math.max(0, virtualizer.getTotalSize() - (after - margin))}px`;

    const next = [this.#before, ...rows, this.#after];
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
      for (const row of rows) {
        if (row.isConnected) virtualizer.measureElement(row);
      }
    });

    virtualizer._willUpdate();
  }

  protected override update(changed: ReadonlySet<string>) {
    const data = [
      "items",
      "keyOf",
      "groupOf",
      "groupLabel",
      "groupsCollapsed",
      "toggledGroups",
    ];

    // A new starting state starts every group from it again, unless the
    // groups toggled from it came with it
    if (changed.has("groupsCollapsed") && !changed.has("toggledGroups")) {
      this.toggledGroups = [];
    }

    // What was kept wins over how the page starts it
    if (changed.has("storageKey") && this.storageKey !== "") {
      this.toggledGroups =
        textsOf(keptAt(this.storageKey)?.["toggledGroups"]) ??
        this.toggledGroups;
    }

    if (changed.has("contained") && this.isConnected) this.#mount();

    if (data.some((name) => changed.has(name))) {
      this.#process();
      this.#prune();
    }

    setAttribute(this.#body, "aria-label", this.label || null);
    this.#none.hidden = this.items.length > 0;
    this.#none.textContent = this.emptyLabel;
    this.#render();
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#scroller);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-list": GwList;
  }
}
