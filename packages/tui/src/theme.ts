/**
 * Terminal colors from Groundwork's tokens: the roles of one theme and mode,
 * placed into the slots the terminal components use, and picked with
 * `GW_THEME` and `GW_MODE`. With no `GW_THEME`, it's the desktop's Omarchy
 * theme where there is one, otherwise Base and dark.
 *
 * @module
 */
import { NodeServices } from "@effect/platform-node";
import type { Theme as ThemeDocument } from "@timmo001/groundwork-tokens";
import {
  coreThemeChoices,
  optionalThemeChoices,
} from "@timmo001/groundwork-tokens/choices";
import { readOmarchyTheme } from "@timmo001/groundwork-tokens/omarchy-current";
import { opentuiThemes } from "@timmo001/groundwork-tokens/opentui";
import {
  hexModes,
  omarchyTheme,
  parseTheme,
  runtimeTheme,
} from "@timmo001/groundwork-tokens/runtime";
import {
  Config,
  Console,
  Effect,
  FileSystem,
  Option,
  Result,
  Schema,
} from "effect";

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

/** A terminal role's name, such as `surface-lower` or `accent`. */
export type RoleName = keyof (typeof opentuiThemes)["base"]["dark"];

/** How a theme draws, beside its colors. */
export interface ThemeOptions {
  /** Panels leave their backgrounds unpainted, so the terminal's shows through. */
  readonly transparent?: boolean | undefined;
}

/**
 * Places a theme's terminal roles into the TUI's slots, such as an app's own
 * theme's from `hexModes(runtimeTheme(document).theme)` in one mode. Base's
 * dark fills any it lacks.
 */
export const fromRoles = (
  roles: Partial<Record<RoleName, string>>,
  options: ThemeOptions = {},
): Theme => {
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
    transparent: options.transparent ?? false,
  };
};

const isTheme = (id: string): id is ThemeId => id in opentuiThemes;

/** Base, dark: the default when nothing is picked. */
export const DEFAULT_THEME: Theme = fromRoles(opentuiThemes.base.dark);

export type { ThemeDocument };

/**
 * A Groundwork theme's slots in one mode, core or optional, or Base and dark
 * when there's no such theme or mode.
 */
export const themeFor = (
  id: string,
  mode: string,
  options: ThemeOptions = {},
): Theme => {
  const roles = isTheme(id)
    ? Object.entries(opentuiThemes[id]).find(([name]) => name === mode)?.[1]
    : undefined;

  return fromRoles(roles ?? opentuiThemes.base.dark, options);
};

/**
 * Any theme document's slots, such as an app's own: solved, then placed in
 * `mode`, or in the theme's own mode when it doesn't have that one, then
 * dark.
 */
export const themeFromDocument = (
  document: ThemeDocument,
  mode?: string,
  options: ThemeOptions = {},
): Theme => {
  const modes = hexModes(runtimeTheme(document).theme);

  const roles =
    (mode === undefined ? undefined : modes[mode]) ??
    (document.kind === "mapped" ? modes[document.mode] : undefined) ??
    modes.dark ??
    modes.light;

  return fromRoles(roles ?? opentuiThemes.base.dark, options);
};

/**
 * An Omarchy `colors.toml`'s slots in `mode`, or in the theme's own mode when
 * it doesn't have that one. Undefined when the file doesn't map.
 */
export const omarchyThemeFor = (
  colors: string,
  mode?: string,
  options: ThemeOptions = {},
): Theme | undefined => {
  const parsed = omarchyTheme(colors);

  return Result.isFailure(parsed)
    ? undefined
    : themeFromDocument(parsed.success, mode, options);
};

export class ThemeFileError extends Schema.TaggedError<ThemeFileError>()(
  "ThemeFileError",
  { message: Schema.String },
) {}

/**
 * A theme file's slots: a theme document's `.json`, or an Omarchy
 * `colors.toml`, placed as `themeFromDocument` places it.
 */
export const themeFromFile = Effect.fn("themeFromFile")(function* (
  path: string,
  mode?: string,
  options: ThemeOptions = {},
) {
  const fs = yield* FileSystem.FileSystem;

  const text = yield* fs
    .readFileString(path)
    .pipe(
      Effect.mapError(
        (error) => new ThemeFileError({ message: `${path}: ${error.message}` }),
      ),
    );

  const parsed = path.endsWith(".toml") ? omarchyTheme(text) : parseTheme(text);

  if (Result.isFailure(parsed)) {
    return yield* new ThemeFileError({
      message: `${path} isn't a theme document or an Omarchy colors.toml`,
    });
  }

  return themeFromDocument(parsed.success, mode, options);
});

/** Whether a pick's theme names a file rather than a theme's id. */
const isThemeFile = (theme: string) =>
  theme.includes("/") || theme.endsWith(".json") || theme.endsWith(".toml");

/** A theme a TUI can offer in a picker, with the modes it has. */
export interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly modes: readonly string[];
}

const modesOf = (id: string) =>
  Object.keys(isTheme(id) ? opentuiThemes[id] : {});

/**
 * The themes to offer in a picker: the app's own `themes` first, then the
 * desktop's Omarchy theme where there is one, then Groundwork's core and
 * optional themes. Pass the same `themes` to `resolveTheme`.
 */
export const themeOptionsWith = (
  themes: readonly ThemeDocument[] = [],
): Effect.Effect<readonly ThemeOption[]> =>
  Effect.gen(function* () {
    const own = themes.map((document) => ({
      id: document.id,
      name: document.name,
      modes: Object.keys(hexModes(runtimeTheme(document).theme)),
    }));

    const groundwork = [...coreThemeChoices, ...optionalThemeChoices].map(
      ({ id, name }) => ({ id, name, modes: modesOf(id) }),
    );

    const current = yield* Effect.promise(readOmarchyTheme);
    const parsed = current === null ? undefined : omarchyTheme(current.colors);

    if (current === null || parsed === undefined || Result.isFailure(parsed))
      return [...own, ...groundwork];

    const omarchy = {
      id: "omarchy",
      name: `Omarchy (${current.name})`,
      modes: Object.keys(hexModes(runtimeTheme(parsed.success).theme)),
    };

    return [...own, omarchy, ...groundwork];
  });

/** `themeOptionsWith` for an app with no themes of its own. */
export const themeOptions: Effect.Effect<readonly ThemeOption[]> =
  themeOptionsWith();

/** A theme and mode to show; either can be left to the defaults. */
export interface ThemePick {
  /**
   * A Groundwork theme's id, one of the app's own themes' ids, `omarchy` for
   * the desktop's Omarchy theme, or a theme file's path
   */
  readonly theme?: string | undefined;
  /** `light`, `dark` or `darker` */
  readonly mode?: string | undefined;
  /** Panels leave their backgrounds unpainted, so the terminal's shows through */
  readonly transparent?: boolean | undefined;
}

/**
 * A pick's slots. Without a theme it's the desktop's Omarchy theme where
 * there is one, otherwise Base; without a mode it's the theme's own,
 * otherwise dark. `themes` are the app's own, picked by id. A theme file
 * that can't be read or decoded falls back to the default, with a warning.
 */
export const resolveTheme = (
  pick: ThemePick,
  themes: readonly ThemeDocument[] = [],
): Effect.Effect<Theme> =>
  Effect.gen(function* () {
    const options = { transparent: pick.transparent };
    const own = themes.find((document) => document.id === pick.theme);

    if (own !== undefined) return themeFromDocument(own, pick.mode, options);

    if (pick.theme !== undefined && isThemeFile(pick.theme)) {
      return yield* themeFromFile(pick.theme, pick.mode, options).pipe(
        Effect.provide(NodeServices.layer),
        Effect.catch((error) =>
          Console.error(`${error.message}; using the default theme`).pipe(
            Effect.as(fromRoles(opentuiThemes.base.dark, options)),
          ),
        ),
      );
    }

    if (pick.theme === undefined || pick.theme === "omarchy") {
      const current = yield* Effect.promise(readOmarchyTheme);

      const theme =
        current === null
          ? undefined
          : omarchyThemeFor(current.colors, pick.mode, options);

      if (theme !== undefined) return theme;
    }

    return themeFor(pick.theme ?? "base", pick.mode ?? "dark", options);
  });

/**
 * Loads the theme from `GW_THEME`, `GW_MODE` (`light`, `dark` or `darker`)
 * and `GW_TRANSPARENT`, as `resolveTheme` picks it: `GW_THEME` is a theme's
 * id, one of `themes`' ids, a theme file's path, or `omarchy` for the
 * desktop's Omarchy theme, which is also the default where Omarchy is
 * installed.
 */
export const loadThemeWith = (
  themes: readonly ThemeDocument[] = [],
): Effect.Effect<Theme> =>
  Effect.gen(function* () {
    const theme = yield* Config.option(Config.String("GW_THEME"));

    const mode = yield* Config.option(
      Config.Literals(["light", "dark", "darker"], "GW_MODE"),
    );

    const transparent = yield* Config.option(Config.Boolean("GW_TRANSPARENT"));

    return yield* resolveTheme(
      {
        theme: Option.getOrUndefined(theme),
        mode: Option.getOrUndefined(mode),
        transparent: Option.getOrUndefined(transparent),
      },
      themes,
    );
  }).pipe(Effect.orElseSucceed(() => DEFAULT_THEME));

/** `loadThemeWith` for an app with no themes of its own. */
export const loadTheme: Effect.Effect<Theme> = loadThemeWith();
