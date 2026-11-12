/** Tests for the desktop config's defaults and the external link check. */
import { describe, expect, test } from "bun:test";

import { isExternal, resolveConfig } from "./config.ts";

describe("resolveConfig", () => {
  test("an empty config turns on every default but system notifications", () => {
    const config = resolveConfig({});

    expect(config.tray).toEqual({ image: "views://tray/icon.png", title: "" });
    expect(config.notifications).toBe(false);
    expect(
      config.find &&
        config.contextMenu &&
        config.singleInstance &&
        config.windowState,
    ).toBe(true);
  });

  test("each option can be turned off", () => {
    const config = resolveConfig({ tray: false, find: false });

    expect(config.tray).toBe(false);
    expect(config.find).toBe(false);
  });
});

describe("isExternal", () => {
  const config = resolveConfig();

  test("allows web links and the configured schemes", () => {
    expect(isExternal("https://example.com", config)).toBe(true);
    expect(isExternal("HTTP://example.com", config)).toBe(true);
    expect(isExternal("mailto:someone@example.com", config)).toBe(true);
  });

  test("refuses the app's own views, files and scripts", () => {
    expect(isExternal("views://mainview/index.html", config)).toBe(false);
    expect(isExternal("file:///etc/passwd", config)).toBe(false);
    expect(isExternal("javascript:alert(1)", config)).toBe(false);
    expect(isExternal("no scheme", config)).toBe(false);
  });

  test("keeps pages from the app's own origins in the window", () => {
    const own = resolveConfig({ ownOrigins: ["http://127.0.0.1:7380"] });

    expect(isExternal("http://127.0.0.1:7380/cameras?a=1", own)).toBe(false);
    expect(isExternal("http://127.0.0.1:1984/", own)).toBe(true);
    expect(isExternal("https://example.com", own)).toBe(true);
  });
});

describe("runInTray and startAtLogin", () => {
  test("are off without the tray", () => {
    const config = resolveConfig({
      tray: false,
      runInTray: true,
      startAtLogin: true,
    });

    expect(config.runInTray).toBe(false);
    expect(config.startAtLogin).toBe(false);
  });
});
