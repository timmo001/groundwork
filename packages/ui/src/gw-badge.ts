import { LitElement, css, html, nothing } from "lit";
import "./gw-skeleton.js";
import { base, icon, type Tone } from "./styles.js";

/**
 * A pill with an icon, a value and an optional small label above it, after
 * Home Assistant's badges. The icon takes the `tone`'s color. While
 * `loading`, a skeleton stands in for the value, and for the icon if it has
 * none yet.
 */
export class GwBadge extends LitElement {
  static override properties = {
    icon: {},
    label: {},
    tone: { reflect: true },
    size: { reflect: true },
    loading: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        max-width: 100%;
        vertical-align: middle;
      }

      /* Home Assistant's badge: 36px tall, 12px padding, 8px between the
         18px icon and the text */
      .badge {
        --gw-icon-size: 1.125rem;

        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        max-width: 100%;
        height: 2.25rem;
        padding: 0 var(--gw-space-4) 0 var(--gw-space-3);
        vertical-align: middle;
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
      }

      :host([size="small"]) .badge {
        --gw-icon-size: 1rem;

        gap: var(--gw-space-1);
        height: 1.75rem;
        padding: 0 var(--gw-space-3) 0 var(--gw-space-2);
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
        font-size: var(--gw-font-size-2xs);
        line-height: 1.1;
        color: var(--gw-color-text-secondary);
      }

      .content {
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1.2;
        white-space: nowrap;
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
  declare loading: boolean;

  constructor() {
    super();
    this.icon = "";
    this.label = "";
    this.tone = "accent";
    this.size = "medium";
    this.loading = false;
  }

  override render() {
    return html`<span
      class="badge"
      part="badge"
      aria-busy=${this.loading ? "true" : nothing}
    >
      ${
        this.icon
          ? icon(this.icon)
          : this.loading
            ? html`<gw-skeleton-icon></gw-skeleton-icon>`
            : nothing
      }
      <span class="info">
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        <span class="content"
          >${
            this.loading
              ? html`<gw-skeleton-text
                  style="--gw-skeleton-width: 3rem"
                ></gw-skeleton-text>`
              : html`<slot></slot>`
          }</span
        >
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
