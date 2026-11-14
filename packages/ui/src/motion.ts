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

/** What identifies an item to `animateLayout()`; `null` or `undefined` leaves it alone. */
export type LayoutKey = string | number | Element | null | undefined;

/** How `animateLayout()` and `measureLayout()` follow a container's items. */
export interface LayoutOptions {
  /**
   * What identifies an item across the change, for a list that rebuilds its
   * items rather than moving them, such as `(item) => item.getAttribute("data-key")`.
   * An item with no key, `null` or `undefined`, is left alone, such as a
   * spacer. Defaults to the item itself.
   */
  readonly key?: (item: Element) => LayoutKey;
}

/** Each item's slide, so a second change starts it from where it is. */
const sliding = new WeakMap<Element, Animation>();

/**
 * Measures where each of `container`'s children is, and returns what slides
 * them from there to wherever a change has put them: call it once the change
 * has rendered. `animateLayout()` does both around a change; this is for a
 * change that happens in steps, such as an element's own update.
 */
export const measureLayout = (
  container: ParentNode,
  { key = (item) => item }: LayoutOptions = {},
): (() => void) => {
  if (reducedMotion() || document.hidden) return () => undefined;

  const before = new Map<LayoutKey, DOMRect>();

  for (const item of container.children) {
    const id = key(item);

    if (id !== null && id !== undefined) {
      before.set(id, item.getBoundingClientRect());
    }
  }

  return () => {
    const items = [...container.children];

    // A slide still running starts again from where the item is now, which
    // the measure above took in
    for (const item of items) sliding.get(item)?.cancel();

    const style = getComputedStyle(
      container instanceof Element
        ? container
        : container instanceof ShadowRoot
          ? container.host
          : document.documentElement,
    );

    const duration =
      Number.parseFloat(style.getPropertyValue("--gw-motion-normal")) || 250;

    const easing =
      style.getPropertyValue("--gw-motion-easing").trim() ||
      "cubic-bezier(0.2, 0, 0, 1)";

    for (const item of items) {
      const id = key(item);

      if (id === null || id === undefined) continue;

      const now = item.getBoundingClientRect();

      if (now.width === 0 && now.height === 0) continue;

      const was = before.get(id);

      // A new item fades in at its place, unless the list was empty, as on
      // its first draw
      if (was === undefined || (was.width === 0 && was.height === 0)) {
        if (before.size > 0) {
          item.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration,
            easing: fadeEasing,
            fill: "backwards",
          });
        }

        continue;
      }

      const x = was.left - now.left;
      const y = was.top - now.top;

      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;

      // Added to any translate of its own, such as an arrival still running
      sliding.set(
        item,
        item.animate([{ translate: `${x}px ${y}px` }, { translate: "0 0" }], {
          duration,
          easing,
          composite: "add",
        }),
      );
    }
  };
};

/**
 * Runs a change to the items in `container`, such as one added, removed or
 * reordered, and slides each item that stays from where it was to its new
 * place, on `--gw-motion-normal` and `--gw-motion-easing`, so the list makes
 * room and closes its gaps rather than jumping. A new item fades in at its
 * place. Animate one that leaves before the change, such as by fading it out.
 *
 * It measures each child before and after the change and slides it the
 * difference (FLIP), in translate only, so nothing lays out again while it
 * moves. A second change while items slide starts each from where it is.
 * Under reduced motion the change just happens.
 *
 * The change may return a promise, such as an element's `updateComplete`.
 */
export const animateLayout = async (
  container: ParentNode,
  change: () => void | Promise<void>,
  options: LayoutOptions = {},
): Promise<void> => {
  const slide = measureLayout(container, options);

  await change();
  slide();
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
