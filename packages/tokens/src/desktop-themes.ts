/**
 * The color themes a machine has, translated into mapped themes so an app can
 * offer them beside its own: every installed Omarchy theme and the theme
 * each terminal (Ghostty, kitty, Alacritty and foot) uses. It needs a file system, so it's an entry
 * of its own; drop the ones an app already offers with `distinctThemes`.
 *
 * @module
 */
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { omarchyTheme } from "./omarchy.ts";
import type { MappedTheme } from "./schema.ts";
import {
  alacrittyPalette,
  colorsTomlPalette,
  distinctThemes,
  footPalette,
  ghosttyPalette,
  kittyPalette,
  translatePalette,
  type TerminalPalette,
} from "./translate.ts";

export { distinctThemes, sameTheme, translatePalette } from "./translate.ts";

/** Where a desktop theme came from, such as `Omarchy` or `Ghostty`. */
export type DesktopThemeSource =
  "Omarchy" | "Ghostty" | "kitty" | "Alacritty" | "foot";

const home = homedir();

const config = process.env.XDG_CONFIG_HOME || join(home, ".config");
const data = process.env.XDG_DATA_HOME || join(home, ".local", "share");

const expand = (path: string, from: string) => {
  const unquoted = path
    .trim()
    .replace(/^\?/, "")
    .replace(/^["']|["']$/g, "");

  const tilde = unquoted.replace(/^~(?=\/|$)/, home);

  return isAbsolute(tilde) ? tilde : resolve(from, tilde);
};

const text = (path: string) => readFile(path, "utf8").catch(() => undefined);

const folders = (path: string) =>
  readdir(path, { withFileTypes: true }).catch((): Dirent[] => []);

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// `tokyo-night` reads as `Tokyo Night`
const titled = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const named = (source: DesktopThemeSource, name: string) => ({
  id: `desktop-${slug(source)}-${slug(name)}`,
  name: `${name} (${source})`,
  family: source,
});

/** Every Omarchy theme installed, the shipped ones and the user's own. */
const omarchyThemes = async () => {
  const found: MappedTheme[] = [];

  for (const root of [
    join(data, "omarchy", "themes"),
    join(config, "omarchy", "themes"),
  ]) {
    for (const entry of await folders(root)) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

      const folder = join(root, entry.name);
      const theme = named("Omarchy", titled(entry.name));
      const colors = await text(join(folder, "colors.toml"));

      const parsed =
        colors === undefined
          ? undefined
          : omarchyTheme(colors, theme.name, theme.id);

      if (parsed?._tag === "Success") {
        found.push(parsed.success);
        continue;
      }

      // Older themes number their colors, or only have each app's file
      for (const [file, palette] of [
        ["colors.toml", colorsTomlPalette],
        ["alacritty.toml", alacrittyPalette],
        ["ghostty.conf", ghosttyPalette],
        ["kitty.conf", kittyPalette],
      ] as const) {
        const read = await text(join(folder, file));

        const translated =
          read === undefined
            ? undefined
            : translatePalette(palette(read), theme);

        if (translated !== undefined) {
          found.push(translated);
          break;
        }
      }
    }
  }

  return found;
};

/**
 * A terminal config with the files it includes, one level deep, joined in
 * order so later colors win, as the terminal reads them.
 */
const withIncludes = async (
  path: string,
  include: RegExp,
  extra: (text: string, from: string) => readonly string[] = () => [],
) => {
  const main = await text(path);

  if (main === undefined) return undefined;

  const from = dirname(path);
  const parts: string[] = [];

  for (const line of main.split(/\r?\n/)) {
    const match = include.exec(line);

    if (match?.[1] !== undefined) {
      for (const file of match[1].split(/,\s*/)) {
        const included = await text(expand(file.replace(/[[\]]/g, ""), from));

        if (included !== undefined) parts.push(included);
      }
    }
  }

  for (const file of extra(main, from)) {
    const included = await text(file);

    if (included !== undefined) parts.push(included);
  }

  return [...parts, main].join("\n");
};

/** Ghostty's theme: its config, the files it pulls in, and a named `theme`. */
const ghosttyConfig = () =>
  withIncludes(
    join(config, "ghostty", "config"),
    /^\s*config-file\s*=\s*(.+)$/,
    (main) => {
      const theme = /^\s*theme\s*=\s*(.+)$/m.exec(main)?.[1]?.trim();

      if (theme === undefined) return [];

      // `light:A,dark:B` takes the dark one
      const name =
        /dark:([^,]+)/.exec(theme)?.[1]?.trim() ??
        theme
          .replace(/^light:/, "")
          .split(",")[0]
          ?.trim() ??
        theme;

      return [
        join(config, "ghostty", "themes", name),
        join("/usr/share/ghostty/themes", name),
      ];
    },
  );

const terminals: readonly {
  readonly source: DesktopThemeSource;
  readonly read: () => Promise<string | undefined>;
  readonly palette: (text: string) => TerminalPalette;
}[] = [
  { source: "Ghostty", read: ghosttyConfig, palette: ghosttyPalette },
  {
    source: "kitty",
    read: () =>
      withIncludes(
        join(config, "kitty", "kitty.conf"),
        /^\s*(?:include|globinclude)\s+(.+)$/,
      ),
    palette: kittyPalette,
  },
  {
    source: "Alacritty",
    read: () =>
      withIncludes(
        join(config, "alacritty", "alacritty.toml"),
        /^\s*(?:general\.)?import\s*=\s*\[(.+)\]/,
      ),
    palette: alacrittyPalette,
  },
  {
    source: "foot",
    read: () =>
      withIncludes(join(config, "foot", "foot.ini"), /^\s*include\s*=\s*(.+)$/),
    palette: footPalette,
  },
];

/** The theme each terminal uses. */
const terminalThemes = async () => {
  const found: MappedTheme[] = [];

  for (const terminal of terminals) {
    const read = await terminal.read();

    if (read === undefined) continue;

    const translated = translatePalette(
      terminal.palette(read),
      named(terminal.source, terminal.source),
    );

    if (translated !== undefined) found.push(translated);
  }

  return found;
};

/**
 * Every theme on the machine, translated: the terminals' first, as the ones
 * in use, then Omarchy's. Themes that look the same are kept once; pass the
 * app's own as `existing` to drop those too.
 */
export const readDesktopThemes = async (
  existing: readonly Pick<MappedTheme, "name" | "palette">[] = [],
): Promise<readonly MappedTheme[]> => {
  const [terminal, omarchy] = await Promise.all([
    terminalThemes(),
    omarchyThemes(),
  ]);

  return distinctThemes([...terminal, ...omarchy], existing);
};
