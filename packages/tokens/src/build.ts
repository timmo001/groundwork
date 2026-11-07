/**
 * Builds every target from theme documents, an app's own as well as
 * Groundwork's: CSS, JSON, TypeScript, QML, OpenTUI, ANSI and Blume's
 * tokens. It reads no files, so it runs anywhere; the `groundwork-tokens`
 * command writes what it returns.
 *
 * @module
 */
import { Schema } from "effect";
import baseDocument from "../themes/base.json" with { type: "json" };
import {
  ansi,
  blumeTheme,
  blumeThemes,
  css,
  json,
  opentui,
  qml,
  typescript,
} from "./generate.ts";
import { SolvedTheme, type Style, type Theme } from "./schema.ts";
import { check, resolve, type Check, type ResolvedTheme } from "./solve.ts";

const base = Schema.decodeUnknownSync(SolvedTheme)(baseDocument);

/** The note at the top of each file built for an app. */
const appNote =
  "Generated from theme documents by @timmo001/groundwork-tokens. Don't edit.";

/** Every target `build` writes. */
export const targets = [
  "css",
  "json",
  "typescript",
  "qml",
  "opentui",
  "ansi",
  "blume",
] as const;

export type Target = (typeof targets)[number];

export interface BuildOptions {
  /** The targets to build. Defaults to every one. */
  readonly targets?: readonly Target[];
  /** The style a mapped theme takes when it gives none. Defaults to Base's. */
  readonly baseStyle?: Style;
  /** The note at the top of each file. */
  readonly note?: string;
}

export interface Build {
  /** The themes solved, in the order given. */
  readonly themes: readonly ResolvedTheme[];
  /**
   * Each file's name and text: `themes.css`, `themes.json`, `themes.ts`,
   * `Themes.qml`, `opentui.ts`, `ansi.json`, and `blume/<id>.css` for each
   * theme with `blume/all.css` for them all.
   */
  readonly files: Readonly<Record<string, string>>;
  /** Every role's contrast check, passing or not. */
  readonly checks: readonly Check[];
}

/**
 * Solves theme documents, in the order given, and writes each target for
 * them. Pass Groundwork's own documents too, from `themes/*.json`, to ship
 * an app's theme beside them.
 */
export const build = (
  documents: readonly Theme[],
  options: BuildOptions = {},
): Build => {
  const baseStyle = options.baseStyle ?? base.style;
  const themes = documents.map((document) => resolve(document, baseStyle));
  const note = options.note ?? appNote;
  const wanted = new Set<Target>(options.targets ?? targets);

  const files: Record<string, string> = {};

  if (wanted.has("css")) files["themes.css"] = css(themes, note);

  if (wanted.has("json")) files["themes.json"] = json(themes);

  if (wanted.has("typescript")) files["themes.ts"] = typescript(themes, note);

  if (wanted.has("qml")) files["Themes.qml"] = qml(themes, note);

  if (wanted.has("opentui")) files["opentui.ts"] = opentui(themes, note);

  if (wanted.has("ansi")) files["ansi.json"] = ansi(note);

  if (wanted.has("blume")) {
    for (const theme of themes) {
      files[`blume/${theme.id}.css`] = blumeTheme(theme, note);
    }

    files["blume/all.css"] = blumeThemes(themes, note);
  }

  return { themes, files, checks: themes.flatMap(check) };
};
