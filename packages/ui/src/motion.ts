/**
 * Motion helpers: fades that never pop, heights that glide instead of jump,
 * and View Transitions for whole-view changes. All respect reduced motion.
 *
 * @module
 */
import { componentsLayer } from "./element.js";

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
 * The View Transition classes, adopted into the document the first time
 * `withViewTransition()` runs, in the components layer so an app's own
 * styles win. Give an element one with `view-transition-class`, beside its
 * `view-transition-name`:
 *
 * - `gw-travel` moves and resizes it to its new place on `--gw-motion-slow`
 *   and `--gw-motion-easing`, such as a tile becoming the whole view;
 * - `gw-from-bottom`, `gw-from-top`, `gw-from-start` and `gw-from-end` slide
 *   it in from that edge as it arrives, on `--gw-motion-slow` and
 *   `--gw-motion-easing-enter`, and back out as it leaves, a step quicker on
 *   `--gw-motion-normal` and `--gw-motion-easing-exit`, such as a docked
 *   panel. Start and end follow the page's direction.
 */
export const viewTransitionStyles = (() => {
  const sheet = new CSSStyleSheet();

  const edges = {
    bottom: ["0 100%", "0 100%"],
    top: ["0 -100%", "0 -100%"],
    start: ["-100% 0", "100% 0"],
    end: ["100% 0", "-100% 0"],
  } as const;

  const slides = Object.entries(edges).map(
    ([edge, [ltr, rtl]]) => `
      ::view-transition-new(*.gw-from-${edge}):only-child {
        animation: var(--gw-motion-slow, 350ms)
          var(--gw-motion-easing-enter, ease-out) both gw-from-${edge};
      }

      ::view-transition-old(*.gw-from-${edge}):only-child {
        animation: var(--gw-motion-normal, 250ms)
          var(--gw-motion-easing-exit, ease-in) both gw-from-${edge} reverse;
      }

      @keyframes gw-from-${edge} {
        from {
          translate: ${ltr};
        }
      }

      :root:dir(rtl)::view-transition-new(*.gw-from-${edge}):only-child,
      :root:dir(rtl)::view-transition-old(*.gw-from-${edge}):only-child {
        animation-name: gw-from-${edge}-rtl;
      }

      @keyframes gw-from-${edge}-rtl {
        from {
          translate: ${rtl};
        }
      }`,
  );

  sheet.replaceSync(`@layer ${componentsLayer} {
    ::view-transition-group(*.gw-travel) {
      animation-duration: var(--gw-motion-slow, 350ms);
      animation-timing-function: var(--gw-motion-easing, ease);
    }
    ${slides.join("\n")}
  }`);

  return sheet;
})();

/** Adopts `viewTransitionStyles` into the document, once. */
const adoptTransitionStyles = () => {
  if (!document.adoptedStyleSheets.includes(viewTransitionStyles)) {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      viewTransitionStyles,
    ];
  }
};

/**
 * Runs a DOM change inside a View Transition where the browser supports one,
 * motion isn't reduced and the page can be seen, otherwise runs it straight
 * away, after Home Assistant's `withViewTransition()`. Use it for changes to
 * the whole view, such as switching theme or mode, or moving an element with
 * a `view-transition-name` to a new place; component state uses CSS
 * transitions. Elements with one of the `viewTransitionStyles` classes
 * travel or slide from their edge.
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

  adoptTransitionStyles();

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
