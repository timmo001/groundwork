import { Schema } from "effect";

/** A colour written as a six-digit sRGB hex, such as `#1b1e23`. */
export const Hex = Schema.String.check(Schema.isPattern(/^#[0-9a-f]{6}$/));

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

export const MonoFont = Schema.Literals([
  "Geist Mono",
  "JetBrains Mono",
  "Monaspace Neon",
]);

export type MonoFont = typeof MonoFont.Type;

/** How a theme looks beyond colour: shape, density, type and surface accents. */
export const Style = Schema.Struct({
  font: Font,
  /** The font for figures and tabular numbers, when it differs from `font`. */
  figures: Schema.optionalKey(Schema.Union([Font, MonoFont])),
  mono: MonoFont,
  radius: Schema.Struct({
    panel: Schema.Number,
    control: Schema.Number,
    chip: Schema.Number,
  }),
  border: Schema.Struct({
    width: Schema.Number,
    strength: Schema.Literals(["none", "hairline", "soft", "strong"]),
  }),
  weights: Schema.Struct({
    regular: Schema.Number,
    strong: Schema.Number,
  }),
  density: Schema.Literals(["compact", "normal", "roomy"]),
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
 * accent sets the hue and chroma of the one colour the theme is known by.
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
 * stays faithful. Each flavour is one mode, and it takes Base's style.
 */
export const MappedTheme = Schema.Struct({
  kind: Schema.tag("mapped"),
  id: Schema.String,
  name: Schema.String,
  family: Schema.String,
  mode: Schema.Literals(["light", "dark"]),
  palette: Palette,
});

export interface MappedTheme extends Schema.Schema.Type<typeof MappedTheme> {}

export const Theme = Schema.Union([SolvedTheme, MappedTheme]);

export type Theme = typeof Theme.Type;
