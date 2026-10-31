import { LitElement, css, html } from "lit";
import { base, type Tone } from "./styles.js";

interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: Tone;
}

/**
 * Where toasts appear, fixed at the bottom of the screen. Call
 * `show(message, tone)`; each toast is announced politely and leaves after
 * `duration` milliseconds. Keep them for something new that needs the
 * person; nothing for routine success.
 */
export class GwToaster extends LitElement {
  static override properties = {
    duration: { type: Number },
    toasts: { state: true },
  };

  static override styles = [
    base,
    css`
      :host {
        position: fixed;
        inset: auto 0 var(--gw-space-5);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-2);
        align-items: center;
        pointer-events: none;
      }

      .toast {
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        max-width: min(32rem, calc(100vw - 2 * var(--gw-space-4)));
        padding: var(--gw-space-3) var(--gw-space-4);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-strong);
        pointer-events: auto;
        background: var(--gw-color-surface-overlay);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-inline-start: calc(var(--gw-border-width) * 4) solid
          var(--gw-toast-tone);
        border-radius: var(--gw-radius-control);
        box-shadow: var(--gw-shadow-m);
        animation: enter var(--gw-motion-slow) var(--gw-motion-easing);
      }

      @keyframes enter {
        from {
          opacity: 0;
          translate: 0 0.5rem;
        }
      }
    `,
  ];

  declare duration: number;
  declare toasts: readonly Toast[];

  #next = 0;

  constructor() {
    super();
    this.duration = 5000;
    this.toasts = [];
  }

  show(message: string, tone: Tone = "neutral") {
    this.#next += 1;

    const toast = { id: this.#next, message, tone };

    this.toasts = [...this.toasts, toast];

    setTimeout(() => {
      this.toasts = this.toasts.filter((item) => item.id !== toast.id);
    }, this.duration);
  }

  override render() {
    return html`<div role="status" aria-live="polite">
      ${this.toasts.map(
        (toast) =>
          html`<div
            class="toast"
            style="--gw-toast-tone: ${
              toast.tone === "neutral"
                ? "var(--gw-color-border-loud)"
                : `var(--gw-color-${toast.tone})`
            }"
          >
            ${toast.message}
          </div>`,
      )}
    </div>`;
  }
}

customElements.define("gw-toaster", GwToaster);

declare global {
  interface HTMLElementTagNameMap {
    "gw-toaster": GwToaster;
  }
}
