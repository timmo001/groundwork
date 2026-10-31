import {
  converter,
  differenceEuclidean,
  formatHex,
  formatHex8,
  parse,
  toGamut,
  wcagContrast,
} from "culori";

/** A colour in OKLCH: lightness 0 to 1, chroma, hue in degrees, and alpha. */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly alpha?: number;
}

const toOklch = converter("oklch");
const toSrgbGamut = toGamut("rgb", "oklch");

export const fromHex = (hex: string): Oklch => {
  const colour = toOklch(parse(hex));

  if (colour === undefined) return { l: 0, c: 0, h: 0 };

  return { l: colour.l, c: colour.c, h: colour.h ?? 0 };
};

/** Bring a colour into sRGB by reducing chroma, keeping lightness and hue. */
export const inGamut = (colour: Oklch): Oklch => {
  const mapped = toOklch(
    toSrgbGamut({ mode: "oklch", l: colour.l, c: colour.c, h: colour.h }),
  );

  return { ...colour, c: mapped.c };
};

/** Six-digit sRGB hex, or eight digits when the colour has alpha. */
export const toHex = (colour: Oklch) => {
  const mapped = toSrgbGamut({
    mode: "oklch",
    l: colour.l,
    c: colour.c,
    h: colour.h,
  });

  return colour.alpha === undefined || colour.alpha === 1
    ? formatHex(mapped)
    : formatHex8({ ...mapped, alpha: colour.alpha });
};

const round = (value: number, places: number) => Number(value.toFixed(places));

export const toCss = (colour: Oklch) => {
  const { l, c, h } = inGamut(colour);

  const alpha =
    colour.alpha === undefined || colour.alpha === 1
      ? ""
      : ` / ${round(colour.alpha, 2)}`;

  return `oklch(${round(l * 100, 2)}% ${round(c, 4)} ${round(h, 2)}${alpha})`;
};

const oklabDistance = differenceEuclidean("oklab");

/** How far apart two hex colours look, as the Euclidean distance in OKLab. */
export const distance = (a: string, b: string) => oklabDistance(a, b);

/** The WCAG 2 contrast ratio between two colours, ignoring alpha. */
export const contrast = (a: Oklch, b: Oklch) =>
  wcagContrast(toHex({ ...a, alpha: 1 }), toHex({ ...b, alpha: 1 }));

export const withLightness = (colour: Oklch, l: number): Oklch => ({
  ...colour,
  l: Math.min(1, Math.max(0, l)),
});

export const shift = (colour: Oklch, by: number): Oklch =>
  withLightness(colour, colour.l + by);

export const withAlpha = (colour: Oklch, alpha: number): Oklch => ({
  ...colour,
  alpha,
});

/**
 * The lightness, moving away from `against` towards white or black, at which
 * the colour first reaches `target` contrast. Falls back to the extreme when
 * the target can't be reached.
 */
export const solveLightness = (
  colour: Oklch,
  against: Oklch,
  target: number,
  direction: "lighter" | "darker",
): Oklch => {
  let low = direction === "lighter" ? against.l : 0;
  let high = direction === "lighter" ? 1 : against.l;

  for (let step = 0; step < 32; step++) {
    const middle = (low + high) / 2;

    const passes =
      contrast(inGamut(withLightness(colour, middle)), against) >= target;

    if (direction === "lighter") {
      if (passes) high = middle;
      else low = middle;
    } else if (passes) low = middle;
    else high = middle;
  }

  return inGamut(withLightness(colour, direction === "lighter" ? high : low));
};
