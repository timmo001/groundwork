import { LitElement, css, html, nothing } from "lit";
import { base } from "./styles.js";

/**
 * A surface for one group of content, with an optional heading and actions.
 * With `href` the whole card is a link.
 */
export class GwCard extends LitElement {
  static override properties = {
    heading: {},
    href: {},
    flush: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .card {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-3);
        height: 100%;
        padding: var(--gw-space-4);
        color: inherit;
        text-decoration: none;
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        box-shadow: var(--gw-shadow-s);
      }

      :host([flush]) .card {
        padding: 0;
        overflow: hidden;
      }

      a.card {
        transition: border-color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      a.card:hover {
        border-color: var(--gw-color-border-accent);
      }

      header {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
      }

      h2 {
        flex: 1;
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }
    `,
  ];

  declare heading: string;
  declare href: string;
  declare flush: boolean;

  constructor() {
    super();
    this.heading = "";
    this.href = "";
    this.flush = false;
  }

  override render() {
    const content = html`
      ${
        this.heading
          ? html`<header>
              <h2>${this.heading}</h2>
              <slot name="actions"></slot>
            </header>`
          : nothing
      }
      <slot></slot>
    `;

    return this.href
      ? html`<a class="card" part="card" href=${this.href}>${content}</a>`
      : html`<section class="card" part="card">${content}</section>`;
  }
}

customElements.define("gw-card", GwCard);

declare global {
  interface HTMLElementTagNameMap {
    "gw-card": GwCard;
  }
}
