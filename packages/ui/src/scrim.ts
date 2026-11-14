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
    pointer-events: auto;
  }
`;

/**
 * Whether `node` is `ancestor` or under it, crossing shadow roots, as the
 * browser counts it for full screen.
 */
const composedWithin = (ancestor: Element, node: Node) => {
  for (let at: Node | undefined = node; at !== undefined;) {
    if (ancestor.contains(at)) return true;

    const root = at.getRootNode();

    at = root instanceof ShadowRoot ? root.host : undefined;
  }

  return false;
};

const warned = new WeakSet<Element>();

/**
 * Chromium makes everything outside the full-screen element inert, top layer
 * or not, so an overlay opened outside it shows over it but can't be pressed
 * or scrolled. Moving it in for the app would close it, run its callbacks
 * again and change what it inherits, so this says so once instead.
 */
const warnOutsideFullscreen = (layer: Element) => {
  const fullscreen = document.fullscreenElement;

  if (fullscreen === null || composedWithin(fullscreen, layer)) return;

  const root = layer.getRootNode();
  const overlay = root instanceof ShadowRoot ? root.host : layer;

  if (warned.has(overlay)) return;

  warned.add(overlay);
  console.warn(
    `<${overlay.localName}> opened outside the full-screen element, so Chromium makes it inert: it shows, but nothing in it can be pressed or scrolled. Put it inside the element that goes full screen.`,
    overlay,
  );
};

/**
 * A manual popover that covers the page under an overlay. Put `element`
 * beside the overlay, `show()` it just before showing the overlay, so the
 * overlay sits over it in the top layer, and `hide()` it once the overlay
 * closes. A click on it calls `dismiss`; since the whole press lands on it,
 * the page never sees it, and focus stays in the overlay. Shown while
 * something outside it is full screen, it warns once in the console, since
 * Chromium leaves the overlay inert there.
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
    warnOutsideFullscreen(this.element);
    this.element.showPopover();
  }

  hide() {
    if (this.element.matches(":popover-open")) this.element.hidePopover();
  }
}
