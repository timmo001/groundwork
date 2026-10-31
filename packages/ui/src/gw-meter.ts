import { LitElement, css, html, nothing } from "lit";
import { base, type Tone } from "./styles.js";

/**
 * A labelled bar for a value in a range, such as disk use. Past `high` it
 * turns warning, and past `critical` danger, unless a `tone` is set.
 */
export class GwMeter extends LitElement {
  static override properties = {
    label: {},
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    high: { type: Number },
    critical: { type: Number },
    display: {},
    tone: { reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .top {
        display: flex;
        gap: var(--gw-space-3);
        justify-content: space-between;
        margin-block-end: var(--gw-space-2);
        font-size: var(--gw-font-size-s);
      }

      .value {
        font-variant-numeric: var(--gw-font-figures);
        color: var(--gw-color-text-strong);
      }

      .track {
        height: 0.5rem;
        overflow: hidden;
        background: var(--gw-color-surface-lower);
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-pill);
      }

      .fill {
        height: 100%;
        background: var(--gw-meter-colour, var(--gw-color-fill-accent-resting));
        border-radius: inherit;
        transition: width var(--gw-motion-slow) var(--gw-motion-easing);
      }
    `,
  ];

  declare label: string;
  declare value: number;
  declare min: number;
  declare max: number;
  declare high: number | undefined;
  declare critical: number | undefined;
  declare display: string;
  declare tone: Tone | undefined;

  constructor() {
    super();
    this.label = "";
    this.value = 0;
    this.min = 0;
    this.max = 100;
    this.high = undefined;
    this.critical = undefined;
    this.display = "";
    this.tone = undefined;
  }

  get #colour() {
    if (this.tone !== undefined) return "var(--gw-tone)";

    if (this.critical !== undefined && this.value >= this.critical) {
      return "var(--gw-color-danger)";
    }

    if (this.high !== undefined && this.value >= this.high) {
      return "var(--gw-color-warning)";
    }

    return "var(--gw-color-fill-accent-resting)";
  }

  override render() {
    const span = this.max - this.min || 1;

    const percent = Math.min(
      100,
      Math.max(0, ((this.value - this.min) / span) * 100),
    );

    const text = this.display || `${Math.round(percent)}%`;

    return html`
      <div class="top">
        <span>${this.label}</span>
        <span class="value" aria-hidden="true">${text}</span>
      </div>
      <div
        class="track"
        role="meter"
        aria-label=${this.label || nothing}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${this.value}
        aria-valuetext=${text}
      >
        <div
          class="fill"
          style="width: ${percent}%; --gw-meter-colour: ${this.#colour}"
        ></div>
      </div>
    `;
  }
}

customElements.define("gw-meter", GwMeter);

declare global {
  interface HTMLElementTagNameMap {
    "gw-meter": GwMeter;
  }
}
