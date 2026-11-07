/**
 * Tests the Android mapping against Material 3's baseline scheme, in both
 * modes, and that a scheme missing a contrast target falls back to a solved
 * theme rather than applying as it is.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Result } from "effect";
import { androidTheme, type AndroidColors } from "./android.ts";
import { androidRuntimeTheme } from "./runtime.ts";

const baseline: AndroidColors = {
  light: {
    surface: "#FEF7FF",
    surfaceContainerLowest: "#FFFFFF",
    surfaceContainer: "#F3EDF7",
    surfaceContainerHigh: "#ECE6F0",
    onSurface: "#1D1B20",
    onSurfaceVariant: "#49454F",
    outlineVariant: "#CAC4D0",
    primary: "#6750A4",
    error: "#B3261E",
  },
  dark: {
    surface: "#141218",
    surfaceContainerLowest: "#0F0D13",
    surfaceContainer: "#211F26",
    surfaceContainerHigh: "#2B2930",
    onSurface: "#E6E0E9",
    onSurfaceVariant: "#CAC4D0",
    outlineVariant: "#49454F",
    primary: "#D0BCFF",
    error: "#F2B8B5",
  },
};

test("maps both modes onto the roles", () => {
  const theme = Result.getOrThrow(androidTheme(baseline));

  expect(theme.id).toBe("android");
  expect(theme.palette).toMatchObject({
    lower: "#0f0d13",
    background: "#141218",
    raised: "#211f26",
    text: "#e6e0e9",
    accent: "#d0bcff",
    danger: "#f2b8b5",
  });
  expect(theme.otherPalette).toMatchObject({
    lower: "#ece6f0",
    background: "#fef7ff",
    raised: "#ffffff",
    accent: "#6750a4",
  });
});

test("keeps a scheme that meets the contrast targets", () => {
  const solved = androidRuntimeTheme(Result.getOrThrow(androidTheme(baseline)));

  expect(solved.fallback).toBe(false);
  expect(Object.keys(solved.theme.modes)).toEqual(["light", "dark", "darker"]);
});

test("falls back when a scheme misses a target", () => {
  const faint = {
    ...baseline,
    dark: { ...baseline.dark, onSurfaceVariant: "#3a3740" },
  };

  const solved = androidRuntimeTheme(Result.getOrThrow(androidTheme(faint)));

  expect(solved.fallback).toBe(true);
  expect(solved.theme.id).toBe("android");
  expect(solved.checks.every((item) => item.passes)).toBe(true);
});

test("fails when a role is missing", () => {
  const { primary: _, ...dark } = baseline.dark;

  expect(Result.isFailure(androidTheme({ ...baseline, dark }))).toBe(true);
});
