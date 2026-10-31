import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { LightElement, fieldId } from "./fields.js";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * A labelled native `<select>`. Pass `options`, or write `<option>` children,
 * which it reads once when it first connects.
 */
export class GwSelect extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    hint: {},
    disabled: { type: Boolean },
    options: { type: Array },
  };

  declare label: string;
  declare name: string;
  declare value: string;
  declare hint: string;
  declare disabled: boolean;
  declare options: readonly SelectOption[];

  readonly #id = fieldId();

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "";
    this.hint = "";
    this.disabled = false;
    this.options = [];
  }

  override connectedCallback() {
    if (this.options.length === 0 && !this.hasUpdated) {
      const children = [...this.querySelectorAll("option")];

      this.options = children.map((option) => ({
        value: option.value,
        label: option.textContent.trim(),
      }));

      const picked = children.find((option) => option.selected);

      if (this.value === "" && picked !== undefined) this.value = picked.value;

      for (const option of children) option.remove();
    }

    super.connectedCallback();
  }

  readonly #onChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      this.value = event.target.value;
    }
  };

  override render() {
    const hintId = `${this.#id}-hint`;

    return html`
      <label for=${this.#id}>${this.label}</label>
      <select
        id=${this.#id}
        name=${this.name || nothing}
        aria-describedby=${this.hint ? hintId : nothing}
        ?disabled=${this.disabled}
        .value=${live(this.value)}
        @change=${this.#onChange}
      >
        ${this.options.map(
          (option) =>
            html`<option
              value=${option.value}
              ?selected=${option.value === this.value}
            >
              ${option.label}
            </option>`,
        )}
      </select>
      ${this.hint ? html`<p class="gw-hint" id=${hintId}>${this.hint}</p>` : nothing}
    `;
  }
}

customElements.define("gw-select", GwSelect);

declare global {
  interface HTMLElementTagNameMap {
    "gw-select": GwSelect;
  }
}
