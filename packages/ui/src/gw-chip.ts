import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import { base, type Tone } from "./styles.js";

/**
 * A short status or category, tinted by its `tone`. While `loading`, a
 * skeleton stands in for its text, and the text fades in once it's loaded.
 */
export class GwChip extends GwElement {
  static override properties = {
    tone: { reflect: true },
    loading: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
      }

      /* 32px, with 12px padding */
      .chip {
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        height: 2rem;
        padding: 0 var(--gw-space-3);
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        background: var(--gw-tone-fill, var(--gw-color-fill-neutral-resting));
        border: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-quiet));
        border-radius: var(--gw-radius-chip);
        --gw-icon-size: 1rem;
      }

      .content {
        display: inline-flex;
        gap: inherit;
        align-items: center;
      }
    `,
  ];

  declare tone: Tone;
  declare loading: boolean;

  readonly #chip = h("span", { class: "chip", part: "chip" });

  readonly #skeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 3.5rem",
  });

  readonly #content = h(
    "span",
    { class: "content" },
    h("slot", { name: "icon" }),
    h("slot"),
  );

  constructor() {
    super();
    this.tone = "neutral";
    this.loading = false;
  }

  protected override create(root: ShadowRoot) {
    this.#chip.append(this.#skeleton, this.#content);
    root.append(this.#chip);
  }

  protected override update(changed: ReadonlySet<string>) {
    const wasLoading = this.#content.hidden;

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
