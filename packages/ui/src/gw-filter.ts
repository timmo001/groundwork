/**
 * `gw-filter`: one filter of a list, as options to tick, for a `gw-sheet`.
 * Docs: https://groundwork.timmo.dev/components/overlays/#filter
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-chip.js";
import { base, createIcon, setIconPath } from "./styles.js";

/** One option of a filter. */
export interface FilterOption {
  readonly value: string;
  readonly label: string;
  /** A line under the label, saying what the option means. */
  readonly description?: string;
  /** How many items have this value, when it's known. */
  readonly count?: number;
}

// MDI's chevron-right, eye-outline and filter-variant-remove
const chevronIcon =
  "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";

const shownIcon =
  "M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z";

const clearIcon =
  "M21 8H3V6H21V8M13.81 16H10V18H13.09C13.21 17.28 13.46 16.61 13.81 16M18 11H6V13H18V11M21.12 15.46L19 17.59L16.88 15.46L15.46 16.88L17.59 19L15.46 21.12L16.88 22.54L19 20.41L21.12 22.54L22.54 21.12L20.41 19L22.54 16.88L21.12 15.46Z";

/** From this many options, `search="auto"` adds a search field. */
const searchFrom = 8;

/**
 * One filter of a list, such as its state or where it came from: a header
 * that opens and closes it, then its options to tick, each with an optional
 * description and count. An item shows when it has any ticked value, and
 * ticking nothing, the same as ticking everything, shows it all, so the last
 * ticked option can't be unticked. The header counts how many options show,
 * in the accent while the filter narrows the list, with a button to clear it
 * back to `default-value`. Long lists get a search field. Stack several in a
 * `gw-sheet`, edge to edge.
 *
 * @element gw-filter
 * @summary One filter of a list, as options to tick.
 *
 * @attr {string} label - The filter's name, in its header.
 * @attr {string} icon - SVG path data for an icon before the name.
 * @attr {FilterOption[]} options - The options, as JSON.
 * @attr {string[]} value - The ticked options' values, as JSON. Empty shows everything.
 * @attr {string[]} default-value - What clearing it goes back to, as JSON. Defaults to everything.
 * @attr {boolean} expanded - Whether the options show. Defaults to `true`.
 * @attr {"auto"|"always"|"never"} search - Whether the options have a search field; `auto` adds one from 8 options. Defaults to `auto`.
 * @attr {string} clear-label - The clear button's name, for an app in another language. Defaults to `Clear`.
 * @attr {string} search-label - The search field's name. Defaults to `Search`.
 *
 * @csspart header - The row with the name and the clear button.
 * @csspart icon - The icon `icon` sets.
 * @csspart count - The chip counting the options that show, a `gw-chip`.
 * @csspart clear - The clear button.
 * @csspart search - The search field.
 * @csspart options - The options' list.
 *
 * @cssprop --gw-filter-inset - How far the header and options reach past its edges, such as to a sheet's edge. Defaults to `0rem`.
 * @cssprop --gw-filter-count-scale - Scales the count chip, around 1 for medium. Defaults to `0.8`, small.
 *
 * @fires {Event} change - When the ticked options change. Read `value`.
 * @fires {Event} toggle - When the options open or close. Read `expanded`.
 */
export class GwFilter extends GwElement {
  static override properties = {
    label: {},
    icon: {},
    options: { type: "json" },
    value: { type: "json" },
    defaultValue: { type: "json", attribute: "default-value" },
    expanded: { type: "boolean", reflect: true },
    search: {},
    clearLabel: { attribute: "clear-label" },
    searchLabel: { attribute: "search-label" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        margin-inline: calc(-1 * var(--gw-filter-inset, 0rem));
      }

      /* The heading row sits on the page's own surface, darker than the
         sheet, so each filter reads as a section */
      .header {
        display: flex;
        align-items: center;
        min-height: 2.75rem;
        padding-inline: var(--gw-filter-inset, 0rem);
        font-size: var(--gw-font-size-m);
        background: var(--gw-color-surface-default);
        border-block-start: var(--gw-border-width) solid
          var(--gw-color-border-normal);
      }

      :host([expanded]) .header {
        border-block-end: var(--gw-border-width) solid
          var(--gw-color-border-normal);
      }

      .toggle {
        display: flex;
        flex: 1;
        gap: var(--gw-space-2);
        align-items: center;
        min-height: 2.75rem;
        padding: 0;
        font: inherit;
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        text-align: start;
        cursor: pointer;
        background: none;
        border: 0;
      }

      .toggle:focus-visible,
      .clear:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      .chevron {
        transition: rotate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      :host([expanded]) .chevron {
        rotate: 90deg;
      }

      .kind {
        color: var(--gw-color-accent);
      }

      .kind[hidden] {
        display: none;
      }

      .shown {
        --gw-chip-scale: var(--gw-filter-count-scale, 0.8);
        font-weight: var(--gw-font-weight-regular);
        font-variant-numeric: tabular-nums;
      }

      .shown[hidden] {
        display: none;
      }

      .clear {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        color: var(--gw-color-text-secondary);
        cursor: pointer;
        background: none;
        border: 0;
        border-radius: var(--gw-radius-pill);
      }

      .clear:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .clear[hidden] {
        display: none;
      }

      .body {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-2);
        padding: var(--gw-space-2) var(--gw-filter-inset, 0rem);
      }

      .body[hidden] {
        display: none;
      }

      .search {
        box-sizing: border-box;
        width: 100%;
        min-height: 2.25rem;
        padding: 0 var(--gw-space-3);
        font: inherit;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-lower, transparent);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-control);
      }

      .search:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      .search[hidden] {
        display: none;
      }

      ul {
        max-height: 18rem;
        margin: 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
      }

      label {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: var(--gw-space-1) var(--gw-space-2);
        align-items: center;
        padding: var(--gw-space-1-5, 0.375rem) var(--gw-space-1);
        cursor: pointer;
        border-radius: var(--gw-radius-control);
      }

      label:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      label:has(input:disabled) {
        cursor: default;
      }

      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .description {
        grid-column: 1 / -1;
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      .description:empty {
        display: none;
      }

      .count {
        font-size: var(--gw-font-size-xs);
        font-variant-numeric: tabular-nums;
        color: var(--gw-color-text-secondary);
      }

      input[type="checkbox"] {
        width: 1.1rem;
        height: 1.1rem;
        margin: 0;
        accent-color: var(--gw-color-accent);
      }

      .none {
        padding: var(--gw-space-2) var(--gw-space-1);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }
    `,
  ];

  declare label: string;
  declare icon: string;
  declare options: readonly FilterOption[];
  declare value: readonly string[];
  declare defaultValue: readonly string[];
  declare expanded: boolean;
  declare search: "auto" | "always" | "never";
  declare clearLabel: string;
  declare searchLabel: string;

  #query = "";

  readonly #chevron = createIcon(chevronIcon);

  readonly #kind = createIcon("", { part: "icon" });

  readonly #name = h("span");

  /** How many options show, out of all of them, as a chip. */
  readonly #shown = h("gw-chip", {
    class: "shown",
    part: "count",
    icon: shownIcon,
  });

  readonly #toggle = h(
    "button",
    { type: "button", class: "toggle", "aria-controls": "body" },
    this.#chevron,
    this.#kind,
    this.#name,
    this.#shown,
  );

  readonly #clear = h(
    "button",
    { type: "button", class: "clear", part: "clear" },
    createIcon(clearIcon),
  );

  readonly #search = h("input", {
    type: "search",
    class: "search",
    part: "search",
  });

  readonly #list = h("ul", { part: "options" });

  readonly #body = h(
    "div",
    { class: "body", id: "body" },
    this.#search,
    this.#list,
  );

  constructor() {
    super();
    this.label = "";
    this.icon = "";
    this.options = [];
    this.value = [];
    this.defaultValue = [];
    this.expanded = true;
    this.search = "auto";
    this.clearLabel = "Clear";
    this.searchLabel = "Search";
  }

  /** No values means no filter, so every option counts as ticked. */
  #isTicked(option: string) {
    return this.value.length === 0 || this.value.includes(option);
  }

  /** Whether the ticked options differ from the default. */
  #isFiltering() {
    if (this.defaultValue.length === 0) return this.value.length > 0;

    const ticked = this.options.filter(({ value }) => this.#isTicked(value));

    return (
      ticked.length !== this.defaultValue.length ||
      ticked.some(({ value }) => !this.defaultValue.includes(value))
    );
  }

  #change(value: readonly string[]) {
    this.value = value;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  #tick(option: string, checked: boolean) {
    const ticked = this.options
      .map(({ value }) => value)
      .filter((value) => (value === option ? checked : this.#isTicked(value)));

    this.#change(ticked.length === this.options.length ? [] : ticked);
  }

  protected override create(root: ShadowRoot) {
    this.#chevron.classList.add("chevron");
    this.#toggle.addEventListener("click", () => {
      this.expanded = !this.expanded;
      this.dispatchEvent(
        new Event("toggle", { bubbles: true, composed: true }),
      );
    });
    this.#clear.addEventListener("click", () => {
      this.#change(this.defaultValue);
    });
    this.#search.addEventListener("input", () => {
      this.#query = this.#search.value;
      this.requestUpdate("options");
    });
    root.append(
      h("div", { class: "header", part: "header" }, this.#toggle, this.#clear),
      this.#body,
    );
  }

  #renderOptions() {
    const query = this.#query.trim().toLowerCase();

    const options = this.options.filter(
      (option) =>
        query === "" ||
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );

    const ticked = this.value.length || this.options.length;

    if (options.length === 0) {
      this.#list.replaceChildren(h("li", { class: "none" }, "No matches"));

      return;
    }

    this.#list.replaceChildren(
      ...options.map((option) => {
        const checked = this.#isTicked(option.value);

        const input = h("input", {
          type: "checkbox",
          disabled: checked && ticked === 1,
        });

        input.checked = checked;
        input.addEventListener("change", () => {
          this.#tick(option.value, input.checked);
        });

        return h(
          "li",
          {},
          h(
            "label",
            { title: option.label },
            h("span", { class: "name" }, option.label),
            option.count === undefined
              ? h("span")
              : h("span", { class: "count" }, String(option.count)),
            input,
            h("span", { class: "description" }, option.description ?? ""),
          ),
        );
      }),
    );
  }

  protected override update() {
    const filtering = this.#isFiltering();
    const shown = this.value.length || this.options.length;

    setIconPath(this.#kind, this.icon);
    this.#kind.classList.add("kind");
    this.#kind.toggleAttribute("hidden", !this.icon);
    this.#name.textContent = this.label;
    this.#shown.textContent = `${shown}/${this.options.length}`;
    setAttribute(this.#shown, "tone", filtering ? "accent" : "neutral");
    this.#shown.hidden = this.options.length === 0;
    setAttribute(this.#toggle, "aria-expanded", String(this.expanded));
    this.#clear.hidden = !filtering;
    setAttribute(this.#clear, "aria-label", `${this.clearLabel} ${this.label}`);
    setAttribute(this.#clear, "title", this.clearLabel);
    this.#body.hidden = !this.expanded;
    this.#search.hidden =
      this.search === "never" ||
      (this.search !== "always" && this.options.length < searchFrom);
    setAttribute(this.#search, "aria-label", this.searchLabel);
    setAttribute(this.#search, "placeholder", this.searchLabel);
    this.#renderOptions();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-filter": GwFilter;
  }
}
