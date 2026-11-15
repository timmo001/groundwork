/**
 * Builds the app into `dist/`: the page script and its CSS, and the page
 * with the theme boot script inlined, so the stored theme applies before the
 * first paint. `buildPwa` then adds the manifest and icons from
 * `pwa.config.ts` and the logo, the service worker and the head tags.
 */
import { rm } from "node:fs/promises";
import path from "node:path";

import { buildPwa } from "@timmo001/groundwork-pwa/build";
import { themeBootScript } from "@timmo001/groundwork-tokens/page";

import config from "../pwa.config.ts";
import { themeOptions } from "./theme.ts";

const root = path.join(import.meta.dir, "..");
const outDir = path.join(root, "dist");

await rm(outDir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [path.join(root, "src/index.ts")],
  outdir: outDir,
  target: "browser",
  minify: true,
  naming: { entry: "[name].[ext]", asset: "assets/[name]-[hash].[ext]" },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const html = await Bun.file(path.join(root, "src/index.html")).text();

await Bun.write(
  path.join(outDir, "index.html"),
  html.replace(
    "<!-- pwa:head -->",
    `<!-- pwa:head -->\n    <script>${themeBootScript(themeOptions)}</script>`,
  ),
);

const { version } = await buildPwa(config, {
  outDir,
  worker: path.join(root, "src/sw.ts"),
  logo: path.join(root, "src/logo.svg"),
});

console.log(`Built ${version} into ${path.relative(process.cwd(), outDir)}/`);
