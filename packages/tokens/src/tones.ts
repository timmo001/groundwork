/**
 * App tones: an app's own state colors, such as an issue's "regressed" or
 * "muted", solved against each theme's surfaces the way the status colors
 * are, so they read in every theme and mode.
 *
 * @module
 */
import {
  contrast,
  fromHex,
  solveLightness,
  toCss,
  withAlpha,
  type Oklch,
} from "./color.ts";
import { modeRules } from "./generate.ts";
import { targets, type ResolvedTheme, type Roles } from "./solve.ts";

/** An app's tones: each name and the hex color it starts from. */
export type AppTones = Readonly<Record<string, string>>;

const textSurfaces = [
  "surface-lower",
  "surface-low",
  "surface-default",
  "surface-raised",
  "surface-overlay",
] as const;

/**
 * Each tone in one mode: its text color, kept as given where it already meets
 * the status contrast target on every surface and moved lighter or darker
 * until it does where not, with a quiet fill and a border from it.
 */
export const appToneRoles = (
  tones: AppTones,
  roles: Roles,
  dark: boolean,
): Roles =>
  Object.fromEntries(
    Object.entries(tones).flatMap(([name, hex]) => {
      const seed = fromHex(hex);

      const surfaces = textSurfaces.flatMap((surface) => {
        const color = roles[surface];

        return color === undefined ? [] : [color];
      });

      // Where the tone reads worst
      const ground = surfaces.reduce<Oklch | undefined>(
        (worst, surface) =>
          worst === undefined || contrast(seed, surface) < contrast(seed, worst)
            ? surface
            : worst,
        undefined,
      );

      const text =
        ground === undefined || contrast(seed, ground) >= targets.status
          ? seed
          : solveLightness(
              seed,
              ground,
              targets.status,
              dark ? "lighter" : "darker",
            );

      return [
        [name, text],
        [`${name}-fill`, withAlpha(text, 0.14)],
        [`${name}-border`, withAlpha(text, 0.45)],
      ];
    }),
  );

/**
 * `--app-tone-<name>`, `-fill` and `-border` for each tone, under the same
 * selectors as `theme`'s own CSS. Set a component's `--gw-tone`,
 * `--gw-tone-fill` and `--gw-tone-border` from them.
 */
export const appTonesCss = (tones: AppTones, theme: ResolvedTheme) =>
  modeRules(theme, (roles, dark, indent) =>
    Object.entries(appToneRoles(tones, roles, dark))
      .map(([name, color]) => `${indent}--app-tone-${name}: ${toCss(color)};`)
      .join("\n"),
  ).join("\n\n");
