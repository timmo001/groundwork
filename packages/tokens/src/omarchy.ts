/**
 * Omarchy theme import: reads an Omarchy theme's `colors.toml` and maps it
 * onto a Groundwork mapped theme, so an app can follow the desktop's theme.
 * It parses the flat `key = "value"` lines itself, so it runs in a browser.
 *
 * @module
 */
import { Schema } from "effect";
import { MappedTheme } from "./schema.ts";

/**
 * The Omarchy theme a machine is using: its name, such as `Tokyo Night`,
 * and the text of its `colors.toml`.
 */
export interface OmarchyCurrentTheme {
  readonly name: string;
  readonly colors: string;
}

/** The `key = "value"` pairs of a flat TOML file, ignoring comments. */
const readPairs = (text: string): ReadonlyMap<string, string> => {
  const pairs = new Map<string, string>();

  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"/.exec(line);

    if (match?.[1] !== undefined && match[2] !== undefined) {
      pairs.set(match[1], match[2]);
    }
  }

  return pairs;
};

/**
 * Maps an Omarchy `colors.toml` onto a mapped theme's palette, then checks it
 * against the Schema. Missing keys or bad colors come back as a `Failure`.
 */
export const omarchyTheme = (
  text: string,
  name = "Omarchy",
  id = "omarchy",
) => {
  const pairs = readPairs(text);
  const color = (key: string) => pairs.get(key)?.toLowerCase();
  const text_ = color("bright_foreground") ?? color("foreground");
  const foreground = color("foreground");

  return Schema.decodeUnknownResult(MappedTheme)({
    kind: "mapped",
    id,
    name,
    family: "Omarchy",
    mode: pairs.get("mode") === "light" ? "light" : "dark",
    palette: {
      lower: color("dark_background"),
      background: color("background"),
      raised: color("lighter_background"),
      border: color("muted") ?? color("selection"),
      text: text_,
      // Omarchy's foreground is the body text; when it's the same as the
      // brightest text, its light foreground is the quieter one
      muted:
        foreground !== undefined && foreground !== text_
          ? foreground
          : color("light_foreground"),
      accent: color("accent"),
      info: color("blue"),
      success: color("green"),
      important: color("magenta"),
      warning: color("yellow"),
      danger: color("red"),
    },
  });
};
