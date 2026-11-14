/**
 * `gw-segmented`: picks one of a few options, as a row of radio buttons.
 * Docs: https://groundwork.timmo.dev/components/actions/#segmented-control
 *
 * @module
 */
import { defaultSheetBelow, defaultSheetBelowHeight } from "./adaptive.js";
import { Below } from "./below.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import type { MenuItem } from "./gw-menu-button.js";
import { base, controlSizes, createIcon } from "./styles.js";

// MDI's dots-horizontal, for the More at the end of the row
const moreIcon =
  "M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z";

export interface Segment {
  readonly value: string;
  readonly label: string;
  /** SVG path data for an icon beside, or instead of, the label. */
  readonly icon?: string;
  /** A longer description, shown as the option's tooltip. */
  readonly hint?: string;
  /** Shows the option but stops it being picked. Say why in its `hint`. */
  readonly disabled?: boolean;
}

/**
 * Picks one of a few options, as a row of native radio buttons, so arrow
 * keys move between them and a form submits the choice. Fires `change`.
 *
 * Options can carry icons. `labels` decides
 * whether their text shows: `show` (the default), `hide` (icons only, with
 * the text as a tooltip and accessible name) or `auto`, which shows the text
 * on wide screens and only the icons below `labels-below`. An option with
 * `disabled` shows but can't be picked.
 *
 * `pick` fires on every pick, the chosen option included, so an option such
 * as a Custom one can open a popover each time it's clicked. Open it beside
 * the option with `optionFor(value)`, which also takes the focus back when it
 * closes.
 *
 * `overflow` shows the options in order while they fit, and lists the rest
 * in a More menu at the end of the row, as checkable choices: picking one
 * fires `change` and `pick` as a click would. The chosen option always
 * shows, taking the last slot when it would be in the menu. It decides again
 * as it resizes, and in a flex row it gives up options first, down to the
 * chosen one and More. `inlineWidth` is its width with every option showing,
 * for a bar that measures its controls before laying them out.
 * `menu-items` adds the app's own items to the menu after the options, such
 * as a group of modes, and keeps More showing: choosing one fires
 * `menu-select` and leaves `value` alone. The menu is a bottom sheet on a
 * narrow or short screen, as `gw-menu-button`'s is.
 *
 * On a touch screen each option is at least 44px across at medium, as is
 * its touch area top to bottom.
 *
 * @element gw-segmented
 * @summary Picks one of a few options, as a row of radio buttons.
 *
 * @attr {string} label - The group's accessible name.
 * @attr {string} name - The form field name. Defaults to a unique name.
 * @attr {string} value - The chosen option's value.
 * @attr {"show"|"hide"|"auto"} labels - Whether option text shows beside icons. Defaults to `show`.
 * @attr {string} labels-below - The viewport width, as a CSS length, below which `labels="auto"` shows only the icons. Defaults to `40rem`.
 * @attr {Segment[]} options - The options, as JSON.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The size, 40px tall at medium. Defaults to `medium`.
 * @attr {boolean} overflow - Shows the options that fit and lists the rest in a More menu.
 * @attr {MenuItem[]} menu-items - The app's own items, listed in the More menu after the options, as JSON. With any, More always shows.
 * @attr {string} more-label - The More button's accessible name and tooltip. Defaults to `More`.
 * @attr {string} more-icon - SVG path data for the More button's icon. Defaults to three dots.
 * @attr {number} sheet-below - Overrides the viewport width in pixels below which the More menu is a bottom sheet; `0` turns the width rule off. Defaults to `600`.
 * @attr {number} sheet-below-height - Overrides the viewport height in pixels below which the More menu is a bottom sheet; `0` turns the height rule off. Defaults to `500`.
 *
 * @csspart track - The pill track around the options.
 * @csspart option - Each option.
 * @csspart option-icon - An option's icon.
 * @csspart option-label - An option's text.
 * @csspart indicator - The pill that slides to the chosen option.
 * @csspart more - The More button at the end of the track, a `gw-menu-button`.
 * @csspart more-trigger - The More button's own button.
 * @csspart more-menu - The More menu's surface.
 * @csspart more-item - Each item in the More menu.
 *
 * @cssprop --gw-segmented-scale - Scales the control, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icons with the theme's density. The theme sets it.
 * @cssprop --gw-segmented-touch-size - The least width of an option, and the height of its touch area, on a touch screen. Defaults to `2.75rem` at medium; `0` turns it off.
 *
 * @fires {Event} change - When the chosen option changes.
 * @fires {CustomEvent<{ value: string }>} pick - When an option is clicked or picked with the keyboard, the chosen one included, after any `change`, with its `value` in `detail`.
 * @fires {CustomEvent<{ value: string }>} menu-select - When one of `menu-items` is chosen, with its `value` in `detail`.
 * @fires {CustomEvent<{ value: string, checked: boolean }>} check - When a checkbox item in `menu-items` is toggled, with its `value` and the state it should change to in `detail`.
 */
export class GwSegmented extends GwElement {
  static override properties = {
    label: {},
    name: {},
    value: { reflect: true },
    labels: { reflect: true },
    labelsBelow: { attribute: "labels-below" },
    options: { type: "json" },
    size: { reflect: true },
    overflow: { type: "boolean", reflect: true },
    menuItems: { type: "json", attribute: "menu-items" },
    moreLabel: { attribute: "more-label" },
    moreIcon: { attribute: "more-icon" },
    sheetBelow: { type: "number", attribute: "sheet-below" },
    sheetBelowHeight: { type: "number", attribute: "sheet-below-height" },
  } as const;

  static override styles = [
    base,
    controlSizes("segmented"),
    css`
      :host {
        --gw-size: var(--gw-segmented-scale, 1);
        --gw-scale: calc(var(--gw-size) * var(--gw-control-scale, 1));

        display: inline-block;
      }

      /* A pill track with the picked option as a pill inside, as Home
         Assistant's toggles are */
      fieldset {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        margin: 0;
        background: var(--gw-color-surface-lower);
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
      }

      legend {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      label {
        position: relative;
        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-size));
        align-items: center;
        box-sizing: border-box;
        /* 32px options in a 40px track at medium, matching fields and
           buttons */
        height: calc(2rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-3) * var(--gw-size));
        font-size: calc(var(--gw-font-size-s) * var(--gw-size));
        color: var(--gw-color-text-primary);
        cursor: pointer;
        background: transparent;
        border-radius: var(--gw-radius-pill);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
        --gw-icon-size: calc(1.125rem * var(--gw-scale));
      }

      label.compact.has-icon {
        padding-inline: var(--gw-space-2);
      }

      label.compact.has-icon .text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      label:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      label:has(input:disabled) {
        color: var(--gw-color-text-disabled);
        cursor: not-allowed;
        background: transparent;
      }

      input:disabled {
        cursor: not-allowed;
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0;
      }

      /* The picked pill is one element that slides between options, under
         their text, so the choice moves rather than jumps */
      fieldset {
        position: relative;
        isolation: isolate;
      }

      .indicator {
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        z-index: -1;
        background: var(--gw-color-fill-accent-resting);
        border-radius: var(--gw-radius-pill);
        box-shadow: var(--gw-shadow-s);
        opacity: 0;
      }

      .indicator.placed {
        opacity: 1;
      }

      .indicator.moving {
        transition:
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          width var(--gw-motion-normal) var(--gw-motion-easing),
          height var(--gw-motion-normal) var(--gw-motion-easing);
      }

      label {
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          color var(--gw-motion-normal) var(--gw-motion-easing);
      }

      label:has(input:checked),
      label:has(input:checked):hover {
        color: var(--gw-color-on-accent);
        background: transparent;
      }

      label:has(input:focus-visible) {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        /* Inset, so the ring sits inside the track rather than on its border */
        outline-offset: calc(var(--gw-focus-width) * -1);
      }

      /* Forced colors drop the pill's background, so the picked option
         takes the system's selection colors instead */
      @media (forced-colors: active) {
        .indicator {
          background: Highlight;
          forced-color-adjust: none;
        }

        label:has(input:checked) {
          color: HighlightText;
          forced-color-adjust: none;
        }
      }

      /* With overflow it's as wide as every option, or the room it has,
         down to the chosen one and More; the widths come from measuring */
      :host([overflow]) {
        inline-size: var(--_gw-segmented-natural, auto);
        min-inline-size: var(--_gw-segmented-least, 0);
        max-inline-size: 100%;
      }

      :host([overflow]) label {
        flex: none;
        white-space: nowrap;
      }

      label[hidden],
      .more[hidden] {
        display: none;
      }

      /* More reads as one more option: the same height and pill, quiet
         until hovered */
      .more {
        --gw-menu-button-scale: var(--gw-size);

        flex: none;
      }

      .more::part(trigger) {
        justify-content: center;
        min-inline-size: calc(2rem * var(--gw-scale));
        height: calc(2rem * var(--gw-scale));
        padding: 0;
        color: var(--gw-color-text-primary);
        border-radius: var(--gw-radius-pill);
      }

      .more::part(trigger):hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .more::part(trigger):focus-visible {
        outline-offset: calc(var(--gw-focus-width) * -1);
      }

      /* A finger needs a bigger target than the 32px option: wider, and a
         touch area that reaches past the track top and bottom */
      @media (any-pointer: coarse) {
        label,
        .more::part(trigger) {
          --_gw-segmented-touch: var(
            --gw-segmented-touch-size,
            calc(2.75rem * var(--gw-scale))
          );

          justify-content: center;
          min-inline-size: var(--_gw-segmented-touch);
        }

        input,
        .more::part(trigger)::after {
          inset-block: min(
            0px,
            calc((2rem * var(--gw-scale) - var(--_gw-segmented-touch)) / 2)
          );
        }

        .more::part(trigger)::after {
          position: absolute;
          inset-inline: 0;
          content: "";
        }
      }
    `,
  ];

  declare label: string;
  declare name: string;
  declare value: string;
  declare labels: "show" | "hide" | "auto";
  /** The viewport width, as a CSS length, below which `labels="auto"` shows only the icons. */
  declare labelsBelow: string;
  declare options: readonly Segment[];
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  /** Shows the options that fit and lists the rest in a More menu. */
  declare overflow: boolean;
  /** The app's own items, listed in the More menu after the options. */
  declare menuItems: readonly MenuItem[];
  declare moreLabel: string;
  /** SVG path data for the More button's icon. */
  declare moreIcon: string;
  /** The viewport width in pixels below which the More menu is a bottom sheet. */
  declare sheetBelow: number;
  /** The viewport height in pixels below which the More menu is a bottom sheet. */
  declare sheetBelowHeight: number;

  constructor() {
    super();
    this.label = "";
    this.name = `gw-segmented-${Math.random().toString(36).slice(2)}`;
    this.value = "";
    this.labels = "show";
    this.labelsBelow = "40rem";
    this.options = [];
    this.size = "medium";
    this.overflow = false;
    this.menuItems = [];
    this.moreLabel = "More";
    this.moreIcon = moreIcon;
    this.sheetBelow = defaultSheetBelow;
    this.sheetBelowHeight = defaultSheetBelowHeight;
  }

  readonly #legend = h("legend");

  readonly #indicator = h("span", { class: "indicator", part: "indicator" });

  readonly #more = h("gw-menu-button", {
    class: "more",
    part: "more",
    exportparts: "trigger: more-trigger, menu: more-menu, item: more-item",
    appearance: "plain",
    labels: "hide",
    hidden: true,
  });

  readonly #fieldset = h(
    "fieldset",
    { part: "track" },
    this.#legend,
    this.#indicator,
    this.#more,
  );

  /** The widths `overflow` measured, set on the host. */
  readonly #widths = new CSSStyleSheet();

  #natural = 0;

  #frame = 0;

  readonly #narrow = new Below(() => this.requestUpdate("labels"));

  #segments: {
    label: HTMLLabelElement;
    input: HTMLInputElement;
    option: Segment;
  }[] = [];

  readonly #resize = new ResizeObserver(() => {
    this.#place(false);
    this.#schedule();
  });

  #choose(value: string) {
    if (value === this.value) return;

    this.value = value;

    // At once, so a `pick` listener finds an option chosen from the menu
    // showing
    this.#fit();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  // A click comes before the radio's own change, so it chooses first, and
  // `pick` sees the new value
  #pick(value: string) {
    this.#choose(value);
    this.dispatchEvent(
      new CustomEvent("pick", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * The radio for an option, to open a popover beside it: it covers the
   * option, and the focus can go back to it.
   */
  optionFor(value: string): HTMLElement | undefined {
    return this.#segments.find(({ option }) => option.value === value)?.input;
  }

  /** Its width in pixels with every option showing, whatever it shows now. */
  get inlineWidth(): number {
    if (!this.overflow) return this.getBoundingClientRect().width;

    if (this.#natural === 0) this.#fit();

    return this.#natural;
  }

  /** Moves keyboard focus to the chosen option, or the first that can be picked. */
  override focus(options?: FocusOptions) {
    const target =
      this.#segments.find(({ input }) => input.checked) ??
      this.#segments.find(({ input }) => !input.disabled);

    target?.input.focus(options);
  }

  /** Puts the pill under the picked option, sliding there unless it's the first placing. */
  #place(animate: boolean) {
    const indicator = this.#indicator;

    const picked = this.#segments.find(({ input }) => input.checked)?.label;

    if (picked === undefined) {
      indicator.classList.remove("placed");

      return;
    }

    indicator.classList.toggle(
      "moving",
      animate && indicator.classList.contains("placed"),
    );
    indicator.style.translate = `${picked.offsetLeft}px ${picked.offsetTop}px`;
    indicator.style.width = `${picked.offsetWidth}px`;
    indicator.style.height = `${picked.offsetHeight}px`;
    indicator.classList.add("placed");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#resize.observe(this);

    // The row it sits in, so it shows more again as that widens
    const root = this.getRootNode();

    const container =
      this.parentElement ?? (root instanceof ShadowRoot ? root.host : null);

    if (container !== null) this.#resize.observe(container);

    this.requestUpdate("labels");
    // The options' widths change once the page's fonts load
    void document.fonts.ready.then(this.#schedule);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#narrow.stop();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  readonly #schedule = () => {
    if (this.#frame !== 0) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#fit();
      this.#place(false);
    });
  };

  /** The menu's own items, from `menu-items`. */
  get #extras(): readonly MenuItem[] {
    return Array.isArray(this.menuItems) ? this.menuItems : [];
  }

  /** The values of the options in the More menu. */
  #inMenu = new Set<string>();

  #menuKey = "";

  #widthsText = "";

  /**
   * Shows the options in order while they fit with More after them, the
   * chosen one taking the last slot when it's further along, and lists the
   * rest in the menu. Measures every option showing first, so a resize
   * either way finds the right count.
   */
  #fit() {
    const segments = this.#segments;

    for (const { label } of segments) label.hidden = false;

    if (!this.overflow || !this.isConnected) {
      this.#setWidths("");
      this.#natural = 0;
      this.#inMenu = new Set();
      this.#more.close();
      this.#more.hidden = true;

      return;
    }

    const more = this.#more;

    more.hidden = false;

    const widths = segments.map(
      ({ label }) => label.getBoundingClientRect().width,
    );

    // Not laid out, such as in a closed dialog; the resize as it shows
    // fits it then
    if (widths.length > 0 && widths.every((width) => width === 0)) return;

    const style = getComputedStyle(this.#fieldset);

    const chrome = [
      style.paddingInlineStart,
      style.paddingInlineEnd,
      style.borderInlineStartWidth,
      style.borderInlineEndWidth,
    ].reduce((sum, length) => sum + (Number.parseFloat(length) || 0), 0);

    const gap = Number.parseFloat(style.columnGap) || 0;
    const moreWidth = more.getBoundingClientRect().width;

    const span = (shown: readonly number[], withMore: boolean) =>
      chrome +
      shown.reduce((sum, index) => sum + (widths[index] ?? 0), 0) +
      (withMore ? moreWidth : 0) +
      gap * Math.max(0, shown.length + (withMore ? 1 : 0) - 1);

    const all = segments.map((_, index) => index);

    const chosen = segments.findIndex(
      ({ option }) => option.value === this.value,
    );

    const always = this.#extras.length > 0;

    const least =
      chosen === -1
        ? span([], true)
        : span([chosen], segments.length > 1 || always);

    this.#natural = span(all, always);
    this.#setWidths(
      `:host { --_gw-segmented-natural: ${Math.ceil(this.#natural)}px; --_gw-segmented-least: ${Math.ceil(least)}px; }`,
    );

    const room = this.getBoundingClientRect().width + 0.5;

    let shown: readonly number[] = all;

    if (this.#natural > room) {
      shown = chosen === -1 ? [] : [chosen];

      for (let count = segments.length - 1; count >= 1; count -= 1) {
        const first = all.slice(0, count);

        const candidate =
          chosen < count ? first : [...first.slice(0, -1), chosen];

        if (span(candidate, true) <= room) {
          shown = candidate;

          break;
        }
      }
    }

    const visible = new Set(shown);

    for (const [index, { label }] of segments.entries()) {
      label.hidden = !visible.has(index);
    }

    this.#menu(
      segments
        .filter((_, index) => !visible.has(index))
        .map(({ option }) => option),
    );
  }

  /** Lists the options that don't fit, then `menu-items`, in More. */
  #menu(options: readonly Segment[]) {
    const extras = this.#extras;

    // An empty icon draws none in the menu
    const items: MenuItem[] = options.map((option) => ({
      value: option.value,
      label: option.label,
      icon: option.icon ?? "",
      checked: option.value === this.value,
      disabled: option.disabled === true,
    }));

    // A line between the options and the app's own items, unless a group
    // heading already parts them
    for (const [index, item] of extras.entries()) {
      const parted =
        index === 0 && options.length > 0 && item.group === undefined;

      items.push(parted ? { ...item, separator: true } : item);
    }

    this.#inMenu = new Set(options.map((option) => option.value));

    // The menu closes once nothing's left in it
    if (items.length === 0) this.#more.close();

    this.#more.hidden = items.length === 0;

    const key = JSON.stringify(items);

    if (key !== this.#menuKey) {
      this.#menuKey = key;
      this.#more.items = items;
    }
  }

  #setWidths(text: string) {
    if (text === this.#widthsText) return;

    this.#widthsText = text;
    this.#widths.replaceSync(text);
  }

  // The inner menu's select would reach the page as its own, so it's
  // stopped here and told apart: an option picks, an app's item is
  // `menu-select`
  readonly #onSelect = (event: Event) => {
    event.stopPropagation();

    if (!(event instanceof CustomEvent)) return;

    const value =
      event.detail !== null && "value" in event.detail
        ? String(event.detail.value)
        : "";

    if (this.#inMenu.has(value)) {
      this.#pick(value);

      return;
    }

    this.dispatchEvent(
      new CustomEvent("menu-select", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  protected override create(root: ShadowRoot) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#widths];
    this.#more.addEventListener("select", this.#onSelect);
    root.append(this.#fieldset);
  }

  protected override update(changed: ReadonlySet<string>) {
    this.#legend.textContent = this.label;

    if (changed.has("options")) {
      const options = Array.isArray(this.options) ? this.options : [];

      for (const { label } of this.#segments) label.remove();

      this.#segments = options.map((option) => {
        const input = h("input", { type: "radio", value: option.value });

        input.addEventListener("change", () => this.#choose(option.value));
        input.addEventListener("click", () => this.#pick(option.value));

        const label = h(
          "label",
          { class: option.icon ? "has-icon" : null, part: "option" },
          input,
          option.icon ? createIcon(option.icon, { part: "option-icon" }) : null,
          h("span", { class: "text", part: "option-label" }, option.label),
        );

        return { label, input, option };
      });
      this.#more.before(...this.#segments.map(({ label }) => label));
    }

    const more = this.#more;

    more.label = this.moreLabel;
    more.icon = this.moreIcon;
    more.sheetBelow = this.sheetBelow;
    more.sheetBelowHeight = this.sheetBelowHeight;

    this.#narrow.follow(this.labels === "auto" ? this.labelsBelow : "");

    const compact =
      this.labels === "hide" ||
      (this.labels === "auto" && this.#narrow.matches);

    for (const { label, input, option } of this.#segments) {
      label.classList.toggle("compact", compact);
      input.name = this.name;
      input.checked = option.value === this.value;
      input.disabled = option.disabled === true;
      setAttribute(
        label,
        "title",
        option.hint ??
          (option.icon && this.labels !== "show" ? option.label : null),
      );
    }

    this.#fit();
    this.#place(true);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-segmented": GwSegmented;
  }
}
