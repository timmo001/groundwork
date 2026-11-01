/**
 * `gw-popover`: a small surface anchored to the button that opened it.
 * Docs: https://groundwork.timmo.dev/components/overlays/#popover
 *
 * @module
 */
import { Dismissal, dismissalStyles } from "./dismiss.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-button.js";
import { base } from "./styles.js";

const gap = 8;

// MDI's close
const closeIcon =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/** Below this width the popover is a bottom sheet, as Home Assistant's adaptive dialogs are. */
const sheetBelow = 600;

/**
 * A confirmation, rename or small form that opens next to the button that
 * asked for it, rather than as a dialog in the middle of the screen. On
 * narrow screens it's a bottom sheet. Opened without a button, such as after
 * a save, it sits in the middle like a dialog.
 *
 * It's on the Popover API, in the top layer, and closes on Esc or a click
 * outside. Open it with `show(anchor)`. Put buttons in the `actions` slot: a
 * click on one with a `value` closes it with that value, and fires `close`.
 * `confirm` makes it an `alertdialog`, for a question that needs an answer.
 *
 * @element gw-popover
 * @summary A small surface anchored to the button that opened it.
 *
 * @attr {string} heading - The heading beside the close button.
 * @attr {boolean} confirm - Makes it an `alertdialog`, for a question that needs an answer.
 *
 * @slot - The content.
 * @slot actions - Buttons; one with a `value` closes it with that value.
 *
 * @cssprop --gw-popover-width - Its width beside a button. Defaults to `20rem`.
 *
 * @fires {Event} close - When it closes; `returnValue` holds the button's value.
 */
export class GwPopover extends GwElement {
  static override properties = {
    heading: {},
    confirm: { type: "boolean" },
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
        padding: var(--gw-space-4);
        margin: 0;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-overlay);
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        box-shadow: var(--gw-shadow-l);
        opacity: 0;
        scale: 0.96;
        transition:
          opacity var(--gw-motion-fast) var(--gw-motion-easing),
          scale var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
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
        background: rgb(0 0 0 / 40%);
      }

      /* A bottom sheet on narrow screens, sliding up from the edge */
      [data-placement="sheet"] {
        inset: auto 0 0;
        width: 100%;
        max-width: none;
        padding-block-end: calc(
          var(--gw-space-4) + env(safe-area-inset-bottom)
        );
        border-end-start-radius: 0;
        border-end-end-radius: 0;
        scale: 1;
        translate: 0 100%;
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
        background: rgb(0 0 0 / 40%);
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

  /** The value of the action that closed it, or "" for Esc or a click outside. */
  returnValue = "";

  readonly #heading = h("h2", { id: "heading" });

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

  readonly #popover = h(
    "div",
    { popover: "manual", tabindex: "-1", "data-placement": "center" },
    h(
      "header",
      {},
      h(
        "div",
        { class: "content" },
        this.#heading,
        h("div", { class: "body", id: "body" }, h("slot")),
      ),
      this.#closeButton,
    ),
    h("footer", {}, h("slot", { name: "actions" })),
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
    if (window.innerWidth < sheetBelow) return "sheet";

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
      popover.dataset.placement = placement;

      return;
    }

    const rect = anchor.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - gap;
    const fitsBelow = below >= popover.offsetHeight || below >= rect.top;

    // Lined up with the button's edge on its side of the screen, so the
    // popover opens toward the space rather than across the content
    const fromStart = rect.left + rect.width / 2 < window.innerWidth / 2;
    const preferred = fromStart ? rect.left : rect.right - popover.offsetWidth;

    const left = Math.min(
      Math.max(gap, preferred),
      window.innerWidth - popover.offsetWidth - gap,
    );

    popover.dataset.side = fromStart ? "start" : "end";

    popover.dataset.placement = fitsBelow ? "below" : "above";
    popover.style.top = `${fitsBelow ? rect.bottom + gap : Math.max(gap, rect.top - gap - popover.offsetHeight)}px`;
    popover.style.left = `${left}px`;
  };

  readonly #onToggle = (event: ToggleEvent) => {
    if (event.newState === "open") {
      this.#position();
      window.addEventListener("resize", this.#position);
      window.addEventListener("scroll", this.#position, true);
      document.addEventListener("pointerdown", this.#onPointerdown, true);

      // The close button takes focus, so Enter never confirms by accident
      this.#closeButton.focus();

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
  }
}

GwPopover.define("gw-popover");

declare global {
  interface HTMLElementTagNameMap {
    "gw-popover": GwPopover;
  }
}
