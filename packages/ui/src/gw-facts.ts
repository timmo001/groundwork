import { LitElement, css, html } from "lit";
import "./gw-skeleton.js";
import { base } from "./styles.js";

export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** Widths for skeleton values, so the rows don't read as a solid block. */
const skeletonWidths = ["60%", "40%", "75%", "50%", "65%"];

/**
 * Label and value pairs, as a description list. While `loading`, `rows`
 * skeleton pairs stand in for them, keeping any labels already known.
 */
export class GwFacts extends LitElement {
  static override properties = {
    items: { type: Array },
    loading: { type: Boolean, reflect: true },
    rows: { type: Number },
  };

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

  constructor() {
    super();
    this.items = [];
    this.loading = false;
    this.rows = 4;
  }

  override render() {
    if (this.loading) {
      const count = Math.max(this.rows, this.items.length);

      return html`<dl aria-busy="true">
        ${Array.from(
          { length: count },
          (_, index) =>
            html`<dt>
                ${
                  this.items[index]?.label ??
                  html`<gw-skeleton-text
                    style="--gw-skeleton-width: 5rem"
                  ></gw-skeleton-text>`
                }
              </dt>
              <dd>
                <gw-skeleton-text
                  style="--gw-skeleton-width: ${skeletonWidths[index % skeletonWidths.length]}"
                ></gw-skeleton-text>
              </dd>`,
        )}
      </dl>`;
    }

    return html`<dl>
      ${this.items.map(
        (item) =>
          html`<dt>${item.label}</dt>
            <dd>${item.value}</dd>`,
      )}
    </dl>`;
  }
}

customElements.define("gw-facts", GwFacts);

declare global {
  interface HTMLElementTagNameMap {
    "gw-facts": GwFacts;
  }
}
