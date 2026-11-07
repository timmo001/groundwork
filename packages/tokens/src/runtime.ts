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
import { androidFallbackTheme } from "./android.ts";
import { MappedTheme, SolvedTheme, Theme } from "./schema.ts";
import { check, resolve, type Check, type ResolvedTheme } from "./solve.ts";
import { appTonesCss, type AppTones } from "./tones.ts";

export { omarchyTheme, type OmarchyCurrentTheme } from "./omarchy.ts";

export {
  androidColorRoles,
  androidFallbackTheme,
  androidTheme,
  androidThemeId,
  type AndroidColorRole,
  type AndroidColors,
  type AndroidScheme,
} from "./android.ts";

export { blumeThemeCss, blumeThemesCss, hexModes, layers } from "./generate.ts";

export { appTonesCss, type AppTones } from "./tones.ts";

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
 * `data-gw-theme` set to `id`, which defaults to the theme's own, in the
 * same tokens layer as the built-in themes.
 */
export const runtimeTheme = (theme: Theme, id = theme.id): RuntimeTheme => {
  const resolved = resolve({ ...theme, id }, base.style);

  return { theme: resolved, css: themeCss(resolved), checks: check(resolved) };
};

/**
 * Solves a theme mapped from the system's colors, as `runtimeTheme` does.
 * When it misses a contrast target, such as on a wallpaper whose colors sit
 * too close, it's solved from its surface and primary instead, or from
 * `fallback` when the app gives one, and `fallback` reads `true`.
 */
export const androidRuntimeTheme = (
  theme: MappedTheme,
  fallback: (theme: MappedTheme) => Theme = androidFallbackTheme,
): RuntimeTheme & { readonly fallback: boolean } => {
  const mapped = runtimeTheme(theme);

  return mapped.checks.every((item) => item.passes)
    ? { ...mapped, fallback: false }
    : { ...runtimeTheme(fallback(theme), theme.id), fallback: true };
};

/**
 * An app's own tones as CSS for each of `themes`: `--app-tone-<name>`,
 * `-fill` and `-border`, solved against each theme's surfaces in every mode
 * so they meet the status colors' contrast. Put it beside the themes' CSS,
 * such as at build time, then point a component's tone at one:
 *
 * ```css
 * .regressed { --gw-tone: var(--app-tone-regressed); }
 * ```
 */
export const appTones = (tones: AppTones, themes: readonly Theme[]) =>
  themes
    .map((theme) => appTonesCss(tones, resolve(theme, base.style)))
    .join("\n\n");

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
