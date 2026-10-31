import { LitElement, css, html, nothing } from "lit";
import { base } from "./styles.js";

/**
 * A native button styled through `--gw-*` variables, so it follows the
 * theme and mode around it. With `href` it renders a link that looks the
 * same. Put an icon in the `icon` slot.
 *
 * As in Home Assistant's Design Kit, `variant` picks the colour and
 * `appearance` how it's applied, from most to least important: `accent` (a
 * solid fill), `filled` (a soft tint), `outlined` (a stroke) or `plain` (text
 * only). Every button is a pill. Sizes run `xs` to `xl`, and
 * `--gw-button-scale` sets any size in between.
 */
export class GwButton extends LitElement {
  /** Focusing the element focuses its native button, such as from a dialog opening. */
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties = {
    variant: { reflect: true },
    appearance: { reflect: true },
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
        --gw-button-tone: var(--gw-color-accent);

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

      :host([variant="neutral"]) {
        --gw-button-tone: var(--gw-color-text-secondary);
        --gw-button-ink: var(--gw-color-text-strong);
      }

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
        color: var(--gw-button-ink, var(--gw-button-tone));
        text-decoration: none;
        text-transform: var(--gw-label-transform);
        letter-spacing: var(--gw-label-tracking);
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: max(var(--gw-border-width), 1px) solid transparent;
        border-radius: var(--gw-radius-pill);
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
        background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
      }

      .button:active {
        background: color-mix(in oklch, var(--gw-button-tone) 24%, transparent);
      }

      /* A solid fill, with text that flips between black and white by the
         fill's lightness so it reads on every theme's colours */
      :host([appearance="accent"]) .button {
        color: oklch(
          from var(--gw-button-tone) clamp(0, (0.66 - l) * 1000, 1) 0 0
        );
        background: var(--gw-button-tone);
      }

      :host([appearance="accent"]) .button:hover {
        background: oklch(
          from var(--gw-button-tone) calc(l + (0.6 - l) * 0.2) c h
        );
      }

      :host([appearance="accent"]) .button:active {
        background: oklch(
          from var(--gw-button-tone) calc(l + (0.6 - l) * 0.35) c h
        );
      }

      :host([appearance="filled"]) .button {
        background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
      }

      :host([appearance="filled"]) .button:hover {
        background: color-mix(in oklch, var(--gw-button-tone) 24%, transparent);
      }

      :host([appearance="filled"]) .button:active {
        background: color-mix(in oklch, var(--gw-button-tone) 32%, transparent);
      }

      :host([appearance="outlined"]) .button {
        border-color: var(--gw-button-tone);
      }

      .button:disabled,
      .button[aria-disabled="true"] {
        color: var(--gw-color-text-disabled);
        pointer-events: none;
        cursor: not-allowed;
        background: var(--gw-color-fill-neutral-disabled);
        border-color: transparent;
      }

      :host([appearance="plain"]) .button:disabled,
      :host([appearance="plain"]) .button[aria-disabled="true"] {
        background: transparent;
      }

      ::slotted([slot="icon"]) {
        width: var(--gw-icon-size);
        height: var(--gw-icon-size);
      }
    `,
  ];

  declare variant:
    "brand" | "neutral" | "info" | "success" | "warning" | "danger";
  declare appearance: "accent" | "filled" | "outlined" | "plain";
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  declare type: "button" | "submit" | "reset";
  declare href: string;
  declare label: string;
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = "brand";
    this.appearance = "accent";
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
