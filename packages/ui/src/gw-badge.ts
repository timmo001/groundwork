import { LitElement, css, html, nothing } from "lit";
import { base, icon, type Tone } from "./styles.js";

/**
 * A pill with an icon, a value and an optional small label above it, after
 * Home Assistant's badges. The icon takes the `tone`'s colour.
 */
export class GwBadge extends LitElement {
  static override properties = {
    icon: {},
    label: {},
    tone: { reflect: true },
    size: { reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        max-width: 100%;
        vertical-align: middle;
      }

      .badge {
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        max-width: 100%;
        min-height: 2.25rem;
        padding: var(--gw-space-1) var(--gw-space-4) var(--gw-space-1)
          var(--gw-space-3);
        vertical-align: middle;
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
      }

      :host([size="small"]) .badge {
        gap: var(--gw-space-1);
        min-height: 1.75rem;
        padding: 0 var(--gw-space-2) 0 var(--gw-space-2);
        --gw-icon-size: 1rem;
      }

      .icon {
        color: var(--gw-tone, var(--gw-color-accent));
      }

      .info {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .label {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      .content {
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        overflow-wrap: anywhere;
      }

      :host([size="small"]) .content {
        font-size: var(--gw-font-size-xs);
        white-space: nowrap;
      }
    `,
  ];

  declare icon: string;
  declare label: string;
  declare tone: Tone;
  declare size: "small" | "medium";

  constructor() {
    super();
    this.icon = "";
    this.label = "";
    this.tone = "accent";
    this.size = "medium";
  }

  override render() {
    return html`<span class="badge" part="badge">
      ${this.icon ? icon(this.icon) : nothing}
      <span class="info">
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        <span class="content"><slot></slot></span>
      </span>
    </span>`;
  }
}

customElements.define("gw-badge", GwBadge);

declare global {
  interface HTMLElementTagNameMap {
    "gw-badge": GwBadge;
  }
}
