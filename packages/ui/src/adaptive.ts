/**
 * `opensAsSheet` and `sheetLayout`, which make a popup a bottom sheet on a
 * narrow or short screen, such as a phone upright or on its side, and an
 * anchored popup or modal everywhere else. `gw-popover`, `gw-select`,
 * `gw-date-picker`, `gw-command-menu`, `gw-menu-button` and `gw-dialog` all
 * decide it here, as does `gw-sheet` with `side="auto"`, so they switch
 * together and an app's own popups can do the same. The other sizes that
 * change the layout are here too, as media queries an app can share.
 * Docs: https://groundwork.timmo.dev/foundations/layout/#sizes-that-change-the-layout
 *
 * @module
 */

/** The viewport width in pixels below which popups open as a bottom sheet. */
export const defaultSheetBelow = 600;

/** The viewport height in pixels below which popups open as a bottom sheet. */
export const defaultSheetBelowHeight = 500;

/**
 * The viewport width below which a button, menu button or segmented control
 * with `labels="auto"` shows only its icon, as a CSS length.
 */
export const defaultLabelsBelow = "40rem";

/** The media query that matches where labels hide: under `defaultLabelsBelow` wide. */
export const labelsHiddenQuery = `(width < ${defaultLabelsBelow})`;

/**
 * The media query for a phone on its side: wider than it's tall, and
 * shorter than where popups become sheets. Controls go over the content and
 * gaps get smaller.
 * Docs: https://groundwork.timmo.dev/foundations/layout/#a-phone-on-its-side
 */
export const sidewaysQuery = `(orientation: landscape) and (height < ${defaultSheetBelowHeight}px)`;

/**
 * The media query for a touch screen, on its own or beside a mouse, where
 * help lists the gestures.
 * Docs: https://groundwork.timmo.dev/behavior/#help
 */
export const touchQuery = "(any-pointer: coarse)";

/**
 * The media query for a touch screen with nothing that hovers, such as a
 * phone or a tablet on its own, which likely has no keyboard. Help leaves
 * the keys out here.
 * Docs: https://groundwork.timmo.dev/behavior/#help
 */
export const noKeyboardQuery = "(any-pointer: coarse) and (any-hover: none)";

/**
 * The media query for a device that likely has a keyboard: anything that
 * doesn't match `noKeyboardQuery`. Help lists the keys here.
 */
export const keyboardQuery = `not (${noKeyboardQuery})`;

/** Where a popup switches to a bottom sheet; `0` turns either side off. */
export interface SheetRule {
  /** The viewport width in pixels below which it's a sheet. Defaults to 600. */
  readonly below?: number;
  /** The viewport height in pixels below which it's a sheet. Defaults to 500. */
  readonly belowHeight?: number;
}

/**
 * Whether a popup opens as a bottom sheet: when the viewport is narrower
 * than `below` or shorter than `belowHeight`, so a phone on its side gets a
 * sheet too rather than a small popup over the page. Pass `viewport` to
 * decide for a size other than the window's.
 */
export const opensAsSheet = (
  {
    below = defaultSheetBelow,
    belowHeight = defaultSheetBelowHeight,
  }: SheetRule = {},
  viewport: { readonly width: number; readonly height: number } = {
    width: window.innerWidth,
    height: window.innerHeight,
  },
) => viewport.width < below || viewport.height < belowHeight;

/**
 * The media query that matches where `opensAsSheet` is true for a rule, for
 * `matchMedia` or a stylesheet: `(width < 600px), (height < 500px)` by
 * default, and `not all` with both sides off.
 */
export const sheetQuery = ({
  below = defaultSheetBelow,
  belowHeight = defaultSheetBelowHeight,
}: SheetRule = {}) =>
  [
    below > 0 ? `(width < ${below}px)` : "",
    belowHeight > 0 ? `(height < ${belowHeight}px)` : "",
  ]
    .filter(Boolean)
    .join(", ") || "not all";

/**
 * The declarations that make a fixed popup, such as one in the top layer, a
 * bottom sheet: along the bottom edge and clear of the safe area at its
 * sides, centered no wider than `--gw-adaptive-sheet-width` (`40rem`), and
 * no taller than `--gw-adaptive-sheet-height` (`85dvh`) so the top of the
 * page stays in view. It sits below the screen, `translate: 0 100%`, until
 * an open rule slides it to `0 0`. Its content scrolls within it, and the
 * bottom safe area goes in its own padding.
 */
export const sheetLayout = `
  inset: auto env(safe-area-inset-right, 0px) 0 env(safe-area-inset-left, 0px);
  width: auto;
  min-width: 0;
  max-width: var(--gw-adaptive-sheet-width, 40rem);
  max-height: var(--gw-adaptive-sheet-height, 85dvh);
  margin: 0 auto;
  border-end-start-radius: 0;
  border-end-end-radius: 0;
  scale: 1;
  translate: 0 100%;
`;
