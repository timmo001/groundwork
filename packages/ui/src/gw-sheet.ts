/**
 * `gw-sheet`: a panel that slides in from an edge of the screen.
 * Docs: https://groundwork.timmo.dev/components/overlays/#sheet
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import { base } from "./styles.js";

// MDI's chevrons, pointing the way the sheet leaves when it closes
const chevrons = {
  start: "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
  end: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  bottom: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
} as const;

type Side = keyof typeof chevrons;

/** Below this width, `side="auto"` slides up from the bottom. */
const bottomBelow = "40rem";

/**
 * A panel of filters, settings or details that slides in from an edge of the
 * screen over the page, rather than taking a place in its layout. With
 * `side="auto"` it comes from the start edge, full height, and from the
 * bottom below `bottom-below`, 40rem wide by default.
 *
 * It's on the Popover API, in the top layer, and closes on Esc, a click
 * outside or its close button, whose chevron points the way it leaves. Open
 * it with `show()`, or `toggle()` from the button that opens it. Its content
 * scrolls under a header with the heading and an `actions` slot, such as a
 * Clear button.
 *
 * @element gw-sheet
 * @summary A panel that slides in from an edge of the screen.
 *
 * @attr {string} heading - The heading beside the close button.
 * @attr {"auto"|"start"|"end"|"bottom"} side - The edge it slides in from. `auto` is the start edge, or the bottom below `bottom-below`. Defaults to `auto`.
 * @attr {string} bottom-below - The viewport width, as a CSS length, below which `side="auto"` slides up from the bottom. Defaults to `40rem`.
 * @attr {string} close-label - The close button's name, for an app in another language. Defaults to `Close`.
 *
 * @slot - The content, which scrolls.
 * @slot actions - Buttons in the header, after the heading.
 *
 * @csspart surface - The sheet's surface.
 * @csspart header - The row with the close button, heading and actions.
 * @csspart close - The close button, a `gw-button`.
 * @csspart heading - The heading.
 * @csspart body - The content.
 *
 * @cssprop --gw-sheet-width - Its width from the start or end edge. Defaults to `20rem`.
 * @cssprop --gw-sheet-height - Its greatest height from the bottom. Defaults to `85vh`.
 * @cssprop --gw-sheet-close-scale - Scales the close button, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-sheet-background - The surface. Defaults to `--gw-color-surface-overlay`.
 * @cssprop --gw-sheet-border-color - The border on its open edge. Defaults to `--gw-color-border-normal`.
 * @cssprop --gw-sheet-radius - The corners of a bottom sheet. Defaults to `--gw-radius-panel`.
 * @cssprop --gw-sheet-shadow - The shadow. Defaults to `--gw-shadow-l`.
 * @cssprop --gw-sheet-backdrop - The backdrop over the page. Defaults to `rgb(0 0 0 / 40%)`.
 *
 * @fires {Event} close - When it closes.
 */
export class GwSheet extends GwElement {
  static override properties = {
    heading: {},
    side: { reflect: true },
    bottomBelow: { attribute: "bottom-below" },
    closeLabel: { attribute: "close-label" },
  } as const;

  static override styles = [
    base,
    css`
      [popover] {
        position: fixed;
        box-sizing: border-box;
        flex-direction: column;
        padding: 0;
        margin: 0;
        overflow: hidden;
        color: var(--gw-color-text-primary);
        background: var(--gw-sheet-background, var(--gw-color-surface-overlay));
        border: 0 solid
          var(--gw-sheet-border-color, var(--gw-color-border-normal));
        box-shadow: var(--gw-sheet-shadow, var(--gw-shadow-l));
        transition:
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      [popover]:popover-open {
        display: flex;
        translate: 0 0;
      }

      /* The page dims as the sheet slides in, and back as it leaves */
      [popover]::backdrop {
        background: rgb(0 0 0 / 0%);
        transition:
          background-color var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      [popover]:popover-open::backdrop {
        background: var(--gw-sheet-backdrop, rgb(0 0 0 / 40%));
      }

      @starting-style {
        [popover]:popover-open::backdrop {
          background: rgb(0 0 0 / 0%);
        }
      }

      /* Full height from the start or end edge */
      [data-side="start"],
      [data-side="end"] {
        inset: 0 auto;
        width: min(var(--gw-sheet-width, 20rem), 100vw);
        height: 100%;
        max-height: none;
      }

      [data-side="start"] {
        inset-inline-start: 0;
        border-inline-end-width: max(var(--gw-border-width), 1px);
        translate: -100% 0;
      }

      [data-side="end"] {
        inset-inline-end: 0;
        border-inline-start-width: max(var(--gw-border-width), 1px);
        translate: 100% 0;
      }

      :host(:dir(rtl)) [data-side="start"] {
        translate: 100% 0;
      }

      :host(:dir(rtl)) [data-side="end"] {
        translate: -100% 0;
      }

      /* Up from the bottom, with room for the phone's home bar */
      [data-side="bottom"] {
        inset: auto 0 0;
        width: 100%;
        max-width: none;
        max-height: var(--gw-sheet-height, 85vh);
        padding-block-end: env(safe-area-inset-bottom);
        border-block-start-width: max(var(--gw-border-width), 1px);
        border-start-start-radius: var(
          --gw-sheet-radius,
          var(--gw-radius-panel)
        );
        border-start-end-radius: var(--gw-sheet-radius, var(--gw-radius-panel));
        translate: 0 100%;
      }

      @starting-style {
        [data-side="start"]:popover-open {
          translate: -100% 0;
        }

        [data-side="end"]:popover-open {
          translate: 100% 0;
        }

        [data-side="bottom"]:popover-open {
          translate: 0 100%;
        }
      }

      header {
        display: flex;
        flex: none;
        gap: var(--gw-space-2);
        align-items: center;
        padding: var(--gw-space-2) var(--gw-space-3);
        border-block-end: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      h2 {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .close {
        --gw-button-scale: var(--gw-sheet-close-scale, 0.8);
      }

      .body {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gw-space-3);
        min-height: 0;
        padding: var(--gw-space-4);
        /* It scrolls down only, so content reaching into its padding never
           makes it scroll sideways */
        overflow: hidden auto;
        overscroll-behavior: contain;
      }
    `,
  ];

  declare heading: string;
  declare side: "auto" | Side;
  /** The viewport width, as a CSS length, below which `side="auto"` slides up from the bottom. */
  declare bottomBelow: string;
  /** The close button's name, for an app in another language. */
  declare closeLabel: string;

  readonly #heading = h("h2", { id: "heading", part: "heading" });

  readonly #closeButton = h(
    "gw-button",
    {
      class: "close",
      part: "close",
      variant: "neutral",
      appearance: "plain",
      labels: "hide",
    },
    "Close",
  );

  readonly #surface: HTMLDivElement = h(
    "div",
    {
      popover: "auto",
      role: "dialog",
      tabindex: "-1",
      part: "surface",
    },
    h(
      "header",
      { part: "header" },
      this.#closeButton,
      this.#heading,
      h("slot", { name: "actions" }),
    ),
    h("div", { class: "body", part: "body" }, h("slot")),
  );

  #narrow = window.matchMedia(`(width < ${bottomBelow})`);

  // Where focus was before it opened, to go back to when it closes
  #returnFocus: HTMLElement | undefined;

  constructor() {
    super();
    this.heading = "";
    this.side = "auto";
    this.bottomBelow = bottomBelow;
    this.closeLabel = "Close";
  }

  /** Whether it's open. */
  get open() {
    return this.#surface.matches(":popover-open");
  }

  show() {
    if (this.open) return;

    const active = document.activeElement;

    this.#returnFocus = active instanceof HTMLElement ? active : undefined;
    this.#place();
    this.#surface.showPopover();
  }

  close() {
    if (this.open) this.#surface.hidePopover();
  }

  /** Opens it, or closes it if it's open, as the button that opens it would. */
  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  /** The edge it comes from now, with `auto` settled by the screen's width. */
  #edge(): Side {
    if (this.side !== "auto") return this.side;

    return this.#narrow.matches ? "bottom" : "start";
  }

  readonly #place = () => {
    const edge = this.#edge();

    this.#surface.dataset.side = edge;
    this.#closeButton.icon = chevrons[edge];
  };

  readonly #onToggle = (event: ToggleEvent) => {
    if (event.newState === "open") {
      this.#narrow.addEventListener("change", this.#place);
      this.#closeButton.focus();

      return;
    }

    this.#narrow.removeEventListener("change", this.#place);
    this.#returnFocus?.focus();
    this.#returnFocus = undefined;
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  };

  override disconnectedCallback() {
    this.#narrow.removeEventListener("change", this.#place);
    super.disconnectedCallback();
  }

  protected override create(root: ShadowRoot) {
    this.#surface.addEventListener("toggle", this.#onToggle);
    this.#closeButton.addEventListener("click", () => this.close());
    root.append(this.#surface);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("bottomBelow")) {
      const { open } = this;

      if (open) this.#narrow.removeEventListener("change", this.#place);

      this.#narrow = window.matchMedia(`(width < ${this.bottomBelow})`);

      if (open) this.#narrow.addEventListener("change", this.#place);
    }

    this.#heading.textContent = this.heading;
    setAttribute(
      this.#surface,
      "aria-labelledby",
      this.heading ? "heading" : null,
    );
    this.#heading.hidden = !this.heading;
    this.#closeButton.textContent = this.closeLabel;
    this.#place();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-sheet": GwSheet;
  }
}
