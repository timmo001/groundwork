/**
 * No jumps on load: every docs page should keep its layout while the `gw-`
 * elements upgrade, so the cumulative layout shift stays near zero. A failure
 * lists what moved, with its y position and height before and after.
 *
 * @module
 */
import { globSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const content = join(import.meta.dirname, "../src/content/docs");

const routes = globSync("**/*.{md,mdx}", { cwd: content })
  .map((file) => `/${file}`.replace(/\.mdx?$/, "").replace(/\/?index$/, "") || "/")
  .toSorted();

/**
 * The most a page may shift in total while it loads. Web guidance counts
 * 0.1 as good; this keeps well under it while allowing the sub-pixel text
 * reflow some pages show as the header settles.
 */
const limit = 0.025;

declare global {
  interface Window {
    gwShift: number;
    gwShifted: string[];
  }
}

// Under a full parallel run, a web font can occasionally land late and nudge
// a text-only page; a retry tells that apart from a component that moves
// every time
test.describe.configure({ retries: 2 });

for (const route of routes) {
  test(`${route} loads without layout shift`, async ({ page }) => {
    // A first visit caches the fonts, so the measured visit counts the
    // components upgrading rather than web fonts swapping in
    await page.goto(route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    await page.addInitScript(() => {
      window.gwShift = 0;
      window.gwShifted = [];

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
          sources: { node: Node | null; previousRect: DOMRect; currentRect: DOMRect }[];
        })[]) {
          if (entry.hadRecentInput) continue;

          window.gwShift += entry.value;

          for (const { node, previousRect, currentRect } of entry.sources) {
            const element = node instanceof Element ? node : node?.parentElement;
            const describe = (item: Element) =>
              `${item.localName}${item.id ? `#${item.id}` : ""}`;
            const name = element
              ? `${element.parentElement ? `${describe(element.parentElement)} > ` : ""}${describe(element)} "${(element.textContent ?? "").trim().slice(0, 24)}"`
              : "?";

            window.gwShifted.push(
              `${name} ${previousRect.y | 0},${previousRect.height | 0} -> ${currentRect.y | 0},${currentRect.height | 0}`,
            );
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const { shift, shifted } = await page.evaluate(() => ({
      shift: window.gwShift,
      shifted: window.gwShifted,
    }));

    expect(shift, shifted.join("\n")).toBeLessThanOrEqual(limit);
  });
}
