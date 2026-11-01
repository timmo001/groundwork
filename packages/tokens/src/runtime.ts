/**
 * Themes at runtime: decodes a theme document a user uploaded or an agent
 * wrote, solves it and returns its CSS and contrast checks. It needs no file
 * system, so it runs in a browser.
 *
 * @module
 */
import { Schema } from "effect";
import baseDocument from "../themes/base.json" with { type: "json" };
import { themeCss } from "./generate.ts";
import { SolvedTheme, Theme } from "./schema.ts";
import { check, resolve, type Check, type ResolvedTheme } from "./solve.ts";

export { omarchyTheme } from "./omarchy.ts";

const base = Schema.decodeUnknownSync(SolvedTheme)(baseDocument);

/** A theme solved at runtime, with its CSS and every contrast check. */
export interface RuntimeTheme {
  readonly theme: ResolvedTheme;
  readonly css: string;
  readonly checks: readonly Check[];
}

/** Decodes a theme document from its JSON text, as a `Result`. */
export const parseTheme = Schema.decodeUnknownResult(
  Schema.fromJsonString(Theme),
);

/**
 * Solves a theme into light, dark and Darker. Its CSS applies under
 * `data-gw-theme` set to `id`, which defaults to the theme's own.
 */
export const runtimeTheme = (theme: Theme, id = theme.id): RuntimeTheme => {
  const resolved = resolve({ ...theme, id }, base.style);

  return { theme: resolved, css: themeCss(resolved), checks: check(resolved) };
};

/**
 * Where an app keeps a user's theme document. The document is stored, not
 * its CSS, so it's solved again when the solver changes. Local storage is
 * the first tier; an app with a profile or a host, such as System Bridge,
 * passes its own store with the same shape.
 */
export interface ThemeStore {
  /** The stored document's JSON text, or `null` when there's none. */
  readonly load: () => Promise<string | null>;
  readonly save: (text: string) => Promise<void>;
  readonly clear: () => Promise<void>;
}

/**
 * A store in the browser's local storage under `key`. It reads as empty and
 * skips writes when storage is blocked, so a theme still applies for the visit.
 */
export const localThemeStore = (key: string): ThemeStore => ({
  load: async () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  save: async (text) => {
    try {
      localStorage.setItem(key, text);
    } catch {
      // Blocked or full: the theme still applies until the page closes
    }
  },
  clear: async () => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clear when storage is blocked
    }
  },
});
