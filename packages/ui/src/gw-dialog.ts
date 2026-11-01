import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A modal on the native `<dialog>`, so focus is trapped and returned, Esc
 * closes it and the page behind is inert. Open it with `show()`. Put buttons
 * in the `actions` slot; a click on one with a `value` closes the dialog with
 * that value, and fires `close`.
 */
export class GwDialog extends GwElement {
  static override properties = {
    heading: {},
    open: { type: "boolean", reflect: true },
  } as const;

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

  readonly #heading = h("h2", { id: "heading" });

  readonly #footer = h("footer", {}, h("slot", { name: "actions" }));

  readonly #dialog = h(
    "dialog",
    { "aria-labelledby": "heading" },
    h("header", {}, this.#heading),
    h("div", { class: "body" }, h("slot")),
    this.#footer,
  );

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

  protected override create(root: ShadowRoot) {
    this.#dialog.addEventListener("close", this.#onClose);
    this.#footer.addEventListener("click", this.#onAction);
    root.append(this.#dialog);
  }

  protected override update() {
    const dialog = this.#dialog;

    this.#heading.textContent = this.heading;

    if (this.open && !dialog.open) {
      dialog.showModal();
      // Toasts rise back above it
      document.dispatchEvent(new Event("gw-dialog-open"));
    }

    if (!this.open && dialog.open) dialog.close(this.returnValue);
  }
}

GwDialog.define("gw-dialog");

declare global {
  interface HTMLElementTagNameMap {
    "gw-dialog": GwDialog;
  }
}
