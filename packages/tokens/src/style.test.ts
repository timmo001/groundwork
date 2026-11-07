/**
 * Tests that a theme can name any font and give density and border strength
 * as numbers, and the CSS those come out as, since the shipped themes only
 * use the presets.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Result } from "effect";
import base from "../themes/base.json" with { type: "json" };
import { parseTheme, runtimeTheme } from "./runtime.ts";
import type { Style } from "./schema.ts";

const theme = (style: Partial<Style>) =>
  parseTheme(JSON.stringify({ ...base, style: { ...base.style, ...style } }));

const property = (css: string, name: string) =>
  new RegExp(`--gw-${name}: ([^;]+);`).exec(css)?.[1];

test("takes any font family, falling back by field", () => {
  const { css } = runtimeTheme(
    Result.getOrThrow(
      theme({ font: "Fraunces", mono: "Berkeley Mono", figures: "Iosevka" }),
    ),
  );

  expect(property(css, "font-sans")).toBe(
    '"Fraunces Variable", "Fraunces", system-ui, sans-serif',
  );
  expect(property(css, "font-mono")).toBe(
    '"Berkeley Mono Variable", "Berkeley Mono", ui-monospace, monospace',
  );
  expect(property(css, "font-figures")).toBe(
    '"Iosevka Variable", "Iosevka", system-ui, sans-serif',
  );
});

test("falls back to monospace for figures when told to", () => {
  const { css } = runtimeTheme(
    Result.getOrThrow(theme({ figures: "Iosevka", figuresMono: true })),
  );

  expect(property(css, "font-figures")).toContain("ui-monospace, monospace");
});

test("scales spacing by a numeric density, controls by half above 1", () => {
  const { css } = runtimeTheme(Result.getOrThrow(theme({ density: 1.3 })));

  expect(property(css, "density")).toBe("1.3");
  expect(property(css, "control-scale")).toBe("1.15");
});

test("mixes the border roles for a strength between the presets", () => {
  const between = runtimeTheme(
    Result.getOrThrow(theme({ border: { width: 1, strength: 1.5 } })),
  );

  expect(property(between.css, "border-color")).toBe(
    "color-mix(in oklch, var(--gw-color-border-normal) 50%, var(--gw-color-border-quiet))",
  );

  const none = runtimeTheme(
    Result.getOrThrow(theme({ border: { width: 1, strength: 0 } })),
  );

  expect(property(none.css, "border-width")).toBe("0px");
});

test("rejects a density or strength out of range, and an empty font", () => {
  expect(Result.isFailure(theme({ density: 3 }))).toBe(true);
  expect(Result.isFailure(theme({ border: { width: 1, strength: 4 } }))).toBe(
    true,
  );
  expect(Result.isFailure(theme({ font: "" }))).toBe(true);
});
