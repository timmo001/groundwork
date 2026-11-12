/**
 * Unsaved changes. A `DirtyState` follows whether a form's values differ
 * from what was last saved, and the page has unsaved changes while any one
 * does. Closing or reloading the tab then asks first, and `confirmLeave`
 * asks before the app moves to another page, which a router calls from its
 * guard. Adapted from the Home Assistant frontend's `DirtyStateProviderMixin`
 * (src/mixins/dirty-state-provider-mixin.ts, Apache-2.0), without Lit or its
 * context.
 *
 * @module
 */
import { h } from "./element.js";
import type {} from "./gw-button.js";
import type {} from "./gw-dialog.js";

export interface DirtyStateOptions<T> {
  /** Whether two values are the same. Defaults to comparing them as JSON, where key order counts. */
  readonly compare?: (a: T, b: T) => boolean;
  /** Puts the values back as they were saved, when someone chooses to leave without saving. */
  readonly discard?: () => void;
}

/** The words `confirmLeave` asks with, for an app in another language. */
export interface LeaveLabels {
  /** Defaults to `Unsaved changes`. */
  readonly heading?: string;
  /** Defaults to `Leave without saving? Your changes will be lost.` */
  readonly question?: string;
  /** Defaults to `Keep editing`. */
  readonly keep?: string;
  /** Defaults to `Leave`. */
  readonly leave?: string;
}

/** Fired on `window` each time the page gains or loses unsaved changes. */
export const unsavedChangesEvent = "gw-unsaved-changes";

interface Tracked {
  readonly dirty: boolean;
  readonly discardChanges: () => void;
}

const tracked = new Set<Tracked>();

let guardingUnload = false;

/** Whether any `DirtyState` on the page has unsaved changes. */
export const hasUnsavedChanges = () => [...tracked].some((each) => each.dirty);

const publish = () => {
  window.dispatchEvent(new Event(unsavedChangesEvent));
};

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges()) event.preventDefault();
};

const sameJson = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Whether one form's values differ from what was last saved. `start` sets
 * the saved values, `update` passes the values as they are now, and
 * `markClean` takes them as saved after a save. The first `update` before
 * any `start` sets the saved values too.
 */
export class DirtyState<T> {
  #saved: { readonly value: T } | undefined;

  #current: { readonly value: T } | undefined;

  #dirty = false;

  readonly #compare: (a: T, b: T) => boolean;

  readonly #discard: (() => void) | undefined;

  readonly #listeners = new Set<(dirty: boolean) => void>();

  constructor(options: DirtyStateOptions<T> = {}) {
    this.#compare = options.compare ?? sameJson;
    this.#discard = options.discard;
    tracked.add(this);

    if (!guardingUnload) {
      guardingUnload = true;
      window.addEventListener("beforeunload", onBeforeUnload);
    }
  }

  /** Whether the values differ from what was last saved. */
  get dirty() {
    return this.#dirty;
  }

  /** Takes `value` as saved, such as when the form loads. */
  start(value: T) {
    this.#saved = { value: structuredClone(value) };
    this.#current = { value };
    this.#set(false);
  }

  /** Passes the values as they are now. */
  update(value: T) {
    if (this.#saved === undefined) {
      this.start(value);

      return;
    }

    this.#current = { value };
    this.#set(!this.#compare(this.#saved.value, value));
  }

  /** Takes the values as they are now as saved, after a save. */
  markClean() {
    if (this.#current !== undefined) {
      this.#saved = { value: structuredClone(this.#current.value) };
    }

    this.#set(false);
  }

  /** Puts the values back as they were saved, through the `discard` option. */
  discardChanges() {
    this.#discard?.();
    this.#current = this.#saved;
    this.#set(false);
  }

  /** Calls `listener` each time it gains or loses changes. Returns the unsubscribe. */
  subscribe(listener: (dirty: boolean) => void) {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** Stops counting towards the page's unsaved changes, such as when its form is removed. */
  dispose() {
    tracked.delete(this);
    this.#listeners.clear();
    publish();
  }

  #set(dirty: boolean) {
    if (dirty === this.#dirty) return;

    this.#dirty = dirty;

    for (const listener of this.#listeners) listener(dirty);

    publish();
  }
}

const ask = (labels: LeaveLabels): Promise<boolean> => {
  const question =
    labels.question ?? "Leave without saving? Your changes will be lost.";

  // Without gw-dialog defined, the browser asks instead
  // oxlint-disable-next-line no-alert -- the fallback when the app has no gw-dialog
  if (customElements.get("gw-dialog") === undefined) {
    return Promise.resolve(window.confirm(question));
  }

  const dialog = h(
    "gw-dialog",
    { heading: labels.heading ?? "Unsaved changes" },
    h("p", {}, question),
    h(
      "gw-button",
      {
        slot: "actions",
        variant: "neutral",
        appearance: "plain",
        value: "keep",
      },
      labels.keep ?? "Keep editing",
    ),
    h(
      "gw-button",
      { slot: "actions", variant: "danger", value: "leave" },
      labels.leave ?? "Leave",
    ),
  );

  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();
        resolve(dialog.returnValue === "leave");
      },
      { once: true },
    );
    document.body.append(dialog);
    dialog.show();
  });
};

let asking: Promise<boolean> | undefined;

/**
 * Whether the app may move to another page: at once while nothing is
 * unsaved, otherwise once someone chooses to leave, which puts every
 * changed form back as it was saved. It answers `true` straight away while
 * nothing is unsaved, so a router goes on without holding the page. It asks
 * in a `gw-dialog` when one is defined, or the browser's own confirm when
 * not. Asked again while it's asking, it waits on the same answer rather
 * than asking twice.
 */
export const confirmLeave = (
  labels: LeaveLabels = {},
): boolean | Promise<boolean> => {
  if (!hasUnsavedChanges()) return true;

  asking ??= ask(labels).then((leave) => {
    asking = undefined;

    if (leave) {
      for (const each of tracked) {
        if (each.dirty) each.discardChanges();
      }
    }

    return leave;
  });

  return asking;
};
