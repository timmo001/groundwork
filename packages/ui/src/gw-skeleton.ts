/**
 * `gw-skeleton` and its text, lines and icon shapes: placeholders for what's
 * loading.
 * Docs: https://groundwork.timmo.dev/components/feedback/#loading
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A placeholder for what's loading, sized by its container or by `width`
 * and `height` in CSS. The shapes below extend it, and components with a
 * `loading` attribute draw their own from them, so a spinner is only needed
 * for an action in progress. It's hidden from assistive technology, so mark
 * the region it sits in `aria-busy`.
 *
 * @element gw-skeleton
 * @summary A pulsing placeholder for what's loading.
 *
 * @cssprop --gw-skeleton-color - The fill. Defaults to the neutral fill.
 * @cssprop --gw-skeleton-radius - The corners. Defaults to the control radius.
 */
export class GwSkeleton extends GwElement {
  static override styles: readonly CSSStyleSheet[] = [
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
 * @element gw-skeleton-text
 * @summary A placeholder for a line of text.
 *
 * @cssprop --gw-skeleton-width - Defaults to `8rem`.
 */
export class GwSkeletonText extends GwSkeleton {
  static override styles = [
    ...GwSkeleton.styles,
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
 *
 * @element gw-skeleton-lines
 * @summary A placeholder for a paragraph.
 *
 * @attr {number} lines - How many lines. Defaults to 3.
 */
export class GwSkeletonLines extends GwElement {
  static override properties = {
    lines: { type: "number" },
  } as const;

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

  protected override update() {
    this.renderRoot.replaceChildren(
      ...Array.from({ length: Math.max(1, this.lines || 1) }, () =>
        h("gw-skeleton-text"),
      ),
    );
  }
}

/**
 * A round placeholder for an icon or avatar.
 *
 * @element gw-skeleton-icon
 * @summary A round placeholder for an icon or avatar.
 *
 * @cssprop --gw-icon-size - Its size. Defaults to `1.25rem`.
 */
export class GwSkeletonIcon extends GwSkeleton {
  static override styles = [
    ...GwSkeleton.styles,
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

GwSkeleton.define("gw-skeleton");

GwSkeletonText.define("gw-skeleton-text");

GwSkeletonLines.define("gw-skeleton-lines");

GwSkeletonIcon.define("gw-skeleton-icon");

declare global {
  interface HTMLElementTagNameMap {
    "gw-skeleton": GwSkeleton;
    "gw-skeleton-text": GwSkeletonText;
    "gw-skeleton-lines": GwSkeletonLines;
    "gw-skeleton-icon": GwSkeletonIcon;
  }
}
