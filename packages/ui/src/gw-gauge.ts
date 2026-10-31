import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import { base } from "./styles.js";

/** How much of the circle the gauge's track covers. */
const sweep = 270;

const radius = 40;

const circumference = 2 * Math.PI * radius;

const track = (circumference * sweep) / 360;

/**
 * The color a reading shows in: the accent until it reaches `warning`, then
 * the warning and danger colors. Lower is worse when `inverted`, such as for
 * a battery.
 */
export const severityColor = (
  value: number | undefined,
  warning: number,
  danger: number,
  inverted = false,
) => {
  if (value === undefined) return "var(--gw-color-text-disabled)";

  const worse = (limit: number) => (inverted ? value <= limit : value >= limit);

  if (worse(danger)) return "var(--gw-color-danger)";

  if (worse(warning)) return "var(--gw-color-warning)";

  return "var(--gw-gauge-color, var(--gw-color-fill-accent-resting))";
};

const circle = (className: string) => {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );

  element.setAttribute("class", className);
  element.setAttribute("cx", "50");
  element.setAttribute("cy", "50");
  element.setAttribute("r", String(radius));
  element.setAttribute("stroke-dasharray", `${track} ${circumference}`);

  return element;
};

/**
 * A reading on a dial. The arc fills to `value` between `min` and `max`,
 * colored by `warning` and `danger`, and glides when the value changes.
 * While `loading`, the track pulses and a skeleton stands in for the
 * reading.
 */
export class GwGauge extends GwElement {
  static override properties = {
    value: { type: "number" },
    min: { type: "number" },
    max: { type: "number" },
    display: {},
    unit: {},
    label: {},
    caption: {},
    warning: { type: "number" },
    danger: { type: "number" },
    inverted: { type: "boolean" },
    loading: { type: "boolean", reflect: true },
  } as const;

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

      :host([loading]) .track {
        stroke: var(--gw-color-fill-neutral-resting);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.45;
        }
      }

      .reading gw-skeleton-text {
        font-size: calc(var(--gw-gauge-size, 8.5rem) * 0.2);
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

      .shown:not([hidden]) {
        display: contents;
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
  declare loading: boolean;

  readonly #fill = circle("fill");

  readonly #dial = h("div", { class: "dial", role: "meter" });

  readonly #value = h("span", { class: "value" });

  readonly #unit = h("span", { class: "unit" });

  readonly #shown = h("span", { class: "shown" }, this.#value, this.#unit);

  readonly #readingSkeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 2em",
  });

  readonly #label = h("span", { class: "label" });

  readonly #caption = h("span", { class: "caption" });

  readonly #captionSkeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 5rem",
  });

  #rendered = false;

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
    this.loading = false;
  }

  protected override create(root: ShadowRoot) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.append(circle("track"), this.#fill);
    this.#dial.append(
      svg,
      h("div", { class: "reading" }, this.#readingSkeleton, this.#shown),
    );
    root.append(this.#dial, this.#label, this.#captionSkeleton, this.#caption);
  }

  protected override update(changed: ReadonlySet<string>) {
    const value =
      this.value !== undefined && Number.isFinite(this.value) && !this.loading
        ? this.value
        : undefined;

    const span = this.max - this.min || 1;

    const fraction =
      value === undefined
        ? 0
        : Math.min(1, Math.max(0, (value - this.min) / span));

    const shown =
      this.display || (value === undefined ? "-" : String(Math.round(value)));

    const text = this.loading
      ? "Loading"
      : value === undefined
        ? "Unknown"
        : [`${shown}${this.unit}`, this.caption]
            .filter((part) => part !== "")
            .join(", ");

    setAttribute(this.#dial, "aria-busy", this.loading ? "true" : null);
    setAttribute(this.#dial, "aria-label", this.label || null);
    setAttribute(this.#dial, "aria-valuemin", this.min);
    setAttribute(this.#dial, "aria-valuemax", this.max);
    setAttribute(this.#dial, "aria-valuenow", value);
    setAttribute(this.#dial, "aria-valuetext", text);
    this.#fill.setAttribute(
      "stroke",
      severityColor(value, this.warning, this.danger, this.inverted),
    );
    this.#fill.setAttribute(
      "stroke-dashoffset",
      String(track * (1 - fraction)),
    );
    this.#fill.setAttribute("opacity", fraction === 0 ? "0" : "1");
    this.#readingSkeleton.hidden = !this.loading;
    this.#shown.hidden = this.loading;
    this.#value.textContent = shown;
    this.#unit.textContent = this.unit;
    this.#unit.hidden = this.unit === "";
    this.#label.textContent = this.label;
    this.#label.hidden = this.label === "";
    this.#captionSkeleton.hidden = !this.loading || this.caption === "";
    this.#caption.textContent = this.caption;
    this.#caption.hidden = this.loading || this.caption === "";

    if (this.#rendered && changed.has("loading") && !this.loading) {
      fadeIn(this.#value);
      fadeIn(this.#unit);
      fadeIn(this.#caption);
    }

    this.#rendered = true;
  }
}

GwGauge.define("gw-gauge");

declare global {
  interface HTMLElementTagNameMap {
    "gw-gauge": GwGauge;
  }
}
