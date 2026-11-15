/**
 * The build half of `@timmo001/groundwork-pwa`: the web app manifest with its
 * colors from the theme, the tags the page's `<head>` needs, and the
 * launcher icons rendered from the app's SVG logo. `buildPwa` does all of it,
 * and bundles the service worker, after the page is built.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import themesData from "@timmo001/groundwork-tokens/themes.json" with { type: "json" };

import {
  isHashed,
  resolveConfig,
  shareParams,
  type PwaConfig,
  type PwaMode,
} from "./config.ts";

export * from "./config.ts";

/**
 * A web app manifest, as `manifest.webmanifest` holds it. The optional
 * members are set after the rest, only when the config has them.
 */
export interface WebAppManifest {
  readonly id: string;
  readonly name: string;
  readonly short_name: string;
  description?: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: string;
  readonly theme_color: string;
  readonly background_color: string;
  readonly icons: readonly object[];
  shortcuts?: readonly object[];
  share_target?: {
    readonly action: string;
    readonly method: "GET";
    readonly params: typeof shareParams;
  };
}

/** The manifest with the members the config's `manifest` adds. */
export type ExtendedManifest = WebAppManifest &
  NonNullable<PwaConfig["manifest"]>;

const modeOrder: readonly PwaMode[] = ["light", "dark", "darker"];

/** A theme's surface color in a mode, or the nearest mode it has. */
export const surfaceColor = (themeId: string, mode: PwaMode): string => {
  const theme = themesData.themes.find(({ id }) => id === themeId);

  if (theme === undefined) throw new Error(`No theme called ${themeId}`);

  const modes: Partial<
    Record<PwaMode, { readonly "surface-default": string }>
  > = theme.modes;

  // A theme with one scheme, such as a light-only one, uses it for both
  const fallback =
    mode === "light" ? modeOrder : [mode, ...modeOrder.toReversed()];

  for (const candidate of fallback) {
    const color = modes[candidate]?.["surface-default"];

    if (color !== undefined) return color;
  }

  throw new Error(`${themeId} has no modes`);
};

/** The manifest for a config. */
export const webManifest = (config: PwaConfig): ExtendedManifest => {
  const pwa = resolveConfig(config);
  const color = surfaceColor(pwa.theme, pwa.mode);

  const manifest: WebAppManifest = {
    id: pwa.id,
    name: pwa.name,
    short_name: pwa.shortName,
    start_url: pwa.startUrl,
    scope: pwa.scope,
    display: pwa.display,
    theme_color: pwa.themeColor ?? color,
    background_color: pwa.backgroundColor ?? color,
    icons: pwa.icons,
  };

  if (pwa.description !== "") manifest.description = pwa.description;

  if (pwa.shortcuts.length > 0)
    manifest.shortcuts = pwa.shortcuts.map(({ shortName, ...shortcut }) =>
      shortName === undefined
        ? shortcut
        : { ...shortcut, short_name: shortName },
    );

  if (pwa.shareTarget !== false)
    manifest.share_target = {
      action: pwa.shareTarget.action,
      method: "GET",
      params: shareParams,
    };

  // The app's own members go last, so they add to or replace the generated ones
  return Object.assign(manifest, pwa.manifest);
};

const escapeAttribute = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

/**
 * The tags for the page's `<head>`: the manifest link, and with
 * `colorScheme` on, `color-scheme` and a `theme-color` for each of the
 * system's modes, so the browser's bars match the page.
 */
export const headTags = (
  config: PwaConfig,
  manifestHref = "manifest.webmanifest",
): string => {
  const pwa = resolveConfig(config);

  const credentials = pwa.manifestCredentials
    ? ' crossorigin="use-credentials"'
    : "";

  const tags = [
    `<link rel="manifest" href="${escapeAttribute(manifestHref)}"${credentials} />`,
  ];

  if (pwa.colorScheme) {
    tags.push('<meta name="color-scheme" content="dark light" />');

    if (pwa.themeColor !== undefined)
      tags.push(
        `<meta name="theme-color" content="${escapeAttribute(pwa.themeColor)}" />`,
      );
    else
      for (const mode of ["light", "dark"] as const)
        tags.push(
          `<meta name="theme-color" media="(prefers-color-scheme: ${mode})" content="${surfaceColor(pwa.theme, mode)}" />`,
        );
  }

  return tags.join("\n    ");
};

/**
 * Adds the head tags to a page: in place of a `<!-- pwa:head -->` comment,
 * or else straight after `<head>`.
 */
export const addHeadTags = (
  html: string,
  config: PwaConfig,
  manifestHref?: string,
): string => {
  const tags = headTags(config, manifestHref);

  if (html.includes("<!-- pwa:head -->"))
    return html.replace("<!-- pwa:head -->", tags);

  const head = /<head(?:\s[^>]*)?>/.exec(html);

  if (head === null)
    throw new Error("The page has no <head> to add the PWA to");

  return html.replace(head[0], `${head[0]}\n    ${tags}`);
};

/**
 * The defines a worker build sets, for `serveShell` to read its cache
 * version and the files to keep for offline starts. `buildPwa` and the Vite
 * plugin set them; a build of its own passes them to its bundler.
 */
export const pwaDefine = (version: string, shell: readonly string[] = []) => ({
  "process.env.GROUNDWORK_PWA_VERSION": JSON.stringify(version),
  "process.env.GROUNDWORK_PWA_SHELL": JSON.stringify(JSON.stringify(shell)),
});

/**
 * The built files in `outDir` with a content hash in their name, such as
 * the page's script and styles, relative to it, for the worker to keep for
 * offline starts. Source maps are left out.
 */
export const findShell = async (outDir: string): Promise<string[]> =>
  (await readdir(outDir, { recursive: true }))
    .map((name) => name.split(path.sep).join("/"))
    .filter((name) => isHashed(name) && !name.endsWith(".map"))
    .toSorted();

/** A version from the built files themselves, so it changes when any does. */
const contentVersion = async (outDir: string, skip: string) => {
  const hash = createHash("sha256");

  for (const name of (await readdir(outDir, { recursive: true })).toSorted()) {
    const file = path.join(outDir, name);

    if (name === skip || !(await stat(file)).isFile()) continue;

    hash.update(name).update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
};

/** Options for {@link buildPwa}. */
export interface BuildPwaOptions {
  /** The built page's folder, which the PWA's files are written into. */
  readonly outDir: string;
  /** The app's service worker source, such as `src/sw.ts`, bundled to the config's `offline.worker`. */
  readonly worker: string;
  /** A square SVG logo to render the default icons from. */
  readonly logo?: string;
  /**
   * The page in `outDir` to add the head tags to, or `false` to leave it.
   * Defaults to `index.html`.
   */
  readonly page?: string | false;
  /**
   * The cache's version. Defaults to `GROUNDWORK_PWA_VERSION` from the
   * environment, else a hash of the built files, so each build that changes
   * them replaces the last one's cache.
   */
  readonly version?: string;
  /** The files to keep for offline starts. Defaults to {@link findShell}'s. */
  readonly shell?: readonly string[];
  /** More defines for the worker's bundle, beside {@link pwaDefine}'s. */
  readonly define?: Record<string, string>;
  /** Minifies the worker. Defaults to `true`. */
  readonly minify?: boolean;
}

/** What {@link buildPwa} built with. */
export interface BuiltPwa {
  readonly version: string;
  readonly shell: readonly string[];
}

/**
 * Adds the PWA to a page already built into `outDir`, under Bun: the
 * manifest and icons, the service worker bundled with the build's version
 * and the page's hashed files, and the head tags in the page.
 */
export const buildPwa = async (
  config: PwaConfig,
  {
    outDir,
    worker,
    logo,
    page = "index.html",
    version,
    shell,
    define = {},
    minify = true,
  }: BuildPwaOptions,
): Promise<BuiltPwa> => {
  const pwa = resolveConfig(config);
  const workerFile = pwa.offline === false ? undefined : pwa.offline.worker;

  await writePwa(config, logo === undefined ? { outDir } : { outDir, logo });

  if (page !== false) {
    const file = path.join(outDir, page);

    await writeFile(file, addHeadTags(await readFile(file, "utf8"), config));
  }

  const built: BuiltPwa = {
    version:
      version ??
      process.env["GROUNDWORK_PWA_VERSION"] ??
      (await contentVersion(outDir, workerFile ?? "")),
    shell: shell ?? (await findShell(outDir)),
  };

  if (workerFile === undefined) return built;

  const result = await Bun.build({
    entrypoints: [worker],
    outdir: outDir,
    target: "browser",
    minify,
    naming: { entry: workerFile },
    define: { ...pwaDefine(built.version, built.shell), ...define },
  });

  if (!result.success)
    throw new AggregateError(result.logs, "The service worker didn't build");

  return built;
};

/** Options for {@link writeIcons}. */
export interface IconsOptions {
  /** The square SVG logo, with a `viewBox`. */
  readonly logo: string;
  /** Where the PNGs go, such as `dist/icons`. */
  readonly outDir: string;
  /** The maskable icon's background, which fills the launcher's shape. */
  readonly background: string;
}

/**
 * Renders the default icons from the logo: `icon-192.png` and `icon-512.png`
 * as drawn, and `maskable-512.png` on the background, inside the middle 60%
 * that every launcher shape keeps. Returns the paths written.
 */
export const writeIcons = async ({
  logo,
  outDir,
  background,
}: IconsOptions): Promise<string[]> => {
  const svg = Buffer.from(await readFile(logo));

  const maskable = await sharp(svg, { density: 384 })
    .resize(308, 308)
    .png()
    .toBuffer();

  const images = [
    {
      file: "icon-192.png",
      render: () => sharp(svg, { density: 384 }).resize(192, 192),
    },
    {
      file: "icon-512.png",
      render: () => sharp(svg, { density: 384 }).resize(512, 512),
    },
    {
      file: "maskable-512.png",
      render: () =>
        sharp({
          create: { width: 512, height: 512, channels: 4, background },
        }).composite([{ input: maskable, gravity: "center" }]),
    },
  ];

  await mkdir(outDir, { recursive: true });

  return Promise.all(
    images.map(async ({ file, render }) => {
      const target = path.join(outDir, file);

      await render().png().toFile(target);

      return target;
    }),
  );
};

/** Options for {@link writePwa}. */
export interface WritePwaOptions {
  /** The built site's folder. */
  readonly outDir: string;
  /** A square SVG logo to render the default icons from. */
  readonly logo?: string;
}

/**
 * Writes `manifest.webmanifest` into the built site and, given a logo, the
 * default icons, with the maskable one on the manifest's background.
 */
export const writePwa = async (
  config: PwaConfig,
  { outDir, logo }: WritePwaOptions,
): Promise<void> => {
  const manifest = webManifest(config);

  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "manifest.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  if (logo !== undefined)
    await writeIcons({
      logo,
      outDir: path.join(outDir, "icons"),
      background: manifest.background_color,
    });
};
