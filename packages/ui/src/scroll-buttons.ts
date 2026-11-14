/**
 * `scrollButtons`, a pair of buttons that scroll a horizontal scroller by
 * about a view at a time, each shown only while there's more to scroll its
 * way, so nobody has to drag or swipe. `gw-row` uses it for `scroll`, and an
 * app attaches it to any other scroller, such as a timeline's track.
 * Docs: https://groundwork.timmo.dev/components/layout/#scroll-buttons
 *
 * @module
 */

/** What a horizontal scroller has out of view, along its inline axis. */
export interface ScrollEdges {
  /** Whether its content is wider than it is. */
  readonly overflowing: boolean;
  /** Whether there's more before its inline start, left in a left-to-right page. */
  readonly moreStart: boolean;
  /** Whether there's more past its inline end, right in a left-to-right page. */
  readonly moreEnd: boolean;
}

/**
 * What a scroller has out of view at each end, allowing a pixel either way
 * for fractional widths. Right to left, `scrollLeft` runs from 0 to negative,
 * so it reads its size either way.
 */
export const scrollEdges = ({
  scrollWidth,
  clientWidth,
  scrollLeft,
}: Pick<
  Element,
  "scrollWidth" | "clientWidth" | "scrollLeft"
>): ScrollEdges => {
  const max = scrollWidth - clientWidth;
  const overflowing = max > 1;
  const scrolled = Math.abs(scrollLeft);

  return {
    overflowing,
    moreStart: overflowing && scrolled > 1,
    moreEnd: overflowing && scrolled < max - 1,
  };
};

/** How far one press scrolls: most of the view, so a little stays in sight. */
const defaultStep = (scroller: Element) => scroller.clientWidth * 0.85;

/**
 * Scrolls a scroller by about one view toward its inline start or end,
 * smoothly, or at once under reduced motion. `step` gives another distance
 * in pixels.
 */
export const scrollByView = (
  scroller: Element,
  toward: "start" | "end",
  step: (scroller: Element) => number = defaultStep,
) => {
  const rtl = getComputedStyle(scroller).direction === "rtl";
  const sign = (toward === "end" ? 1 : -1) * (rtl ? -1 : 1);

  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";

  scroller.scrollBy({ left: sign * step(scroller), behavior });
};

/** The buttons and what else `scrollButtons` watches. */
export interface ScrollButtonsOptions {
  /** The button that scrolls toward the inline start, such as a ‹. */
  readonly start?: HTMLElement;
  /** The button that scrolls toward the inline end, such as a ›. */
  readonly end?: HTMLElement;
  /**
   * The items whose size changes what overflows. Defaults to the scroller's
   * children; give it another list when they're slotted, as `gw-row`'s are.
   */
  readonly items?: () => Iterable<Element>;
  /** How far one press scrolls, in pixels. Defaults to 85% of the view. */
  readonly step?: (scroller: Element) => number;
  /** Called with the edges whenever they might have changed. */
  readonly onChange?: (edges: ScrollEdges) => void;
}

/** A running `scrollButtons`. */
export interface ScrollButtons {
  /** Measures again and watches the items again, such as after they changed. */
  readonly update: () => void;
  /** Stops listening and watching, leaving the buttons as they are. */
  readonly stop: () => void;
}

/**
 * Makes `start` and `end` scroll `scroller` by about a view per press, and
 * sets `hidden` on each while there's nothing more its way, so both hide when
 * everything fits. A button that hides while focused hands focus to the
 * other. It measures as the scroller scrolls, resizes or gains children, and
 * as its items resize; call `update()` for any other change. The buttons can
 * be any elements, though `gw-button`s with `labels="hide"`, a chevron icon
 * and text such as "Scroll left" are what `gw-row` uses; placing them over
 * or beside the scroller is up to the app.
 */
export const scrollButtons = (
  scroller: HTMLElement,
  { start, end, items, step, onChange }: ScrollButtonsOptions = {},
): ScrollButtons => {
  const listItems = items ?? (() => scroller.children);

  const show = (
    button: HTMLElement | undefined,
    on: boolean,
    other: HTMLElement | undefined,
  ) => {
    if (button === undefined || button.hidden === !on) return;

    const focused = !on && button.matches(":focus-within");

    button.hidden = !on;

    if (focused && other !== undefined && !other.hidden) other.focus();
  };

  const measure = () => {
    const edges = scrollEdges(scroller);

    show(start, edges.moreStart, end);
    show(end, edges.moreEnd, start);
    onChange?.(edges);
  };

  const resize = new ResizeObserver(measure);

  const watch = () => {
    resize.disconnect();
    resize.observe(scroller);

    for (const item of listItems()) resize.observe(item);
  };

  const update = () => {
    watch();
    measure();
  };

  const children = new MutationObserver(update);
  const toStart = () => scrollByView(scroller, "start", step);
  const toEnd = () => scrollByView(scroller, "end", step);

  scroller.addEventListener("scroll", measure, { passive: true });
  children.observe(scroller, { childList: true });
  start?.addEventListener("click", toStart);
  end?.addEventListener("click", toEnd);
  update();

  return {
    update,
    stop: () => {
      scroller.removeEventListener("scroll", measure);
      children.disconnect();
      resize.disconnect();
      start?.removeEventListener("click", toStart);
      end?.removeEventListener("click", toEnd);
    },
  };
};
