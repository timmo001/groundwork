/**
 * The schema for `themes/*.json`: fonts, style, and the colors a theme sets
 * for each mode.
 *
 * @module
 */
import { Schema } from "effect";

/** A color written as a six-digit sRGB hex, such as `#1b1e23`. */
export const Hex = Schema.String.check(Schema.isPattern(/^#[0-9a-f]{6}$/));

/**
 * The text fonts Groundwork suggests, as the theme editor lists them. A
 * theme can name any family; see `FontFamily`.
 */
export const Font = Schema.Literals([
  "Mona Sans",
  "System UI",
  "Inter",
  "Geist",
  "IBM Plex Sans",
  "Noto Sans",
  "Albert Sans",
  "Hubot Sans",
  "Atkinson Hyperlegible Next",
  "Public Sans",
  "Source Sans 3",
  "Figtree",
  "Manrope",
  "Instrument Sans",
  "Onest",
  "Schibsted Grotesk",
]);

export type Font = typeof Font.Type;

/** The code fonts Groundwork suggests, as the theme editor lists them. */
export const MonoFont = Schema.Literals([
  "Geist Mono",
  "JetBrains Mono",
  "Monaspace Neon",
]);

export type MonoFont = typeof MonoFont.Type;

/**
 * A font family's name, such as `Inter` or one of `Font` and `MonoFont`'s.
 * The page loads the font's files; the stack falls back to the system's
 * font where it isn't there.
 */
export const FontFamily = Schema.NonEmptyString;

/**
 * The presets the named densities scale spacing by, or a number for any
 * scale between: 0.85, 1 and 1.2.
 */
export const Density = Schema.Union([
  Schema.Literals(["compact", "normal", "roomy"]),
  Schema.Number.check(Schema.isBetween({ minimum: 0.7, maximum: 1.5 })),
]);

export type Density = typeof Density.Type;

/**
 * How strong borders are: a preset, or a number from 0 (none) through 1
 * (hairline) and 2 (soft) to 3 (strong), mixing between the theme's quiet,
 * normal and loud border colors.
 */
export const BorderStrength = Schema.Union([
  Schema.Literals(["none", "hairline", "soft", "strong"]),
  Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 3 })),
]);

export type BorderStrength = typeof BorderStrength.Type;

/** How a theme looks beyond color: shape, density, type and surface accents. */
export const Style = Schema.Struct({
  font: FontFamily,
  /** The font for figures and tabular numbers, when it differs from `font`. */
  figures: Schema.optionalKey(FontFamily),
  /**
   * Whether `figures` is a monospace font, for its fallback. Defaults to
   * whether it's one of `MonoFont`'s.
   */
  figuresMono: Schema.optionalKey(Schema.Boolean),
  mono: FontFamily,
  radius: Schema.Struct({
    panel: Schema.Number,
    control: Schema.Number,
    chip: Schema.Number,
  }),
  border: Schema.Struct({
    width: Schema.Number,
    strength: BorderStrength,
  }),
  weights: Schema.Struct({
    regular: Schema.Number,
    strong: Schema.Number,
  }),
  density: Density,
  capitals: Schema.Boolean,
  link: Schema.Struct({
    color: Schema.Literals(["text", "accent"]),
    underline: Schema.Literals(["thin", "thick"]),
  }),
  surfaceAccent: Schema.Literals(["none", "sheen", "marker", "flange"]),
  rows: Schema.Literals(["cards", "dense"]),
});

export interface Style extends Schema.Schema.Type<typeof Style> {}

/**
 * A core theme: two inputs solved into every role for light, dark and Darker.
 * The background sets the dark surface and the tint carried into light; the
 * accent sets the hue and chroma of the one color the theme is known by.
 */
export const SolvedTheme = Schema.Struct({
  kind: Schema.tag("solved"),
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  background: Hex,
  accent: Hex,
  style: Style,
  /** Apps that use the theme, as examples. Any app can pick any theme. */
  examples: Schema.optionalKey(Schema.Array(Schema.String)),
});

export interface SolvedTheme extends Schema.Schema.Type<typeof SolvedTheme> {}

/** One mode of a mapped theme: its own palette placed onto the roles. */
export const Palette = Schema.Struct({
  lower: Hex,
  background: Hex,
  raised: Hex,
  border: Hex,
  text: Hex,
  muted: Hex,
  accent: Hex,
  info: Hex,
  success: Hex,
  important: Hex,
  warning: Hex,
  danger: Hex,
});

export interface Palette extends Schema.Schema.Type<typeof Palette> {}

/**
 * An optional theme mapped from an existing palette, such as Catppuccin, so it
 * stays faithful. It takes Base's style. Some flavors are one mode, such as
 * Catppuccin's; one that comes in both, such as GitHub's or Tokyo Night's,
 * also gives the other mode's palette.
 */
export const MappedTheme = Schema.Struct({
  kind: Schema.tag("mapped"),
  id: Schema.String,
  name: Schema.String,
  family: Schema.String,
  /** The mode `palette` is for. */
  mode: Schema.Literals(["light", "dark"]),
  palette: Palette,
  /** The other mode's palette, for a theme that covers both. */
  otherPalette: Schema.optionalKey(Palette),
});

export interface MappedTheme extends Schema.Schema.Type<typeof MappedTheme> {}

export const Theme = Schema.Union([SolvedTheme, MappedTheme]);

export type Theme = typeof Theme.Type;
