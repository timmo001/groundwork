import { LitElement, css, html, nothing } from "lit";
import { base, type Tone } from "./styles.js";

/**
 * A message in the flow of the page. `urgent` announces it at once, for
 * errors that need attention; otherwise it's announced politely.
 */
export class GwAlert extends LitElement {
  static override properties = {
    tone: { reflect: true },
    heading: {},
    urgent: { type: Boolean },
  };

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .alert {
        display: flex;
        gap: var(--gw-space-2);
        align-items: flex-start;
        padding: var(--gw-space-2) var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        background: var(--gw-tone-fill, var(--gw-color-fill-info-quiet));
        border: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-info));
        border-inline-start-width: calc(var(--gw-border-width) * 4);
        border-radius: var(--gw-radius-control);
      }

      ::slotted(p) {
        margin: 0;
      }

      ::slotted([slot="actions"]) {
        align-self: center;
      }

      ::slotted([slot="icon"]) {
        color: var(--gw-tone, var(--gw-color-info));
      }

      .body {
        flex: 1;
        min-width: 0;
      }

      strong {
        display: block;
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }
    `,
  ];

  declare tone: Tone;
  declare heading: string;
  declare urgent: boolean;

  constructor() {
    super();
    this.tone = "info";
    this.heading = "";
    this.urgent = false;
  }

  override render() {
    return html`<div
      class="alert"
      role=${this.urgent ? "alert" : "status"}
      part="alert"
    >
      <slot name="icon"></slot>
      <div class="body">
        ${this.heading ? html`<strong>${this.heading}</strong>` : nothing}
        <slot></slot>
      </div>
      <slot name="actions"></slot>
    </div>`;
  }
}

customElements.define("gw-alert", GwAlert);

declare global {
  interface HTMLElementTagNameMap {
    "gw-alert": GwAlert;
  }
}
