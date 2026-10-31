import { LitElement, css, html } from "lit";
import { base } from "./styles.js";

/** A spinning ring while something loads, announced by its `label`. */
export class GwSpinner extends LitElement {
  static override properties = {
    label: {},
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        width: var(--gw-spinner-size, 1.25rem);
        height: var(--gw-spinner-size, 1.25rem);
        color: var(--gw-color-accent);
      }

      .ring {
        width: 100%;
        height: 100%;
        border: 2px solid var(--gw-color-border-quiet);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
    `,
  ];

  declare label: string;

  constructor() {
    super();
    this.label = "Loading";
  }

  override render() {
    return html`<span class="ring" role="status"
      ><span class="label">${this.label}</span></span
    >`;
  }
}

customElements.define("gw-spinner", GwSpinner);

declare global {
  interface HTMLElementTagNameMap {
    "gw-spinner": GwSpinner;
  }
}
