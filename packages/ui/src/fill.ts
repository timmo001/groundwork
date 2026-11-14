/**
 * `fillWindow`, which keeps a view that fills the window, such as a player
 * or a map, measured from its own top edge, so it takes the height under the
 * app bar and any banners and the page never scrolls behind it.
 * Docs: https://groundwork.timmo.dev/foundations/layout/#filling-the-window
 *
 * @module
 */

/**
 * Keeps each element's `--gw-fill-top` at its distance from the top of the
 * page, for styles that size it from the window's height:
 * `block-size: calc(100dvh - var(--gw-fill-top, 0px))`. It's measured again
 * as the page's height changes, such as a banner coming or going, as the
 * window resizes, and after full screen. A hidden element, or one in full
 * screen, keeps its last value. Returns a function that stops measuring.
 */
export const fillWindow = (...elements: readonly HTMLElement[]) => {
  const measure = () => {
    for (const element of elements) {
      if (
        element.getClientRects().length === 0 ||
        document.fullscreenElement === element
      ) {
        continue;
      }

      element.style.setProperty(
        "--gw-fill-top",
        `${element.getBoundingClientRect().top + window.scrollY}px`,
      );
    }
  };

  const observer = new ResizeObserver(measure);

  observer.observe(document.body);
  window.addEventListener("resize", measure);
  document.addEventListener("fullscreenchange", measure);
  measure();

  return () => {
    observer.disconnect();
    window.removeEventListener("resize", measure);
    document.removeEventListener("fullscreenchange", measure);
  };
};
