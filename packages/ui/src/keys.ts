/**
 * The keyboard helpers: `listIndex`, the moves of a menu or list (the arrow
 * keys, Home, End and Page Up or Down), as `gw-option-list` and
 * `gw-menu-button` use them, so an app's own list moves the same way; and
 * `shortcutKey`, which reads a page's own shortcut from a key press without
 * taking a key from what already uses it.
 * Docs: https://groundwork.timmo.dev/behavior/#keys
 *
 * @module
 */

/** Fields that take typing, so a page's shortcuts leave them alone. */
export const typingTargets =
  "input:not([type=radio], [type=checkbox], [type=button], [type=submit], [type=reset], [type=range], [type=color], [type=file]), textarea, select, [contenteditable]:not([contenteditable=false]), gw-input, gw-select, gw-date-picker";

/** Controls that move between their own parts with the arrow keys. */
export const arrowOwners =
  "gw-segmented, gw-table, gw-menu-button, gw-option-list, gw-range, gw-calendar, gw-sortable, input[type=range], input[type=radio], [role=menu], [role=menubar], [role=listbox], [role=radiogroup], [role=slider], [role=tablist], [role=grid], [role=tree]";

/** Overlays whose keys are their own while they're open. */
export const keyOverlays =
  "gw-popover, gw-sheet, gw-dialog, gw-command-menu, dialog, [popover]:popover-open";

/** Controls that Space and Enter press. */
const pressables =
  "button, a[href], summary, gw-button, input[type=checkbox], input[type=radio], [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=option], [role=menuitem], [role=tab]";

/** How `shortcutKey` reads a key press. */
export interface ShortcutKeyOptions {
  /**
   * Whether one letter, number or symbol on its own, such as `k` or `?`, is
   * a shortcut. Give people a setting that turns it off, since speech input
   * types letters and would set them off. Defaults to `true`.
   */
  readonly singleKeys?: boolean;
  /** A selector for more elements whose keys are their own, such as an app's own player. */
  readonly ignore?: string;
}

/**
 * The shortcut a key press asks for, such as `k`, `F` lowered to `f`, `?`,
 * `ArrowLeft` or `Shift+ArrowLeft`; or `undefined` where the key belongs to
 * something else, so the page leaves the event alone:
 *
 * - a field being typed in, or text being composed;
 * - the arrows, in a control that moves with them, such as a toggle or list;
 * - Space and Enter, on a button or a link;
 * - anything in an open popover, sheet or dialog, whose keys are its own;
 * - a press with Ctrl, Cmd or Alt, or one already handled.
 *
 * ```ts
 * document.addEventListener("keydown", (event) => {
 *   const key = shortcutKey(event, { singleKeys: settings.singleKeys });
 *
 *   if (key === "k") togglePlay();
 *   else if (key === "?") help.toggle(helpButton);
 *   else return;
 *
 *   event.preventDefault();
 * });
 * ```
 */
export const shortcutKey = (
  event: KeyboardEvent,
  { singleKeys = true, ignore }: ShortcutKeyOptions = {},
): string | undefined => {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.defaultPrevented ||
    event.isComposing
  ) {
    return undefined;
  }

  const path = event
    .composedPath()
    .filter((target) => target instanceof Element);

  const within = (selector: string) =>
    path.some((target) => target.matches(selector));

  if (within(typingTargets) || within(keyOverlays)) return undefined;

  if (ignore !== undefined && within(ignore)) return undefined;

  if (event.key.startsWith("Arrow") && within(arrowOwners)) return undefined;

  if ((event.key === " " || event.key === "Enter") && within(pressables)) {
    return undefined;
  }

  // Space isn't a character key, so it stays with singleKeys off
  const single = event.key.length === 1 && event.key !== " ";

  if (single && !singleKeys) return undefined;

  const key = single ? event.key.toLowerCase() : event.key;

  return event.shiftKey && key.startsWith("Arrow") ? `Shift+${key}` : key;
};

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
