import {
  contrast,
  fromHex,
  inGamut,
  shift,
  solveLightness,
  withAlpha,
  withLightness,
  type Oklch,
} from "./color.ts";
import type { MappedTheme, SolvedTheme, Style, Theme } from "./schema.ts";

export const statuses = [
  "info",
  "success",
  "important",
  "warning",
  "danger",
] as const;

export type Status = (typeof statuses)[number];

/**
 * GitHub's Markdown alert colors in dark (note, tip, important, warning and
 * caution), which give each status its hue and chroma.
 */
const statusSeeds: Record<Status, string> = {
  info: "#5b9ee0",
  success: "#52ab69",
  important: "#aa89e2",
  warning: "#c49027",
  danger: "#e47c74",
};

/**
 * Contrast targets, each measured on the surface where the role reads worst:
 * the lowest surface in light modes, where fields sit, and the overlay in
 * dark ones, where menus and dialogs sit.
 */
export const targets = {
  "text-strong": 11,
  "text-primary": 9,
  "text-secondary": 4.6,
  accent: 5,
  status: 4.8,
  "on-accent": 4.5,
} as const;

export const modes = ["light", "dark", "darker"] as const;

export type Mode = (typeof modes)[number];

export type Roles = Record<string, Oklch>;

export interface ResolvedTheme {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly optional: boolean;
  readonly family: string | undefined;
  /** Apps that use the theme, as examples. */
  readonly examples: readonly string[];
  readonly style: Style;
  readonly modes: Partial<Record<Mode, Roles>>;
}

/** The text or surface color that reads best on a fill. */
const onFill = (fill: Oklch, candidates: readonly Oklch[]) =>
  candidates.reduce((best, candidate) =>
    contrast(candidate, fill) > contrast(best, fill) ? candidate : best,
  );

const accentRoles = (
  accent: Oklch,
  surfaces: { readonly default: Oklch; readonly ground: Oklch },
  dark: boolean,
  textStrong: Oklch,
  link: Style["link"]["color"],
) => {
  const direction = dark ? "lighter" : "darker";

  const text =
    contrast(accent, surfaces.ground) >= targets.accent
      ? accent
      : solveLightness(accent, surfaces.ground, targets.accent, direction);

  const step = dark ? 0.05 : -0.05;

  return {
    accent: text,
    "fill-accent-resting": text,
    "fill-accent-hovered": inGamut(shift(text, step)),
    "fill-accent-pressed": inGamut(shift(text, -step / 2)),
    "fill-accent-quiet": withAlpha(text, 0.16),
    "border-accent": withAlpha(text, 0.5),
    "on-accent": onFill(text, [
      surfaces.default,
      { l: 1, c: 0, h: 0 },
      { l: 0.15, c: 0, h: 0 },
    ]),
    focus: text,
    link: link === "accent" ? text : textStrong,
  };
};

const statusRoles = (
  seeds: Record<Status, Oklch>,
  ground: Oklch,
  dark: boolean,
  solve: boolean,
): Roles =>
  Object.fromEntries(
    statuses.flatMap((status) => {
      const seed = seeds[status];

      const text =
        !solve || contrast(seed, ground) >= targets.status
          ? seed
          : solveLightness(
              seed,
              ground,
              targets.status,
              dark ? "lighter" : "darker",
            );

      return [
        [status, text],
        [`fill-${status}-quiet`, withAlpha(text, 0.14)],
        [`border-${status}`, withAlpha(text, 0.45)],
      ];
    }),
  );

const solvedMode = (theme: SolvedTheme, mode: "light" | "dark") => {
  const background = fromHex(theme.background);
  const dark = mode === "dark";
  const tint = { h: background.h, c: background.c };

  const surface = (l: number, chromaScale = 1) =>
    inGamut({ l, c: tint.c * chromaScale, h: tint.h });

  // A theme's dark background is where cards sit; the page goes one step
  // below it, so layers read as raised above the page.
  const base = dark ? background.l - 0.03 : 0.975;
  const chroma = dark ? 1 : 0.6;
  const away = dark ? 1 : -1;

  // Lower surfaces are recessed, so darker in both modes. Dark steps are
  // wider, since lightness differences read smaller near black.
  const surfaces = {
    lower: surface(base - (dark ? 0.03 : 0.025), chroma),
    low: surface(base - (dark ? 0.015 : 0.012), chroma),
    default: surface(base, chroma),
    raised: surface(dark ? base + 0.05 : 0.995, dark ? 1 : 0.3),
    overlay: surface(dark ? base + 0.09 : 1, dark ? 1 : 0),
  };

  /** A step away from the default surface, wider in dark mode. */
  const step = (light: number, darkStep: number) =>
    base + away * (dark ? darkStep : light);

  const text = { l: 0.5, c: Math.min(tint.c * 0.4, 0.02), h: tint.h };
  const direction = dark ? "lighter" : "darker";
  // Where text reads worst: the lowest surface in light, the overlay in dark.
  const ground = dark ? surfaces.overlay : surfaces.lower;

  const textStrong = solveLightness(
    text,
    ground,
    targets["text-strong"],
    direction,
  );

  // Black and white primaries: near-white fill in dark, near-black in light.
  const primary = inGamut({ ...text, l: dark ? 0.93 : 0.24 });
  const accent = fromHex(theme.accent);
  // An accent with no real color, as Base's, is the primary itself.
  const neutralAccent = accent.c < 0.02;

  const seeds: Record<Status, Oklch> = {
    info: fromHex(statusSeeds.info),
    success: fromHex(statusSeeds.success),
    important: fromHex(statusSeeds.important),
    warning: fromHex(statusSeeds.warning),
    danger: fromHex(statusSeeds.danger),
  };

  return {
    "surface-lower": surfaces.lower,
    "surface-low": surfaces.low,
    "surface-default": surfaces.default,
    "surface-raised": surfaces.raised,
    "surface-overlay": surfaces.overlay,
    "border-quiet": surface(step(0.07, 0.1), chroma),
    "border-normal": surface(step(0.08, 0.14), chroma),
    "border-loud": surface(step(0.2, 0.22), chroma),
    "text-strong": textStrong,
    "text-primary": solveLightness(
      text,
      ground,
      targets["text-primary"],
      direction,
    ),
    "text-secondary": solveLightness(
      text,
      ground,
      targets["text-secondary"],
      direction,
    ),
    "text-disabled": solveLightness(text, ground, 2.4, direction),
    "fill-neutral-resting": surface(step(0.06, 0.09), chroma),
    "fill-neutral-hovered": surface(step(0.09, 0.12), chroma),
    "fill-neutral-pressed": surface(step(0.12, 0.15), chroma),
    "fill-neutral-selected": surface(step(0.11, 0.14), chroma * 1.5),
    "fill-neutral-disabled": surface(step(0.035, 0.06), chroma),
    "fill-primary-resting": primary,
    "fill-primary-hovered": inGamut(shift(primary, -away * 0.06)),
    "fill-primary-pressed": inGamut(shift(primary, -away * 0.1)),
    "on-primary": dark ? surfaces.default : surfaces.raised,
    ...accentRoles(
      neutralAccent ? primary : accent,
      { default: surfaces.default, ground },
      dark,
      textStrong,
      theme.style.link.color,
    ),
    ...statusRoles(seeds, ground, dark, true),
  };
};

/**
 * Darker: every surface `by` darker, hues kept, field outlines strengthened.
 * Solved themes' dark page is already a step down, so they go less far.
 */
const darker = (dark: Roles, by = 0.045) => {
  const surfaces = Object.fromEntries(
    Object.entries(dark)
      .filter(
        ([role]) =>
          role.startsWith("surface-") ||
          role.startsWith("fill-neutral-") ||
          role === "on-primary",
      )
      .map(([role, color]) => [
        role,
        inGamut(withLightness(color, color.l - by)),
      ]),
  );

  return {
    ...dark,
    ...surfaces,
    "border-quiet": dark["border-normal"] ?? { l: 0, c: 0, h: 0 },
    "border-normal": dark["border-loud"] ?? { l: 0, c: 0, h: 0 },
  };
};

const mappedRoles = (theme: MappedTheme) => {
  const palette = {
    lower: fromHex(theme.palette.lower),
    background: fromHex(theme.palette.background),
    raised: fromHex(theme.palette.raised),
    border: fromHex(theme.palette.border),
    text: fromHex(theme.palette.text),
    muted: fromHex(theme.palette.muted),
    accent: fromHex(theme.palette.accent),
  };

  const dark = theme.mode === "dark";
  const away = dark ? 1 : -1;

  const surfaces = {
    default: palette.background,
    ground: dark ? palette.raised : palette.lower,
  };

  const seeds: Record<Status, Oklch> = {
    info: fromHex(theme.palette.info),
    success: fromHex(theme.palette.success),
    important: fromHex(theme.palette.important),
    warning: fromHex(theme.palette.warning),
    danger: fromHex(theme.palette.danger),
  };

  return {
    "surface-lower": palette.lower,
    "surface-low": inGamut({
      ...palette.background,
      l: (palette.lower.l + palette.background.l) / 2,
    }),
    "surface-default": palette.background,
    "surface-raised": palette.raised,
    "surface-overlay": inGamut(shift(palette.raised, away * 0.025)),
    "border-quiet": inGamut(shift(palette.border, -away * 0.03)),
    "border-normal": palette.border,
    "border-loud": inGamut(shift(palette.border, away * 0.08)),
    "text-strong": palette.text,
    "text-primary": palette.text,
    "text-secondary": palette.muted,
    "text-disabled": withAlpha(palette.muted, 0.6),
    "fill-neutral-resting": inGamut(shift(palette.raised, away * 0.03)),
    "fill-neutral-hovered": inGamut(shift(palette.raised, away * 0.06)),
    "fill-neutral-pressed": inGamut(shift(palette.raised, away * 0.09)),
    "fill-neutral-selected": inGamut(shift(palette.raised, away * 0.08)),
    "fill-neutral-disabled": inGamut(shift(palette.raised, away * 0.015)),
    "fill-primary-resting": palette.text,
    "fill-primary-hovered": inGamut(shift(palette.text, -away * 0.06)),
    "fill-primary-pressed": inGamut(shift(palette.text, -away * 0.1)),
    "on-primary": palette.background,
    ...accentRoles(palette.accent, surfaces, dark, palette.text, "accent"),
    accent: palette.accent,
    "fill-accent-resting": palette.accent,
    focus: palette.accent,
    ...statusRoles(seeds, palette.raised, dark, false),
  };
};

/** Base's style with accent links, for themes mapped from a palette. */
const mappedStyle = (base: Style): Style => ({
  font: base.font,
  mono: base.mono,
  radius: base.radius,
  border: base.border,
  weights: base.weights,
  density: base.density,
  capitals: base.capitals,
  link: { color: "accent", underline: base.link.underline },
  surfaceAccent: base.surfaceAccent,
  rows: base.rows,
});

/** Resolve a theme into roles. Mapped themes take `baseStyle`, Base's style. */
export const resolve = (theme: Theme, baseStyle: Style): ResolvedTheme => {
  if (theme.kind === "mapped") {
    const roles = mappedRoles(theme);

    return {
      id: theme.id,
      name: theme.name,
      description: `${theme.name}, mapped onto the roles so it stays faithful to the ${theme.family} palette.`,
      optional: true,
      family: theme.family,
      examples: [],
      style: mappedStyle(baseStyle),
      modes:
        theme.mode === "dark"
          ? { dark: roles, darker: darker(roles) }
          : { light: roles },
    };
  }

  const dark = solvedMode(theme, "dark");

  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    optional: false,
    family: undefined,
    examples: theme.examples ?? [],
    style: theme.style,
    modes: {
      light: solvedMode(theme, "light"),
      dark,
      darker: darker(dark, 0.015),
    },
  };
};

export interface Check {
  readonly theme: string;
  readonly mode: Mode;
  readonly role: string;
  readonly ratio: number;
  readonly target: number;
  readonly passes: boolean;
}

const checkedRoles = [
  ["text-strong", targets["text-strong"]],
  ["text-primary", targets["text-primary"]],
  ["text-secondary", targets["text-secondary"]],
  ["accent", targets.accent],
  ...statuses.map((status) => [status, targets.status] as const),
] as const;

const textSurfaces = [
  "surface-lower",
  "surface-low",
  "surface-default",
  "surface-raised",
  "surface-overlay",
];

/** Every role with a contrast target, measured on the surface where it reads worst. */
export const check = (theme: ResolvedTheme): readonly Check[] =>
  modes.flatMap((mode) => {
    const roles = theme.modes[mode];

    if (roles === undefined) return [];

    const black = { l: 0, c: 0, h: 0 };
    const raised = roles["surface-raised"] ?? black;

    const measure = (
      role: string,
      against: readonly Oklch[],
      target: number,
    ): Check => {
      const ratio = Math.min(
        ...against.map((surface) => contrast(roles[role] ?? black, surface)),
      );

      return {
        theme: theme.id,
        mode,
        role,
        ratio,
        target,
        passes: ratio >= target - 0.005,
      };
    };

    const surfaces = textSurfaces.map((surface) => roles[surface] ?? raised);

    return [
      ...checkedRoles.map(([role, target]) => measure(role, surfaces, target)),
      measure(
        "on-accent",
        [roles["fill-accent-resting"] ?? raised],
        targets["on-accent"],
      ),
    ];
  });
