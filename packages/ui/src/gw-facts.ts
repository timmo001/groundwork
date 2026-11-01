/**
 * `gw-facts`: label and value pairs, as a description list.
 * Docs: https://groundwork.timmo.dev/components/display/#facts
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import "./gw-skeleton.js";
import { animateHeight, fadeIn } from "./motion.js";
import { base } from "./styles.js";

export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** Widths for skeleton values, so the rows don't read as a solid block. */
const skeletonWidths = ["60%", "40%", "75%", "50%", "65%"];

/**
 * Label and value pairs, as a description list. While `loading`, `rows`
 * skeleton pairs stand in for them, keeping any labels already known. The
 * list glides to its new height and the values fade in once they've loaded.
 *
 * @element gw-facts
 * @summary Label and value pairs, as a description list.
 *
 * @attr {Fact[]} items - The pairs, as JSON.
 * @attr {boolean} loading - Shows skeleton pairs, keeping any labels already known.
 * @attr {number} rows - How many skeleton pairs while loading. Defaults to 4.
 */
export class GwFacts extends GwElement {
  static override properties = {
    items: { type: "json" },
    loading: { type: "boolean", reflect: true },
    rows: { type: "number" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      dl {
        display: grid;
        grid-template-columns: minmax(7rem, max-content) 1fr;
        gap: var(--gw-space-1) var(--gw-space-3);
        margin: 0;
        font-size: var(--gw-font-size-s);
      }

      dt {
        color: var(--gw-color-text-secondary);
      }

      dd {
        min-width: 0;
        margin: 0;
        font-variant-numeric: var(--gw-font-figures);
        color: var(--gw-color-text-strong);
        overflow-wrap: anywhere;
      }
    `,
  ];

  declare items: readonly Fact[];
  declare loading: boolean;
  declare rows: number;

  readonly #list = h("dl");

  #rendered = false;

  constructor() {
    super();
    this.items = [];
    this.loading = false;
    this.rows = 4;
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#list);
  }

  protected override update(changed: ReadonlySet<string>) {
    const items = Array.isArray(this.items) ? this.items : [];
    const before = this.#rendered ? this.offsetHeight : 0;
    const loaded = this.#rendered && changed.has("loading") && !this.loading;

    if (this.loading) {
      const count = Math.max(this.rows, items.length);

      this.#list.setAttribute("aria-busy", "true");
      this.#list.replaceChildren(
        ...Array.from({ length: count }, (_, index) => [
          h(
            "dt",
            {},
            items[index]?.label ??
              h("gw-skeleton-text", { style: "--gw-skeleton-width: 5rem" }),
          ),
          h(
            "dd",
            {},
            h("gw-skeleton-text", {
              style: `--gw-skeleton-width: ${skeletonWidths[index % skeletonWidths.length]}`,
            }),
          ),
        ]).flat(),
      );
    } else {
      this.#list.removeAttribute("aria-busy");
      this.#list.replaceChildren(
        ...items.flatMap((item) => [
          h("dt", {}, item.label),
          h("dd", {}, loaded ? h("span", {}, item.value) : item.value),
        ]),
      );
    }

    if (before > 0) animateHeight(this, before);

    if (loaded) {
      for (const value of this.#list.querySelectorAll("dd > span")) {
        if (value instanceof HTMLElement) fadeIn(value);
      }
    }

    this.#rendered = true;
  }
}

GwFacts.define("gw-facts");

declare global {
  interface HTMLElementTagNameMap {
    "gw-facts": GwFacts;
  }
}
