/**
 * `onSwipe`, the touch swipes of a surface such as a player's picture: one or
 * more fingers moving the same way far enough, rather than pinching or
 * dragging something a drag already moves. Every listener on an element
 * shares one recognizer, and a swipe it takes never also clicks.
 * Docs: https://groundwork.timmo.dev/behavior/#touch
 *
 * @module
 */

/** Which way a swipe went. */
export type SwipeDirection = "up" | "down" | "left" | "right";

/** A swipe: how many fingers moved together, and which way. */
export interface Swipe {
  readonly fingers: number;
  readonly direction: SwipeDirection;
}

/** How one listener reads swipes. Each listener on an element has its own. */
export interface SwipeOptions {
  /**
   * A selector for what a drag already moves, such as a zoomed picture, a
   * slider or a popover. A touch that starts on or inside a match is never a
   * swipe for this listener.
   */
  readonly ignore?: string;
  /** How far the fingers move, in pixels, before it's a swipe. Defaults to `48`. */
  readonly distance?: number;
  /** How far two fingers may spread or close, in pixels, before it's a pinch instead. Defaults to `40`. */
  readonly pinch?: number;
}

/** Where a finger went down and where it is now, in client pixels. */
export interface SwipeFinger {
  readonly x0: number;
  readonly y0: number;
  readonly x: number;
  readonly y: number;
}

const spread = (fingers: ReadonlyArray<SwipeFinger>, at: "start" | "end") => {
  const [a, b] = fingers;

  if (a === undefined || b === undefined) return 0;

  return at === "start"
    ? Math.hypot(a.x0 - b.x0, a.y0 - b.y0)
    : Math.hypot(a.x - b.x, a.y - b.y);
};

/**
 * The swipe some fingers made, if they made one: they moved `distance` on
 * average, along an axis at least twice as far as across it, and didn't
 * spread or close more than `pinch`. For an app tracking fingers itself.
 */
export const swipeOf = (
  fingers: ReadonlyArray<SwipeFinger>,
  { distance = 48, pinch = 40 }: Omit<SwipeOptions, "ignore"> = {},
): Swipe | undefined => {
  if (fingers.length === 0) return undefined;

  if (
    fingers.length > 1 &&
    Math.abs(spread(fingers, "end") - spread(fingers, "start")) > pinch
  ) {
    return undefined;
  }

  const dx =
    fingers.reduce((sum, finger) => sum + finger.x - finger.x0, 0) /
    fingers.length;

  const dy =
    fingers.reduce((sum, finger) => sum + finger.y - finger.y0, 0) /
    fingers.length;

  const across = Math.abs(dx);
  const down = Math.abs(dy);

  if (Math.max(across, down) < distance) return undefined;

  if (down > 2 * across) {
    return { fingers: fingers.length, direction: dy < 0 ? "up" : "down" };
  }

  if (across > 2 * down) {
    return { fingers: fingers.length, direction: dx < 0 ? "left" : "right" };
  }

  return undefined;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface Heard {
  readonly listener: (swipe: Swipe) => void;
  readonly options: SwipeOptions;
}

interface Recognizer {
  readonly heard: Set<Heard>;
  readonly controller: AbortController;
}

/** How long after a swipe's lift its click is swallowed, in milliseconds. */
const clickAfter = 400;

const recognizers = new WeakMap<HTMLElement, Recognizer>();

/** Starts the one recognizer an element's listeners share. */
const recognize = (element: HTMLElement): Recognizer => {
  const heard = new Set<Heard>();
  const controller = new AbortController();
  const options = { capture: true, signal: controller.signal };

  const down = new Map<number, Mutable<SwipeFinger>>();

  let fingers: Array<Mutable<SwipeFinger>> = [];
  /** What each finger of this touch went down on, for each listener's `ignore`. */
  let started: Array<Element> = [];
  /** Whether the browser took this touch over, such as to scroll. */
  let cancelled = false;
  /** Until when a click is a swipe's lift, and does nothing. */
  let swallowUntil = 0;

  element.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;

      if (down.size === 0) {
        fingers = [];
        started = [];
        cancelled = false;
        swallowUntil = 0;
      }

      started.push(
        ...event.composedPath().filter((target) => target instanceof Element),
      );

      const finger = {
        x0: event.clientX,
        y0: event.clientY,
        x: event.clientX,
        y: event.clientY,
      };

      down.set(event.pointerId, finger);
      fingers.push(finger);
    },
    options,
  );

  element.addEventListener(
    "pointermove",
    (event) => {
      const finger = down.get(event.pointerId);

      if (finger === undefined) return;

      finger.x = event.clientX;
      finger.y = event.clientY;
    },
    options,
  );

  const lift = (event: PointerEvent) => {
    if (!down.has(event.pointerId)) return;

    if (event.type === "pointercancel") cancelled = true;

    down.delete(event.pointerId);

    if (down.size > 0 || cancelled) return;

    let took = false;

    for (const { listener, options } of heard) {
      const { ignore } = options;

      if (
        ignore !== undefined &&
        started.some((target) => target.matches(ignore))
      ) {
        continue;
      }

      const swipe = swipeOf(fingers, options);

      if (swipe === undefined) continue;

      took = true;
      listener(swipe);
    }

    if (took) swallowUntil = event.timeStamp + clickAfter;
  };

  element.addEventListener("pointerup", lift, options);
  element.addEventListener("pointercancel", lift, options);

  // A swipe's lift doesn't also press what it ended on
  for (const type of ["click", "dblclick"]) {
    element.addEventListener(
      type,
      (event) => {
        if (event.timeStamp > swallowUntil) return;

        event.stopPropagation();
        event.preventDefault();
      },
      options,
    );
  }

  return { heard, controller };
};

/**
 * Calls `listener` with each touch swipe on `element`: one or more fingers
 * moving the same way at least `distance`, along one axis twice as far as
 * across it. A pinch, a touch the browser takes over and a touch that starts
 * on `ignore` are never swipes, and the click after a swipe does nothing.
 * Every listener on an element shares one recognizer, each with its own
 * options. Give the element a `touch-action` that leaves swipes to the page,
 * such as `none`. Returns a function that stops listening.
 *
 * @example
 * onSwipe(stage, ({ fingers, direction }) => {
 *   if (fingers === 1 && direction === "left") next();
 * }, { ignore: "[data-movable], gw-range, gw-popover" });
 */
export const onSwipe = (
  element: HTMLElement,
  listener: (swipe: Swipe) => void,
  options: SwipeOptions = {},
): (() => void) => {
  let recognizer = recognizers.get(element);

  if (recognizer === undefined) {
    recognizer = recognize(element);
    recognizers.set(element, recognizer);
  }

  const entry = { listener, options };
  const { heard, controller } = recognizer;

  heard.add(entry);

  return () => {
    // Already stopped, so a newer recognizer on the element isn't this one's
    if (!heard.delete(entry) || heard.size > 0) return;

    controller.abort();
    recognizers.delete(element);
  };
};
