import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { LightElement, fieldId } from "./fields.js";

/** A labelled native checkbox. `gw-switch` draws the same control as a switch. */
export class GwCheckbox extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    hint: {},
    checked: { type: Boolean },
    disabled: { type: Boolean },
  };

  declare label: string;
  declare name: string;
  declare value: string;
  declare hint: string;
  declare checked: boolean;
  declare disabled: boolean;

  readonly #id = fieldId();

  /** `switch` for `gw-switch`, so assistive technology announces it as one. */
  protected get controlRole(): string | undefined {
    return undefined;
  }

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "on";
    this.hint = "";
    this.checked = false;
    this.disabled = false;
  }

  readonly #onChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      this.checked = event.target.checked;
    }
  };

  override render() {
    const hintId = `${this.#id}-hint`;

    return html`
      <label>
        <input
          type="checkbox"
          role=${this.controlRole ?? nothing}
          name=${this.name || nothing}
          value=${this.value}
          aria-describedby=${this.hint ? hintId : nothing}
          ?disabled=${this.disabled}
          .checked=${live(this.checked)}
          @change=${this.#onChange}
        />
        ${this.label}
      </label>
      ${this.hint ? html`<p class="gw-hint" id=${hintId}>${this.hint}</p>` : nothing}
    `;
  }
}

/** A checkbox drawn as a switch, announced as a switch. */
export class GwSwitch extends GwCheckbox {
  protected override get controlRole() {
    return "switch";
  }
}

customElements.define("gw-checkbox", GwCheckbox);

customElements.define("gw-switch", GwSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "gw-checkbox": GwCheckbox;
    "gw-switch": GwSwitch;
  }
}
