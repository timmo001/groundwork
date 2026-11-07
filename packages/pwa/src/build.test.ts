/** Tests for the PWA config's defaults and the manifest built from it. */
import { describe, expect, test } from "bun:test";

import { headTags, surfaceColor, webManifest } from "./build.ts";
import { resolveConfig } from "./config.ts";

describe("resolveConfig", () => {
  test("a name alone turns on every piece", () => {
    const config = resolveConfig({ name: "Updates" });

    expect(config.shortName).toBe("Updates");
    expect(config.shareTarget).toEqual({ action: "./" });
    expect(config.offline).toEqual({ worker: "sw.js", shell: ["./"] });
    expect(config.colorScheme && config.install).toBe(true);
  });

  test("each piece can be turned off", () => {
    const config = resolveConfig({
      name: "Updates",
      shareTarget: false,
      offline: false,
    });

    expect(config.shareTarget).toBe(false);
    expect(config.offline).toBe(false);
  });
});

describe("webManifest", () => {
  test("takes its colors from the theme's surface", () => {
    const manifest = webManifest({ name: "Updates", mode: "dark" });

    expect(manifest.theme_color).toBe(surfaceColor("base", "dark"));
    expect(manifest.background_color).toBe(manifest.theme_color);
    expect(manifest.share_target?.params.url).toBe("share-url");
  });

  test("a theme without the mode uses the one it has", () => {
    expect(surfaceColor("catppuccin-latte", "dark")).toBe(
      surfaceColor("catppuccin-latte", "light"),
    );
    expect(() => surfaceColor("no-such-theme", "light")).toThrow();
  });

  test("leaves out what the config turns off", () => {
    const manifest = webManifest({ name: "Updates", shareTarget: false });

    expect(manifest.share_target).toBeUndefined();
    expect(manifest.shortcuts).toBeUndefined();
  });

  test("the app's own members and colors win over the generated ones", () => {
    const manifest = webManifest({
      name: "Updates",
      themeColor: "#112233",
      manifest: { orientation: "portrait", display: "fullscreen" },
    });

    expect(manifest.theme_color).toBe("#112233");
    expect(manifest.background_color).toBe(surfaceColor("base", "light"));
    expect(manifest["orientation"]).toBe("portrait");
    expect(manifest.display).toBe("fullscreen");
  });
});

describe("headTags", () => {
  test("gives a theme color for each of the system's modes", () => {
    const tags = headTags({ name: "Updates" });

    expect(tags).toContain('content="dark light"');
    expect(tags).toContain(
      `media="(prefers-color-scheme: dark)" content="${surfaceColor("base", "dark")}"`,
    );
  });
});
