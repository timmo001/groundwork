import { LitElement, css, html } from "lit";
import { base } from "./styles.js";

export interface Segment {
  readonly value: string;
  readonly label: string;
}

/**
 * Picks one of a few options, as a row of native radio buttons, so arrow
 * keys move between them and a form submits the choice. Fires `change`.
 */
export class GwSegmented extends LitElement {
  static override properties = {
    label: {},
    name: {},
    value: { reflect: true },
    options: { type: Array },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
      }

      fieldset {
        display: inline-flex;
        padding: 0;
        margin: 0;
        overflow: hidden;
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-control);
      }

      legend {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }

      label {
        position: relative;
        padding: var(--gw-space-2) var(--gw-space-4);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        cursor: pointer;
        background: var(--gw-color-surface-raised);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
      }

      label + label {
        border-inline-start: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      label:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0;
      }

      label:has(input:checked) {
        color: var(--gw-color-on-accent);
        background: var(--gw-color-fill-accent-resting);
      }

      label:has(input:focus-visible) {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: calc(var(--gw-focus-width) * -1);
      }
    `,
  ];

  declare label: string;
  declare name: string;
  declare value: string;
  declare options: readonly Segment[];

  constructor() {
    super();
    this.label = "";
    this.name = `gw-segmented-${Math.random().toString(36).slice(2)}`;
    this.value = "";
    this.options = [];
  }

  #pick(value: string) {
    this.value = value;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  override render() {
    return html`<fieldset>
      <legend>${this.label}</legend>
      ${this.options.map(
        (option) =>
          html`<label>
            <input
              type="radio"
              name=${this.name}
              value=${option.value}
              .checked=${option.value === this.value}
              @change=${() => this.#pick(option.value)}
            />
            ${option.label}
          </label>`,
      )}
    </fieldset>`;
  }
}

customElements.define("gw-segmented", GwSegmented);

declare global {
  interface HTMLElementTagNameMap {
    "gw-segmented": GwSegmented;
  }
}
