import { LitElement, css, html, nothing } from "lit";
import { base, icon } from "./styles.js";

/**
 * A page's title, with an optional icon tile and description, and its
 * controls at the top right in the `actions` slot.
 */
export class GwPageHeader extends LitElement {
  static override properties = {
    heading: {},
    description: {},
    icon: {},
  };

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        gap: var(--gw-space-3);
        align-items: flex-start;
      }

      .tile {
        display: grid;
        flex: none;
        place-items: center;
        width: 3rem;
        height: 3rem;
        color: var(--gw-color-accent);
        background: var(--gw-color-fill-accent-quiet);
        border-radius: var(--gw-radius-l);
        --gw-icon-size: 1.625rem;
      }

      .titles {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gw-space-0-5);
        min-width: 0;
      }

      h1 {
        margin: 0;
        font-size: var(--gw-font-size-2xl);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1.2;
        color: var(--gw-color-text-strong);
      }

      p {
        margin: 0;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }

      .actions {
        display: flex;
        flex: none;
        gap: var(--gw-space-1);
        align-items: center;
        margin-inline-start: auto;
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare icon: string;

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.icon = "";
  }

  override render() {
    return html`
      ${this.icon ? html`<span class="tile">${icon(this.icon)}</span>` : nothing}
      <div class="titles">
        <h1>${this.heading}</h1>
        ${this.description ? html`<p>${this.description}</p>` : nothing}
      </div>
      <div class="actions"><slot name="actions"></slot></div>
    `;
  }
}

customElements.define("gw-page-header", GwPageHeader);

declare global {
  interface HTMLElementTagNameMap {
    "gw-page-header": GwPageHeader;
  }
}
