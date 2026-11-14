/**
 * `Scrim`, a clear layer between an open overlay and the page, so a click or
 * tap outside the overlay only closes it: nothing beneath hovers, takes
 * focus or is pressed until it's gone. Every Groundwork overlay that isn't a
 * modal dialog uses it, and an app's own popover can too.
 * Docs: https://groundwork.timmo.dev/components/overlays/#clicks-outside
 *
 * @module
 */
import { css, h } from "./element.js";
import { adoptStyles } from "./fields.js";

/** Fills the viewport, clear, over the browser's popover styles. */
export const scrimStyles = css`
  .gw-scrim {
    inset: 0;
    width: auto;
    max-width: none;
    height: auto;
    max-height: none;
    padding: 0;
    margin: 0;
    background: transparent;
    border: 0;
  }
`;

/**
 * A manual popover that covers the page under an overlay. Put `element`
 * beside the overlay, `show()` it just before showing the overlay, so the
 * overlay sits over it in the top layer, and `hide()` it once the overlay
 * closes. A click on it calls `dismiss`; since the whole press lands on it,
 * the page never sees it, and focus stays in the overlay.
 */
export class Scrim {
  /** The layer, with the `gw-scrim` class and the `scrim` part. */
  readonly element = h("div", {
    class: "gw-scrim",
    part: "scrim",
    popover: "manual",
    "aria-hidden": "true",
  });

  constructor(dismiss: () => void) {
    this.element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
    });

    this.element.addEventListener("click", dismiss);
  }

  /** Covers the page, under whatever shows after it. */
  show() {
    if (this.element.matches(":popover-open")) return;

    adoptStyles(this.element, scrimStyles);
    this.element.showPopover();
  }

  hide() {
    if (this.element.matches(":popover-open")) this.element.hidePopover();
  }
}
