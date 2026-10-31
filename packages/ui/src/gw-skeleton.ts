import { LitElement, css, html, type CSSResultGroup } from "lit";
import { base } from "./styles.js";

/**
 * A placeholder for what's loading, sized by its container or by `width`
 * and `height` in CSS. The shapes below extend it, and components with a
 * `loading` attribute draw their own from them, so a spinner is only needed
 * for an action in progress. It's hidden from assistive technology, so mark
 * the region it sits in `aria-busy`.
 *
 * @cssprop --gw-skeleton-color - The fill. Defaults to the neutral fill.
 * @cssprop --gw-skeleton-radius - The corners. Defaults to the control radius.
 */
export class GwSkeleton extends LitElement {
  static override styles: CSSResultGroup = [
    base,
    css`
      :host {
        display: block;
        min-height: 1rem;
        background: var(
          --gw-skeleton-color,
          var(--gw-color-fill-neutral-resting)
        );
        border-radius: var(--gw-skeleton-radius, var(--gw-radius-control));
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        50% {
          opacity: 0.45;
        }
      }

      @media (forced-colors: active) {
        :host {
          background: GrayText;
        }
      }
    `,
  ];

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("aria-hidden", "true");
  }
}

/**
 * A line of text. Its height follows the font size around it, so it lines up
 * with the text it stands in for.
 *
 * @cssprop --gw-skeleton-width - Defaults to `8rem`.
 */
export class GwSkeletonText extends GwSkeleton {
  static override styles = [
    GwSkeleton.styles,
    css`
      :host {
        display: inline-block;
        width: var(--gw-skeleton-width, 8rem);
        max-width: 100%;
        height: 1em;
        min-height: 0;
        vertical-align: middle;
      }
    `,
  ];
}

/**
 * Several lines of text, as a paragraph, with a shorter last line so it
 * doesn't read as a solid block.
 */
export class GwSkeletonLines extends LitElement {
  static override properties = {
    lines: { type: Number },
  };

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
      }

      gw-skeleton-text {
        --gw-skeleton-width: 100%;
      }

      gw-skeleton-text:last-child:not(:first-child) {
        --gw-skeleton-width: 60%;
      }
    `,
  ];

  declare lines: number;

  constructor() {
    super();
    this.lines = 3;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("aria-hidden", "true");
  }

  override render() {
    return Array.from(
      { length: Math.max(1, this.lines) },
      () => html`<gw-skeleton-text></gw-skeleton-text>`,
    );
  }
}

/** A round placeholder for an icon or avatar. */
export class GwSkeletonIcon extends GwSkeleton {
  static override styles = [
    GwSkeleton.styles,
    css`
      :host {
        display: inline-block;
        flex: none;
        width: var(--gw-icon-size, 1.25rem);
        height: var(--gw-icon-size, 1.25rem);
        min-height: 0;
        vertical-align: middle;
        border-radius: var(--gw-radius-pill);
      }
    `,
  ];
}

customElements.define("gw-skeleton", GwSkeleton);

customElements.define("gw-skeleton-text", GwSkeletonText);

customElements.define("gw-skeleton-lines", GwSkeletonLines);

customElements.define("gw-skeleton-icon", GwSkeletonIcon);

declare global {
  interface HTMLElementTagNameMap {
    "gw-skeleton": GwSkeleton;
    "gw-skeleton-text": GwSkeletonText;
    "gw-skeleton-lines": GwSkeletonLines;
    "gw-skeleton-icon": GwSkeletonIcon;
  }
}
