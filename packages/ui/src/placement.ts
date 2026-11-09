/**
 * `placeBeside`, which puts a fixed popup under or over the control that
 * opened it, as `gw-popover` and `gw-select` do, so an app's own popups
 * open the same way without either element.
 *
 * @module
 */

/** How `placeBeside` lines a popup up and fits it in. */
export interface PlaceOptions {
  /**
   * Which edge of the anchor the popup lines up with: `start`, or `space`
   * for the edge on whichever side of the window has more room, so it opens
   * toward the space rather than across the content. Defaults to `start`.
   */
  readonly align?: "start" | "space";
  /** The space between the anchor and the popup, and kept from the window's edges, in pixels. Defaults to 8. */
  readonly gap?: number;
  /**
   * Shrinks the popup to the room there is, in pixels, when it's taller.
   * Defaults to capping its `max-height`, so it scrolls within the room.
   */
  readonly fit?: (room: number) => void;
}

/**
 * Places a `position: fixed` popup, such as one in the top layer, below its
 * anchor while it fits there or there's more room below than above, and
 * above it otherwise. It sets the popup's `top` and `left`, and
 * `data-placement` (`below` or `above`) and `data-side` (`start` or `end`)
 * for styles that follow the side, such as a transform origin. Call it when
 * the popup opens and again on resize and scroll.
 */
export const placeBeside = (
  popup: HTMLElement,
  anchor: Element,
  { align = "start", gap = 8, fit }: PlaceOptions = {},
) => {
  const rect = anchor.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - gap;
  const fitsBelow = below >= popup.offsetHeight || below >= rect.top;
  const room = fitsBelow ? below - gap : rect.top - 2 * gap;

  if (popup.offsetHeight > room) {
    if (fit === undefined) popup.style.maxHeight = `${room}px`;
    else fit(room);
  }

  const fromStart =
    align === "start" || rect.left + rect.width / 2 < window.innerWidth / 2;

  const preferred = fromStart ? rect.left : rect.right - popup.offsetWidth;

  const left = Math.min(
    Math.max(gap, preferred),
    window.innerWidth - popup.offsetWidth - gap,
  );

  popup.dataset.placement = fitsBelow ? "below" : "above";
  popup.dataset.side = fromStart ? "start" : "end";
  popup.style.top = `${fitsBelow ? rect.bottom + gap : Math.max(gap, rect.top - gap - popup.offsetHeight)}px`;
  popup.style.left = `${left}px`;
};
