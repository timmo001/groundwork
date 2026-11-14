/**
 * Motion helpers: fades that never pop, heights that glide instead of jump,
 * and View Transitions for whole-view changes. All respect reduced motion.
 *
 * @module
 */

/** Whether the person asked for reduced motion. */
export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reads a motion duration token in milliseconds, such as
 * `--gw-motion-slow`, falling back when the tokens aren't loaded.
 */
export const motionDuration = (
  element: Element,
  token: string,
  fallback: number,
) =>
  Number.parseFloat(getComputedStyle(element).getPropertyValue(token)) ||
  fallback;

/**
 * The curve for fades. A decelerating curve lands most of an opacity change
 * in the first frames and reads as a pop, so fades ease in and out.
 */
export const fadeEasing = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Fades `element` in, after `delay`, over `duration` (`--gw-motion-slow` by
 * default). Use it when content replaces a skeleton. With reduced motion it
 * shows at once.
 */
export const fadeIn = (
  element: HTMLElement,
  { delay = 0, duration }: { delay?: number; duration?: number } = {},
) =>
  element.animate([{ opacity: 0 }, { opacity: 1 }], {
    delay,
    duration: reducedMotion()
      ? 0
      : (duration ?? motionDuration(element, "--gw-motion-slow", 350)),
    easing: fadeEasing,
    fill: "backwards",
  });

/**
 * Glides `element` from the height it had before a change to the height it
 * has after, as an expansion panel opens, so content arriving or going never
 * jumps the layout. Measure with `before = element.offsetHeight` ahead of the
 * change, then call this once it's rendered. Skipped when motion is reduced.
 */
export const animateHeight = (element: HTMLElement, before: number) => {
  const after = element.offsetHeight;

  if (before === after || before === 0 || reducedMotion()) {
    return;
  }

  const duration = motionDuration(element, "--gw-motion-normal", 250);

  element.animate(
    { height: [`${before}px`, `${after}px`], overflow: ["clip", "clip"] },
    { duration, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  );
};

/**
 * Runs a DOM change inside a View Transition where the browser supports one,
 * motion isn't reduced and the page can be seen, otherwise runs it straight
 * away, after Home Assistant's `withViewTransition()`. Use it for changes to
 * the whole view, such as switching theme or mode, or moving an element with
 * a `view-transition-name` to a new place; component state uses CSS
 * transitions.
 *
 * The change may return a promise, such as a Lit element's
 * `updateComplete`, so the new view is captured once it has rendered. Keep
 * it quick: the page is frozen until it settles.
 */
export const withViewTransition = (
  change: () => void | Promise<void>,
): Promise<void> => {
  const reduced = reducedMotion();

  if (
    document.startViewTransition === undefined ||
    reduced ||
    document.hidden
  ) {
    return Promise.resolve(change());
  }

  let changed = false;

  try {
    const transition = document.startViewTransition(() => {
      changed = true;

      return change();
    });

    // A transition skipped by a newer one rejects with AbortError; the change
    // itself still happened.
    transition.ready.catch(() => undefined);

    return transition.finished.catch(() => undefined);
  } catch {
    return changed ? Promise.resolve() : Promise.resolve(change());
  }
};

/**
 * A `view-transition-name` from an app's own ids, such as
 * `transitionName("camera", id)` for `camera-front-door`. Anything a CSS
 * name can't hold becomes a hyphen, so each element keeps a valid name of
 * its own.
 */
export const transitionName = (...parts: Array<string>) => {
  const name = parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "-");

  return /^[a-zA-Z_]/.test(name) ? name : `vt-${name}`;
};
