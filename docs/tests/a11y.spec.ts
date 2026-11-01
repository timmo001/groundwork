/**
 * An axe pass over every docs page in every core theme and mode, so a theme
 * that drops a contrast pair or a component that loses its name fails here.
 * It runs the WCAG 2 A and AA rules after components have upgraded.
 *
 * @module
 */
import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import tokens from "@groundwork/tokens/themes.json" with { type: "json" };
import { expect, test, type Page } from "@playwright/test";

const content = join(import.meta.dirname, "../src/content/docs");

const routes = globSync("**/*.{md,mdx}", { cwd: content })
  .map((file) => `/${file}`.replace(/\.mdx?$/, "").replace(/\/?index$/, "") || "/")
  .toSorted();

const modes = ["light", "dark", "darker"] as const;

const themes = tokens.themes.filter((theme) => !theme.optional);

// Optional themes keep their upstream palettes, misses included, and the
// contrast page reports them, so their previews aren't held to AA here
const optional = tokens.themes
  .filter((theme) => theme.optional)
  .map((theme) => [`[data-gw-theme="${theme.id}"]`]);

const axe = readFileSync(createRequire(import.meta.url).resolve("axe-core"), "utf8");

interface Violation {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string[]; any: { data?: unknown }[] }[];
}

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

const audit = async (page: Page) => {
  // Fades and skeleton shimmers would read as low contrast mid-animation
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  await page.addScriptTag({ content: axe });

  return page.evaluate(async (exclude) => {
    const { violations } = await (
      window as unknown as {
        axe: {
          run: (context: object, options: object) => Promise<{ violations: Violation[] }>;
        };
      }
    ).axe.run(
      { include: [["html"]], exclude },
      { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    );

    return violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      nodes: nodes.slice(0, 5).map(({ target, any }) => {
        const data = any[0]?.data as
          | { fgColor?: string; bgColor?: string; contrastRatio?: number }
          | undefined;

        return data?.contrastRatio
          ? `${target.join(" ")} (${data.fgColor} on ${data.bgColor}, ${data.contrastRatio})`
          : target.join(" ");
      }),
    }));
  }, optional);
};

for (const route of routes) {
  test.describe(route, () => {
    for (const theme of themes) {
      test(`${theme.name} passes axe`, async ({ page }) => {
        await page.goto(route);

        for (const mode of modes) {
          await pick(page, theme.id, mode);
          await page.reload();
          await page.waitForLoadState("load");
          await page.evaluate(() => document.fonts.ready);

          const violations = await audit(page);

          expect
            .soft(violations, `${theme.id} ${mode}: ${JSON.stringify(violations, null, 2)}`)
            .toEqual([]);
        }
      });
    }
  });
}
