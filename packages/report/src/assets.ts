/**
 * Builds what a report page inlines: every theme's CSS and the page script,
 * bundled and minified with Bun. It needs Bun and the package's source, so
 * an app compiled to one binary calls it at build time, as a Bun macro:
 *
 * ```ts
 * import { reportAssets } from "@timmo001/groundwork-report/assets" with { type: "macro" };
 *
 * const assets = await reportAssets();
 * ```
 *
 * @module
 */
import { fileURLToPath } from "node:url";

import type { ReportAssets } from "./page.ts";

/** Bundles the page script and reads the themes' CSS. */
export const reportAssets = async (): Promise<ReportAssets> => {
  // The CLI rather than `Bun.build`, which can't run inside a macro while
  // the bundler waits on it
  const build = Bun.spawnSync([
    process.execPath,
    "build",
    fileURLToPath(import.meta.resolve("./client.ts")),
    "--target=browser",
    "--format=esm",
    "--minify",
  ]);

  if (!build.success) {
    throw new Error(
      `The report script didn't build:\n${build.stderr.toString()}`,
    );
  }

  const css = await Bun.file(
    fileURLToPath(
      import.meta.resolve("@timmo001/groundwork-tokens/themes.css"),
    ),
  ).text();

  return { css, script: build.stdout.toString() };
};
