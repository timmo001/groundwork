/**
 * Start at login for `openDesktopWindow`'s tray item. On Linux it's an XDG
 * autostart entry that runs the app's launcher with `GROUNDWORK_DESKTOP_HIDDEN`
 * set, so an app with `runInTray` starts in the tray. Electrobun's launcher
 * doesn't pass its arguments on to the main process, hence the variable.
 */
import { mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { Option, Schema } from "effect";

/** Set to `1` when the app starts at login, so it opens in the tray. */
export const hiddenVariable = "GROUNDWORK_DESKTOP_HIDDEN";

/** Turns starting at login on or off. */
export interface LoginItem {
  readonly enabled: () => Promise<boolean>;
  readonly set: (enabled: boolean) => Promise<void>;
}

const decodeVersion = Schema.decodeUnknownOption(
  Schema.Struct({
    identifier: Schema.String,
    name: Schema.String,
    channel: Schema.String,
  }),
);

// An Exec argument in double quotes, then escaped again as a string value,
// as the Desktop Entry spec has it
const execArgument = (value: string): string =>
  `"${value.replaceAll(/["`$\\]/g, (character) => `\\${character}`)}"`.replaceAll(
    "\\",
    "\\\\",
  );

/** The entry an app with this name starts from at login. */
export const autostartEntry = (name: string, launcher: string): string =>
  [
    "[Desktop Entry]",
    "Type=Application",
    `Name=${name}`,
    `Exec=env ${hiddenVariable}=1 ${execArgument(launcher)}`,
    "Terminal=false",
    "X-GNOME-Autostart-enabled=true",
    "",
  ].join("\n");

/**
 * The app's start at login item, or `undefined` where there's none: off
 * Linux, or outside a built app. The entry is named for the app's identifier,
 * with the channel after it for builds other than stable.
 */
export const loginItem = async (): Promise<LoginItem | undefined> => {
  if (process.platform !== "linux") return undefined;
  const bin = dirname(process.execPath);

  const version = decodeVersion(
    await Bun.file(join(bin, "..", "Resources", "version.json"))
      .json()
      .catch(() => undefined),
  );

  if (Option.isNone(version)) return undefined;
  const { identifier, name, channel } = version.value;

  const folder = join(
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
    "autostart",
  );

  const path = join(
    folder,
    `${identifier}${channel === "stable" ? "" : `-${channel}`}.desktop`,
  );

  return {
    enabled: () => Bun.file(path).exists(),
    set: async (enabled) => {
      if (!enabled) {
        await rm(path, { force: true });

        return;
      }

      await mkdir(folder, { recursive: true });
      await Bun.write(path, autostartEntry(name, join(bin, "launcher")));
    },
  };
};
