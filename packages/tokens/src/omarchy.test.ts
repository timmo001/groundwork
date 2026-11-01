/**
 * Tests the Omarchy import against a real `colors.toml` shape, in both modes,
 * and that a file missing a color fails rather than half-applies.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Result } from "effect";
import { omarchyTheme } from "./omarchy.ts";

const dark = `mode = "dark"

accent = "#7aa2f7"
selection = "#292e42"
muted = "#414868"

background = "#1a1b26"
dark_background = "#13141c"
lighter_background = "#24283b"

foreground = "#a9b1d6"
light_foreground = "#b4bee6"
bright_foreground = "#c0caf5"

red = "#f7768e"
yellow = "#e0af68"
green = "#9ece6a"
blue = "#7aa2f7"
magenta = "#ad8ee6"
`;

test("maps a dark colors.toml onto the roles", () => {
  const theme = Result.getOrThrow(omarchyTheme(dark, "Tokyo Night", "tokyo"));

  expect(theme.mode).toBe("dark");
  expect(theme.palette).toMatchObject({
    lower: "#13141c",
    background: "#1a1b26",
    raised: "#24283b",
    border: "#414868",
    text: "#c0caf5",
    muted: "#a9b1d6",
    danger: "#f7768e",
  });
});

test("uses the light foreground as muted when foreground is the text", () => {
  const light = dark
    .replace('mode = "dark"', 'mode = "light"')
    .replace("#a9b1d6", "#C0CAF5")
    .replace("#b4bee6", "#403e3c");

  const theme = Result.getOrThrow(omarchyTheme(light));

  expect(theme.mode).toBe("light");
  expect(theme.palette.muted).toBe("#403e3c");
});

test("fails when a color is missing", () => {
  expect(Result.isFailure(omarchyTheme(dark.replace(/^red = .*$/m, "")))).toBe(
    true,
  );
});
