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
 * @attr {number} value - The value. Defaults to 0. Leave it unset or `NaN` for an unknown value, shown as `-` with an empty bar.
 * @attr {number} min - The bottom of the range. Defaults to 0.
 * @attr {number} max - The top of the range. Defaults to 100.
 * @attr {number} high - Past this it turns warning.
 * @attr {number} critical - Past this it turns danger.
 * @attr {boolean} inverted - Lower is worse, such as for a battery: at or below `high` it turns warning, and at or below `critical` danger.
 * @attr {string} display - The value as shown, such as `42 GB`. Defaults to a percentage.
 * @attr {string} caption - A quiet line under the bar.
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - A fixed color, overriding `high` and `critical`.
 * @attr {boolean} loading - Pulses the track and shows a skeleton for the value.
 *
 * @csspart top - The row with the label and value.
 * @csspart value - The value as shown.
 * @csspart track - The bar's track.
 * @csspart fill - The filled part of the bar.
 * @csspart caption - The line under the bar.
 *
 * @cssprop --gw-meter-height - The bar's height. Defaults to `0.5rem`.
 */
export class GwMeter extends GwElement {
  static override properties = {
    label: {},
    value: { type: "number" },
    min: { type: "number" },
    max: { type: "number" },
    high: { type: "number" },
    critical: { type: "number" },
    inverted: { type: "boolean" },
    display: {},
    caption: {},
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
        height: var(--gw-meter-height, 0.5rem);
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
        height: var(--gw-meter-height, 0.5rem);
        --gw-skeleton-radius: var(--gw-radius-pill);
      }

      .caption {
        display: block;
        margin-block-start: var(--gw-space-1);
        overflow: hidden;
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .caption[hidden] {
        display: none;
      }
    `,
  ];

  declare label: string;
  declare value: number | undefined;
  declare min: number;
  declare max: number;
  declare high: number | undefined;
  declare critical: number | undefined;
  declare inverted: boolean;
  declare display: string;
  declare caption: string;
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

  readonly #caption = h("span", { class: "caption", part: "caption" });

  #rendered = false;

  constructor() {
    super();
    this.label = "";
    this.value = 0;
    this.min = 0;
    this.max = 100;
    this.high = undefined;
    this.critical = undefined;
    this.inverted = false;
    this.display = "";
    this.caption = "";
    this.tone = undefined;
    this.loading = false;
  }

  get #known() {
    return this.value !== undefined && Number.isFinite(this.value)
      ? this.value
      : undefined;
  }

  #worse(limit: number | undefined) {
    const value = this.#known;

    if (limit === undefined || value === undefined) return false;

    return this.inverted ? value <= limit : value >= limit;
  }

  get #color() {
    if (this.tone !== undefined) return "var(--gw-tone)";

    if (this.#worse(this.critical)) return "var(--gw-color-danger)";

    if (this.#worse(this.high)) return "var(--gw-color-warning)";

    return "var(--gw-color-fill-accent-resting)";
  }

  protected override create(root: ShadowRoot) {
    this.#top.append(
      h("span", {}, this.#label, this.#labelSkeleton),
      this.#value,
      this.#valueSkeleton,
    );
    root.append(this.#top, this.#track, this.#bar, this.#caption);
  }

  protected override update(changed: ReadonlySet<string>) {
    const value = this.#known;

    const span = this.max - this.min || 1;

    const percent =
      value === undefined
        ? 0
        : Math.min(100, Math.max(0, ((value - this.min) / span) * 100));

    const text =
      this.display || (value === undefined ? "-" : `${Math.round(percent)}%`);

    setAttribute(this.#top, "aria-busy", this.loading ? "true" : null);
    this.#label.textContent = this.label;
    this.#labelSkeleton.hidden = !this.loading || this.label !== "";
    this.#value.textContent = text;
    this.#value.hidden = this.loading;
    this.#valueSkeleton.hidden = !this.loading;
    this.#track.hidden = this.loading;
    this.#bar.hidden = !this.loading;
    this.#caption.textContent = this.caption;
    this.#caption.hidden = this.loading || this.caption === "";
    setAttribute(this.#track, "aria-label", this.label || null);
    setAttribute(this.#track, "aria-valuemin", this.min);
    setAttribute(this.#track, "aria-valuemax", this.max);
    // A meter needs a value; when it's unknown, the text says so
    setAttribute(this.#track, "aria-valuenow", value ?? this.min);
    setAttribute(
      this.#track,
      "aria-valuetext",
      value !== undefined || this.display !== "" ? text : "Unknown",
    );
    this.#fill.style.width = `${percent}%`;
    this.#fill.style.setProperty("--gw-meter-color", this.#color);

    if (this.#rendered && changed.has("loading") && !this.loading) {
      fadeIn(this.#value);
      fadeIn(this.#caption);
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
