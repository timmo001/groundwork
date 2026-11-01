/**
 * The TUI's colors, from Groundwork's terminal tokens: the roles of one theme
 * and mode, picked with `GW_THEME` and `GW_MODE` (Base and dark by default).
 *
 * @module
 */
import { opentuiThemes } from "@timmo001/groundwork-tokens/opentui";
import { Config, Effect } from "effect";

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

type Roles = (typeof opentuiThemes)["base"]["dark"];

/** Places a theme's terminal roles into the TUI's slots. */
const fromRoles = (roles: Roles): Theme => ({
  bg: roles["surface-lower"],
  bgElevated: roles["surface-default"],
  bgSelected: roles["fill-neutral-selected"],
  bgInput: roles["surface-raised"],
  accent: roles.accent,
  accentFg: roles["on-accent"],
  surface: roles["border-normal"],
  fg: roles["text-primary"],
  fgMuted: roles["text-secondary"],
  fgSubtle: roles["text-disabled"],
  fgGhost: roles["border-loud"],
  green: roles.success,
  red: roles.danger,
  yellow: roles.warning,
  transparent: false,
});

const isTheme = (id: string): id is ThemeId => id in opentuiThemes;

/** Base, dark: the default when nothing is picked. */
export const DEFAULT_THEME: Theme = fromRoles(opentuiThemes.base.dark);

/**
 * Loads the theme from `GW_THEME` (a core theme's id) and `GW_MODE` (`light`,
 * `dark` or `darker`), falling back to Base and dark.
 */
export const loadTheme: Effect.Effect<Theme> = Effect.gen(function* () {
  const id = yield* Config.String("GW_THEME").pipe(Config.withDefault("base"));

  const mode = yield* Config.Literals(
    ["light", "dark", "darker"],
    "GW_MODE",
  ).pipe(Config.withDefault("dark"));

  if (!isTheme(id)) return DEFAULT_THEME;

  const roles = Object.entries(opentuiThemes[id]).find(
    ([name]) => name === mode,
  )?.[1];

  return roles === undefined ? DEFAULT_THEME : fromRoles(roles);
}).pipe(Effect.orElseSucceed(() => DEFAULT_THEME));
