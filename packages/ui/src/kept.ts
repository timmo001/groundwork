/**
 * Reading view state back from the shared store for elements with a
 * `storage-key`. Anyone can edit what's kept, so each part is checked
 * against what it can be before it's used.
 *
 * @module
 */
import type { Json } from "./element.js";
import { getStorage } from "./storage.js";

const isRecord = (
  value: Json | undefined,
): value is { readonly [key: string]: Json } =>
  value instanceof Object && !Array.isArray(value);

/** Whether a kept value is text, boxed so it's told apart without `typeof`. */
export const isText = (value: Json | undefined): value is string =>
  Object(value) instanceof String;

/** The text in a kept list, leaving out anything else. */
export const textsOf = (value: Json | undefined) =>
  Array.isArray(value) ? value.filter(isText) : undefined;

/** What's kept under a key, if it's a record of view state at all. */
export const keptAt = (key: string) => {
  const kept = getStorage().get(key);

  return isRecord(kept) ? kept : undefined;
};

/** Keeps `part` under `key`, beside what's already kept there. */
export const keep = (key: string, part: { readonly [key: string]: Json }) => {
  getStorage().set(key, { ...keptAt(key), ...part });
};
