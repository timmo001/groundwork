/**
 * `gw-dialog`: a modal on the native `<dialog>`, for what blocks the whole app.
 * Docs: https://groundwork.timmo.dev/components/overlays/#dialog
 *
 * @module
 */
import { Dismissal, dismissalStyles } from "./dismiss.js";
import { GwElement, css, h } from "./element.js";
import "./gw-button.js";
import { base } from "./styles.js";

// MDI's close
const closeIcon =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/**
 * A modal on the native `<dialog>`, so focus is trapped and returned, Esc
 * closes it and the page behind is inert. Open it with `show()`. Put buttons
 * in the `actions` slot; a click on one with a `value` closes the dialog with
 * that value, and fires `close`.
 *
 * @element gw-dialog
 * @summary A modal for what blocks the whole app.
 *
 * @attr {string} heading - The heading beside the close button.
 * @attr {boolean} open - Whether it shows.
 *
 * @slot - The content.
 * @slot actions - Buttons; one with a `value` closes it with that value.
 *
 * @fires close - When it closes; `returnValue` holds the button's value.
 */
export class GwDialog extends GwElement {
  static override properties = {
    heading: {},
    open: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    dismissalStyles,
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
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        padding: var(--gw-space-3) var(--gw-space-3) 0 var(--gw-space-4);
      }

      h2 {
        flex: 1;
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

      dialog > .discard {
        padding: var(--gw-space-4);
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

  readonly #closeButton = h(
    "gw-button",
    {
      class: "close",
      variant: "neutral",
      appearance: "plain",
      size: "small",
      labels: "hide",
      icon: closeIcon,
    },
    "Close",
  );

  readonly #dialog = h(
    "dialog",
    { "aria-labelledby": "heading" },
    h("header", {}, this.#heading, this.#closeButton),
    h("div", { class: "body" }, h("slot")),
    this.#footer,
  );

  readonly #dismissal = new Dismissal(this, this.#dialog, () => this.close());

  /** Whether its content has changed since it opened, so closing it asks first. */
  get dirty() {
    return this.#dismissal.dirty;
  }

  set dirty(dirty: boolean) {
    this.#dismissal.mark(dirty);
  }

  show() {
    this.#dismissal.reset();
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

  // Esc and the close button close it at once while nothing has changed,
  // and ask first once something has
  readonly #onCancel = (event: Event) => {
    event.preventDefault();
    this.#dismissal.request();
  };

  // A click on the backdrop closes it too, but only while nothing has
  // changed, so a stray click never throws work away
  readonly #onBackdrop = (event: MouseEvent) => {
    if (event.target === this.#dialog && !this.#dismissal.dirty) this.close();
  };

  protected override create(root: ShadowRoot) {
    this.#dialog.addEventListener("close", this.#onClose);
    this.#dialog.addEventListener("cancel", this.#onCancel);
    this.#dialog.addEventListener("click", this.#onBackdrop);
    this.#closeButton.addEventListener("click", () => {
      this.#dismissal.request();
    });
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
