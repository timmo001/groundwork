/**
 * Tests the WebMCP theme tools against a fake model context: what they
 * register, and that set-theme applies and keeps a theme by id, by document
 * and from an Omarchy colors.toml.
 *
 * @module
 */
import { expect, test } from "bun:test";
import type { ThemeStore } from "./runtime.ts";
import {
  registerThemeTools,
  type ModelContext,
  type ToolArguments,
} from "./webmcp.ts";

type Tool = Parameters<ModelContext["registerTool"]>[0];

const setup = () => {
  const tools = new Map<string, Tool>();
  const applied: string[] = [];
  let stored: string | null = null;

  const store: ThemeStore = {
    load: async () => stored,
    save: async (text) => {
      stored = text;
    },
    clear: async () => {
      stored = null;
    },
  };

  const registered = registerThemeTools({
    store,
    apply: ({ document }) => applied.push(document.id),
    context: {
      registerTool: (tool) => {
        tools.set(tool.name, tool);
      },
    },
  });

  const call = async (name: string, input: ToolArguments = {}) => {
    const result = await tools.get(name)?.execute(input);

    return JSON.stringify(result);
  };

  return { registered, tools, applied, call, stored: () => stored };
};

test("registers the three tools", () => {
  const { registered, tools } = setup();

  expect(registered).toBe(true);
  expect([...tools.keys()]).toEqual(["get-theme", "list-themes", "set-theme"]);
});

test("does nothing without a model context", () => {
  expect(
    registerThemeTools({
      store: {
        load: async () => null,
        save: async () => {},
        clear: async () => {},
      },
      apply: () => {},
    }),
  ).toBe(false);
});

test("set-theme applies and keeps a built-in theme by id", async () => {
  const { applied, call, stored } = setup();

  expect(await call("list-themes")).toContain("glazing");
  expect(await call("set-theme", { id: "glazing" })).toContain(
    "Applied Glazing",
  );
  expect(applied).toEqual(["glazing"]);
  expect(stored()).toContain('"id": "glazing"');
  expect(await call("get-theme")).toContain("glazing");
});

test("set-theme takes an Omarchy colors.toml", async () => {
  const { applied, call } = setup();

  const toml = `mode = "dark"
accent = "#7aa2f7"
muted = "#414868"
background = "#1a1b26"
dark_background = "#13141c"
lighter_background = "#24283b"
foreground = "#a9b1d6"
bright_foreground = "#c0caf5"
red = "#f7768e"
yellow = "#e0af68"
green = "#9ece6a"
blue = "#7aa2f7"
magenta = "#ad8ee6"`;

  expect(await call("set-theme", { theme: toml })).toContain("Applied Omarchy");
  expect(applied).toEqual(["omarchy"]);
});

test("set-theme explains a bad id or input instead of throwing", async () => {
  const { applied, call } = setup();

  expect(await call("set-theme", { id: "nope" })).toContain("list-themes");
  expect(await call("set-theme", { theme: "{}" })).toContain("isn't a theme");
  expect(applied).toEqual([]);
});
