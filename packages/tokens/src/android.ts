/**
 * Android dynamic color import: maps the system's Material color roles, as
 * the shell reads them from `android.R.color`, onto a Groundwork mapped theme
 * in both modes, so an app can follow the phone's wallpaper colors. Material
 * has no info, success, important or warning roles, so those are Base's.
 *
 * @module
 */
import { Schema } from "effect";
import baseDocument from "../themes/base.json" with { type: "json" };
import {
  contrast,
  fromHex,
  inGamut,
  shift,
  solveLightness,
  toHex,
} from "./color.ts";
import { MappedTheme, SolvedTheme } from "./schema.ts";
import { resolve, targets } from "./solve.ts";

/**
 * The Material roles the mapping reads, by their Compose `ColorScheme` names.
 * The shell sends each from `android.R.color.system_<role>_light` and `_dark`,
 * such as `system_surface_container_high_dark` for `surfaceContainerHigh`.
 */
export const androidColorRoles = [
  "surface",
  "surfaceContainerLowest",
  "surfaceContainer",
  "surfaceContainerHigh",
  "onSurface",
  "onSurfaceVariant",
  "outlineVariant",
  "primary",
  "error",
] as const;

export type AndroidColorRole = (typeof androidColorRoles)[number];

/** One mode's roles, each as `#rrggbb`. Extra roles are ignored. */
export type AndroidScheme = { readonly [Role in AndroidColorRole]?: string };

/** The system's colors in both modes, as the shell sends them. */
export interface AndroidColors {
  readonly light: AndroidScheme;
  readonly dark: AndroidScheme;
}

export const androidThemeId = "android";

const base = Schema.decodeUnknownSync(SolvedTheme)(baseDocument);
const baseModes = resolve(base, base.style).modes;

// Base's status colors, solved against the surface where they read worst:
// the lowest in light, and the overlay a step above raised in dark
const baseStatus = (
  mode: "light" | "dark",
  status: string,
  worst: string | undefined,
) => {
  const color = baseModes[mode]?.[status];

  if (color === undefined || worst === undefined) return undefined;

  const dark = mode === "dark";
  const against = dark ? inGamut(shift(fromHex(worst), 0.025)) : fromHex(worst);

  return toHex(
    contrast(color, against) >= targets.status + 0.05
      ? color
      : solveLightness(
          color,
          against,
          targets.status + 0.05,
          dark ? "lighter" : "darker",
        ),
  );
};

const palette = (scheme: AndroidScheme, mode: "light" | "dark") => {
  const color = (role: AndroidColorRole) => scheme[role]?.toLowerCase();
  const dark = mode === "dark";
  // Lower is recessed in both modes: below the surface in dark, and a
  // container step darker than it in light, where the lowest is white
  const lower = color(dark ? "surfaceContainerLowest" : "surfaceContainerHigh");
  const raised = color(dark ? "surfaceContainer" : "surfaceContainerLowest");
  const worst = dark ? raised : lower;

  return {
    lower,
    background: color("surface"),
    raised,
    border: color("outlineVariant"),
    text: color("onSurface"),
    muted: color("onSurfaceVariant"),
    accent: color("primary"),
    info: baseStatus(mode, "info", worst),
    success: baseStatus(mode, "success", worst),
    important: baseStatus(mode, "important", worst),
    warning: baseStatus(mode, "warning", worst),
    danger: color("error"),
  };
};

/**
 * Maps the system's colors onto a mapped theme covering light and dark, then
 * checks it against the Schema. Missing roles or bad colors come back as a
 * `Failure`. Solve it with `androidRuntimeTheme` from the runtime entry,
 * which falls back when it misses a contrast target.
 */
export const androidTheme = (
  colors: AndroidColors,
  name = "Android",
  id = androidThemeId,
) =>
  Schema.decodeUnknownResult(MappedTheme)({
    kind: "mapped",
    id,
    name,
    family: "Android",
    mode: "dark",
    palette: palette(colors.dark, "dark"),
    otherPalette: palette(colors.light, "light"),
  });

/**
 * A solved theme from the mapped theme's own surface and primary, for when the
 * mapped one misses a contrast target. It keeps the wallpaper's hue, solved
 * to contrast as the core themes are.
 */
export const androidFallbackTheme = (theme: MappedTheme): SolvedTheme => ({
  kind: "solved",
  id: theme.id,
  name: theme.name,
  description: `${theme.name}, solved from the system's colors to meet the contrast targets.`,
  background: theme.palette.background,
  accent: theme.palette.accent,
  style: base.style,
});
