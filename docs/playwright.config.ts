/**
 * Scripted visual checks of the docs site, with a screenshot of every page in
 * every theme and mode in the HTML report. By default they run against the
 * isolated build (`bun run test:visual` builds it first), served statically so
 * nothing reloads mid-test. Set `GW_DOCS_URL` to test another copy, such as
 * the dev server.
 *
 * @module
 */
import { defineConfig, devices } from "@playwright/test";

const url = process.env.GW_DOCS_URL;

const config = defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: url ?? "http://127.0.0.1:7360",
    ignoreHTTPSErrors: true,
    ...devices["Desktop Chrome"],
  },
});

if (url === undefined) {
  config.webServer = {
    command: "bun scripts/serve-build.ts",
    url: "http://127.0.0.1:7360",
    reuseExistingServer: false,
  };
}

export default config;
