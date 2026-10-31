import {
  converter,
  differenceEuclidean,
  formatHex,
  formatHex8,
  parse,
  toGamut,
  wcagContrast,
} from "culori";

/** A color in OKLCH: lightness 0 to 1, chroma, hue in degrees, and alpha. */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly alpha?: number;
}

const toOklch = converter("oklch");
const toSrgbGamut = toGamut("rgb", "oklch");

export const fromHex = (hex: string): Oklch => {
  const color = toOklch(parse(hex));

  if (color === undefined) return { l: 0, c: 0, h: 0 };

  return { l: color.l, c: color.c, h: color.h ?? 0 };
};

/** Bring a color into sRGB by reducing chroma, keeping lightness and hue. */
export const inGamut = (color: Oklch): Oklch => {
  const mapped = toOklch(
    toSrgbGamut({ mode: "oklch", l: color.l, c: color.c, h: color.h }),
  );

  return { ...color, c: mapped.c };
};

/** Six-digit sRGB hex, or eight digits when the color has alpha. */
export const toHex = (color: Oklch) => {
  const mapped = toSrgbGamut({
    mode: "oklch",
    l: color.l,
    c: color.c,
    h: color.h,
  });

  return color.alpha === undefined || color.alpha === 1
    ? formatHex(mapped)
    : formatHex8({ ...mapped, alpha: color.alpha });
};

const round = (value: number, places: number) => Number(value.toFixed(places));

export const toCss = (color: Oklch) => {
  const { l, c, h } = inGamut(color);

  const alpha =
    color.alpha === undefined || color.alpha === 1
      ? ""
      : ` / ${round(color.alpha, 2)}`;

  return `oklch(${round(l * 100, 2)}% ${round(c, 4)} ${round(h, 2)}${alpha})`;
};

const oklabDistance = differenceEuclidean("oklab");

/** How far apart two hex colors look, as the Euclidean distance in OKLab. */
export const distance = (a: string, b: string) => oklabDistance(a, b);

/** The WCAG 2 contrast ratio between two colors, ignoring alpha. */
export const contrast = (a: Oklch, b: Oklch) =>
  wcagContrast(toHex({ ...a, alpha: 1 }), toHex({ ...b, alpha: 1 }));

export const withLightness = (color: Oklch, l: number): Oklch => ({
  ...color,
  l: Math.min(1, Math.max(0, l)),
});

export const shift = (color: Oklch, by: number): Oklch =>
  withLightness(color, color.l + by);

export const withAlpha = (color: Oklch, alpha: number): Oklch => ({
  ...color,
  alpha,
});

/**
 * The lightness, moving away from `against` toward white or black, at which
 * the color first reaches `target` contrast. Falls back to the extreme when
 * the target can't be reached.
 */
export const solveLightness = (
  color: Oklch,
  against: Oklch,
  target: number,
  direction: "lighter" | "darker",
): Oklch => {
  let low = direction === "lighter" ? against.l : 0;
  let high = direction === "lighter" ? 1 : against.l;

  for (let step = 0; step < 32; step++) {
    const middle = (low + high) / 2;

    const passes =
      contrast(inGamut(withLightness(color, middle)), against) >= target;

    if (direction === "lighter") {
      if (passes) high = middle;
      else low = middle;
    } else if (passes) low = middle;
    else high = middle;
  }

  return inGamut(withLightness(color, direction === "lighter" ? high : low));
};
