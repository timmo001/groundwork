/**
 * `gw-popover`: a small surface anchored to the button that opened it.
 * Docs: https://groundwork.timmo.dev/components/overlays/#popover
 *
 * @module
 */
import {
  defaultSheetBelow,
  defaultSheetBelowHeight,
  opensAsSheet,
  sheetLayout,
} from "./adaptive.js";
import { Dismissal, dismissalStyles } from "./dismiss.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import { placeBeside } from "./placement.js";
import { base } from "./styles.js";

const gap = 8;

// MDI's close
const closeIcon =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/**
 * A confirmation, rename or small form that opens next to the button that
 * asked for it, rather than as a dialog in the middle of the screen. On a
 * narrow or short screen, under 600px wide or 500px tall, it's a bottom
 * sheet. Opened without a button, such as after a save, it sits in the
 * middle like a dialog.
 *
 * It's on the Popover API, in the top layer, and closes on Esc or a click
 * outside. Open it with `show(anchor)`. It focuses the close button, or the
 * first element in its content with `autofocus`, such as a field it's opened
 * to fill in. Put buttons in the `actions` slot: a
 * click on one with a `value` closes it with that value, and fires `close`.
 * `confirm` makes it an `alertdialog`, for a question that needs an answer.
 *
 * @element gw-popover
 * @summary A small surface anchored to the button that opened it.
 *
 * @attr {string} heading - The heading beside the close button.
 * @attr {boolean} confirm - Makes it an `alertdialog`, for a question that needs an answer.
 * @attr {boolean} fit - Sizes it to its content beside a button or in the middle: at least `--gw-popover-width`, and no wider than the window, so a wide control inside never scrolls sideways.
 * @attr {number} sheet-below - Overrides the viewport width in pixels below which it's a bottom sheet; `0` turns the width rule off. Defaults to `600`.
 * @attr {number} sheet-below-height - Overrides the viewport height in pixels below which it's a bottom sheet, such as a phone on its side; `0` turns the height rule off. Defaults to `500`.
 * @attr {string} close-label - The close button's name, for an app in another language. Defaults to `Close`.
 * @attr {string} discard-question - The question asked before closing with edits, for an app in another language. Defaults to `Discard your changes?`.
 * @attr {string} keep-label - The button that goes back to editing. Defaults to `Keep editing`.
 * @attr {string} discard-label - The button that throws the edits away. Defaults to `Discard`.
 *
 * @slot - The content.
 * @slot actions - Buttons; one with a `value` closes it with that value.
 *
 * @csspart surface - The popover's surface.
 * @csspart header - The row with the heading, content and close button.
 * @csspart heading - The heading.
 * @csspart close - The close button, a `gw-button`.
 * @csspart body - The content.
 * @csspart footer - The actions row.
 * @csspart discard - The view asking whether to discard edits, in place of the content.
 * @csspart discard-question - Its question.
 * @csspart discard-actions - The row with Keep editing and Discard.
 * @csspart discard-keep - The Keep editing button, a `gw-button`.
 * @csspart discard-confirm - The Discard button, a `gw-button`.
 *
 * @cssprop --gw-popover-close-scale - Scales the close button, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-discard-scale - Scales the Keep editing and Discard buttons, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-popover-width - Its width beside a button, or its least width with `fit`. Defaults to `20rem`.
 * @cssprop --gw-popover-padding - The space inside it. Defaults to `--gw-space-4`.
 * @cssprop --gw-popover-background - The surface. Defaults to `--gw-color-surface-overlay`.
 * @cssprop --gw-popover-border-color - The border. Defaults to `--gw-color-border-normal`.
 * @cssprop --gw-popover-radius - The corners. Defaults to `--gw-radius-panel`.
 * @cssprop --gw-popover-shadow - The shadow. Defaults to `--gw-shadow-l`.
 * @cssprop --gw-popover-backdrop - The backdrop behind a centered popover or sheet. Defaults to `rgb(0 0 0 / 40%)`.
 * @cssprop --gw-adaptive-sheet-width - The widest it grows as a bottom sheet, centered. Defaults to `40rem`.
 * @cssprop --gw-adaptive-sheet-height - The tallest it grows as a bottom sheet, its content scrolling past that. Defaults to `85dvh`.
 * @cssprop --gw-popover-scrollbar-size - Its scrollbars' thickness. Defaults to `--gw-scrollbar-inner-size`, `0.25rem`.
 * @cssprop --gw-popover-scrollbar-radius - Its scrollbar thumbs' corners. Defaults to `--gw-scrollbar-inner-radius`, the thickness, fully round.
 * @cssprop --gw-popover-scrollbar-thumb - Its scrollbar thumbs' fill. Defaults to `--gw-scrollbar-inner-thumb`.
 * @cssprop --gw-popover-scrollbar-thumb-hovered - A thumb's fill under the pointer. Defaults to `--gw-scrollbar-inner-thumb-hovered`.
 * @cssprop --gw-popover-scrollbar-track - Its scrollbars' track. Defaults to `--gw-scrollbar-inner-track`, clear.
 *
 * @fires {Event} close - When it closes; `returnValue` holds the button's value.
 */
export class GwPopover extends GwElement {
  static override properties = {
    heading: {},
    confirm: { type: "boolean" },
    fit: { type: "boolean", reflect: true },
    sheetBelow: { type: "number", attribute: "sheet-below" },
    sheetBelowHeight: { type: "number", attribute: "sheet-below-height" },
    closeLabel: { attribute: "close-label" },
    discardQuestion: { attribute: "discard-question" },
    keepLabel: { attribute: "keep-label" },
    discardLabel: { attribute: "discard-label" },
  } as const;

  static override styles = [
    base,
    dismissalStyles,
    css`
      [popover] {
        position: fixed;
        inset: unset;
        box-sizing: border-box;
        width: min(var(--gw-popover-width, 20rem), calc(100vw - 2 * ${gap}px));
        /* Never past the window, scrolling within it; placed popovers get
           the room on their side of the button */
        max-height: calc(100dvh - 2 * ${gap}px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: var(--gw-popover-padding, var(--gw-space-4));
        margin: 0;
        color: var(--gw-color-text-primary);
        background: var(
          --gw-popover-background,
          var(--gw-color-surface-overlay)
        );
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-popover-border-color, var(--gw-color-border-normal));
        border-radius: var(--gw-popover-radius, var(--gw-radius-panel));
        box-shadow: var(--gw-popover-shadow, var(--gw-shadow-l));
        opacity: 0;
        scale: 0.96;
        transition:
          opacity var(--gw-motion-fast) var(--gw-motion-easing),
          scale var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      /* As wide as its content needs, from its usual width up to the
         window's, so a wide control never scrolls sideways in it */
      :host([fit]) [popover]:not([data-placement="sheet"]) {
        width: max-content;
        min-width: min(
          var(--gw-popover-width, 20rem),
          calc(100vw - 2 * ${gap}px)
        );
        max-width: calc(100vw - 2 * ${gap}px);
      }

      [popover]:popover-open {
        opacity: 1;
        scale: 1;
      }

      @starting-style {
        [popover]:popover-open {
          opacity: 0;
          scale: 0.96;
        }
      }

      /* Grows from the corner nearest the button */
      [data-placement="below"] {
        transform-origin: top right;
      }

      [data-placement="above"] {
        transform-origin: bottom right;
      }

      [data-placement="below"][data-side="start"] {
        transform-origin: top left;
      }

      [data-placement="above"][data-side="start"] {
        transform-origin: bottom left;
      }

      [data-placement="center"] {
        inset: 0;
        margin: auto;
        height: fit-content;
      }

      [data-placement="center"]::backdrop {
        background: var(--gw-popover-backdrop, rgb(0 0 0 / 40%));
      }

      /* A bottom sheet on narrow or short screens, sliding up from the
         edge */
      [data-placement="sheet"] {
        ${sheetLayout}
        padding-block-end: calc(
          var(--gw-popover-padding, var(--gw-space-4)) +
            env(safe-area-inset-bottom)
        );
      }

      [data-placement="sheet"]:popover-open {
        translate: 0 0;
      }

      @starting-style {
        [data-placement="sheet"]:popover-open {
          translate: 0 100%;
        }
      }

      [data-placement="sheet"]::backdrop {
        background: var(--gw-popover-backdrop, rgb(0 0 0 / 40%));
      }

      header {
        display: flex;
        gap: var(--gw-space-2);
        align-items: flex-start;
        margin: calc(var(--gw-space-2) * -1) calc(var(--gw-space-2) * -1)
          var(--gw-space-2) 0;
      }

      header .content {
        flex: 1;
        min-width: 0;
        padding-block-start: var(--gw-space-2);
      }

      h2 {
        margin: 0 0 var(--gw-space-2);
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .close {
        --gw-button-scale: var(--gw-popover-close-scale, 0.8);
      }

      .body {
        font-size: var(--gw-font-size-s);
      }

      ::slotted(p) {
        margin: 0;
      }

      footer {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        justify-content: flex-end;
        margin-block-start: var(--gw-space-4);
      }
    `,
  ];

  declare heading: string;
  declare confirm: boolean;
  /** Sizes it to its content, from `--gw-popover-width` up to the window's width. */
  declare fit: boolean;
  /** The viewport width in pixels below which it's a bottom sheet. */
  declare sheetBelow: number;
  /** The viewport height in pixels below which it's a bottom sheet. */
  declare sheetBelowHeight: number;
  /** The close button's name, for an app in another language. */
  declare closeLabel: string;
  declare discardQuestion: string;
  declare keepLabel: string;
  declare discardLabel: string;

  /** The value of the action that closed it, or "" for Esc or a click outside. */
  returnValue = "";

  readonly #heading = h("h2", { id: "heading", part: "heading" });

  readonly #closeButton = h(
    "gw-button",
    {
      class: "close",
      part: "close",
      variant: "neutral",
      appearance: "plain",
      labels: "hide",
      icon: closeIcon,
    },
    "Close",
  );

  readonly #popover = h(
    "div",
    {
      popover: "manual",
      tabindex: "-1",
      "data-placement": "center",
      part: "surface",
    },
    h(
      "header",
      { part: "header" },
      h(
        "div",
        { class: "content" },
        this.#heading,
        h("div", { class: "body", id: "body", part: "body" }, h("slot")),
      ),
      this.#closeButton,
    ),
    h("footer", { part: "footer" }, h("slot", { name: "actions" })),
  );

  readonly #dismissal = new Dismissal(
    this,
    this.#popover,
    () => this.close(),
    () => this.#position(),
  );

  #anchor: Element | undefined;

  constructor() {
    super();
    this.heading = "";
    this.confirm = false;
    this.fit = false;
    this.sheetBelow = defaultSheetBelow;
    this.sheetBelowHeight = defaultSheetBelowHeight;
    this.closeLabel = "Close";
    this.discardQuestion = "Discard your changes?";
    this.keepLabel = "Keep editing";
    this.discardLabel = "Discard";
  }

  /** Whether its content has changed since it opened, so closing it asks first. */
  get dirty() {
    return this.#dismissal.dirty;
  }

  set dirty(dirty: boolean) {
    this.#dismissal.mark(dirty);
  }

  /** Opens next to `anchor`, or in the middle without one. */
  show(anchor?: Element) {
    this.#anchor = anchor;
    this.returnValue = "";
    this.#dismissal.reset();
    this.#popover.dataset.placement = this.#placementFor(anchor);
    this.#popover.showPopover();
  }

  close(value = "") {
    this.returnValue = value;

    if (this.#popover.matches(":popover-open")) this.#popover.hidePopover();
  }

  // Esc and a click outside close it at once, unless there are changes:
  // then Esc asks first and a click outside does nothing
  readonly #onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    event.stopPropagation();
    this.#dismissal.request();
  };

  readonly #onPointerdown = (event: PointerEvent) => {
    if (event.composedPath().includes(this)) return;

    if (!this.#dismissal.dirty) this.close();
  };

  #placementFor(anchor: Element | undefined) {
    if (
      opensAsSheet({
        below: this.sheetBelow,
        belowHeight: this.sheetBelowHeight,
      })
    ) {
      return "sheet";
    }

    return anchor === undefined ? "center" : "below";
  }

  /** Under the button, lined up with its right edge, or above it when there's more room there. */
  readonly #position = () => {
    const popover = this.#popover;
    const anchor = this.#anchor;
    const placement = this.#placementFor(anchor);

    if (anchor === undefined || placement === "sheet") {
      popover.style.top = "";
      popover.style.left = "";
      popover.style.maxHeight = "";
      popover.dataset.placement = placement;

      return;
    }

    popover.style.maxHeight = "";
    placeBeside(popover, anchor, { align: "space", gap });
  };

  readonly #onToggle = (event: ToggleEvent) => {
    if (event.newState === "open") {
      this.#position();
      window.addEventListener("resize", this.#position);
      window.addEventListener("scroll", this.#position, true);
      document.addEventListener("pointerdown", this.#onPointerdown, true);

      // An element marked `autofocus` in the content takes focus, such as
      // the field it's open to fill in; otherwise the close button does, so
      // Enter never confirms by accident
      const autofocus = this.querySelector("[autofocus]");

      (autofocus instanceof HTMLElement
        ? autofocus
        : this.#closeButton
      ).focus();

      return;
    }

    window.removeEventListener("resize", this.#position);
    window.removeEventListener("scroll", this.#position, true);
    document.removeEventListener("pointerdown", this.#onPointerdown, true);

    if (this.#anchor instanceof HTMLElement) this.#anchor.focus();

    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  };

  readonly #onAction = (event: Event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute("value")) {
      this.close(target.getAttribute("value") ?? "");
    }
  };

  override disconnectedCallback() {
    window.removeEventListener("resize", this.#position);
    window.removeEventListener("scroll", this.#position, true);
    document.removeEventListener("pointerdown", this.#onPointerdown, true);
    super.disconnectedCallback();
  }

  protected override create(root: ShadowRoot) {
    this.#popover.addEventListener("toggle", this.#onToggle);
    this.#popover.addEventListener("keydown", this.#onKeydown);
    this.#closeButton.addEventListener("click", () => {
      this.#dismissal.request();
    });
    this.#popover
      .querySelector("footer")
      ?.addEventListener("click", this.#onAction);
    root.append(this.#popover);
  }

  protected override update() {
    const popover = this.#popover;

    setAttribute(popover, "role", this.confirm ? "alertdialog" : "dialog");
    setAttribute(popover, "aria-labelledby", this.heading ? "heading" : "body");
    setAttribute(popover, "aria-describedby", this.heading ? "body" : null);
    this.#heading.textContent = this.heading;
    this.#heading.hidden = !this.heading;
    this.#closeButton.textContent = this.closeLabel;
    this.#dismissal.text(
      this.discardQuestion,
      this.keepLabel,
      this.discardLabel,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-popover": GwPopover;
  }
}
