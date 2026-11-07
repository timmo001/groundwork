/**
 * The build half of `@timmo001/groundwork-pwa`: the web app manifest with its
 * colors from the theme, the tags the page's `<head>` needs, and the
 * launcher icons rendered from the app's SVG logo.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import themesData from "@timmo001/groundwork-tokens/themes.json" with { type: "json" };

import {
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

  const tags = [
    `<link rel="manifest" href="${escapeAttribute(manifestHref)}" />`,
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
