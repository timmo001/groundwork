/**
 * Tests a solved theme's own status colors and role overrides, and a mapped
 * theme's own style, since none of the shipped themes use them.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Result } from "effect";
import base from "../themes/base.json" with { type: "json" };
import mocha from "../themes/catppuccin-mocha.json" with { type: "json" };
import { toHex } from "./color.ts";
import { parseTheme, runtimeTheme } from "./runtime.ts";

/** Decodes a theme file's text, as an app reads its own. */
const decode = (text: string) => Result.getOrThrow(parseTheme(text));

test("solves a theme's own status seeds in place of the defaults", () => {
  const plain = runtimeTheme(decode(JSON.stringify(base))).theme;

  const own = runtimeTheme(
    decode(JSON.stringify({ ...base, status: { danger: "#ff2266" } })),
  ).theme;

  const danger = (theme: typeof plain) => theme.modes.dark?.danger;

  expect(danger(own)).not.toEqual(danger(plain));
  expect(own.modes.dark?.info).toEqual(plain.modes.dark?.info);
});

test("sets overridden roles as given, with Darker starting from dark's", () => {
  const { theme, checks } = runtimeTheme(
    decode(
      JSON.stringify({
        ...base,
        roles: {
          dark: { "surface-raised": "#202830", accent: "#33aaff" },
          darker: { accent: "#1188dd" },
        },
      }),
    ),
  );

  const hex = (mode: "dark" | "darker", role: string) => {
    const color = theme.modes[mode]?.[role];

    return color === undefined ? undefined : toHex(color);
  };

  expect(hex("dark", "surface-raised")).toBe("#202830");
  expect(hex("dark", "accent")).toBe("#33aaff");
  expect(hex("darker", "accent")).toBe("#1188dd");
  expect(
    checks.some((check) => check.mode === "dark" && check.role === "accent"),
  ).toBe(true);
});

test("rejects a role that doesn't exist", () => {
  expect(
    Result.isFailure(
      parseTheme(
        JSON.stringify({ ...base, roles: { dark: { accnt: "#33aaff" } } }),
      ),
    ),
  ).toBe(true);
});

test("keeps a mapped theme's own style, and Base's otherwise", () => {
  const style = { ...base.style, font: "Fraunces", density: "compact" };

  expect(
    runtimeTheme(decode(JSON.stringify({ ...mocha, style }))).theme.style.font,
  ).toBe("Fraunces");
  expect(runtimeTheme(decode(JSON.stringify(mocha))).theme.style.font).toBe(
    base.style.font,
  );
});
