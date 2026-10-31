import { LitElement, css, html, nothing } from "lit";
import { base } from "./styles.js";

/**
 * A setting: its name and description on one side, its control on the
 * other. A wide control drops under the text when there isn't room. Rows
 * after the first in their parent get a line above them.
 */
export class GwSettingRow extends LitElement {
  static override properties = {
    heading: {},
    description: {},
  };

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2) var(--gw-space-4);
        align-items: center;
        justify-content: space-between;
        padding: var(--gw-row-padding, var(--gw-space-3)) 0;
      }

      /* A full line even in themes without borders, since it separates rows */
      :host(:not(:first-of-type)) .row {
        border-block-start: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-quiet);
      }

      .text {
        flex: 1 1 12rem;
        min-width: 0;
      }

      .heading {
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .description {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      .control {
        max-width: 100%;
      }
    `,
  ];

  declare heading: string;
  declare description: string;

  constructor() {
    super();
    this.heading = "";
    this.description = "";
  }

  override render() {
    return html`<div class="row" part="row">
      <div class="text">
        <div class="heading">${this.heading}</div>
        ${this.description ? html`<div class="description">${this.description}</div>` : nothing}
      </div>
      <div class="control"><slot></slot></div>
    </div>`;
  }
}

customElements.define("gw-setting-row", GwSettingRow);

declare global {
  interface HTMLElementTagNameMap {
    "gw-setting-row": GwSettingRow;
  }
}
