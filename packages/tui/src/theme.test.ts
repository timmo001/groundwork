/**
 * Tests loading a theme that isn't one of the generated ones: a theme file
 * by path, an app's own document by id and from `GW_THEME`, and the
 * transparent option.
 *
 * @module
 */
import { afterEach, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { parseTheme } from "@timmo001/groundwork-tokens/runtime";
import { Effect, Result } from "effect";
import {
  DEFAULT_THEME,
  loadThemeWith,
  resolveTheme,
  themeFor,
  themeFromDocument,
  themeOptionsWith,
} from "./theme.ts";

const glazingFile = fileURLToPath(
  import.meta.resolve("@timmo001/groundwork-tokens/themes/glazing.json"),
);

const kiln = Result.getOrThrow(
  parseTheme(
    JSON.stringify({
      kind: "solved",
      id: "kiln",
      name: "Kiln",
      description: "Warm clay and ember orange.",
      background: "#1f1a17",
      accent: "#e08a4f",
      style: {
        font: "Inter",
        mono: "JetBrains Mono",
        radius: { panel: 6, control: 4, chip: 4 },
        border: { width: 1, strength: "soft" },
        weights: { regular: 400, strong: 600 },
        density: "compact",
        capitals: false,
        link: { color: "accent", underline: "thin" },
        surfaceAccent: "none",
        rows: "dense",
      },
    }),
  ),
);

afterEach(() => {
  delete process.env.GW_THEME;
  delete process.env.GW_MODE;
  delete process.env.GW_TRANSPARENT;
});

test("a theme file by path matches the generated theme", async () => {
  const fromFile = await Effect.runPromise(
    resolveTheme({ theme: glazingFile, mode: "light" }),
  );

  expect(fromFile).toEqual(themeFor("glazing", "light"));
});

test("a theme file that isn't there falls back to the default", async () => {
  const theme = await Effect.runPromise(
    resolveTheme({ theme: "./no-such-theme.json" }),
  );

  expect(theme).toEqual(DEFAULT_THEME);
});

test("an app's own theme by id, in its own mode, and transparent", async () => {
  const theme = await Effect.runPromise(
    resolveTheme({ theme: "kiln", transparent: true }, [kiln]),
  );

  expect(theme).toEqual(
    themeFromDocument(kiln, undefined, { transparent: true }),
  );
  expect(theme.transparent).toBe(true);
  expect(theme.accent).not.toBe(DEFAULT_THEME.accent);
});

test("GW_THEME takes a path and GW_TRANSPARENT the option", async () => {
  process.env.GW_THEME = glazingFile;
  process.env.GW_MODE = "darker";
  process.env.GW_TRANSPARENT = "true";

  const theme = await Effect.runPromise(loadThemeWith());

  expect(theme).toEqual({
    ...themeFor("glazing", "darker"),
    transparent: true,
  });
});

test("the picker lists the app's themes first, then the optional ones too", async () => {
  const options = await Effect.runPromise(themeOptionsWith([kiln]));
  const ids = options.map((option) => option.id);

  expect(ids[0]).toBe("kiln");
  expect(ids).toContain("catppuccin-mocha");
  expect(options[0]?.modes).toEqual(["light", "dark", "darker"]);
});
