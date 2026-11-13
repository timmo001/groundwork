/**
 * `gw-segmented`: picks one of a few options, as a row of radio buttons.
 * Docs: https://groundwork.timmo.dev/components/actions/#segmented-control
 *
 * @module
 */
import { Below } from "./below.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, controlSizes, createIcon } from "./styles.js";

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
 *
 * @csspart track - The pill track around the options.
 * @csspart option - Each option.
 * @csspart option-icon - An option's icon.
 * @csspart option-label - An option's text.
 * @csspart indicator - The pill that slides to the chosen option.
 *
 * @cssprop --gw-segmented-scale - Scales the control, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icons with the theme's density. The theme sets it.
 *
 * @fires {Event} change - When the chosen option changes.
 * @fires {CustomEvent<{ value: string }>} pick - When an option is clicked or picked with the keyboard, the chosen one included, after any `change`, with its `value` in `detail`.
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

  constructor() {
    super();
    this.label = "";
    this.name = `gw-segmented-${Math.random().toString(36).slice(2)}`;
    this.value = "";
    this.labels = "show";
    this.labelsBelow = "40rem";
    this.options = [];
    this.size = "medium";
  }

  readonly #legend = h("legend");

  readonly #indicator = h("span", { class: "indicator", part: "indicator" });

  readonly #fieldset = h(
    "fieldset",
    { part: "track" },
    this.#legend,
    this.#indicator,
  );

  readonly #narrow = new Below(() => this.requestUpdate("labels"));

  #segments: {
    label: HTMLLabelElement;
    input: HTMLInputElement;
    option: Segment;
  }[] = [];

  readonly #resize = new ResizeObserver(() => this.#place(false));

  #choose(value: string) {
    if (value === this.value) return;

    this.value = value;
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
    this.requestUpdate("labels");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#narrow.stop();
  }

  protected override create(root: ShadowRoot) {
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
      this.#fieldset.append(...this.#segments.map(({ label }) => label));
    }

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

    this.#place(true);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-segmented": GwSegmented;
  }
}
