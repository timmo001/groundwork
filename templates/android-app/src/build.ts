/**
 * Builds the page into the Android app's assets: the script and its CSS
 * into `android/app/src/main/assets/web/`, with the theme boot script
 * inlined so the stored theme applies before the first paint, and
 * `mobile.config.ts` as JSON beside it for the shell.
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { resolveConfig } from "@timmo001/groundwork-mobile";
import { themeBootScript } from "@timmo001/groundwork-tokens/page";

import mobileConfig from "../mobile.config.ts";
import { themeOptions } from "./theme.ts";

const root = path.join(import.meta.dir, "..");
const assets = path.join(root, "android/app/src/main/assets");
const outDir = path.join(assets, "web");

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
    "<!-- theme:boot -->",
    `<script>${themeBootScript(themeOptions)}</script>`,
  ),
);

await mkdir(path.join(assets, "groundwork"), { recursive: true });

await Bun.write(
  path.join(assets, "groundwork/mobile.config.json"),
  JSON.stringify(resolveConfig(mobileConfig)),
);

console.log(`Built the page into ${path.relative(process.cwd(), outDir)}/`);
