/**
 * Theme translation: reads another app's color theme, such as a Ghostty,
 * kitty, foot or Alacritty theme or an older Omarchy theme, and maps it onto
 * a mapped theme's palette, so an app can offer the themes a
 * machine already has. It parses each format itself, so it runs in a
 * browser; `@timmo001/groundwork-tokens/desktop-themes` finds them on disk.
 *
 * @module
 */
import { converter, formatHex, interpolate, parse, wcagContrast } from "culori";

import { distance, fromHex, shift, toHex } from "./color.ts";
import type { MappedTheme, Palette } from "./schema.ts";

/**
 * A terminal's colors: the background and foreground, the 16 ANSI colors in
 * order, and the accent where the format names one.
 */
export interface TerminalPalette {
  readonly background: string;
  readonly foreground: string;
  /** The 16 ANSI colors, black to bright white. Missing ones are `undefined`. */
  readonly ansi: readonly (string | undefined)[];
  readonly accent?: string | undefined;
  /** A darker surface, such as a side bar, where the format has one. */
  readonly lower?: string | undefined;
  /** A raised surface, such as a widget's, where the format has one. */
  readonly raised?: string | undefined;
  readonly border?: string | undefined;
  readonly muted?: string | undefined;
  readonly mode?: "light" | "dark" | undefined;
}

const toRgb = converter("rgb");

/** A CSS color as six-digit hex, dropping any alpha, or `undefined`. */
export const normalizeHex = (value: string | undefined) => {
  if (value === undefined) return undefined;

  const trimmed = value.trim().replace(/^0x/i, "#");

  const color = parse(/^[0-9a-f]{6}$/i.test(trimmed) ? `#${trimmed}` : trimmed);

  return color === undefined ? undefined : formatHex(toRgb(color));
};

const mix = (a: string, b: string, amount: number) =>
  formatHex(toRgb(interpolate([a, b], "oklch")(amount)));

/** Whether a background reads as light. */
const isLight = (background: string) =>
  wcagContrast(background, "#000000") > wcagContrast(background, "#ffffff");

/**
 * Maps a terminal palette onto a mapped theme. Surfaces the format doesn't
 * name are stepped from the background, and the status colors come from
 * the ANSI colors: blue for info, green, magenta, yellow and red.
 */
export const translatePalette = (
  colors: TerminalPalette,
  options: {
    readonly id: string;
    readonly name: string;
    readonly family: string;
  },
): MappedTheme | undefined => {
  const background = normalizeHex(colors.background);
  const text = normalizeHex(colors.foreground);

  if (background === undefined || text === undefined) return undefined;

  const ansi = (index: number) => normalizeHex(colors.ansi[index]);
  const mode = colors.mode ?? (isLight(background) ? "light" : "dark");
  const base = fromHex(background);

  const blue = ansi(4) ?? ansi(12);
  const green = ansi(2) ?? ansi(10);
  const magenta = ansi(5) ?? ansi(13);
  const yellow = ansi(3) ?? ansi(11);
  const red = ansi(1) ?? ansi(9);

  if (
    blue === undefined ||
    green === undefined ||
    magenta === undefined ||
    yellow === undefined ||
    red === undefined
  ) {
    return undefined;
  }

  const palette: Palette = {
    lower: normalizeHex(colors.lower) ?? toHex(shift(base, -0.025)),
    background,
    raised:
      normalizeHex(colors.raised) ??
      toHex(shift(base, mode === "dark" ? 0.05 : 0.02)),
    border: normalizeHex(colors.border) ?? mix(background, text, 0.2),
    text,
    muted: normalizeHex(colors.muted) ?? mix(text, background, 0.3),
    accent: normalizeHex(colors.accent) ?? blue,
    info: blue,
    success: green,
    important: magenta,
    warning: yellow,
    danger: red,
  };

  return {
    kind: "mapped",
    id: options.id,
    name: options.name,
    family: options.family,
    mode,
    palette,
  };
};

/** The `key = value` pairs of a flat config file, skipping comments. */
const pairs = (text: string, separator: RegExp) => {
  const found = new Map<string, string>();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }

    const match = separator.exec(trimmed);

    if (match?.[1] !== undefined && match[2] !== undefined) {
      found.set(
        match[1].toLowerCase(),
        match[2].trim().replace(/^["']|["']$/g, ""),
      );
    }
  }

  return found;
};

/** A Ghostty theme or config: `palette = N=#hex`, `background`, `foreground`. */
export const ghosttyPalette = (text: string): TerminalPalette => {
  const ansi: (string | undefined)[] = [];
  let background: string | undefined;
  let foreground: string | undefined;

  for (const line of text.split(/\r?\n/)) {
    const palette = /^\s*palette\s*=\s*(\d+)\s*=\s*(\S+)/.exec(line);

    if (palette?.[1] !== undefined && palette[2] !== undefined) {
      ansi[Number(palette[1])] = palette[2];
      continue;
    }

    const pair = /^\s*(background|foreground)\s*=\s*(\S+)/.exec(line);

    if (pair?.[1] === "background") background = pair[2];

    if (pair?.[1] === "foreground") foreground = pair[2];
  }

  return { background: background ?? "", foreground: foreground ?? "", ansi };
};

/** A kitty theme or config: `background`, `foreground`, `colorN`. */
export const kittyPalette = (text: string): TerminalPalette => {
  const found = pairs(text, /^([\w-]+)\s+(\S+)/);

  return {
    background: found.get("background") ?? "",
    foreground: found.get("foreground") ?? "",
    ansi: Array.from({ length: 16 }, (_, index) => found.get(`color${index}`)),
    accent: found.get("active_border_color"),
  };
};

/** A foot config's `[colors]` (or `[colors-dark]`): `regularN`, `brightN`. */
export const footPalette = (text: string): TerminalPalette => {
  const found = pairs(text, /^([\w-]+)\s*=\s*(\S+)/);

  return {
    background: found.get("background") ?? "",
    foreground: found.get("foreground") ?? "",
    ansi: [
      ...Array.from({ length: 8 }, (_, index) => found.get(`regular${index}`)),
      ...Array.from({ length: 8 }, (_, index) => found.get(`bright${index}`)),
    ],
  };
};

const ansiNames = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
] as const;

/** An Alacritty theme or config: `[colors.primary]`, `[colors.normal]`, `[colors.bright]`. */
export const alacrittyPalette = (text: string): TerminalPalette => {
  const sections = new Map<string, Map<string, string>>();
  let section = "";

  for (const line of text.split(/\r?\n/)) {
    const header = /^\s*\[([^\]]+)\]/.exec(line);

    if (header?.[1] !== undefined) {
      section = header[1].trim();
      continue;
    }

    const pair = /^\s*(\w+)\s*=\s*["']?(#?[0-9a-fA-Fx]+)["']?/.exec(line);

    if (pair?.[1] !== undefined && pair[2] !== undefined) {
      const entries = sections.get(section) ?? new Map<string, string>();

      entries.set(pair[1], pair[2]);
      sections.set(section, entries);
    }
  }

  const get = (name: string, key: string) => sections.get(name)?.get(key);

  return {
    background: get("colors.primary", "background") ?? "",
    foreground: get("colors.primary", "foreground") ?? "",
    ansi: [
      ...ansiNames.map((name) => get("colors.normal", name)),
      ...ansiNames.map((name) => get("colors.bright", name)),
    ],
  };
};

/**
 * A flat `colors.toml` written with the ANSI colors as `color0` to
 * `color15`, as older Omarchy themes have it; `omarchyTheme` reads the
 * newer one with named colors.
 */
export const colorsTomlPalette = (text: string): TerminalPalette => {
  const found = pairs(text, /^([\w-]+)\s*=\s*(.+)$/);

  return {
    background: found.get("background") ?? "",
    foreground: found.get("foreground") ?? "",
    ansi: Array.from({ length: 16 }, (_, index) => found.get(`color${index}`)),
    accent: found.get("accent"),
  };
};

/** A name to compare by: `Nord (Omarchy)` reads as `nord`. */
const nameKey = (name: string) =>
  name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const close = (a: string, b: string) => distance(a, b) < 0.03;

/**
 * Whether two themes are the same one: the same name, or the same
 * background with most of the same status colors. Text isn't compared, as a
 * terminal's foreground is often a step off the brightest text its theme
 * names.
 */
export const sameTheme = (
  a: Pick<MappedTheme, "name" | "palette">,
  b: Pick<MappedTheme, "name" | "palette">,
) =>
  nameKey(a.name) === nameKey(b.name) ||
  (close(a.palette.background, b.palette.background) &&
    (["info", "success", "warning", "danger", "important"] as const).filter(
      (role) => close(a.palette[role], b.palette[role]),
    ).length >= 3);

/**
 * Drops each candidate that's the same theme as one in `existing` or one
 * kept before it, so a terminal following the desktop's theme, or a theme
 * Groundwork already ships, shows once.
 */
export const distinctThemes = (
  candidates: readonly MappedTheme[],
  existing: readonly Pick<MappedTheme, "name" | "palette">[],
) => {
  const kept: MappedTheme[] = [];

  for (const candidate of candidates) {
    if (
      !existing.some((theme) => sameTheme(theme, candidate)) &&
      !kept.some((theme) => sameTheme(theme, candidate))
    ) {
      kept.push(candidate);
    }
  }

  return kept;
};
