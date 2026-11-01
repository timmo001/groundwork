import { LitElement, css, html } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { base } from "./styles.js";

/**
 * A modal on the native `<dialog>`, so focus is trapped and returned, Esc
 * closes it and the page behind is inert. Open it with `show()`. Put buttons
 * in the `actions` slot; a click on one with a `value` closes the dialog with
 * that value, and fires `close`.
 */
export class GwDialog extends LitElement {
  static override properties = {
    heading: {},
    open: { type: Boolean, reflect: true },
  };

  static override styles = [
    base,
    css`
      dialog {
        width: min(32rem, calc(100vw - 2 * var(--gw-space-3)));
        padding: 0;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-overlay);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        box-shadow: var(--gw-shadow-l);
      }

      dialog::backdrop {
        background: rgb(0 0 0 / 50%);
      }

      /* Fades and lifts in and out, the backdrop with it */
      dialog,
      dialog::backdrop {
        transition:
          opacity var(--gw-motion-normal) var(--gw-motion-easing),
          scale var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      dialog,
      dialog::backdrop {
        opacity: 0;
      }

      dialog {
        scale: 0.96;
      }

      dialog[open],
      dialog[open]::backdrop {
        opacity: 1;
      }

      dialog[open] {
        scale: 1;
      }

      @starting-style {
        dialog[open],
        dialog[open]::backdrop {
          opacity: 0;
        }

        dialog[open] {
          scale: 0.96;
        }
      }

      header {
        padding: var(--gw-space-4) var(--gw-space-4) 0;
      }

      h2 {
        margin: 0;
        font-size: var(--gw-font-size-l);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .body {
        padding: var(--gw-space-3) var(--gw-space-4);
        font-size: var(--gw-font-size-s);
      }

      footer {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-1);
        justify-content: flex-end;
        padding: 0 var(--gw-space-4) var(--gw-space-4);
      }
    `,
  ];

  declare heading: string;
  declare open: boolean;

  /** The value of the action that closed the dialog, or "" for Esc. */
  returnValue = "";

  constructor() {
    super();
    this.heading = "";
    this.open = false;
  }

  readonly #dialog = createRef<HTMLDialogElement>();

  show() {
    this.open = true;
  }

  close(value = "") {
    this.returnValue = value;
    this.open = false;
  }

  readonly #onAction = (event: Event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("value")) {
      this.close(target.getAttribute("value") ?? "");
    }
  };

  readonly #onClose = () => {
    this.open = false;
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  };

  override updated() {
    const dialog = this.#dialog.value;

    if (dialog === undefined) return;

    if (this.open && !dialog.open) {
      dialog.showModal();
      // Toasts rise back above it
      document.dispatchEvent(new Event("gw-dialog-open"));
    }

    if (!this.open && dialog.open) dialog.close(this.returnValue);
  }

  override render() {
    return html`<dialog
      ${ref(this.#dialog)}
      aria-labelledby="heading"
      @close=${this.#onClose}
    >
      <header><h2 id="heading">${this.heading}</h2></header>
      <div class="body"><slot></slot></div>
      <footer @click=${this.#onAction}><slot name="actions"></slot></footer>
    </dialog>`;
  }
}

customElements.define("gw-dialog", GwDialog);

declare global {
  interface HTMLElementTagNameMap {
    "gw-dialog": GwDialog;
  }
}
