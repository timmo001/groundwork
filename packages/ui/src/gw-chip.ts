import { LitElement, css, html } from "lit";
import { base, type Tone } from "./styles.js";

/** A short status or category, tinted by its `tone`. */
export class GwChip extends LitElement {
  static override properties = {
    tone: { reflect: true },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
      }

      /* 32px, as Home Assistant's chips, with 12px padding */
      .chip {
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        height: 2rem;
        padding: 0 var(--gw-space-3);
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        background: var(--gw-tone-fill, var(--gw-color-fill-neutral-resting));
        border: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-quiet));
        border-radius: var(--gw-radius-chip);
        --gw-icon-size: 1rem;
      }
    `,
  ];

  declare tone: Tone;

  constructor() {
    super();
    this.tone = "neutral";
  }

  override render() {
    return html`<span class="chip" part="chip"
      ><slot name="icon"></slot><slot></slot
    ></span>`;
  }
}

customElements.define("gw-chip", GwChip);

declare global {
  interface HTMLElementTagNameMap {
    "gw-chip": GwChip;
  }
}
