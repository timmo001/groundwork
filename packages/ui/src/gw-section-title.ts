import { LitElement, css, html } from "lit";
import { base } from "./styles.js";

/** A small heading between groups on a page, as an `<h2>` unless `level` says otherwise. */
export class GwSectionTitle extends LitElement {
  static override properties = {
    level: { type: Number },
  };

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
      }

      [role="heading"] {
        flex: 1;
        margin: 0;
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ];

  declare level: number;

  constructor() {
    super();
    this.level = 2;
  }

  override render() {
    return html`<div role="heading" aria-level=${this.level}><slot></slot></div>
      <slot name="actions"></slot>`;
  }
}

customElements.define("gw-section-title", GwSectionTitle);

declare global {
  interface HTMLElementTagNameMap {
    "gw-section-title": GwSectionTitle;
  }
}
