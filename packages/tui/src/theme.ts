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
import { coreThemeChoices } from "@timmo001/groundwork-tokens/page";
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

/** A theme a TUI can offer in a picker, with the modes it has. */
export interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly modes: readonly string[];
}

/**
 * The themes to offer in a picker: the desktop's Omarchy theme first where
 * there is one, then the core themes.
 */
export const themeOptions: Effect.Effect<readonly ThemeOption[]> = Effect.gen(
  function* () {
    const core = coreThemeChoices.map(({ id, name }) => ({
      id,
      name,
      modes: Object.keys(isTheme(id) ? opentuiThemes[id] : {}),
    }));

    const current = yield* Effect.promise(readOmarchyTheme);
    const parsed = current === null ? undefined : omarchyTheme(current.colors);

    if (current === null || parsed === undefined || Result.isFailure(parsed))
      return core;

    const omarchy = {
      id: "omarchy",
      name: `Omarchy (${current.name})`,
      modes: Object.keys(hexModes(runtimeTheme(parsed.success).theme)),
    };

    return [omarchy, ...core];
  },
);

/** A theme and mode to show; either can be left to the defaults. */
export interface ThemePick {
  /** A core theme's id, or `omarchy` for the desktop's Omarchy theme */
  readonly theme?: string | undefined;
  /** `light`, `dark` or `darker` */
  readonly mode?: string | undefined;
}

/**
 * A pick's slots. Without a theme it's the desktop's Omarchy theme where
 * there is one, otherwise Base; without a mode it's the Omarchy theme's own,
 * otherwise dark.
 */
export const resolveTheme = (pick: ThemePick): Effect.Effect<Theme> =>
  Effect.gen(function* () {
    if (pick.theme === undefined || pick.theme === "omarchy") {
      const current = yield* Effect.promise(readOmarchyTheme);

      const theme =
        current === null
          ? undefined
          : omarchyThemeFor(current.colors, pick.mode);

      if (theme !== undefined) return theme;
    }

    return themeFor(pick.theme ?? "base", pick.mode ?? "dark");
  });

/**
 * Loads the theme from `GW_THEME` and `GW_MODE` (`light`, `dark` or
 * `darker`), as `resolveTheme` picks it: `GW_THEME` is a core theme's id, or
 * `omarchy` for the desktop's Omarchy theme, which is also the default where
 * Omarchy is installed.
 */
export const loadTheme: Effect.Effect<Theme> = Effect.gen(function* () {
  const theme = yield* Config.option(Config.String("GW_THEME"));

  const mode = yield* Config.option(
    Config.Literals(["light", "dark", "darker"], "GW_MODE"),
  );

  return yield* resolveTheme({
    theme: Option.getOrUndefined(theme),
    mode: Option.getOrUndefined(mode),
  });
}).pipe(Effect.orElseSucceed(() => DEFAULT_THEME));
