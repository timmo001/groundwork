import { globSync } from "node:fs";
import { join } from "node:path";
import tokens from "@groundwork/tokens/themes.json" with { type: "json" };
import { expect, test, type Page } from "@playwright/test";

/**
 * Every docs page in every core theme and mode. Each test attaches a
 * full-page screenshot per mode for a person to look over after a large
 * change, and checks the page background comes from the picked theme, which
 * fails when the theme picker or docs-kit's Blume bridge stops applying.
 */
const content = join(import.meta.dirname, "../src/content/docs");

const routes = globSync("**/*.{md,mdx}", { cwd: content })
  .map((file) => `/${file}`.replace(/\.mdx?$/, "").replace(/\/?index$/, "") || "/")
  .toSorted();

const modes = ["light", "dark", "darker"] as const;

const themes = tokens.themes.filter((theme) => !theme.optional);

/** Reads a CSS colour as sRGB channels by painting it on a canvas. */
const channels = (page: Page, colour: string) =>
  page.evaluate((value) => {
    const canvas = document.createElement("canvas");

    canvas.width = 1;
    canvas.height = 1;

    const context = canvas.getContext("2d");

    if (context === null) throw new Error("No 2D canvas");

    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);

    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, colour);

/** The colour Blume's page background resolves to. */
const pageBackground = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement("div");

    probe.style.background = "var(--blume-background)";
    document.body.append(probe);

    const colour = getComputedStyle(probe).backgroundColor;

    probe.remove();

    return colour;
  });

/**
 * Waits until the page stops loading. The dev server can reload a page once
 * or twice after it first opens, so a check that starts too early loses its
 * page.
 */
const settle = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
};

/** Picks the theme and mode the way the header's theme picker stores them. */
const pick = (page: Page, theme: string, mode: (typeof modes)[number]) =>
  page.evaluate(
    ([theme, mode]) => {
      localStorage.setItem("gw-docs-theme", theme);
      localStorage.setItem("blume-theme", mode === "light" ? "light" : "dark");

      if (mode === "darker") localStorage.setItem("gw-darker", "1");
      else localStorage.removeItem("gw-darker");
    },
    [theme, mode] as const,
  );

for (const route of routes) {
  test.describe(route, () => {
    for (const theme of themes) {
      test(theme.name, async ({ page }, info) => {
        await page.goto(route);
        await settle(page);

        for (const mode of modes) {
          await pick(page, theme.id, mode);
          await page.reload();
          await settle(page);

          const expected = await channels(page, theme.modes[mode]["surface-default"]);
          const actual = await channels(page, await pageBackground(page));

          expect
            .soft(
              actual.every((value, index) => Math.abs(value - (expected[index] ?? 0)) <= 2),
              `${mode} background ${actual.join(",")} should be ${expected.join(",")}`,
            )
            .toBe(true);

          await info.attach(`${theme.id} ${mode}`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
        }
      });
    }
  });
}
