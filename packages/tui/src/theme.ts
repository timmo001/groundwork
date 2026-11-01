/**
 * Terminal colors from Groundwork's tokens: the roles of one theme and mode,
 * placed into the slots the terminal components use, and picked with
 * `GW_THEME` and `GW_MODE`. With no `GW_THEME`, it's the desktop's Omarchy
 * theme where there is one, otherwise Base and dark.
 *
 * @module
 */
import { readOmarchyTheme } from "@timmo001/groundwork-tokens/omarchy-current";
import { opentuiThemes } from "@timmo001/groundwork-tokens/opentui";
import {
  hexModes,
  omarchyTheme,
  runtimeTheme,
} from "@timmo001/groundwork-tokens/runtime";
import { Config, Effect, Option, Result } from "effect";

/** Semantic color slots for the TUI */
export interface Theme {
  /** App background */
  readonly bg: string;
  /** Elevated surface (pane/card background) */
  readonly bgElevated: string;
  /** Selected row background */
  readonly bgSelected: string;
  /** Focused input background */
  readonly bgInput: string;
  /** Accent for selections, highlights, cursors and emphasis text */
  readonly accent: string;
  /** Text on the accent */
  readonly accentFg: string;
  /** Secondary surface (separators, secondary selection background) */
  readonly surface: string;
  /** Primary foreground text */
  readonly fg: string;
  /** Muted secondary text */
  readonly fgMuted: string;
  /** Dim text for subtle UI elements */
  readonly fgSubtle: string;
  /** Dimmest text for ghost-level elements */
  readonly fgGhost: string;
  /** Success state */
  readonly green: string;
  /** Error state */
  readonly red: string;
  /** Warning or in-progress state */
  readonly yellow: string;
  /** Whether panels skip painting backgrounds to let terminal transparency through */
  readonly transparent: boolean;
}

type ThemeId = keyof typeof opentuiThemes;

type RoleName = keyof (typeof opentuiThemes)["base"]["dark"];

/**
 * Places a theme's terminal roles into the TUI's slots. A theme solved at
 * runtime has the same roles; Base's dark fills any it lacks.
 */
const fromRoles = (roles: Partial<Record<RoleName, string>>): Theme => {
  const role = (name: RoleName) => roles[name] ?? opentuiThemes.base.dark[name];

  return {
    bg: role("surface-lower"),
    bgElevated: role("surface-default"),
    bgSelected: role("fill-neutral-selected"),
    bgInput: role("surface-raised"),
    accent: role("accent"),
    accentFg: role("on-accent"),
    surface: role("border-normal"),
    fg: role("text-primary"),
    fgMuted: role("text-secondary"),
    fgSubtle: role("text-disabled"),
    fgGhost: role("border-loud"),
    green: role("success"),
    red: role("danger"),
    yellow: role("warning"),
    transparent: false,
  };
};

const isTheme = (id: string): id is ThemeId => id in opentuiThemes;

/** Base, dark: the default when nothing is picked. */
export const DEFAULT_THEME: Theme = fromRoles(opentuiThemes.base.dark);

/**
 * A core theme's slots in one mode, or Base and dark when there's no such
 * theme or mode.
 */
export const themeFor = (id: string, mode: string): Theme => {
  if (!isTheme(id)) return DEFAULT_THEME;

  const roles = Object.entries(opentuiThemes[id]).find(
    ([name]) => name === mode,
  )?.[1];

  return roles === undefined ? DEFAULT_THEME : fromRoles(roles);
};

/**
 * An Omarchy `colors.toml`'s slots in `mode`, or in the theme's own mode when
 * it doesn't have that one. Undefined when the file doesn't map.
 */
export const omarchyThemeFor = (
  colors: string,
  mode?: string,
): Theme | undefined => {
  const parsed = omarchyTheme(colors);

  if (Result.isFailure(parsed)) return undefined;

  const modes = hexModes(runtimeTheme(parsed.success).theme);

  const roles =
    (mode === undefined ? undefined : modes[mode]) ??
    modes[parsed.success.mode];

  return roles === undefined ? undefined : fromRoles(roles);
};

/**
 * Loads the theme from `GW_THEME` and `GW_MODE` (`light`, `dark` or
 * `darker`). `GW_THEME` is a core theme's id, or `omarchy` for the desktop's
 * Omarchy theme, which is also the default where Omarchy is installed. Base
 * and dark are the fallback.
 */
export const loadTheme: Effect.Effect<Theme> = Effect.gen(function* () {
  const id = yield* Config.option(Config.String("GW_THEME"));

  const mode = yield* Config.option(
    Config.Literals(["light", "dark", "darker"], "GW_MODE"),
  );

  if (Option.isNone(id) || id.value === "omarchy") {
    const current = yield* Effect.promise(readOmarchyTheme);

    const theme =
      current === null
        ? undefined
        : omarchyThemeFor(current.colors, Option.getOrUndefined(mode));

    if (theme !== undefined) return theme;
  }

  return themeFor(
    Option.getOrElse(id, () => "base"),
    Option.getOrElse(mode, () => "dark"),
  );
}).pipe(Effect.orElseSucceed(() => DEFAULT_THEME));
