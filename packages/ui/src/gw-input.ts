/**
 * `gw-input`: a labeled native input in light DOM.
 * Docs: https://groundwork.timmo.dev/components/inputs/#input
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { FieldInfo } from "./field-info.js";
import { LightElement, fieldId } from "./fields.js";

/**
 * A labeled native `<input>`, with an optional hint and error.
 *
 * @element gw-input
 * @summary A labeled text field in light DOM, so forms and autofill see it.
 *
 * @attr {string} label - The field's label.
 * @attr {string} name - The form field name.
 * @attr {string} type - The native input type. Defaults to `text`.
 * @attr {string} value - The value.
 * @attr {string} placeholder - Placeholder text.
 * @attr {string} autocomplete - The native autocomplete hint.
 * @attr {string} hint - One line of help under the field.
 * @attr {string} info - Longer help, opened from an (i) button by the label.
 * @attr {string} error - An error under the field, which marks it invalid.
 * @attr {boolean} required - Requires a value.
 * @attr {boolean} disabled - Disables the field.
 */
export class GwInput extends LightElement {
  static override properties = {
    label: {},
    name: {},
    type: {},
    value: {},
    placeholder: {},
    autocomplete: {},
    hint: {},
    info: {},
    error: {},
    required: { type: "boolean" },
    disabled: { type: "boolean" },
  } as const;

  declare label: string;
  declare name: string;
  declare type: string;
  declare value: string;
  declare placeholder: string;
  declare autocomplete: string;
  declare hint: string;
  /** Longer help, opened from an (i) button by the label. */
  declare info: string;
  declare error: string;
  declare required: boolean;
  declare disabled: boolean;

  readonly #id = fieldId();

  readonly #label = h("label", { for: this.#id });

  readonly #info = new FieldInfo(this.#label);

  readonly #input = h("input", { id: this.#id });

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  readonly #error = h("p", { class: "gw-error", id: `${this.#id}-error` });

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.type = "text";
    this.value = "";
    this.placeholder = "";
    this.autocomplete = "";
    this.hint = "";
    this.info = "";
    this.error = "";
    this.required = false;
    this.disabled = false;
  }

  protected override create(root: HTMLElement) {
    this.#input.addEventListener("input", () => {
      this.value = this.#input.value;
    });
    root.append(this.#info.heading, this.#input, this.#hint, this.#error);
  }

  protected override update() {
    const input = this.#input;

    const described = [
      this.hint ? this.#hint.id : "",
      this.error ? this.#error.id : "",
    ]
      .join(" ")
      .trim();

    this.#label.textContent = this.label;
    this.#info.update(this.label, this.info);
    input.type = this.type;
    setAttribute(input, "name", this.name || null);
    setAttribute(input, "placeholder", this.placeholder || null);
    setAttribute(input, "autocomplete", this.autocomplete || null);
    setAttribute(input, "aria-invalid", this.error ? "true" : null);
    setAttribute(input, "aria-describedby", described || null);
    input.required = this.required;
    input.disabled = this.disabled;

    if (input.value !== this.value) input.value = this.value;

    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;
    this.#error.textContent = this.error;
    this.#error.hidden = !this.error;
  }
}

GwInput.define("gw-input");

declare global {
  interface HTMLElementTagNameMap {
    "gw-input": GwInput;
  }
}
