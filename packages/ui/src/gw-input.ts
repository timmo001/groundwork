import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
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
    required: { type: Boolean },
    disabled: { type: Boolean },
  };

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

  readonly #onInput = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      this.value = event.target.value;
    }
  };

  override render() {
    const hintId = `${this.#id}-hint`;
    const errorId = `${this.#id}-error`;

    const described = [this.hint ? hintId : "", this.error ? errorId : ""]
      .join(" ")
      .trim();

    return html`
      <label for=${this.#id}>${this.label}</label>
      <input
        id=${this.#id}
        type=${this.type}
        name=${this.name || nothing}
        placeholder=${this.placeholder || nothing}
        autocomplete=${this.autocomplete || nothing}
        aria-invalid=${this.error ? "true" : nothing}
        aria-describedby=${described || nothing}
        ?required=${this.required}
        ?disabled=${this.disabled}
        .value=${live(this.value)}
        @input=${this.#onInput}
      />
      ${this.hint ? html`<p class="gw-hint" id=${hintId}>${this.hint}</p>` : nothing}
      ${this.error ? html`<p class="gw-error" id=${errorId}>${this.error}</p>` : nothing}
    `;
  }
}

customElements.define("gw-input", GwInput);

declare global {
  interface HTMLElementTagNameMap {
    "gw-input": GwInput;
  }
}
