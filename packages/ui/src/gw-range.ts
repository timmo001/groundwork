/**
 * `gw-range`: a labeled native range slider in light DOM.
 * Docs: https://groundwork.timmo.dev/components/inputs/#range
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { LightElement, fieldId } from "./fields.js";

/**
 * A labeled native range slider. While it's pressed or dragged, a bubble
 * above the thumb shows the value, so a slider without a readout beside it
 * still says where it is. The native `input` and `change` events bubble out
 * as usual.
 *
 * @element gw-range
 * @summary A labeled slider in light DOM, so forms see it.
 *
 * @attr {string} label - The label, also its accessible name.
 * @attr {boolean} label-hidden - Hides the label but keeps it for assistive technology.
 * @attr {string} name - The form field name.
 * @attr {number} value - The value.
 * @attr {number} min - The lowest value. Defaults to 0.
 * @attr {number} max - The highest value. Defaults to 100.
 * @attr {number} step - The step between values. Defaults to 1.
 * @attr {string} unit - Shown after the value in the bubble, the readout and for assistive technology, such as `%`. Empty for a plain number.
 * @attr {boolean} readout - Shows the value beside the track, kept up to date while it's dragged.
 * @attr {string} hint - One line of help under it.
 * @attr {boolean} disabled - Disables it.
 *
 * @cssprop --gw-range-thumb - The thumb's size. Defaults to 1rem.
 */
export class GwRange extends LightElement {
  static override properties = {
    label: {},
    labelHidden: { type: "boolean", attribute: "label-hidden" },
    name: {},
    value: { type: "number" },
    min: { type: "number" },
    max: { type: "number" },
    step: { type: "number" },
    unit: {},
    readout: { type: "boolean" },
    hint: {},
    disabled: { type: "boolean" },
  } as const;

  declare label: string;
  /** Keeps the label for assistive technology but hides it. */
  declare labelHidden: boolean;
  declare name: string;
  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  /** Shown after the value, such as `%`. */
  declare unit: string;
  /** Shows the value beside the track. */
  declare readout: boolean;
  declare hint: string;
  declare disabled: boolean;

  readonly #id = fieldId();

  readonly #label = h("label", { for: this.#id });

  readonly #input = h("input", { type: "range", id: this.#id });

  readonly #bubble = h("span", {
    class: "gw-range-bubble",
    "aria-hidden": "true",
    hidden: "",
  });

  readonly #readout = h("output", {
    class: "gw-range-readout",
    for: this.#id,
    "aria-hidden": "true",
  });

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  constructor() {
    super();
    this.label = "";
    this.labelHidden = false;
    this.name = "";
    this.value = 0;
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.unit = "";
    this.readout = false;
    this.hint = "";
    this.disabled = false;
  }

  #text(value: number): string {
    if (!this.unit) return String(value);

    return this.unit === "%" ? `${value}%` : `${value} ${this.unit}`;
  }

  #placeBubble() {
    const value = this.#input.valueAsNumber;
    const span = this.max - this.min;
    const fraction = span > 0 ? (value - this.min) / span : 0;

    this.#bubble.textContent = this.#text(value);
    // Follows the thumb's center, which travels a thumb's width less than the track
    this.#bubble.style.left = `calc(${fraction * 100}% + (0.5 - ${fraction}) * var(--gw-range-thumb, 1rem))`;
  }

  readonly #release = () => {
    this.#bubble.hidden = true;
    window.removeEventListener("pointerup", this.#release);
    window.removeEventListener("pointercancel", this.#release);
  };

  protected override create(root: HTMLElement) {
    this.#input.addEventListener("pointerdown", () => {
      if (this.#input.disabled) return;

      this.#placeBubble();
      this.#bubble.hidden = false;
      window.addEventListener("pointerup", this.#release);
      window.addEventListener("pointercancel", this.#release);
    });
    this.#input.addEventListener("input", () => {
      this.value = this.#input.valueAsNumber;
      this.#placeBubble();
      this.#readout.textContent = this.#text(this.value);
    });
    root.append(
      this.#label,
      h(
        "span",
        { class: "gw-range-row" },
        h("span", { class: "gw-range-control" }, this.#input, this.#bubble),
        this.#readout,
      ),
      this.#hint,
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#release();
  }

  protected override update() {
    const input = this.#input;

    this.#label.textContent = this.label;
    this.#label.className = this.labelHidden ? "gw-visually-hidden" : "";
    setAttribute(input, "name", this.name || null);
    input.min = String(this.min);
    input.max = String(this.max);
    input.step = String(this.step);
    input.disabled = this.disabled;

    if (input.valueAsNumber !== this.value) input.value = String(this.value);

    setAttribute(
      input,
      "aria-valuetext",
      this.unit ? this.#text(this.value) : null,
    );
    setAttribute(input, "aria-describedby", this.hint ? this.#hint.id : null);
    this.#readout.textContent = this.#text(this.value);
    this.#readout.hidden = !this.readout;
    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;
  }
}

GwRange.define("gw-range");

declare global {
  interface HTMLElementTagNameMap {
    "gw-range": GwRange;
  }
}
