import { LitElement, css, html } from "lit";
import { base } from "./styles.js";

export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** Label and value pairs, as a description list. */
export class GwFacts extends LitElement {
  static override properties = {
    items: { attribute: false },
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
        gap: var(--gw-space-2) var(--gw-space-4);
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

  constructor() {
    super();
    this.items = [];
  }

  override render() {
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
