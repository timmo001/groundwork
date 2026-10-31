import { LitElement, css, html, nothing } from "lit";
import { base } from "./styles.js";

/**
 * A native button styled through `--gw-*` variables, so it follows the
 * theme and mode around it. With `href` it renders a link that looks the
 * same. Put an icon in the `icon` slot.
 */
export class GwButton extends LitElement {
  static override properties = {
    variant: { reflect: true },
    size: { reflect: true },
    type: {},
    href: {},
    label: {},
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
      }

      .button {
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        justify-content: center;
        min-height: 2.25rem;
        padding: 0 var(--gw-space-4);
        font: inherit;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1;
        color: var(--gw-color-text-strong);
        text-decoration: none;
        text-transform: var(--gw-label-transform);
        letter-spacing: var(--gw-label-tracking);
        white-space: nowrap;
        cursor: pointer;
        background: var(--gw-color-fill-neutral-resting);
        border: var(--gw-border-width) solid var(--gw-border-colour);
        border-radius: var(--gw-radius-control);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
        --gw-icon-size: 1.125rem;
      }

      .button:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .button:active {
        background: var(--gw-color-fill-neutral-pressed);
      }

      :host([size="small"]) .button {
        min-height: 1.875rem;
        padding: 0 var(--gw-space-3);
        font-size: var(--gw-font-size-xs);
        --gw-icon-size: 1rem;
      }

      :host([size="large"]) .button {
        min-height: 3rem;
        padding: 0 var(--gw-space-6);
        font-size: var(--gw-font-size-m);
        --gw-icon-size: 1.5rem;
      }

      :host([variant="primary"]) .button {
        color: var(--gw-color-on-primary);
        background: var(--gw-color-fill-primary-resting);
        border-color: transparent;
      }

      :host([variant="primary"]) .button:hover {
        background: var(--gw-color-fill-primary-hovered);
      }

      :host([variant="primary"]) .button:active {
        background: var(--gw-color-fill-primary-pressed);
      }

      :host([variant="accent"]) .button {
        color: var(--gw-color-on-accent);
        background: var(--gw-color-fill-accent-resting);
        border-color: transparent;
      }

      :host([variant="accent"]) .button:hover {
        background: var(--gw-color-fill-accent-hovered);
      }

      :host([variant="accent"]) .button:active {
        background: var(--gw-color-fill-accent-pressed);
      }

      :host([variant="plain"]) .button {
        background: transparent;
        border-color: transparent;
      }

      :host([variant="plain"]) .button:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      :host([variant="danger"]) .button {
        color: var(--gw-color-danger);
        background: var(--gw-color-fill-danger-quiet);
        border-color: var(--gw-color-border-danger);
      }

      .button:disabled,
      .button[aria-disabled="true"] {
        color: var(--gw-color-text-disabled);
        pointer-events: none;
        cursor: not-allowed;
        background: var(--gw-color-fill-neutral-disabled);
        border-color: transparent;
      }

      ::slotted([slot="icon"]) {
        width: var(--gw-icon-size);
        height: var(--gw-icon-size);
      }
    `,
  ];

  declare variant: "neutral" | "primary" | "accent" | "plain" | "danger";
  declare size: "small" | "medium" | "large";
  declare type: "button" | "submit" | "reset";
  declare href: string;
  declare label: string;
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = "neutral";
    this.size = "medium";
    this.type = "button";
    this.href = "";
    this.label = "";
    this.disabled = false;
  }

  override render() {
    const content = html`<slot name="icon"></slot><slot></slot>`;

    if (this.href) {
      return html`<a
        class="button"
        part="button"
        href=${this.disabled ? nothing : this.href}
        aria-label=${this.label || nothing}
        aria-disabled=${this.disabled ? "true" : nothing}
        >${content}</a
      >`;
    }

    return html`<button
      class="button"
      part="button"
      type=${this.type}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
    >
      ${content}
    </button>`;
  }
}

customElements.define("gw-button", GwButton);

declare global {
  interface HTMLElementTagNameMap {
    "gw-button": GwButton;
  }
}
