/**
 * `overlayControls`, which puts a player's controls over its picture on a
 * phone on its side or in full screen, sliding them away while they're left
 * alone, as a video player's do.
 * Docs: https://groundwork.timmo.dev/behavior/#controls-over-a-picture
 *
 * @module
 */
import { sidewaysQuery } from "./adaptive.js";
import { css, h } from "./element.js";
import { adoptStyles } from "./fields.js";
import { reducedMotion } from "./motion.js";
import { pressedBelow } from "./pressed.js";
import { dragCloses, onSwipe } from "./swipe.js";

// MDI's chevron-up, for the handle that brings the controls back
const chevronUp =
  "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";

/**
 * What a press does something on, so it never wakes or hides the controls:
 * a control, a field, a popover or anything focusable.
 */
export const overlayPressables = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "[role=button]",
  "[role=slider]",
  "[role=menuitem]",
  "[tabindex]:not([tabindex='-1'])",
  "gw-button",
  "gw-menu-button",
  "gw-segmented",
  "gw-select",
  "gw-range",
  "gw-volume",
  "gw-input",
  "gw-popover",
  "gw-sheet",
].join(", ");

/** The bar over the picture, its slide and the handle, in the components layer so an app's own styles win. */
const overlayStyles = css`
  [data-overlay] {
    position: relative;
    /* The solid fill, kept for what opens from the bar */
    --gw-overlay-controls-solid: var(--gw-color-surface-lower);
  }

  [data-overlay-controls][data-over] {
    position: absolute;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: 1;
    padding-inline: var(--gw-safe-inline);
    padding-block-end: var(--gw-safe-bottom);
    background: var(
      --gw-overlay-controls-background,
      color-mix(in oklab, var(--gw-color-surface-raised) 30%, transparent)
    );
    backdrop-filter: blur(4px);
    /* The controls' own fills, such as a segmented track, a select or a
       control group, let the picture through as the bar does, rather than
       sit on it as dark slabs */
    --gw-color-surface-lower: var(
      --gw-overlay-controls-fill,
      color-mix(in oklab, var(--gw-color-surface-low) 45%, transparent)
    );
    /* Back up from the bottom edge, slowing into place */
    transition:
      translate var(--gw-motion-normal) var(--gw-motion-easing-enter),
      opacity var(--gw-motion-fast) linear;
  }

  /* Leaving, it goes down off the edge it sits on, a step quicker, and fades
     with it, so it never hangs below a stage that doesn't clip */
  [data-overlay-controls][data-over][data-hidden] {
    translate: 0 100%;
    opacity: 0;
    pointer-events: none;
    transition:
      translate var(--gw-motion-fast) var(--gw-motion-easing-exit),
      opacity var(--gw-motion-fast) linear;
  }

  [data-overlay][data-controls-hidden] {
    cursor: none;
  }

  /* Pulled down, it moves with the finger, nothing easing it */
  [data-overlay-controls][data-over][data-dragging] {
    transition: none;
  }

  /* What opens from the bar sits on its own solid surface, so the fields in
     it keep their solid fill */
  [data-overlay-controls][data-over] :is(gw-popover, gw-sheet)::part(surface),
  [data-overlay-controls][data-over] gw-dialog::part(dialog),
  [data-overlay-controls][data-over] gw-menu-button::part(menu),
  gw-control-bar[data-over]::part(more-menu),
  [data-overlay-controls][data-over] :is([popover], dialog) {
    --gw-color-surface-lower: var(--gw-overlay-controls-solid);
  }

  /* The tab that opens a control bar's other rows, on its top edge. Over the
     picture it's pressed with a finger, so it's the handle's size; off it,
     it stays small */
  gw-control-bar[data-over]::part(expand) {
    inset-inline-end: var(--gw-safe-inline);
    background: inherit;
    border-start-start-radius: var(--gw-radius-control);
    border-start-end-radius: var(--gw-radius-control);
    backdrop-filter: blur(4px);
  }

  gw-control-bar[data-over]::part(expand-button) {
    min-inline-size: 4rem;
    min-block-size: 2.75rem;
  }

  /* At the bottom in the middle, clear of a phone's rounded corners, and a
     finger's width to press */
  .gw-overlay-handle {
    position: absolute;
    inset-block-end: 0;
    inset-inline-start: 50%;
    z-index: 2;
    padding-block-end: var(--gw-safe-bottom);
    translate: -50% 0;
    background: var(
      --gw-overlay-controls-background,
      color-mix(in oklab, var(--gw-color-surface-raised) 30%, transparent)
    );
    border-start-start-radius: var(--gw-radius-control);
    border-start-end-radius: var(--gw-radius-control);
    backdrop-filter: blur(4px);
    /* It rises as the bar goes down, and drops as the bar comes back */
    transition:
      translate var(--gw-motion-normal) var(--gw-motion-easing-enter),
      display var(--gw-motion-fast) allow-discrete;
  }

  .gw-overlay-handle[hidden] {
    display: none;
    translate: -50% 100%;
    transition:
      translate var(--gw-motion-fast) var(--gw-motion-easing-exit),
      display var(--gw-motion-fast) allow-discrete;
  }

  @starting-style {
    .gw-overlay-handle {
      translate: -50% 100%;
    }
  }

  .gw-overlay-handle::part(button) {
    min-inline-size: 4rem;
    min-block-size: 2.75rem;
  }

  /* Under reduced motion nothing slides: the bar fades in place, as it goes
     by itself rather than at a press */
  @media (prefers-reduced-motion: reduce) {
    [data-overlay-controls][data-over],
    [data-overlay-controls][data-over][data-hidden] {
      translate: none;
      transition: opacity var(--gw-motion-fade, 150ms) linear;
    }

    .gw-overlay-handle,
    .gw-overlay-handle[hidden] {
      translate: -50% 0;
      transition: none;
    }
  }
`;

/** How `overlayControls` behaves. */
export interface OverlayControlsOptions {
  /** What the controls sit over, such as the player's picture. Defaults to the bar's parent. */
  readonly stage?: HTMLElement;
  /**
   * What goes full screen when a phone turns on its side, such as the
   * player, and leaves it when the phone turns back. Leave it out to keep
   * full screen to the app's own button.
   */
  readonly fullscreen?: HTMLElement;
  /** How long they stay after the last touch, in milliseconds. Defaults to `3000`. */
  readonly hideAfter?: number;
  /**
   * Whether they should stay up anyway, such as while paused. They always
   * stay while a menu or popover in them is open, and while a
   * `gw-control-bar`'s rows past the first are.
   */
  readonly stays?: () => boolean;
  /** More that a press does something on, such as a tile, added to `overlayPressables`. */
  readonly pressable?: string;
  /** What a swipe never starts on, as a drag already moves it, such as a zoomed picture. */
  readonly ignore?: string;
  /** The handle's name. Defaults to `Show the controls`. */
  readonly handleLabel?: string;
}

/** Whether an overlay's scrim is open anywhere in `root`, through shadow roots. */
const overlayOpen = (root: Element | ShadowRoot): boolean =>
  root.querySelector(".gw-scrim:popover-open") !== null ||
  [...root.querySelectorAll("*")].some(
    (each) => each.shadowRoot !== null && overlayOpen(each.shadowRoot),
  ) ||
  (root instanceof Element &&
    root.shadowRoot !== null &&
    overlayOpen(root.shadowRoot));

/**
 * On a phone on its side (`sidewaysQuery`), or in full screen, puts `bar`
 * over the bottom of its picture and slides it down off the edge once it's
 * been left alone for `hideAfter` while nothing keeps it. Only what does
 * nothing else brings it back: a tap where there's nothing to press, a 1
 * finger swipe up, a key, a mouse moving, or a handle at the bottom while
 * it's hidden. A finger pulling it down moves it with the finger, and let go
 * it goes on down or springs back, as `dragCloses` has it. A press on a
 * control does its own thing, and a tap that toggles the bar presses nothing
 * else. With `fullscreen`, turning a phone on its side goes full screen
 * where the browser lets it, and turning it back leaves.
 *
 * Over the picture the controls' own fills, `--gw-color-surface-lower`, let
 * the picture through as the bar does; `--gw-overlay-controls-fill` sets
 * them, and `--gw-overlay-controls-background` the bar's. A menu, popover,
 * sheet or dialog opened from the bar keeps its solid surface and fills.
 *
 * It marks the stage `data-overlay` while the bar is over it, and the bar
 * `data-over` and `data-hidden`, for the styles it adopts and an app's own.
 * A `gw-control-bar` gets `expandable` while it's over the picture, so it
 * shows its first row until its tab opens the rest. It uses `gw-button` for
 * the handle. Returns a function that stops it and puts the bar back.
 */
export const overlayControls = (
  bar: HTMLElement,
  {
    stage = bar.parentElement ?? undefined,
    fullscreen,
    hideAfter = 3000,
    stays = () => false,
    pressable,
    ignore,
    handleLabel = "Show the controls",
  }: OverlayControlsOptions = {},
): (() => void) => {
  if (stage === undefined) return () => {};

  const sideways = matchMedia(sidewaysQuery);
  const touchScreen = matchMedia("(pointer: coarse)");

  const presses =
    pressable === undefined
      ? overlayPressables
      : `${overlayPressables}, ${pressable}`;

  const controller = new AbortController();
  const { signal } = controller;

  const handle = h("gw-button", {
    class: "gw-overlay-handle",
    icon: chevronUp,
    labels: "hide",
    appearance: "plain",
    variant: "neutral",
    hidden: true,
  });

  handle.textContent = handleLabel;

  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Where a press on nothing to press began, which a tap there toggles the bar from. */
  let press: { readonly x: number; readonly y: number } | undefined;
  /** Whether the press under way toggled the bar, so its click does nothing else. */
  let toggled = false;
  /** Whether turning the phone on its side put it in full screen. */
  let turned = false;

  /**
   * The one finger pulling the bar down, if it is: where it went down, how
   * far the bar has come, and its last moves for how fast it was going.
   */
  let drag:
    | {
        readonly id: number;
        readonly x0: number;
        y0: number;
        following: boolean;
        distance: number;
        moves: Array<{ readonly at: number; readonly y: number }>;
      }
    | undefined;

  const isOver = () =>
    sideways.matches || (document.fullscreenElement?.contains(bar) ?? false);

  const isBar = bar.localName === "gw-control-bar";

  const keeps = () =>
    (isBar && bar.hasAttribute("expanded")) || overlayOpen(bar) || stays();

  const show = (hidden: boolean) => {
    bar.toggleAttribute("data-hidden", hidden);
    stage.toggleAttribute("data-controls-hidden", hidden);
    handle.hidden = !hidden;

    if (!hidden) bar.style.removeProperty("translate");
  };

  const sleep = () => {
    timer = undefined;

    if (!isOver()) return;

    if (keeps()) {
      timer = setTimeout(sleep, hideAfter);

      return;
    }

    show(true);
  };

  const wake = () => {
    show(false);
    clearTimeout(timer);
    timer = isOver() ? setTimeout(sleep, hideAfter) : undefined;
  };

  /** Hides it at once, unless something keeps it. */
  const hide = () => {
    clearTimeout(timer);
    timer = undefined;

    if (isOver() && !keeps()) show(true);
  };

  /** Over the picture or under it, as the window and full screen have it. */
  const place = () => {
    const over = isOver();

    stage.toggleAttribute("data-overlay", over);
    bar.toggleAttribute("data-over", over);

    if (isBar) bar.toggleAttribute("expandable", over);

    wake();
  };

  handle.addEventListener("click", wake, { signal });

  // A press on nothing to press can toggle the bar, if it's a tap
  stage.addEventListener(
    "pointerdown",
    (event) => {
      toggled = false;

      const path = event.composedPath();

      // Only what's on the picture counts: the stage may be focusable itself,
      // such as with tabindex="0" for shortcutKey's within
      const pressed =
        path.includes(bar) ||
        pressedBelow(
          path,
          stage,
          (target) => target instanceof Element && target.matches(presses),
        );

      press =
        !isOver() || pressed
          ? undefined
          : { x: event.clientX, y: event.clientY };
    },
    { capture: true, signal },
  );

  stage.addEventListener(
    "pointerup",
    (event) => {
      if (press === undefined) return;

      const tap =
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < 10;

      press = undefined;

      if (!tap) return;

      toggled = true;

      if (bar.hasAttribute("data-hidden")) wake();
      else hide();
    },
    { capture: true, signal },
  );

  // One the browser takes over, such as to scroll, toggles nothing
  stage.addEventListener(
    "pointercancel",
    () => {
      press = undefined;
    },
    { signal },
  );

  // A press that toggled the bar does nothing else
  for (const type of ["click", "dblclick"]) {
    stage.addEventListener(
      type,
      (event) => {
        if (!toggled) return;

        event.stopPropagation();

        if (type === "click") toggled = false;
      },
      { capture: true, signal },
    );
  }

  const stopSwipes = onSwipe(
    stage,
    (swipe) => {
      if (!isOver() || swipe.fingers !== 1) return;

      if (swipe.direction === "up") wake();
      // A drag down has already settled the bar where it let go
      else if (swipe.direction === "down" && drag === undefined) hide();
    },
    ignore === undefined ? {} : { ignore },
  );

  /** Lets the bar go: on down off the edge, or back up, as `dragCloses` has it. */
  const letGo = (closes: boolean) => {
    const following = drag?.following === true;

    drag = undefined;

    if (!following) return;

    bar.removeAttribute("data-dragging");

    if (closes) hide();
    else wake();

    // Under reduced motion it fades out where the finger left it, rather than
    // jump back up first
    if (!bar.hasAttribute("data-hidden") || !reducedMotion()) {
      bar.style.removeProperty("translate");
    }
  };

  // A finger pulling the bar down moves it with the finger, then it goes or
  // springs back by how far and how fast it went
  stage.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;

      // A second finger isn't pulling the bar
      if (drag !== undefined) {
        letGo(false);

        return;
      }

      const path = event.composedPath();

      if (
        !isOver() ||
        bar.hasAttribute("data-hidden") ||
        keeps() ||
        (ignore !== undefined &&
          path.some(
            (target) => target instanceof Element && target.matches(ignore),
          ))
      ) {
        return;
      }

      drag = {
        id: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        following: false,
        distance: 0,
        moves: [{ at: event.timeStamp, y: event.clientY }],
      };
    },
    { capture: true, signal },
  );

  stage.addEventListener(
    "pointermove",
    (event) => {
      if (drag === undefined || event.pointerId !== drag.id) return;

      const dx = event.clientX - drag.x0;
      const dy = event.clientY - drag.y0;

      // It follows once it's plainly a pull down, from there on, so it
      // doesn't jump by the slack
      if (!drag.following) {
        if (dy < 10 || dy < 2 * Math.abs(dx)) return;

        drag.following = true;
        drag.y0 = event.clientY;
        bar.toggleAttribute("data-dragging", true);
        clearTimeout(timer);
      }

      drag.distance = Math.min(
        Math.max(event.clientY - drag.y0, 0),
        bar.offsetHeight,
      );
      drag.moves = [
        ...drag.moves.filter((move) => event.timeStamp - move.at < 100),
        { at: event.timeStamp, y: event.clientY },
      ];
      bar.style.translate = `0 ${drag.distance}px`;
    },
    { signal },
  );

  stage.addEventListener(
    "pointerup",
    (event) => {
      if (drag === undefined || event.pointerId !== drag.id) return;

      const [first] = drag.moves;
      const time = first === undefined ? 0 : event.timeStamp - first.at;

      const velocity =
        first === undefined || time <= 0
          ? 0
          : ((event.clientY - first.y) / time) * 1000;

      const { distance } = drag;

      letGo(dragCloses({ distance, velocity, size: bar.offsetHeight }));
    },
    { signal },
  );

  stage.addEventListener(
    "pointercancel",
    (event) => {
      if (drag !== undefined && event.pointerId === drag.id) letGo(false);
    },
    { signal },
  );

  // Using the bar keeps it up
  bar.addEventListener("pointerdown", wake, { signal });

  // A mouse moving brings it back; a finger's only moves once it's down
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "mouse") wake();
    },
    { signal },
  );

  document.addEventListener("keydown", wake, { signal });
  sideways.addEventListener("change", place, { signal });

  document.addEventListener(
    "fullscreenchange",
    () => {
      if (document.fullscreenElement === null) turned = false;

      place();
    },
    { signal },
  );

  // Browsers mostly let a page go full screen only from a tap, so turning
  // the phone may not be enough; then it stays as it is
  if (fullscreen !== undefined && "orientation" in screen) {
    screen.orientation.addEventListener(
      "change",
      () => {
        if (
          !touchScreen.matches ||
          !document.fullscreenEnabled ||
          bar.getClientRects().length === 0
        ) {
          return;
        }

        const landscape = screen.orientation.type.startsWith("landscape");

        if (landscape && document.fullscreenElement === null) {
          void fullscreen.requestFullscreen().then(
            () => {
              turned = true;
            },
            () => undefined,
          );
        } else if (!landscape && turned) {
          turned = false;
          void document.exitFullscreen().catch(() => undefined);
        }
      },
      { signal },
    );
  }

  adoptStyles(stage, overlayStyles);
  bar.toggleAttribute("data-overlay-controls", true);
  stage.append(handle);
  place();

  return () => {
    controller.abort();
    stopSwipes();
    clearTimeout(timer);
    handle.remove();
    stage.removeAttribute("data-overlay");
    stage.removeAttribute("data-controls-hidden");

    for (const name of [
      "data-overlay-controls",
      "data-over",
      "data-hidden",
      "data-dragging",
    ]) {
      bar.removeAttribute(name);
    }

    bar.style.removeProperty("translate");

    if (isBar) bar.removeAttribute("expandable");
  };
};
