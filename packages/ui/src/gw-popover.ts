import { LitElement, css, html, nothing } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { base } from "./styles.js";

const gap = 8;

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
 */
export class GwPopover extends LitElement {
  static override properties = {
    heading: {},
    confirm: { type: Boolean },
    placement: { state: true },
  };

  static override styles = [
    base,
    css`
      [popover] {
        position: fixed;
        inset: unset;
        box-sizing: border-box;
        width: min(20rem, calc(100vw - 2 * ${gap}px));
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
  declare placement: "below" | "above" | "center" | "sheet";

  /** The value of the action that closed it, or "" for Esc or a click outside. */
  returnValue = "";

  readonly #popover = createRef<HTMLElement>();

  #anchor: Element | undefined;

  constructor() {
    super();
    this.heading = "";
    this.confirm = false;
    this.placement = "center";
  }

  /** Opens next to `anchor`, or in the middle without one. */
  show(anchor?: Element) {
    this.#anchor = anchor;
    this.returnValue = "";
    this.placement = this.#placementFor(anchor);
    this.#popover.value?.showPopover();
  }

  close(value = "") {
    this.returnValue = value;
    this.#popover.value?.hidePopover();
  }

  #placementFor(anchor: Element | undefined) {
    if (window.innerWidth < sheetBelow) return "sheet";

    return anchor === undefined ? "center" : "below";
  }

  /** Under the button, lined up with its right edge, or above it when there's more room there. */
  readonly #position = () => {
    const popover = this.#popover.value;
    const anchor = this.#anchor;

    if (popover === undefined) return;

    const placement = this.#placementFor(anchor);

    if (anchor === undefined || placement === "sheet") {
      popover.style.top = "";
      popover.style.left = "";
      this.placement = placement;

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

    this.placement = fitsBelow ? "below" : "above";
    popover.style.top = `${fitsBelow ? rect.bottom + gap : Math.max(gap, rect.top - gap - popover.offsetHeight)}px`;
    popover.style.left = `${left}px`;
  };

  readonly #onToggle = (event: ToggleEvent) => {
    if (event.newState === "open") {
      this.#position();
      window.addEventListener("resize", this.#position);
      window.addEventListener("scroll", this.#position, true);

      // The first action, usually Cancel, so Enter never confirms by accident
      const first = this.querySelector("[slot='actions']");

      if (first instanceof HTMLElement) first.focus();

      return;
    }

    window.removeEventListener("resize", this.#position);
    window.removeEventListener("scroll", this.#position, true);

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
    super.disconnectedCallback();
  }

  override render() {
    return html`<div
      ${ref(this.#popover)}
      popover
      role=${this.confirm ? "alertdialog" : "dialog"}
      aria-labelledby=${this.heading ? "heading" : "body"}
      aria-describedby=${this.heading ? "body" : nothing}
      data-placement=${this.placement}
      @toggle=${this.#onToggle}
    >
      ${this.heading ? html`<h2 id="heading">${this.heading}</h2>` : nothing}
      <div class="body" id="body"><slot></slot></div>
      <footer @click=${this.#onAction}><slot name="actions"></slot></footer>
    </div>`;
  }
}

customElements.define("gw-popover", GwPopover);

declare global {
  interface HTMLElementTagNameMap {
    "gw-popover": GwPopover;
  }
}
