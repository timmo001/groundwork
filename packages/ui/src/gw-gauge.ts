import { LitElement, css, html, nothing, svg } from "lit";
import { base } from "./styles.js";

/** How much of the circle the gauge's track covers. */
const sweep = 270;

const radius = 40;

const circumference = 2 * Math.PI * radius;

const track = (circumference * sweep) / 360;

/**
 * The colour a reading shows in: the accent until it reaches `warning`, then
 * the warning and danger colours. Lower is worse when `inverted`, such as for
 * a battery.
 */
export const severityColour = (
  value: number | undefined,
  warning: number,
  danger: number,
  inverted = false,
) => {
  if (value === undefined) return "var(--gw-color-text-disabled)";

  const worse = (limit: number) => (inverted ? value <= limit : value >= limit);

  if (worse(danger)) return "var(--gw-color-danger)";

  if (worse(warning)) return "var(--gw-color-warning)";

  return "var(--gw-gauge-colour, var(--gw-color-fill-accent-resting))";
};

/**
 * A reading on a dial, after Home Assistant's gauge card. The arc fills to
 * `value` between `min` and `max`, coloured by `warning` and `danger`, and
 * glides when the value changes.
 */
export class GwGauge extends LitElement {
  static override properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    display: {},
    unit: {},
    label: {},
    caption: {},
    warning: { type: Number },
    danger: { type: Number },
    inverted: { type: Boolean },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        flex-direction: column;
        gap: var(--gw-space-1);
        /* Dials line up in a row even when only some have captions */
        align-self: flex-start;
        align-items: center;
        width: var(--gw-gauge-size, 8.5rem);
      }

      .dial {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
      }

      svg {
        width: 100%;
        height: 100%;
        /* Start the arc at the bottom left, leaving the gap at the bottom */
        rotate: ${90 + (360 - sweep) / 2}deg;
      }

      circle {
        fill: none;
        stroke-width: 9;
        stroke-linecap: round;
      }

      .track {
        stroke: var(--gw-color-surface-lower);
      }

      .fill {
        transition:
          stroke-dashoffset var(--gw-motion-slow) var(--gw-motion-easing),
          stroke var(--gw-motion-normal) var(--gw-motion-easing);
      }

      .reading {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-block-start: 6%;
      }

      .value {
        font-size: calc(var(--gw-gauge-size, 8.5rem) * 0.2);
        font-weight: var(--gw-font-weight-strong);
        font-variant-numeric: var(--gw-font-figures);
        line-height: 1;
        color: var(--gw-color-text-strong);
      }

      .unit,
      .caption {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      .label {
        margin-block-start: calc(var(--gw-gauge-size, 8.5rem) * -0.12);
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        text-align: center;
      }

      .caption {
        text-align: center;
      }
    `,
  ];

  declare value: number | undefined;
  declare min: number;
  declare max: number;
  /** The text in the middle. Defaults to the rounded value. */
  declare display: string;
  declare unit: string;
  declare label: string;
  declare caption: string;
  declare warning: number;
  declare danger: number;
  /** Lower readings are worse, such as for a battery. */
  declare inverted: boolean;

  constructor() {
    super();
    this.value = undefined;
    this.min = 0;
    this.max = 100;
    this.display = "";
    this.unit = "%";
    this.label = "";
    this.caption = "";
    this.warning = 75;
    this.danger = 90;
    this.inverted = false;
  }

  override render() {
    const value =
      this.value !== undefined && Number.isFinite(this.value)
        ? this.value
        : undefined;

    const span = this.max - this.min || 1;

    const fraction =
      value === undefined
        ? 0
        : Math.min(1, Math.max(0, (value - this.min) / span));

    const shown =
      this.display || (value === undefined ? "-" : String(Math.round(value)));

    const text =
      value === undefined
        ? "Unknown"
        : [`${shown}${this.unit}`, this.caption]
            .filter((part) => part !== "")
            .join(", ");

    return html`
      <div
        class="dial"
        role="meter"
        aria-label=${this.label || nothing}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${value ?? nothing}
        aria-valuetext=${text}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          ${svg`
            <circle class="track" cx="50" cy="50" r=${radius}
              stroke-dasharray="${track} ${circumference}"></circle>
            <circle class="fill" cx="50" cy="50" r=${radius}
              stroke=${severityColour(value, this.warning, this.danger, this.inverted)}
              stroke-dasharray="${track} ${circumference}"
              stroke-dashoffset=${track * (1 - fraction)}
              opacity=${fraction === 0 ? 0 : 1}></circle>
          `}
        </svg>
        <div class="reading">
          <span class="value">${shown}</span>
          ${this.unit === "" ? nothing : html`<span class="unit">${this.unit}</span>`}
        </div>
      </div>
      ${this.label === "" ? nothing : html`<span class="label">${this.label}</span>`}
      ${this.caption === "" ? nothing : html`<span class="caption">${this.caption}</span>`}
    `;
  }
}

customElements.define("gw-gauge", GwGauge);

declare global {
  interface HTMLElementTagNameMap {
    "gw-gauge": GwGauge;
  }
}
