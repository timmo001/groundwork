/**
 * `gw-meter`: a labeled bar for a value in a range.
 * Docs: https://groundwork.timmo.dev/components/display/#meter
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import { base, type Tone } from "./styles.js";

/**
 * A labeled bar for a value in a range, such as disk use. Past `high` it
 * turns warning, and past `critical` danger, unless a `tone` is set. While
 * `loading`, the track pulses and a skeleton stands in for the value.
 *
 * @element gw-meter
 * @summary A labeled bar for a value in a range.
 *
 * @attr {string} label - What it measures.
 * @attr {number} value - The value. Defaults to 0.
 * @attr {number} min - The bottom of the range. Defaults to 0.
 * @attr {number} max - The top of the range. Defaults to 100.
 * @attr {number} high - Past this it turns warning.
 * @attr {number} critical - Past this it turns danger.
 * @attr {string} display - The value as shown, such as `42 GB`. Defaults to a percentage.
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - A fixed color, overriding `high` and `critical`.
 * @attr {boolean} loading - Pulses the track and shows a skeleton for the value.
 *
 * @csspart top - The row with the label and value.
 * @csspart value - The value as shown.
 * @csspart track - The bar's track.
 * @csspart fill - The filled part of the bar.
 */
export class GwMeter extends GwElement {
  static override properties = {
    label: {},
    value: { type: "number" },
    min: { type: "number" },
    max: { type: "number" },
    high: { type: "number" },
    critical: { type: "number" },
    display: {},
    tone: { reflect: true },
    loading: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .top {
        display: flex;
        gap: var(--gw-space-2);
        justify-content: space-between;
        margin-block-end: var(--gw-space-1);
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
        background: var(--gw-meter-color, var(--gw-color-fill-accent-resting));
        border-radius: inherit;
        transition: width var(--gw-motion-slow) var(--gw-motion-easing);
      }

      .bar {
        min-height: 0;
        height: 0.5rem;
        --gw-skeleton-radius: var(--gw-radius-pill);
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
  declare loading: boolean;

  readonly #top = h("div", { class: "top", part: "top" });

  readonly #label = h("span");

  readonly #labelSkeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 6rem",
  });

  readonly #value = h("span", {
    class: "value",
    part: "value",
    "aria-hidden": "true",
  });

  readonly #valueSkeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 2.5rem",
  });

  readonly #fill = h("div", { class: "fill", part: "fill" });

  readonly #track = h(
    "div",
    { class: "track", part: "track", role: "meter" },
    this.#fill,
  );

  readonly #bar = h("gw-skeleton", { class: "bar" });

  #rendered = false;

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
    this.loading = false;
  }

  get #color() {
    if (this.tone !== undefined) return "var(--gw-tone)";

    if (this.critical !== undefined && this.value >= this.critical) {
      return "var(--gw-color-danger)";
    }

    if (this.high !== undefined && this.value >= this.high) {
      return "var(--gw-color-warning)";
    }

    return "var(--gw-color-fill-accent-resting)";
  }

  protected override create(root: ShadowRoot) {
    this.#top.append(
      h("span", {}, this.#label, this.#labelSkeleton),
      this.#value,
      this.#valueSkeleton,
    );
    root.append(this.#top, this.#track, this.#bar);
  }

  protected override update(changed: ReadonlySet<string>) {
    const span = this.max - this.min || 1;

    const percent = Math.min(
      100,
      Math.max(0, ((this.value - this.min) / span) * 100),
    );

    const text = this.display || `${Math.round(percent)}%`;

    setAttribute(this.#top, "aria-busy", this.loading ? "true" : null);
    this.#label.textContent = this.label;
    this.#labelSkeleton.hidden = !this.loading || this.label !== "";
    this.#value.textContent = text;
    this.#value.hidden = this.loading;
    this.#valueSkeleton.hidden = !this.loading;
    this.#track.hidden = this.loading;
    this.#bar.hidden = !this.loading;
    setAttribute(this.#track, "aria-label", this.label || null);
    setAttribute(this.#track, "aria-valuemin", this.min);
    setAttribute(this.#track, "aria-valuemax", this.max);
    setAttribute(this.#track, "aria-valuenow", this.value);
    setAttribute(this.#track, "aria-valuetext", text);
    this.#fill.style.width = `${percent}%`;
    this.#fill.style.setProperty("--gw-meter-color", this.#color);

    if (this.#rendered && changed.has("loading") && !this.loading) {
      fadeIn(this.#value);
    }

    this.#rendered = true;
  }
}

GwMeter.define("gw-meter");

declare global {
  interface HTMLElementTagNameMap {
    "gw-meter": GwMeter;
  }
}
