/**
 * Glides `element` from the height it had before a change to the height it
 * has after, as an expansion panel opens, so content arriving or going never
 * jumps the layout. Measure with `before = element.offsetHeight` ahead of the
 * change, then call this once it's rendered. Skipped when motion is reduced.
 */
export const animateHeight = (element: HTMLElement, before: number) => {
  const after = element.offsetHeight;

  if (
    before === after ||
    before === 0 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const duration =
    Number.parseFloat(
      getComputedStyle(element).getPropertyValue("--gw-motion-normal"),
    ) || 250;

  element.animate(
    { height: [`${before}px`, `${after}px`], overflow: ["clip", "clip"] },
    { duration, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  );
};

/**
 * Runs a DOM change inside a View Transition where the browser supports one
 * and motion isn't reduced, otherwise runs it straight away, after Home
 * Assistant's `withViewTransition()`. Use it for changes to the whole view,
 * such as switching theme or mode; component state uses CSS transitions.
 *
 * The change may return a promise, such as a Lit element's
 * `updateComplete`, so the new view is captured once it has rendered. Keep
 * it quick: the page is frozen until it settles.
 */
export const withViewTransition = (
  change: () => void | Promise<void>,
): Promise<void> => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (document.startViewTransition === undefined || reduced) {
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
