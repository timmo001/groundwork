import { LitElement, css, html, nothing } from "lit";
import { base, icon } from "./styles.js";

/**
 * What a list or page shows when there's nothing in it, or nothing to do:
 * an icon, a heading, a line of text and an optional action.
 */
export class GwEmptyState extends LitElement {
  static override properties = {
    icon: {},
    heading: {},
  };

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-2);
        align-items: center;
        justify-content: center;
        padding: var(--gw-space-8) var(--gw-space-4);
        color: var(--gw-color-text-secondary);
        text-align: center;
        --gw-icon-size: 2.5rem;
      }

      h2 {
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      ::slotted([slot="actions"]) {
        margin-block-start: var(--gw-space-3);
      }
    `,
  ];

  declare icon: string;
  declare heading: string;

  constructor() {
    super();
    this.icon = "";
    this.heading = "";
  }

  override render() {
    return html`
      ${this.icon ? icon(this.icon) : nothing}
      ${this.heading ? html`<h2>${this.heading}</h2>` : nothing}
      <slot></slot>
      <slot name="actions"></slot>
    `;
  }
}

customElements.define("gw-empty-state", GwEmptyState);

declare global {
  interface HTMLElementTagNameMap {
    "gw-empty-state": GwEmptyState;
  }
}
