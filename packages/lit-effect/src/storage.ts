/**
 * `@storage`: keeps a Lit element's property in `localStorage` or
 * `sessionStorage`, so it outlasts a reload. `getStorage` reads and writes
 * the same values from code that isn't a decorated property. Values are kept
 * as JSON and checked against a Schema when they're read, so a stale or
 * hand-edited value falls back to the default. Adapted from the Home
 * Assistant frontend's storage decorator (src/common/decorators/storage.ts,
 * Apache-2.0), for standard decorators.
 *
 * @module
 */
import { Option, Schema } from "effect";
import type { ReactiveElement } from "lit";

/** Which of the browser's stores a value is kept in. */
export type StorageName = "localStorage" | "sessionStorage";

/** A value that survives `JSON.stringify` and `JSON.parse`. */
export type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | { readonly [key: string]: Json };

/** How a kept value is checked when read, and written back as JSON. */
export type StoredSchema<A> = Schema.Codec<A, Json>;

/** A store's values, by key, kept as JSON. */
export interface StoredValues {
  /**
   * The value under `key`, or `undefined` when there's none, it can't be
   * read, or it doesn't match `schema`.
   */
  readonly get: <A>(key: string, schema: StoredSchema<A>) => A | undefined;
  /** Keeps `value` under `key`; `undefined` removes it. */
  readonly set: <A>(
    key: string,
    schema: StoredSchema<A>,
    value: A | undefined,
  ) => void;
  /** Calls `listener` when `key` changes, here or in another tab. Returns the unsubscribe. */
  readonly subscribe: (key: string, listener: () => void) => () => void;
}

const parse = (text: string | null) => {
  if (text === null) return undefined;

  try {
    const value: unknown = JSON.parse(text);

    return value;
  } catch {
    // Not JSON: treated as nothing kept
    return undefined;
  }
};

const open = (name: StorageName): StoredValues => {
  // The raw parsed JSON, checked against a schema on each read
  const cache = new Map<string, unknown>();
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

  const raw = (key: string) => {
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
    get: (key, schema) =>
      Option.getOrUndefined(Schema.decodeUnknownOption(schema)(raw(key))),
    set: (key, schema, value) => {
      const encoded =
        value === undefined
          ? undefined
          : Option.getOrUndefined(Schema.encodeOption(schema)(value));

      cache.set(key, encoded);

      try {
        if (encoded === undefined) store()?.removeItem(key);
        else store()?.setItem(key, JSON.stringify(encoded));
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

/** The values in one of the browser's stores, shared with `@storage`. */
export const getStorage = (name: StorageName = "localStorage") => {
  const existing = stores.get(name);

  if (existing !== undefined) return existing;

  const created = open(name);

  stores.set(name, created);

  return created;
};

export interface StorageOptions<A> {
  /** How the kept value is checked when read. */
  readonly schema: StoredSchema<A>;
  /** The key it's kept under. Defaults to the property's name. */
  readonly key?: string;
  /** Defaults to `localStorage`. */
  readonly storage?: StorageName;
  /**
   * Redraws the element when the value changes elsewhere: another element
   * with the same key, `getStorage`, or another tab. Defaults to `true`.
   */
  readonly subscribe?: boolean;
}

/**
 * Keeps an `accessor` property in storage. It starts from the kept value,
 * or its initializer when nothing valid is kept yet, and setting it keeps
 * the new value and redraws the element, so it needs no `@state` of its own.
 *
 * ```ts
 * class GwIssues extends LitElement {
 *   @storage({ key: "issues:view", schema: Schema.Literals(["list", "board"]) })
 *   accessor view: "list" | "board" = "list";
 * }
 * ```
 */
export const storage =
  <A>(options: StorageOptions<A>) =>
  <E extends ReactiveElement>(
    target: ClassAccessorDecoratorTarget<E, A>,
    context: ClassAccessorDecoratorContext<E, A>,
  ): ClassAccessorDecoratorResult<E, A> => {
    const key = options.key ?? String(context.name);
    const store = getStorage(options.storage ?? "localStorage");
    const { schema } = options;

    if (options.subscribe !== false) {
      context.addInitializer(function (this: E) {
        let unsubscribe: (() => void) | undefined;

        this.addController({
          hostConnected: () => {
            unsubscribe ??= store.subscribe(key, () =>
              this.requestUpdate(context.name),
            );
          },
          hostDisconnected: () => {
            unsubscribe?.();
            unsubscribe = undefined;
          },
        });
      });
    }

    return {
      init(value) {
        return store.get(key, schema) ?? value;
      },
      get() {
        return store.get(key, schema) ?? target.get.call(this);
      },
      set(value) {
        const old = target.get.call(this);

        target.set.call(this, value);
        store.set(key, schema, value);
        this.requestUpdate(context.name, old);
      },
    };
  };
