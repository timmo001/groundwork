/**
 * `gw-page`, `gw-stack`, `gw-row` and `gw-grid`: page width and spacing.
 * Docs: https://groundwork.timmo.dev/components/layout/#stack-row-and-grid
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-button.js";
import { type ScrollButtons, scrollButtons } from "./scroll-buttons.js";
import { base, contentWidths } from "./styles.js";

/**
 * Centers a page's content at `--gw-content-width`, with the page gap between
 * its children. `size` picks one of the standard widths instead; give
 * `gw-app-bar` the same `size` so its content lines up.
 *
 * @element gw-page
 * @summary A page's content column.
 *
 * @attr {"narrow"|"default"|"wide"|"full"} size - The standard width it keeps to: `narrow` for forms and settings, `wide` for tables and dashboards, `full` for the whole window less the edge gap. Defaults to `default`.
 * @attr {boolean} narrow - The same as `size="narrow"`.
 *
 * @slot - The page's content.
 *
 * @csspart page - The content column.
 *
 * @cssprop --gw-content-width - The content's widest. Defaults to the theme's, 90rem; `size` sets it from `--gw-content-width-narrow` or `--gw-content-width-wide`.
 */
export class GwPage extends GwElement {
  static override properties = {
    size: { reflect: true },
    narrow: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    contentWidths,
    css`
      :host {
        display: block;
      }

      .page {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-6);
        /* The same box as gw-app-bar's content, so the two line up */
        width: min(100% - 2 * var(--gw-space-3), var(--gw-content-width));
        margin-inline: auto;
      }

      :host([narrow]) {
        --gw-content-width: var(--gw-content-width-narrow);
      }
    `,
  ];

  declare size: "narrow" | "default" | "wide" | "full";
  declare narrow: boolean;

  constructor() {
    super();
    this.size = "default";
    this.narrow = false;
  }

  protected override create(root: ShadowRoot) {
    root.append(h("div", { class: "page", part: "page" }, h("slot")));
  }
}

const gaps = css`
  :host([gap="s"]) {
    --gw-gap: var(--gw-space-1);
  }

  :host([gap="l"]) {
    --gw-gap: var(--gw-space-6);
  }
`;

/* Where the children sit along the line (`justify`) and across it (`align`).
   `safe` keeps overflowing children from being cut off at the start. */
const alignment = css`
  :host([justify="start"]) {
    justify-content: flex-start;
  }

  :host([justify="center"]) {
    justify-content: safe center;
  }

  :host([justify="end"]) {
    justify-content: safe flex-end;
  }

  :host([justify="between"]) {
    justify-content: space-between;
  }

  :host([align="start"]) {
    align-items: flex-start;
  }

  :host([align="center"]) {
    align-items: safe center;
  }

  :host([align="end"]) {
    align-items: safe flex-end;
  }

  :host([align="stretch"]) {
    align-items: stretch;
  }
`;

/** A layout element whose shadow root is a single slot. */
class GwSlotted extends GwElement {
  protected override create(root: ShadowRoot) {
    root.append(h("slot"));
  }
}

/**
 * Stacks its children in a column.
 *
 * @element gw-stack
 * @summary Children in a column.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 * @attr {"start"|"center"|"end"|"between"} justify - Where the children sit in the column's height, when it's taller than they are. `center` keeps them in the middle unless they overflow.
 * @attr {"start"|"center"|"end"|"stretch"} align - Where the children sit across the column. Defaults to `stretch`.
 *
 * @slot - The children.
 *
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-3`.
 */
export class GwStack extends GwSlotted {
  static override styles = [
    base,
    gaps,
    alignment,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-gap, var(--gw-space-3));
      }
    `,
  ];
}

/* A row that scrolls sideways on one line rather than wrapping. The host
   holds the scroll buttons over the track, which scrolls: its children keep
   their size, and its padding keeps their focus rings from being clipped.
   A focused child scrolls clear of the fade and the buttons. */
const scrolling = (host: string) => `
  ${host} {
    position: relative;
    flex-wrap: nowrap;
  }

  ${host} .track {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    gap: inherit;
    justify-content: inherit;
    align-items: inherit;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    padding: var(--_gw-row-ring);
    margin: calc(-1 * var(--_gw-row-ring));
    scroll-padding-inline: max(var(--_gw-row-fade), var(--_gw-row-button));
  }

  ${host} ::slotted(*) {
    flex-shrink: 0;
  }
`;

// MDI's chevrons
const chevrons = {
  left: "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
  right: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
} as const;

/**
 * Lines its children up in a row, wrapping when they run out of room.
 *
 * With `scroll` it keeps them on one line and scrolls sideways instead, such
 * as a row of presets or filter chips on a phone: touch scrolls it, a mouse
 * drags it without the release clicking what's under it, the ends fade on
 * the side with more to scroll, and a child focused from the keyboard
 * scrolls into view. A ‹ or › button over each end scrolls it by about a
 * view, shown only while there's more that way (`scrollButtons`), and
 * `no-scroll-buttons` leaves them out. `scroll="narrow"` wraps on a larger
 * screen and scrolls only on a narrow or short one, under 600px wide or
 * 500px tall, the same rule that turns popups into bottom sheets.
 *
 * @element gw-row
 * @summary Children in a wrapping or scrolling row.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 * @attr {boolean} nowrap - Keeps the children on one line.
 * @attr {""|"narrow"} scroll - Keeps the children on one line and scrolls sideways when they don't fit. `narrow` does that only under 600px wide or 500px tall, and wraps elsewhere.
 * @attr {boolean} no-scroll-buttons - Leaves out the buttons that scroll a `scroll` row.
 * @attr {string} scroll-left-label - The name of the button that scrolls left, for an app in another language. Defaults to `Scroll left`.
 * @attr {string} scroll-right-label - The name of the button that scrolls right. Defaults to `Scroll right`.
 * @attr {"start"|"center"|"end"|"between"} justify - Where the children sit along the row. Defaults to `start`.
 * @attr {"start"|"center"|"end"|"stretch"} align - Where the children sit in the row's height. Defaults to `center`.
 *
 * @slot - The children.
 *
 * @csspart track - What scrolls in a `scroll` row, around the children.
 * @csspart scroll-button - Each scroll button, a `gw-button`.
 * @csspart scroll-start - The button that scrolls toward the start, left in a left-to-right page.
 * @csspart scroll-end - The button that scrolls toward the end.
 *
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-2`.
 * @cssprop --gw-row-fade - How far the ends fade while there's more to scroll that way. Defaults to `1.5rem`.
 * @cssprop --gw-row-scroll-button-scale - The scroll buttons' size, as `--gw-button-scale`. Defaults to `1.1`, 44px.
 */
export class GwRow extends GwElement {
  static override properties = {
    scrollMode: { attribute: "scroll" },
    noScrollButtons: {
      type: "boolean",
      reflect: true,
      attribute: "no-scroll-buttons",
    },
    scrollLeftLabel: { attribute: "scroll-left-label" },
    scrollRightLabel: { attribute: "scroll-right-label" },
  } as const;

  static override styles = [
    base,
    gaps,
    css`
      :host {
        --_gw-row-fade: var(--gw-row-fade, 1.5rem);
        --_gw-row-ring: calc(var(--gw-focus-width) + var(--gw-focus-offset));
        --_gw-row-button-scale: var(--gw-row-scroll-button-scale, 1.1);
        --_gw-row-button: calc(
          2.5rem * var(--_gw-row-button-scale) * var(--gw-control-scale, 1)
        );
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-gap, var(--gw-space-2));
        align-items: center;
      }

      :host([nowrap]) {
        flex-wrap: nowrap;
      }

      .track {
        display: contents;
      }

      ${scrolling(':host([scroll]:not([scroll="narrow"]))')}

      @media (width < 600px), (height < 500px) {
        ${scrolling(':host([scroll="narrow"])')}
      }

      .scroll-button {
        --gw-button-scale: var(--_gw-row-button-scale);
        position: absolute;
        z-index: 1;
        inset-block-start: 50%;
        translate: 0 -50%;
        border-radius: var(--gw-radius-pill);
        background: var(--gw-color-surface-overlay);
        box-shadow: var(--gw-shadow-m);
      }

      .start {
        inset-inline-start: 0;
      }

      .end {
        inset-inline-end: 0;
      }

      :host([no-scroll-buttons]) .scroll-button {
        display: none;
      }

      :host(:state(more-start)) {
        --_gw-row-fade-start: var(--_gw-row-fade);
      }

      :host(:state(more-end)) {
        --_gw-row-fade-end: var(--_gw-row-fade);
      }

      :host(:state(overflowing)) .track {
        cursor: grab;
        user-select: none;
        mask-image: linear-gradient(
          to right,
          transparent,
          #000 var(--_gw-row-fade-start, 0px),
          #000 calc(100% - var(--_gw-row-fade-end, 0px)),
          transparent
        );
      }

      :host(:state(overflowing):dir(rtl)) .track {
        mask-image: linear-gradient(
          to left,
          transparent,
          #000 var(--_gw-row-fade-start, 0px),
          #000 calc(100% - var(--_gw-row-fade-end, 0px)),
          transparent
        );
      }

      /* Nothing under the pointer takes the drag's release as a click */
      :host(:state(dragging)) .track {
        cursor: grabbing;
      }

      :host(:state(dragging)) ::slotted(*) {
        pointer-events: none;
      }
    `,
    alignment,
  ];

  declare scrollMode: "" | "narrow" | undefined;
  declare noScrollButtons: boolean;
  declare scrollLeftLabel: string | undefined;
  declare scrollRightLabel: string | undefined;

  readonly #internals = this.attachInternals();

  readonly #slot = h("slot");

  readonly #track = h("div", { class: "track", part: "track" }, this.#slot);

  readonly #start = this.#scrollButton("start");

  readonly #end = this.#scrollButton("end");

  #buttons: ScrollButtons | undefined;

  #drag:
    | { readonly id: number; readonly x: number; readonly left: number }
    | undefined;

  #dragging = false;

  // Set from a press until just after it ends, so focus a click gives a
  // child doesn't scroll it, moving it out from under the pointer
  #pressing = false;

  // Set when a drag ends, until the click its release fires is swallowed
  #dragged = false;

  constructor() {
    super();
    this.scrollMode = undefined;
    this.noScrollButtons = false;
    this.scrollLeftLabel = undefined;
    this.scrollRightLabel = undefined;
    this.addEventListener("pointerdown", this.#onPointerDown);
    this.addEventListener("pointermove", this.#onPointerMove);
    this.addEventListener("pointerup", this.#onPointerEnd);
    this.addEventListener("pointercancel", this.#onPointerEnd);
    this.addEventListener("lostpointercapture", this.#onPointerEnd);
    this.addEventListener("click", this.#onClick, { capture: true });
    this.addEventListener("dragstart", this.#onDragStart);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #scrollButton(side: "start" | "end") {
    return h("gw-button", {
      class: `scroll-button ${side}`,
      part: `scroll-button scroll-${side}`,
      variant: "neutral",
      appearance: "outlined",
      labels: "hide",
      hidden: true,
    });
  }

  protected override create(root: ShadowRoot) {
    this.#slot.addEventListener("slotchange", () => this.#buttons?.update());
    root.append(this.#start, this.#track, this.#end);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("scrollMode")) this.#attach();

    if (changed.has("scrollLeftLabel") || changed.has("scrollRightLabel"))
      this.#label();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#attach();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#detach();
  }

  // Watches the row only while it can scroll, since most rows never do
  #attach() {
    this.#detach();

    if (this.scrollMode === undefined || !this.isConnected) return;

    this.#label();
    this.#buttons = scrollButtons(this.#track, {
      start: this.#start,
      end: this.#end,
      items: () => this.#slot.assignedElements(),
      onChange: (edges) => {
        this.#setState("overflowing", edges.overflowing);
        this.#setState("more-start", edges.moreStart);
        this.#setState("more-end", edges.moreEnd);
      },
    });
  }

  #detach() {
    this.#buttons?.stop();
    this.#buttons = undefined;
    this.#start.hidden = true;
    this.#end.hidden = true;

    for (const name of ["overflowing", "more-start", "more-end", "dragging"])
      this.#setState(name, false);
  }

  // The buttons name and point the way they scroll on screen, so the start
  // one is the right one in a right-to-left page
  #label() {
    const left = {
      text: this.scrollLeftLabel ?? "Scroll left",
      icon: chevrons.left,
    };

    const right = {
      text: this.scrollRightLabel ?? "Scroll right",
      icon: chevrons.right,
    };

    const rtl = getComputedStyle(this).direction === "rtl";

    for (const [button, { text, icon }] of [
      [this.#start, rtl ? right : left],
      [this.#end, rtl ? left : right],
    ] as const) {
      button.textContent = text;
      button.setAttribute("icon", icon);
    }
  }

  #setState(name: string, on: boolean) {
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  readonly #onPointerDown = (event: PointerEvent) => {
    this.#pressing = true;
    this.#dragged = false;

    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !this.#internals.states.has("overflowing") ||
      event
        .composedPath()
        .some((target) => target === this.#start || target === this.#end)
    )
      return;

    this.#drag = {
      id: event.pointerId,
      x: event.clientX,
      left: this.#track.scrollLeft,
    };
  };

  readonly #onPointerMove = (event: PointerEvent) => {
    const drag = this.#drag;

    if (drag === undefined || event.pointerId !== drag.id) return;

    const moved = event.clientX - drag.x;

    // A small wobble while pressing a child is still a click
    if (!this.#dragging) {
      if (Math.abs(moved) < 4) return;

      this.#dragging = true;
      this.setPointerCapture(drag.id);
      this.#setState("dragging", true);
    }

    this.#track.scrollLeft = drag.left - moved;
  };

  readonly #onPointerEnd = (event: PointerEvent) => {
    setTimeout(() => {
      this.#pressing = false;
    });

    if (this.#drag?.id !== event.pointerId) return;

    this.#drag = undefined;

    if (!this.#dragging) return;

    this.#dragging = false;
    this.#dragged = true;
    this.#setState("dragging", false);

    // The click, if any, comes in the same task as the release
    setTimeout(() => {
      this.#dragged = false;
    });
  };

  readonly #onClick = (event: MouseEvent) => {
    if (!this.#dragged) return;

    this.#dragged = false;
    event.preventDefault();
    event.stopPropagation();
  };

  // A link or image would start a native drag instead of scrolling
  readonly #onDragStart = (event: DragEvent) => {
    if (this.#internals.states.has("overflowing")) event.preventDefault();
  };

  readonly #onFocusIn = (event: FocusEvent) => {
    if (this.#pressing || !this.#internals.states.has("overflowing")) return;

    const target = event.target;

    if (!(target instanceof Node)) return;

    const child = [...this.children].find((item) => item.contains(target));

    child?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
}

/**
 * Fills as many columns as fit, each at least `--gw-grid-min` wide, and at
 * most `max` of them when it's set.
 *
 * @element gw-grid
 * @summary Children in responsive columns.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 * @attr {"2"|"3"|"4"|"5"|"6"} max - The most columns it shows. Sets `--gw-grid-max`.
 *
 * @slot - The children.
 *
 * @cssprop --gw-grid-min - The narrowest a column gets. Defaults to `18rem`.
 * @cssprop --gw-grid-max - The most columns it shows, as a number. Unset by default, so as many fit as the width allows.
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-3`.
 */
export class GwGrid extends GwSlotted {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        /* A column's width at the cap. Invalid while --gw-grid-max is unset,
           so the var() below falls back to 0px and the cap does nothing */
        --_gw-grid-cap: calc(
          (100% - (var(--gw-grid-max) - 1) * var(--gw-gap, var(--gw-space-3))) /
            var(--gw-grid-max)
        );
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(
            min(100%, max(var(--gw-grid-min, 18rem), var(--_gw-grid-cap, 0px))),
            1fr
          )
        );
        gap: var(--gw-gap, var(--gw-space-3));
      }

      :host([max="2"]) {
        --gw-grid-max: 2;
      }

      :host([max="3"]) {
        --gw-grid-max: 3;
      }

      :host([max="4"]) {
        --gw-grid-max: 4;
      }

      :host([max="5"]) {
        --gw-grid-max: 5;
      }

      :host([max="6"]) {
        --gw-grid-max: 6;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-page": GwPage;
    "gw-stack": GwStack;
    "gw-row": GwRow;
    "gw-grid": GwGrid;
  }
}
