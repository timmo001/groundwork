/**
 * An app's `pwa.config`: what makes a Groundwork web app installable and
 * usable as one on a phone, each piece on unless the config turns it off.
 * Shared by the build, which writes the manifest, and the page.
 */

/** One of the manifest's icons. */
export interface PwaIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type?: string;
  readonly purpose?: "any" | "maskable" | "monochrome";
}

/** A shortcut in the launcher's long-press menu. */
export interface PwaShortcut {
  readonly name: string;
  readonly url: string;
  readonly shortName?: string;
  readonly description?: string;
  readonly icons?: readonly PwaIcon[];
}

/** Where shares arrive. */
export interface ShareTargetConfig {
  /** The page shares open, in the app's scope. Defaults to `startUrl`. */
  readonly action?: string;
}

/** The service worker that keeps the app shell for offline starts. */
export interface OfflineConfig {
  /** The worker's script, in the app's scope. Defaults to `sw.js`. */
  readonly worker?: string;
  /** Pages and files cached when the worker installs. Defaults to `startUrl`. */
  readonly shell?: readonly string[];
}

/** The modes a manifest's colors can come from. */
export type PwaMode = "light" | "dark" | "darker";

/** A value a manifest member can hold. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** What a web app turns on. Only the name is needed. */
export interface PwaConfig {
  readonly name: string;
  /** The name under the launcher icon. Defaults to `name`. */
  readonly shortName?: string;
  readonly description?: string;
  /** The Groundwork theme the colors come from. Defaults to `base`. */
  readonly theme?: string;
  /**
   * The mode the manifest's colors come from, for the splash screen and task
   * switcher, which take one color. The page's own `theme-color` follows the
   * system's mode. Defaults to `light`.
   */
  readonly mode?: PwaMode;
  /** The browser's bar color. Defaults to the theme's `surface-default`. */
  readonly themeColor?: string;
  /** The splash screen's color. Defaults to the theme's `surface-default`. */
  readonly backgroundColor?: string;
  /** The app's identity across installs. Defaults to `startUrl`. */
  readonly id?: string;
  /** Defaults to `./`, the page the manifest sits beside. */
  readonly startUrl?: string;
  /** Defaults to `./`. */
  readonly scope?: string;
  /** Defaults to `standalone`. */
  readonly display?: "standalone" | "minimal-ui" | "fullscreen" | "browser";
  /** Defaults to `icons/icon-192.png`, `icon-512.png` and `maskable-512.png`. */
  readonly icons?: readonly PwaIcon[];
  readonly shortcuts?: readonly PwaShortcut[];
  /** `<meta name="color-scheme" content="dark light">` and `theme-color` per mode. */
  readonly colorScheme?: boolean;
  /** Holds the browser's install prompt for the app to offer when it chooses. */
  readonly install?: boolean;
  /** Takes shares from other apps, delivered as a `gw-share` event. */
  readonly shareTarget?: boolean | ShareTargetConfig;
  /** A service worker that caches the app shell for offline starts. */
  readonly offline?: boolean | OfflineConfig;
  /**
   * Manifest members to add or replace, written over the generated ones, such
   * as `orientation`, `categories` or `screenshots`.
   */
  readonly manifest?: { readonly [key: string]: JsonValue };
  /**
   * Fetches the manifest with the page's cookies, as
   * `crossorigin="use-credentials"`, for an app behind a sign-in such as
   * Cloudflare Access that would otherwise refuse it.
   */
  readonly manifestCredentials?: boolean;
}

/** Every option filled in. */
export interface ResolvedPwaConfig {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly theme: string;
  readonly mode: PwaMode;
  readonly id: string;
  readonly startUrl: string;
  readonly scope: string;
  readonly display: NonNullable<PwaConfig["display"]>;
  readonly icons: readonly PwaIcon[];
  readonly shortcuts: readonly PwaShortcut[];
  readonly colorScheme: boolean;
  readonly install: boolean;
  readonly shareTarget: false | Required<ShareTargetConfig>;
  readonly offline: false | Required<OfflineConfig>;
  readonly themeColor: string | undefined;
  readonly backgroundColor: string | undefined;
  readonly manifest: { readonly [key: string]: JsonValue };
  readonly manifestCredentials: boolean;
}

/** A share from another app, from the share target or the Android shell. */
export interface Share {
  readonly title?: string;
  readonly text?: string;
  readonly url?: string;
}

/** The query parameters the share target sends, kept apart from the app's own. */
export const shareParams = {
  title: "share-title",
  text: "share-text",
  url: "share-url",
} as const satisfies Record<keyof Share, string>;

/** Types a config in the app's `pwa.config.ts`. */
export const definePwaConfig = (config: PwaConfig): PwaConfig => config;

/** Fills in the defaults. */
export const resolveConfig = (config: PwaConfig): ResolvedPwaConfig => {
  const startUrl = config.startUrl ?? "./";
  const share = config.shareTarget ?? true;
  const offline = config.offline ?? true;

  return {
    name: config.name,
    shortName: config.shortName ?? config.name,
    description: config.description ?? "",
    theme: config.theme ?? "base",
    mode: config.mode ?? "light",
    id: config.id ?? startUrl,
    startUrl,
    scope: config.scope ?? "./",
    display: config.display ?? "standalone",
    icons: config.icons ?? [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: config.shortcuts ?? [],
    colorScheme: config.colorScheme ?? true,
    install: config.install ?? true,
    shareTarget:
      share === false
        ? false
        : { action: (share === true ? undefined : share.action) ?? startUrl },
    offline:
      offline === false
        ? false
        : {
            worker: (offline === true ? undefined : offline.worker) ?? "sw.js",
            shell: (offline === true ? undefined : offline.shell) ?? [startUrl],
          },
    themeColor: config.themeColor,
    backgroundColor: config.backgroundColor,
    manifest: config.manifest ?? {},
    manifestCredentials: config.manifestCredentials ?? false,
  };
};

/**
 * A share as one block of text: its title, text and link, one to a line.
 * Android apps often put the link in the text too, so a line another
 * already holds isn't repeated.
 */
export const shareText = ({ title, text, url }: Share): string => {
  const lines = [title, text, url].flatMap((line) =>
    line === undefined || line.trim() === "" ? [] : [line.trim()],
  );

  return lines
    .filter(
      (line, at) =>
        !lines.some(
          (other, otherAt) =>
            other.includes(line) && (other !== line || otherAt < at),
        ),
    )
    .join("\n");
};

/**
 * Whether a built file's name carries a content hash, as Bun and Vite name
 * them, such as `index-r20khhep.js`. Such a file never changes, so it can be
 * cached for good and kept for offline starts.
 */
export const isHashed = (name: string) => {
  const hash = /-([\w-]{8})\.\w+$/.exec(name)?.[1];

  // A word such as `settings` fits too, so a hash needs a digit, a capital,
  // a dash or an underscore. One that misses only gets rechecked
  return hash !== undefined && /[^a-z]/.test(hash);
};
