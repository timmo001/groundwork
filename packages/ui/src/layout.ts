import { LitElement, css, html } from "lit";
import { base } from "./styles.js";

/**
 * Layout: `gw-page` centers a page's content at
 * the theme's width, `gw-stack` stacks its children, `gw-row` lines them up
 * and `gw-grid` fills columns at least `--gw-grid-min` wide.
 */
export class GwPage extends LitElement {
  static override properties = {
    narrow: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .page {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-6);
        width: 100%;
        max-width: var(--gw-content-width);
        margin-inline: auto;
      }

      :host([narrow]) .page {
        max-width: var(--gw-content-width-narrow);
      }
    `,
  ];

  declare narrow: boolean;

  constructor() {
    super();
    this.narrow = false;
  }

  override render() {
    return html`<div class="page" part="page"><slot></slot></div>`;
  }
}

const gaps = css`
  :host([gap="s"]) {
    --gw-gap: var(--gw-space-1);
  }

  :host([gap="l"]) {
    --gw-gap: var(--gw-space-6);
  }
`;

export class GwStack extends LitElement {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-gap, var(--gw-space-3));
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}

export class GwRow extends LitElement {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-gap, var(--gw-space-2));
        align-items: center;
      }

      :host([nowrap]) {
        flex-wrap: nowrap;
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}

export class GwGrid extends LitElement {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(min(100%, var(--gw-grid-min, 18rem)), 1fr)
        );
        gap: var(--gw-gap, var(--gw-space-3));
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define("gw-page", GwPage);

customElements.define("gw-stack", GwStack);

customElements.define("gw-row", GwRow);

customElements.define("gw-grid", GwGrid);

declare global {
  interface HTMLElementTagNameMap {
    "gw-page": GwPage;
    "gw-stack": GwStack;
    "gw-row": GwRow;
    "gw-grid": GwGrid;
  }
}
