/**
 * Captures every page of the docs site, so a person or agent can look
 * through them after a large change. Each page is captured with its demos
 * on each of the given themes and modes, plus the site's own light and dark.
 *
 *   bun scripts/capture.ts [out-dir] [--themes base,glazing] [--modes light,dark] [--only /components]
 *
 * It reads the page list from the running dev server (`mise run serve:docs`),
 * or from `GW_DOCS_URL`.
 */
import { mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    themes: { type: "string", default: "base,glazing,snag" },
    modes: { type: "string", default: "light,dark" },
    only: { type: "string", default: "" },
  },
});

const site = process.env.GW_DOCS_URL ?? "https://docs.groundwork.localhost";
const out = positionals[0] ?? "/tmp/opencode/groundwork-capture";
const themes = values.themes.split(",");
const modes = values.modes.split(",");

const index = await fetch(`${site}/api/docs/pages.json`, { tls: { rejectUnauthorized: false } });
const { pages } = (await index.json()) as { pages: { route: string }[] };
const routes = pages.map((page) => page.route).filter((route) => route.startsWith(values.only));

await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
const written: string[] = [];

for (const route of routes) {
  await page.goto(`${site}${route}`, { waitUntil: "networkidle" });

  const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  const hasDemos = (await page.locator("gw-demo-frame").count()) > 0;

  for (const mode of modes) {
    // The site's own colour scheme follows the mode too
    await page.emulateMedia({ colorScheme: mode === "light" ? "light" : "dark", reducedMotion: "reduce" });

    for (const theme of hasDemos ? themes : ["site"]) {
      if (hasDemos) {
        await page.evaluate(
          ([theme, mode]) => {
            for (const frame of document.querySelectorAll("gw-demo-frame")) {
              frame.setAttribute("data-gw-theme", theme);
              frame.setAttribute("data-gw-mode", mode);
            }
          },
          [theme, mode],
        );
      }

      const file = `${out}/${slug}-${theme}-${mode}.png`;

      await page.screenshot({ path: file, fullPage: true });
      written.push(file);
    }
  }
}

await browser.close();
console.log(`Captured ${written.length} screenshots of ${routes.length} pages in ${out}`);
