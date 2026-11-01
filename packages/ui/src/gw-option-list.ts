/**
 * `gw-option-list`: the searchable, windowed list behind the select and the
 * command menu.
 * Docs: https://groundwork.timmo.dev/components/inputs/#select
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, createIcon } from "./styles.js";

/** One choice in a select or command menu. */
export interface OptionItem {
  readonly value: string;
  readonly label: string;
  /** A second line under the label. */
  readonly description?: string;
  /** SVG path data for an icon before the label. */
  readonly icon?: string;
  /** Options with the same group are listed together under its name. */
  readonly group?: string;
  /** Words that also match a search, but aren't shown. */
  readonly keywords?: readonly string[];
  /** Colors shown as small swatches, such as a theme's palette. */
  readonly swatches?: readonly string[];
}

// MDI's magnify and check
const searchIcon =
  "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";

const checkIcon = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

// Every row kind has a fixed height, so the list knows where each row sits
// without measuring and only renders the ones in view
const optionHeight = 40;
const describedHeight = 52;
const groupHeight = 32;
const listPadding = 6;
const overscan = 6;
const pageSize = 8;

type Row =
  | { readonly kind: "group"; readonly label: string }
  | {
      readonly kind: "option";
      readonly option: OptionItem;
      readonly index: number;
    };

const matches = (option: OptionItem, query: string) =>
  [
    option.label,
    option.description,
    option.group,
    option.value,
    ...(option.keywords ?? []),
  ].some((text) => text?.toLowerCase().includes(query) ?? false);

let lastList = 0;

/**
 * The searchable, keyboard-driven list behind `gw-select` and
 * `gw-command-menu`. Only the rows in view are rendered, so it stays quick
 * with thousands of options. Type to filter, move with the arrow keys, Home,
 * End and Page Up or Down, and pick with Enter or a click; it fires `pick`
 * with the option's value. Call `reset()` each time it's shown.
 *
 * @element gw-option-list
 * @summary A searchable, windowed list of options.
 *
 * @attr {OptionItem[]} options - The options, as JSON.
 * @attr {string} value - The selected option's value.
 * @attr {string} label - The list's accessible name.
 * @attr {boolean} search - Shows a search field above the list.
 * @attr {string} placeholder - The search placeholder. Defaults to `Search`.
 *
 * @cssprop --gw-option-list-height - The list's maximum height. Defaults to `20rem`.
 *
 * @fires pick - When an option is picked, with its `value` in `detail`.
 */
export class GwOptionList extends GwElement {
  static override properties = {
    options: { type: "json" },
    value: {},
    label: {},
    search: { type: "boolean", reflect: true },
    placeholder: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .search {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        padding: var(--gw-space-1) var(--gw-space-3);
        color: var(--gw-color-text-secondary);
        border-block-end: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      :host(:not([search])) .search {
        display: none;
      }

      input {
        flex: 1;
        min-width: 0;
        height: 2.5rem;
        padding: 0;
        font: inherit;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-strong);
        background: none;
        border: 0;
        outline: none;
      }

      /* The search field is always focused while the list is open, so the
         row's divider marks it rather than a ring */
      input:focus-visible {
        outline: none;
      }

      input::placeholder {
        color: var(--gw-color-text-secondary);
      }

      [role="listbox"] {
        position: relative;
        max-height: var(--gw-option-list-height, 20rem);
        overflow-y: auto;
        overscroll-behavior: contain;
        outline: none;
      }

      .spacer {
        position: relative;
      }

      .row {
        position: absolute;
        inset-inline: ${listPadding}px;
        box-sizing: border-box;
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        padding: 0 var(--gw-space-2);
      }

      .group {
        align-items: flex-end;
        padding-block-end: var(--gw-space-1);
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
      }

      [role="option"] {
        font-size: var(--gw-font-size-s);
        cursor: pointer;
        border-radius: var(--gw-radius-control);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
      }

      [role="option"][data-active] {
        background: var(--gw-color-fill-neutral-hovered);
      }

      [role="option"][aria-selected="true"] {
        color: var(--gw-color-text-strong);
      }

      [role="option"] > .icon {
        flex: none;
        color: var(--gw-color-text-secondary);
      }

      [role="option"] > .check {
        color: var(--gw-color-accent);
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

      .swatches {
        display: flex;
        flex: none;
      }

      .swatches span {
        width: 0.875rem;
        height: 0.875rem;
        margin-inline-start: -0.25rem;
        border: 1px solid
          color-mix(in oklab, var(--gw-color-text-primary) 20%, transparent);
        border-radius: 50%;
      }

      .none {
        padding: var(--gw-space-4);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
        text-align: center;
      }

      .none[hidden] {
        display: none;
      }
    `,
  ];

  declare options: readonly OptionItem[];
  declare value: string;
  declare label: string;
  declare search: boolean;
  declare placeholder: string;

  readonly #id = `gw-options-${(lastList += 1)}`;

  readonly #input = h("input", {
    type: "search",
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-expanded": "true",
    autocomplete: "off",
    spellcheck: "false",
  });

  readonly #spacer = h("div", { class: "spacer" });

  readonly #listbox = h(
    "div",
    { role: "listbox", tabindex: "-1" },
    this.#spacer,
  );

  readonly #none = h("div", { class: "none", hidden: true }, "No matches");

  #query = "";

  #active = 0;

  #rows: readonly Row[] = [];

  #tops: readonly number[] = [];

  #filtered: readonly OptionItem[] = [];

  #frame = 0;

  constructor() {
    super();
    this.options = [];
    this.value = "";
    this.label = "";
    this.search = false;
    this.placeholder = "Search";
  }

  /** The options left after the search, in order. */
  get filtered() {
    return this.#filtered;
  }

  /**
   * Clears the search, marks the chosen option, focuses the search field or
   * the list, and scrolls the chosen option into view.
   */
  reset() {
    this.#query = "";
    this.#input.value = "";
    this.#build();
    this.#active = Math.max(
      0,
      this.#filtered.findIndex((option) => option.value === this.value),
    );
    (this.search ? this.#input : this.#listbox).focus({ preventScroll: true });
    this.#reveal(true);
  }

  /** Moves the active option, as the arrow keys do. */
  move(by: number) {
    const last = this.#filtered.length - 1;

    if (last < 0) return;

    const next = this.#active + by;

    // Single steps wrap around; page jumps stop at the ends
    if (Math.abs(by) === 1) {
      this.#active = next > last ? 0 : next < 0 ? last : next;
    } else {
      this.#active = Math.min(last, Math.max(0, next));
    }

    this.#reveal();
  }

  #pick(option: OptionItem | undefined) {
    if (option === undefined) return;

    this.dispatchEvent(
      new CustomEvent("pick", {
        detail: { value: option.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  readonly #onKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        this.move(1);
        break;
      case "ArrowUp":
        this.move(-1);
        break;
      case "PageDown":
        this.move(pageSize);
        break;
      case "PageUp":
        this.move(-pageSize);
        break;
      case "Home":
        if (this.search && event.target === this.#input) return;
        this.move(-this.#active);
        break;
      case "End":
        if (this.search && event.target === this.#input) return;
        this.move(this.#filtered.length - 1 - this.#active);
        break;
      case "Enter":
        this.#pick(this.#filtered[this.#active]);
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  #optionAt(event: Event) {
    const row = event
      .composedPath()
      .find(
        (node) =>
          node instanceof HTMLElement && node.dataset.index !== undefined,
      );

    return row instanceof HTMLElement ? Number(row.dataset.index) : undefined;
  }

  protected override create(root: ShadowRoot) {
    this.#input.addEventListener("input", () => {
      this.#query = this.#input.value;
      this.#build();
      this.#active = 0;
      this.#reveal(true);
    });
    this.#input.addEventListener("keydown", this.#onKeydown);
    this.#listbox.addEventListener("keydown", this.#onKeydown);
    this.#listbox.addEventListener("scroll", () => {
      this.#schedule();
    });
    this.#listbox.addEventListener("pointermove", (event) => {
      const index = this.#optionAt(event);

      if (index !== undefined && index !== this.#active) {
        this.#active = index;
        this.#render();
      }
    });
    this.#listbox.addEventListener("click", (event) => {
      const index = this.#optionAt(event);

      if (index !== undefined) this.#pick(this.#filtered[index]);
    });
    // Keeps focus in the search field when an option is pressed
    this.#listbox.addEventListener("pointerdown", (event) => {
      if (this.search) event.preventDefault();
    });

    root.append(
      h("div", { class: "search" }, createIcon(searchIcon), this.#input),
      this.#listbox,
      this.#none,
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    const listId = `${this.#id}-list`;

    this.#listbox.id = listId;
    setAttribute(this.#input, "aria-controls", listId);
    setAttribute(this.#input, "placeholder", this.placeholder);
    setAttribute(this.#input, "aria-label", this.label || this.placeholder);
    setAttribute(this.#listbox, "aria-label", this.label || null);

    if (changed.has("options") || changed.has("value")) {
      this.#build();
      this.#render();
    }
  }

  #build() {
    const query = this.#query.trim().toLowerCase();
    const options = Array.isArray(this.options) ? this.options : [];

    this.#filtered =
      query === ""
        ? options
        : options.filter((option) => matches(option, query));

    const rows: Row[] = [];
    const tops: number[] = [];
    let top = listPadding;
    let group: string | undefined;

    for (const [index, option] of this.#filtered.entries()) {
      if (option.group !== undefined && option.group !== group) {
        rows.push({ kind: "group", label: option.group });
        tops.push(top);
        top += groupHeight;
      }

      group = option.group;
      rows.push({ kind: "option", option, index });
      tops.push(top);
      top += option.description === undefined ? optionHeight : describedHeight;
    }

    this.#rows = rows;
    this.#tops = tops;
    this.#spacer.style.height = `${rows.length === 0 ? 0 : top + listPadding}px`;
    this.#none.hidden = rows.length > 0;
  }

  #heightOf(row: Row) {
    if (row.kind === "group") return groupHeight;

    return row.option.description === undefined
      ? optionHeight
      : describedHeight;
  }

  /** Scrolls the active option into view, then renders. */
  #reveal(center = false) {
    const position = this.#rows.findIndex(
      (row) => row.kind === "option" && row.index === this.#active,
    );

    if (position >= 0) {
      const listbox = this.#listbox;
      const row = this.#rows[position];
      const top = this.#tops[position] ?? 0;
      const bottom = top + (row === undefined ? 0 : this.#heightOf(row));
      // The group heading above the first option of a group stays in view
      const previous = this.#rows[position - 1];

      const headed =
        previous?.kind === "group" ? (this.#tops[position - 1] ?? top) : top;

      if (center) {
        listbox.scrollTop = Math.max(0, top - listbox.clientHeight / 2);
      } else if (headed - listPadding < listbox.scrollTop) {
        listbox.scrollTop = Math.max(0, headed - listPadding);
      } else if (
        bottom + listPadding >
        listbox.scrollTop + listbox.clientHeight
      ) {
        listbox.scrollTop = bottom + listPadding - listbox.clientHeight;
      }
    }

    this.#render();
  }

  #schedule() {
    if (this.#frame !== 0) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#render();
    });
  }

  #render() {
    const listbox = this.#listbox;
    const start = listbox.scrollTop;
    const end = start + (listbox.clientHeight || 320);
    const rows: HTMLElement[] = [];

    // The first row that reaches into view
    let first = this.#rows.findIndex(
      (row, position) =>
        (this.#tops[position] ?? 0) + this.#heightOf(row) >= start,
    );

    if (first < 0) first = 0;

    first = Math.max(0, first - overscan);

    for (let position = first; position < this.#rows.length; position += 1) {
      const top = this.#tops[position] ?? 0;

      if (top > end && position > first + overscan * 2) break;

      const row = this.#rows[position];

      if (row !== undefined) rows.push(this.#rowElement(row, top));
    }

    this.#spacer.replaceChildren(...rows);

    const active =
      this.#filtered.length > 0 ? `${this.#id}-${this.#active}` : null;

    setAttribute(this.#input, "aria-activedescendant", active);
    setAttribute(this.#listbox, "aria-activedescendant", active);
  }

  #rowElement(row: Row, top: number) {
    if (row.kind === "group") {
      const element = h(
        "div",
        { class: "row group", role: "presentation" },
        row.label,
      );

      element.style.top = `${top}px`;
      element.style.height = `${groupHeight}px`;

      return element;
    }

    const { option, index } = row;
    const selected = option.value === this.value;

    const element = h(
      "div",
      {
        class: "row",
        role: "option",
        id: `${this.#id}-${index}`,
        "data-index": index,
        "aria-selected": selected ? "true" : "false",
        "aria-setsize": this.#filtered.length,
        "aria-posinset": index + 1,
        "data-active": index === this.#active,
      },
      option.icon === undefined ? null : createIcon(option.icon),
      h(
        "span",
        { class: "text" },
        h("span", {}, option.label),
        option.description === undefined
          ? null
          : h("span", { class: "description" }, option.description),
      ),
      option.swatches === undefined
        ? null
        : h(
            "span",
            { class: "swatches", "aria-hidden": "true" },
            ...option.swatches.map((color) => {
              const swatch = h("span");

              swatch.style.background = color;

              return swatch;
            }),
          ),
      selected ? createIcon(checkIcon) : null,
    );

    if (selected) element.lastElementChild?.classList.add("check");

    element.style.top = `${top}px`;
    element.style.height = `${this.#heightOf(row)}px`;

    return element;
  }
}

GwOptionList.define("gw-option-list");

declare global {
  interface HTMLElementTagNameMap {
    "gw-option-list": GwOptionList;
  }
}
