/**
 * `gw-chip`: a short status or category, tinted by its tone.
 * Docs: https://groundwork.timmo.dev/components/display/#chip-and-dot
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import {
  base,
  controlSizes,
  createIcon,
  setIconPath,
  type Tone,
} from "./styles.js";

/**
 * A short status or category, tinted by its `tone`. While `loading`, a
 * skeleton stands in for its text, and the text fades in once it's loaded.
 *
 * @element gw-chip
 * @summary A short status or category, tinted by its tone.
 *
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The tint. Defaults to `neutral`.
 * @attr {string} icon - SVG path data for an icon before the text.
 * @attr {string} swatch - A CSS color, drawn as a small round dot in the icon's place, such as a tag's own color.
 * @attr {boolean} loading - Shows a skeleton for the text.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The size, around 32px tall at medium. Defaults to `medium`.
 *
 * @slot - The text.
 * @slot icon - An icon before the text, in place of `icon`.
 *
 * @csspart chip - The chip.
 *
 * @cssprop --gw-tone-fill - The tint, for a tone of your own. `tone` sets it.
 * @cssprop --gw-tone-border - The border. `tone` sets it.
 * @cssprop --gw-chip-scale - Scales the chip, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icon with the theme's density. The theme sets it.
 */
export class GwChip extends GwElement {
  static override properties = {
    tone: { reflect: true },
    icon: {},
    swatch: {},
    loading: { type: "boolean", reflect: true },
    size: { reflect: true },
  } as const;

  static override styles = [
    base,
    controlSizes("chip"),
    css`
      :host {
        display: inline-flex;
      }

      /* 32px at medium, with 12px padding */
      .chip {
        --gw-size: var(--gw-chip-scale, 1);
        --gw-scale: calc(var(--gw-size) * var(--gw-control-scale, 1));
        --gw-icon-size: calc(1rem * var(--gw-scale));

        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-size));
        align-items: center;
        box-sizing: border-box;
        height: calc(2rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-3) * var(--gw-size));
        font-size: max(
          var(--gw-font-size-2xs),
          calc(var(--gw-font-size-xs) * var(--gw-size))
        );
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        background: var(--gw-tone-fill, var(--gw-color-fill-neutral-resting));
        border: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-quiet));
        border-radius: var(--gw-radius-chip);
      }

      .content {
        display: inline-flex;
        gap: inherit;
        align-items: center;
      }

      /* A color dot in the icon's place */
      .swatch {
        flex: none;
        width: calc(var(--gw-icon-size) * 0.6);
        height: calc(var(--gw-icon-size) * 0.6);
        border: 1px solid
          color-mix(in oklab, var(--gw-color-text-primary) 20%, transparent);
        border-radius: 50%;
      }
    `,
  ];

  declare tone: Tone;
  /** SVG path data for an icon before the text, instead of the `icon` slot. */
  declare icon: string;
  /** A CSS color, drawn as a small round dot in the icon's place. */
  declare swatch: string;
  declare loading: boolean;
  declare size: "xs" | "small" | "medium" | "large" | "xl";

  readonly #icon = createIcon("");

  readonly #swatch = h("span", { class: "swatch", "aria-hidden": "true" });

  readonly #chip = h("span", { class: "chip", part: "chip" });

  readonly #skeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 3.5rem",
  });

  readonly #content = h(
    "span",
    { class: "content" },
    h("slot", { name: "icon" }, this.#icon, this.#swatch),
    h("slot"),
  );

  constructor() {
    super();
    this.tone = "neutral";
    this.icon = "";
    this.swatch = "";
    this.loading = false;
    this.size = "medium";
  }

  protected override create(root: ShadowRoot) {
    this.#chip.append(this.#skeleton, this.#content);
    root.append(this.#chip);
  }

  protected override update(changed: ReadonlySet<string>) {
    const wasLoading = this.#content.hidden;

    setIconPath(this.#icon, this.icon);
    this.#icon.toggleAttribute("hidden", !this.icon);
    this.#swatch.style.background = this.swatch;
    this.#swatch.hidden = this.swatch === "" || this.icon !== "";

    setAttribute(this.#chip, "aria-busy", this.loading ? "true" : null);
    this.#skeleton.hidden = !this.loading;
    this.#content.hidden = this.loading;

    if (changed.has("loading") && wasLoading && !this.loading) {
      fadeIn(this.#content);
    }
  }
}

GwChip.define("gw-chip");

declare global {
  interface HTMLElementTagNameMap {
    "gw-chip": GwChip;
  }
}
