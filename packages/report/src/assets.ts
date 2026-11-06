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
  const build = await Bun.build({
    entrypoints: [fileURLToPath(import.meta.resolve("./client.ts"))],
    target: "browser",
    format: "esm",
    minify: true,
  });

  const [output] = build.outputs;

  if (!build.success || output === undefined) {
    throw new AggregateError(build.logs, "The report script didn't build");
  }

  const css = await Bun.file(
    fileURLToPath(
      import.meta.resolve("@timmo001/groundwork-tokens/themes.css"),
    ),
  ).text();

  return { css, script: await output.text() };
};
