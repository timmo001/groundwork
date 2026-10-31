import { LitElement, css, html, nothing } from "lit";
import { base, type Tone } from "./styles.js";

/**
 * A small status dot. Give it a `label`, such as "Online", unless text
 * beside it already says the same.
 */
export class GwDot extends LitElement {
  static override properties = {
    tone: { reflect: true },
    label: {},
    pulse: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
        flex: none;
        width: 0.5rem;
        height: 0.5rem;
        background: var(--gw-tone, var(--gw-color-text-secondary));
        border-radius: 50%;
      }

      :host([pulse]) {
        animation: pulse 1.6s ease-in-out infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.4;
        }
      }

      span {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
    `,
  ];

  declare tone: Tone;
  declare label: string;
  declare pulse: boolean;

  constructor() {
    super();
    this.tone = "neutral";
    this.label = "";
    this.pulse = false;
  }

  override render() {
    return this.label ? html`<span>${this.label}</span>` : nothing;
  }
}

customElements.define("gw-dot", GwDot);

declare global {
  interface HTMLElementTagNameMap {
    "gw-dot": GwDot;
  }
}
