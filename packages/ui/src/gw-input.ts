import { h, setAttribute } from "./element.js";
import { LightElement, fieldId } from "./fields.js";

/** A labeled native `<input>`, with an optional hint and error. */
export class GwInput extends LightElement {
  static override properties = {
    label: {},
    name: {},
    type: {},
    value: {},
    placeholder: {},
    autocomplete: {},
    hint: {},
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
  declare error: string;
  declare required: boolean;
  declare disabled: boolean;

  readonly #id = fieldId();

  readonly #label = h("label", { for: this.#id });

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
    this.error = "";
    this.required = false;
    this.disabled = false;
  }

  protected override create(root: HTMLElement) {
    this.#input.addEventListener("input", () => {
      this.value = this.#input.value;
    });
    root.append(this.#label, this.#input, this.#hint, this.#error);
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
