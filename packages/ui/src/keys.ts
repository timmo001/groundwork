/**
 * `listIndex`, the keyboard moves of a menu or list: the arrow keys, Home,
 * End and Page Up or Down, as `gw-option-list` and `gw-menu-button` use
 * them, so an app's own list moves the same way.
 *
 * @module
 */

/**
 * The index a key moves to from `index` in a list of `length` items: the
 * arrow keys step one and wrap around, Page Up and Page Down jump `page`
 * and stop at the ends, and Home and End go to them. `undefined` for any
 * other key, or an empty list, so the caller leaves the event alone.
 */
export const listIndex = (
  key: string,
  index: number,
  length: number,
  page = 8,
): number | undefined => {
  const last = length - 1;

  if (last < 0) return undefined;

  switch (key) {
    case "ArrowDown":
      return index >= last ? 0 : index + 1;
    case "ArrowUp":
      return index <= 0 ? last : index - 1;
    case "PageDown":
      return Math.min(last, Math.max(0, index + page));
    case "PageUp":
      return Math.min(last, Math.max(0, index - page));
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return undefined;
  }
};
