import { LitElement, css, html, nothing } from "lit";
import { base } from "./styles.js";

/**
 * A native button styled through `--gw-*` variables, so it follows the
 * theme and mode around it. With `href` it renders a link that looks the
 * same. Put an icon in the `icon` slot.
 *
 * Variants: `primary`, `secondary` (the default), `accent` and `plain`, plus
 * `info`, `success`, `warning` and `danger` from the theme's status roles.
 * Sizes run `xs` to `xl`, and `--gw-button-scale` sets any size in between.
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

      /* Everything scales from --gw-button-scale, around Home Assistant's 40px
         medium button: the presets give HA's 24, 32 and 48px and a 56px xl, and
         an app can set any value for a size between or beyond them */
      :host([size="xs"]) {
        --gw-button-scale: 0.6;
      }

      :host([size="small"]) {
        --gw-button-scale: 0.8;
      }

      :host([size="large"]) {
        --gw-button-scale: 1.2;
      }

      :host([size="xl"]) {
        --gw-button-scale: 1.4;
      }

      .button {
        --gw-scale: var(--gw-button-scale, 1);
        --gw-icon-size: calc(1.125rem * var(--gw-scale));

        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-scale));
        align-items: center;
        justify-content: center;
        min-height: calc(2.5rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-4) * var(--gw-scale));
        font: inherit;
        font-size: calc(var(--gw-font-size-s) * var(--gw-scale));
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
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          border-color var(--gw-motion-fast) var(--gw-motion-easing),
          color var(--gw-motion-fast) var(--gw-motion-easing),
          scale var(--gw-motion-fast) var(--gw-motion-easing);
      }

      /* A slight press, so a click feels physical */
      .button:active {
        scale: 0.97;
      }

      .button:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .button:active {
        background: var(--gw-color-fill-neutral-pressed);
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

      /* Status buttons take their colour from the theme's status roles, as a
         tinted fill and border, with strong text so they read in every theme */
      :host([variant="info"]) {
        --gw-button-tone: var(--gw-color-info);
      }

      :host([variant="success"]) {
        --gw-button-tone: var(--gw-color-success);
      }

      :host([variant="warning"]) {
        --gw-button-tone: var(--gw-color-warning);
      }

      :host([variant="danger"]) {
        --gw-button-tone: var(--gw-color-danger);
      }

      :host(
          :is(
            [variant="info"],
            [variant="success"],
            [variant="warning"],
            [variant="danger"]
          )
        )
        .button {
        color: var(--gw-color-text-strong);
        background: color-mix(
          in oklch,
          var(--gw-button-tone) 18%,
          var(--gw-color-surface-raised)
        );
        border-color: var(--gw-button-tone);
      }

      :host(
          :is(
            [variant="info"],
            [variant="success"],
            [variant="warning"],
            [variant="danger"]
          )
        )
        .button:hover {
        background: color-mix(
          in oklch,
          var(--gw-button-tone) 28%,
          var(--gw-color-surface-raised)
        );
      }

      :host(
          :is(
            [variant="info"],
            [variant="success"],
            [variant="warning"],
            [variant="danger"]
          )
        )
        .button:active {
        background: color-mix(
          in oklch,
          var(--gw-button-tone) 36%,
          var(--gw-color-surface-raised)
        );
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

  declare variant:
    | "primary"
    | "secondary"
    | "accent"
    | "plain"
    | "info"
    | "success"
    | "warning"
    | "danger";
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  declare type: "button" | "submit" | "reset";
  declare href: string;
  declare label: string;
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = "secondary";
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
