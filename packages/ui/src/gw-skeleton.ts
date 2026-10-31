import { LitElement, css } from "lit";
import { base } from "./styles.js";

/**
 * A placeholder sized like what it stands in for while data loads. Set its
 * size with `width` and `height` in CSS. It's hidden from assistive
 * technology, so mark the region it sits in `aria-busy`.
 */
export class GwSkeleton extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-height: 1rem;
        background: linear-gradient(
          90deg,
          var(--gw-color-surface-lower) 25%,
          var(--gw-color-fill-neutral-hovered) 50%,
          var(--gw-color-surface-lower) 75%
        );
        background-size: 200% 100%;
        border-radius: var(--gw-radius-control);
        animation: shimmer 1.4s ease-in-out infinite;
      }

      @keyframes shimmer {
        from {
          background-position: 100% 0;
        }

        to {
          background-position: -100% 0;
        }
      }
    `,
  ];

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute("aria-hidden", "true");
  }
}

customElements.define("gw-skeleton", GwSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    "gw-skeleton": GwSkeleton;
  }
}
