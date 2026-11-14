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
 * The View Transition classes and types, adopted into the document the first
 * time `withViewTransition()` runs, in the components layer so an app's own
 * styles win. Give an element a class with `view-transition-class`, beside
 * its `view-transition-name`:
 *
 * - `gw-travel` moves and resizes it to its new place on `--gw-motion-slow`
 *   and `--gw-motion-easing`, such as a tile becoming the whole view;
 * - `gw-from-bottom`, `gw-from-top`, `gw-from-start` and `gw-from-end` slide
 *   it in from that edge as it arrives, on `--gw-motion-slow` and
 *   `--gw-motion-easing-enter`, and back out as it leaves, a step quicker on
 *   `--gw-motion-normal` and `--gw-motion-easing-exit`, such as a docked
 *   panel. Start and end follow the page's direction;
 * - `gw-page` swaps a page's content: with the `gw-forward` or `gw-back`
 *   type it slides a short way along the line toward the end or the start
 *   and fades through, for a sibling page or tab; with neither it fades
 *   through, the old out and the new in, for a page that isn't related.
 *
 * Under reduced motion nothing moves or resizes: every old and new view
 * crossfades on `--gw-motion-fade` instead.
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

  // A page's swap: the old fades out over the first 35% and the new fades in
  // over the rest, sliding 30px along the line for a sibling, or growing from
  // 92% for a page that isn't related
  const page = "var(--gw-motion-slow, 350ms) var(--gw-motion-easing, ease)";

  const axis = [
    ["gw-forward", "gw-to-start", "gw-from-end-near"],
    ["gw-back", "gw-to-end", "gw-from-start-near"],
  ].map(
    ([type, leave, arrive]) => `
      :root:active-view-transition-type(${type})::view-transition-old(*.gw-page) {
        animation: ${page} both gw-fade-out-through, ${page} both ${leave};
      }

      :root:active-view-transition-type(${type})::view-transition-new(*.gw-page) {
        animation: ${page} both gw-fade-in-through, ${page} both ${arrive};
      }`,
  );

  sheet.replaceSync(`@layer ${componentsLayer} {
    @media (prefers-reduced-motion: no-preference) {
      ::view-transition-group(*.gw-travel) {
        animation-duration: var(--gw-motion-slow, 350ms);
        animation-timing-function: var(--gw-motion-easing, ease);
      }
      ${slides.join("\n")}

      ::view-transition-old(*.gw-page) {
        animation: ${page} both gw-fade-out-through;
      }

      ::view-transition-new(*.gw-page) {
        animation: ${page} both gw-fade-in-through, ${page} both gw-grow;
      }
      ${axis.join("\n")}
    }

    @media (prefers-reduced-motion: reduce) {
      ::view-transition-group(*) {
        animation-name: none;
      }

      ::view-transition-old(*) {
        animation: var(--gw-motion-fade, 150ms) linear both gw-fade-out;
      }

      ::view-transition-new(*) {
        animation: var(--gw-motion-fade, 150ms) linear both gw-fade-in;
      }

      /* The browser's own crossfade blends a pair so it never dims half way;
         replacing its animation drops that, so it's set here. Inside an
         isolated pair a lone image draws just as it would without it */
      ::view-transition-image-pair(*) {
        isolation: isolate;
      }

      ::view-transition-old(*),
      ::view-transition-new(*) {
        mix-blend-mode: plus-lighter;
      }
    }

    @keyframes gw-fade-out {
      to {
        opacity: 0;
      }
    }

    @keyframes gw-fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes gw-fade-out-through {
      35%,
      100% {
        opacity: 0;
      }
    }

    @keyframes gw-fade-in-through {
      0%,
      35% {
        opacity: 0;
      }
    }

    @keyframes gw-grow {
      from {
        scale: 0.92;
      }
    }

    @keyframes gw-to-start {
      to {
        translate: calc(-30px * var(--gw-page-flip, 1)) 0;
      }
    }

    @keyframes gw-to-end {
      to {
        translate: calc(30px * var(--gw-page-flip, 1)) 0;
      }
    }

    @keyframes gw-from-end-near {
      from {
        translate: calc(30px * var(--gw-page-flip, 1)) 0;
      }
    }

    @keyframes gw-from-start-near {
      from {
        translate: calc(-30px * var(--gw-page-flip, 1)) 0;
      }
    }

    /* Start and end swap sides in a right-to-left page */
    :root:dir(rtl) {
      --gw-page-flip: -1;
    }
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

/** How `withViewTransition()` runs a change. */
export interface ViewTransitionOptions {
  /**
   * The transition's types, for `:active-view-transition-type()` rules:
   * `gw-forward` or `gw-back` for moving between sibling pages or tabs, or an
   * app's own. Left out where the browser has no types.
   */
  readonly types?: readonly string[];
}

/** Whether the browser takes a View Transition's types. */
const transitionTypes = () =>
  "ViewTransition" in window && "types" in ViewTransition.prototype;

/**
 * Runs a DOM change inside a View Transition where the browser supports one
 * and the page can be seen, otherwise runs it straight away. Use it for
 * changes to the whole view, such as switching theme or mode, a page or tab
 * changing, or moving an element with a `view-transition-name` to a new
 * place; component state uses CSS transitions. Elements with one of the
 * `viewTransitionStyles` classes travel, slide from their edge or swap as a
 * page, and under reduced motion every view crossfades in place instead.
 *
 * A second change never waits for the first: the browser skips the running
 * transition to its end and starts the new one from there.
 *
 * The change may return a promise, such as a Lit element's
 * `updateComplete`, so the new view is captured once it has rendered. Keep
 * it quick: the page is frozen until it settles.
 */
export const withViewTransition = (
  change: () => void | Promise<void>,
  { types = [] }: ViewTransitionOptions = {},
): Promise<void> => {
  if (document.startViewTransition === undefined || document.hidden) {
    return Promise.resolve(change());
  }

  adoptTransitionStyles();

  let changed = false;

  const update = () => {
    changed = true;

    return change();
  };

  try {
    const transition =
      types.length > 0 && transitionTypes()
        ? document.startViewTransition({ update, types: [...types] })
        : document.startViewTransition(update);

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
