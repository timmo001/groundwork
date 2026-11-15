/**
 * The Vite plugin of `@timmo001/groundwork-pwa`, for apps built with Vite:
 * it adds the head tags to the page, and after the client build writes the
 * manifest and icons and bundles the service worker with the build's version
 * and the page's hashed files, as `buildPwa` does for a Bun build.
 *
 *   import { pwa } from "@timmo001/groundwork-pwa/vite";
 *   import config from "./pwa.config.ts";
 *
 *   export default defineConfig({
 *     plugins: [pwa(config, { worker: "src/sw.ts", logo: "public/icon.svg" })],
 *   });
 */
import { createHash } from "node:crypto";
import path from "node:path";

import type { Plugin } from "vite";

import {
  addHeadTags,
  pwaDefine,
  resolveConfig,
  writePwa,
  type PwaConfig,
} from "./build.ts";
import { isHashed } from "./config.ts";

/** Options for {@link pwa}. */
export interface VitePwaOptions {
  /** The app's service worker source, such as `src/sw.ts`, bundled to the config's `offline.worker`. */
  readonly worker: string;
  /** A square SVG logo to render the default icons from. */
  readonly logo?: string;
  /**
   * The cache's version. Defaults to `GROUNDWORK_PWA_VERSION` from the
   * environment, else a hash of the build's hashed file names, which change
   * whenever the files do.
   */
  readonly version?: string;
  /** More defines for the worker's bundle, beside `pwaDefine`'s. */
  readonly define?: Record<string, string>;
  /** The Vite environment the page is built in. Defaults to `client`. */
  readonly environment?: string;
}

/** The PWA as a Vite plugin. */
export const pwa = (
  config: PwaConfig,
  {
    worker,
    logo,
    version,
    define = {},
    environment = "client",
  }: VitePwaOptions,
): Plugin => ({
  name: "groundwork-pwa",
  transformIndexHtml: (html) => addHeadTags(html, config),
  async writeBundle(options, bundle) {
    if (this.environment.name !== environment || options.dir === undefined)
      return;

    const outDir = options.dir;
    const offline = resolveConfig(config).offline;

    const shell = Object.keys(bundle)
      .filter((name) => isHashed(name) && !name.endsWith(".map"))
      .toSorted();

    await writePwa(config, logo === undefined ? { outDir } : { outDir, logo });

    if (offline === false) return;

    const { build } = await import("vite");

    await build({
      configFile: false,
      logLevel: "warn",
      publicDir: false,
      define: {
        ...pwaDefine(
          version ??
            process.env["GROUNDWORK_PWA_VERSION"] ??
            createHash("sha256")
              .update(shell.join())
              .digest("hex")
              .slice(0, 12),
          shell,
        ),
        ...define,
      },
      build: {
        outDir,
        emptyOutDir: false,
        lib: {
          entry: path.resolve(worker),
          formats: ["iife"],
          name: "sw",
          fileName: () => offline.worker,
        },
      },
    });
  },
});
