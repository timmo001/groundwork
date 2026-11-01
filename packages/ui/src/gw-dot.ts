/**
 * `gw-dot`: a small status dot.
 * Docs: https://groundwork.timmo.dev/components/display/#chip-and-dot
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, type Tone } from "./styles.js";

/**
 * A small status dot. Give it a `label`, such as "Online", unless text
 * beside it already says the same.
 *
 * @element gw-dot
 * @summary A small status dot.
 *
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The color. Defaults to `neutral`.
 * @attr {string} label - What it means, for assistive technology.
 * @attr {boolean} pulse - Pulses, for something live.
 */
export class GwDot extends GwElement {
  static override properties = {
    tone: { reflect: true },
    label: {},
    pulse: { type: "boolean", reflect: true },
  } as const;

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

  readonly #label = h("span");

  constructor() {
    super();
    this.tone = "neutral";
    this.label = "";
    this.pulse = false;
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#label);
  }

  protected override update() {
    this.#label.textContent = this.label;
    this.#label.hidden = !this.label;
  }
}

GwDot.define("gw-dot");

declare global {
  interface HTMLElementTagNameMap {
    "gw-dot": GwDot;
  }
}
