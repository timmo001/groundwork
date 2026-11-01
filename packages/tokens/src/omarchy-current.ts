/**
 * The Omarchy theme a machine is using, for apps that run outside a browser,
 * such as a desktop app's main process or a terminal UI. It reads the theme's
 * name and `colors.toml` from Omarchy's state folder and watches for a
 * switch. It needs a file system, so it's an entry of its own; map the colors
 * with `omarchyTheme` from the runtime entry.
 *
 * @module
 */
import { watch, type FSWatcher } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { OmarchyCurrentTheme } from "./omarchy.ts";

export type { OmarchyCurrentTheme } from "./omarchy.ts";

/** Omarchy's `current` folder, in `$XDG_STATE_HOME`, by default `~/.local/state`. */
export const omarchyCurrentPath = () =>
  join(
    process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"),
    "omarchy",
    "current",
  );

// `tokyo-night` reads as `Tokyo Night`, as `omarchy theme current` shows it
const displayName = (slug: string) =>
  slug
    .trim()
    .split("-")
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** The Omarchy theme in use, or `null` where there's no Omarchy. */
export const readOmarchyTheme =
  async (): Promise<OmarchyCurrentTheme | null> => {
    const current = omarchyCurrentPath();

    try {
      const colors = await readFile(
        join(current, "theme", "colors.toml"),
        "utf8",
      );

      const slug = await readFile(join(current, "theme.name"), "utf8").catch(
        () => "",
      );

      return { name: displayName(slug) || "Omarchy", colors };
    } catch {
      return null;
    }
  };

const watchFolder = (path: string, onEvent: () => void) => {
  try {
    return watch(path, onEvent).on("error", () => undefined);
  } catch {
    return undefined;
  }
};

/**
 * Calls `onChange` with the theme each time Omarchy switches it, or with
 * `null` when it goes. Returns a function that stops watching.
 */
export const watchOmarchyTheme = (
  onChange: (theme: OmarchyCurrentTheme | null) => void,
): (() => void) => {
  const current = omarchyCurrentPath();
  let last: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let themeWatcher: FSWatcher | undefined;

  void readOmarchyTheme().then((theme) => {
    last ??= JSON.stringify(theme);
  });

  // A switch replaces the theme folder, so its watcher is armed again each time
  const armTheme = () => {
    themeWatcher?.close();
    themeWatcher = watchFolder(join(current, "theme"), changed);
  };

  // A switch writes several files; read once they've settled
  function changed() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      armTheme();
      const theme = await readOmarchyTheme();
      const key = JSON.stringify(theme);

      if (key === last) return;
      last = key;
      onChange(theme);
    }, 250);
  }

  const currentWatcher = watchFolder(current, changed);

  armTheme();

  return () => {
    clearTimeout(timer);
    currentWatcher?.close();
    themeWatcher?.close();
  };
};
