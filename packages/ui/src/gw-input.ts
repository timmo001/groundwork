/**
 * `gw-input`: a labeled native input in light DOM.
 * Docs: https://groundwork.timmo.dev/components/inputs/#input
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { createIcon, setIconPath } from "./styles.js";
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
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The field's size, 40px tall at medium. Defaults to `medium`.
 * @attr {string} icon - SVG path data for an icon inside the field, before the text, such as a magnifier on a search.
 * @attr {boolean} hide-label - Keeps the label as the field's accessible name but doesn't show it, for a field in a toolbar whose icon and placeholder say what it's for.
 *
 * @cssprop --gw-field-scale - Scales the field, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height with the theme's density. The theme sets it.
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
    size: { reflect: true },
    icon: {},
    hideLabel: { type: "boolean", attribute: "hide-label", reflect: true },
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
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  /** SVG path data for an icon inside the field, before the text. */
  declare icon: string;
  /** Keeps the label as the accessible name without showing it. */
  declare hideLabel: boolean;

  readonly #id = fieldId();

  readonly #icon = createIcon("");

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
    this.size = "medium";
    this.icon = "";
    this.hideLabel = false;
  }

  protected override create(root: HTMLElement) {
    this.#input.addEventListener("input", () => {
      this.value = this.#input.value;
    });
    root.append(
      this.#info.heading,
      h("span", { class: "gw-input-control" }, this.#icon, this.#input),
      this.#hint,
      this.#error,
    );
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
    this.#info.heading.classList.toggle("gw-visually-hidden", this.hideLabel);
    setIconPath(this.#icon, this.icon);
    this.#icon.toggleAttribute("hidden", !this.icon);
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
