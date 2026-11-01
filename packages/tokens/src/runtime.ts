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
