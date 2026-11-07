/**
 * Values kept in `localStorage` or `sessionStorage` as JSON, read once and
 * cached, with writes that fail quietly where storage is unavailable, such as
 * in a private window. Elements with a `storage-key` keep their view state
 * through it, and a page can keep its own the same way. Whoever reads a value
 * checks it against what it can be, since anyone can edit what's kept.
 * Adapted from the Home Assistant frontend's `getStorage`
 * (src/common/decorators/storage.ts, Apache-2.0), without its Lit decorator.
 *
 * @module
 */
import type { Json } from "./element.js";

/** Which of the browser's stores a value is kept in. */
export type StorageName = "localStorage" | "sessionStorage";

/** A store's values, by key. */
export interface StoredValues {
  /** The value under `key`, or `undefined` when there's none or it isn't JSON. */
  readonly get: (key: string) => Json | undefined;
  /** Keeps `value` under `key`; `undefined` removes it. */
  readonly set: (key: string, value: Json | undefined) => void;
  /** Calls `listener` when `key` changes, here or in another tab. Returns the unsubscribe. */
  readonly subscribe: (key: string, listener: () => void) => () => void;
}

const parse = (text: string | null) => {
  if (text === null) return undefined;

  try {
    const value: Json = JSON.parse(text);

    return value;
  } catch {
    // Not JSON: treated as nothing kept
    return undefined;
  }
};

const open = (name: StorageName): StoredValues => {
  const cache = new Map<string, Json | undefined>();
  const listeners = new Map<string, Set<() => void>>();

  const store = () => {
    try {
      return window[name];
    } catch {
      // Blocked, such as with cookies turned off
      return undefined;
    }
  };

  const notify = (key: string) => {
    for (const listener of listeners.get(key) ?? []) listener();
  };

  // Only localStorage fires storage events, for changes from other tabs
  if (name === "localStorage") {
    window.addEventListener("storage", (event) => {
      if (event.key === null || !cache.has(event.key)) return;

      cache.set(event.key, parse(event.newValue));
      notify(event.key);
    });
  }

  return {
    get: (key) => {
      if (!cache.has(key)) {
        let text: string | null = null;

        try {
          text = store()?.getItem(key) ?? null;
        } catch {
          // Unreadable: treated as nothing kept
        }

        cache.set(key, parse(text));
      }

      return cache.get(key);
    },
    set: (key, value) => {
      cache.set(key, value);

      try {
        if (value === undefined) store()?.removeItem(key);
        else store()?.setItem(key, JSON.stringify(value));
      } catch {
        // Unavailable or full: the value still holds until the page closes
      }

      notify(key);
    },
    subscribe: (key, listener) => {
      const set = listeners.get(key) ?? new Set<() => void>();

      set.add(listener);
      listeners.set(key, set);

      return () => set.delete(listener);
    },
  };
};

const stores = new Map<StorageName, StoredValues>();

/** The values in one of the browser's stores, shared across the page. */
export const getStorage = (name: StorageName = "localStorage") => {
  const existing = stores.get(name);

  if (existing !== undefined) return existing;

  const created = open(name);

  stores.set(name, created);

  return created;
};
