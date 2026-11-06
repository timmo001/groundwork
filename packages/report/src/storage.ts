/**
 * Values kept in `localStorage` or `sessionStorage` as JSON, read once and
 * cached, checked against a Schema on each read, with writes that fail
 * quietly where storage is unavailable, such as in a private window. Adapted
 * from the Home Assistant frontend's `getStorage`
 * (src/common/decorators/storage.ts, Apache-2.0), without its Lit decorator:
 * the report's page script isn't a Lit element.
 *
 * @module
 */
import { Option, Schema } from "effect";

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

/** A store's values, by key. */
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

  const store = () => {
    try {
      return window[name];
    } catch {
      // Blocked, such as with cookies turned off
      return undefined;
    }
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
