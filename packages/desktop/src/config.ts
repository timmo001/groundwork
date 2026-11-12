/**
 * An app's `desktop.config`: every browser default a Groundwork desktop app
 * gets, each on unless the config turns it off, so an empty config gives all
 * of them. Shared by the main process and the view.
 */

/** The tray icon, its tooltip and the image it shows. */
export interface TrayConfig {
  /** An image path, or a `views://` URL to one bundled with the views. */
  readonly image?: string;
  /** Text beside the icon, where the system shows it. Empty by default. */
  readonly title?: string;
}

/**
 * The text the desktop defaults show, for an app in another language or
 * voice. Each defaults to the English below.
 */
export interface DesktopLabels {
  /** The in-app notices' region. Defaults to `Notifications`. */
  readonly notifications?: string;
  /** The find field's label. Defaults to `Find in page`. */
  readonly find?: string;
  /** The find field's placeholder. Defaults to `Find`. */
  readonly findPlaceholder?: string;
  /** Defaults to `Previous match`. */
  readonly previousMatch?: string;
  /** Defaults to `Next match`. */
  readonly nextMatch?: string;
  /** Defaults to `Close find`. */
  readonly closeFind?: string;
  /** Defaults to `Cut`. */
  readonly cut?: string;
  /** Defaults to `Copy`. */
  readonly copy?: string;
  /** Defaults to `Paste`. */
  readonly paste?: string;
  /** Defaults to `Select all`. */
  readonly selectAll?: string;
  /** Defaults to `Copy link`. */
  readonly copyLink?: string;
  /** Defaults to `Open link in browser`. */
  readonly openLink?: string;
  /** The tray's item that shows the window. Defaults to `Show <title>`. */
  readonly show?: string;
  /** The tray's quit item. Defaults to `Quit`. */
  readonly quit?: string;
  /** The tray's start at login item. Defaults to `Start at login`. */
  readonly startAtLogin?: string;
  /** The notice when a download finishes. Defaults to `Download finished`. */
  readonly downloadFinished?: string;
}

/** The labels with their defaults, `show` left to the window's title. */
export type ResolvedDesktopLabels = Required<Omit<DesktopLabels, "show">> &
  Pick<DesktopLabels, "show">;

/** What a desktop app turns on, all optional. */
export interface DesktopConfig {
  /** A tray icon that shows the window and quits. On by default. */
  readonly tray?: boolean | TrayConfig;
  /** System notifications instead of in-app ones. Off by default. */
  readonly notifications?: boolean;
  /** The page zoom on top of the system's scale, such as 0.8. Defaults to 1. */
  readonly zoom?: number;
  /** Ctrl + and - zoom, Ctrl+0 resets, remembered across launches. */
  readonly zoomKeys?: boolean;
  /** Cut, copy, paste, select all and link actions on right click. */
  readonly contextMenu?: boolean;
  /** Find in the page with Ctrl+F. */
  readonly find?: boolean;
  /** Reading and writing the clipboard from the view. */
  readonly clipboard?: boolean;
  /** F5 and Ctrl+R reload, Ctrl+Shift+R hard reloads. */
  readonly reload?: boolean;
  /** Back and forward with Alt+Left and Right and the mouse's side buttons. */
  readonly history?: boolean;
  /** Links to http(s) and `externalSchemes` open in the system browser. */
  readonly externalLinks?: boolean;
  /** Schemes besides http(s) that open outside the app. Defaults to `mailto`. */
  readonly externalSchemes?: readonly string[];
  /** A notice when a download finishes, with where it went. */
  readonly downloads?: boolean;
  /** Only one copy runs; opening another brings the first to the front. */
  readonly singleInstance?: boolean;
  /** The window opens at the size and place it closed at. */
  readonly windowState?: boolean;
  /** F12 and Ctrl+Shift+I open the dev tools, in dev builds only. */
  readonly devTools?: boolean;
  /** The system spell checker in text fields, where the webview has one. */
  readonly spellcheck?: boolean;
  /** Passes the app's deep links (`urlSchemes`) to the view. */
  readonly deepLinks?: boolean;
  /**
   * Passes the desktop's Omarchy theme to the view, and every switch, where
   * Omarchy is installed. `pageTheme` offers it and uses it until another
   * theme is picked.
   */
  readonly omarchyTheme?: boolean;
  /**
   * Origins the app's own pages come from besides its views, such as a server
   * it runs on this machine (`http://127.0.0.1:7380`). Their pages load in
   * the window, not the system browser. None by default.
   */
  readonly ownOrigins?: readonly string[];
  /**
   * Closing the window leaves the app running in the tray, and the tray's
   * show item opens it again. Needs the tray, and
   * `runtime.exitOnLastWindowClosed: false` in `electrobun.config.ts`. Off by
   * default.
   */
  readonly runInTray?: boolean;
  /**
   * A start at login item in the tray, which starts the app in the tray when
   * `runInTray` is on. Linux only for now, through an XDG autostart entry; the
   * item is left out elsewhere. Off by default.
   */
  readonly startAtLogin?: boolean;
  /** The text the defaults show. English by default. */
  readonly labels?: DesktopLabels;
}

/** Every option filled in. */
export interface ResolvedDesktopConfig {
  readonly tray: false | Required<TrayConfig>;
  readonly notifications: boolean;
  readonly zoom: number;
  readonly zoomKeys: boolean;
  readonly contextMenu: boolean;
  readonly find: boolean;
  readonly clipboard: boolean;
  readonly reload: boolean;
  readonly history: boolean;
  readonly externalLinks: boolean;
  readonly externalSchemes: readonly string[];
  readonly downloads: boolean;
  readonly singleInstance: boolean;
  readonly windowState: boolean;
  readonly devTools: boolean;
  readonly spellcheck: boolean;
  readonly deepLinks: boolean;
  readonly omarchyTheme: boolean;
  readonly ownOrigins: readonly string[];
  readonly runInTray: boolean;
  readonly startAtLogin: boolean;
  readonly labels: ResolvedDesktopLabels;
}

/** Types a config in the app's `desktop.config.ts`. */
export const defineDesktopConfig = (
  config: DesktopConfig = {},
): DesktopConfig => config;

/** Fills in the defaults. */
export const resolveConfig = (
  config: DesktopConfig = {},
): ResolvedDesktopConfig => {
  const tray = config.tray ?? true;
  const trayConfig: TrayConfig = tray === true || tray === false ? {} : tray;

  return {
    tray:
      tray === false
        ? false
        : {
            image: trayConfig.image ?? "views://tray/icon.png",
            title: trayConfig.title ?? "",
          },
    notifications: config.notifications ?? false,
    zoom: config.zoom ?? 1,
    zoomKeys: config.zoomKeys ?? true,
    contextMenu: config.contextMenu ?? true,
    find: config.find ?? true,
    clipboard: config.clipboard ?? true,
    reload: config.reload ?? true,
    history: config.history ?? true,
    externalLinks: config.externalLinks ?? true,
    externalSchemes: config.externalSchemes ?? ["mailto"],
    downloads: config.downloads ?? true,
    singleInstance: config.singleInstance ?? true,
    windowState: config.windowState ?? true,
    devTools: config.devTools ?? true,
    spellcheck: config.spellcheck ?? true,
    deepLinks: config.deepLinks ?? true,
    omarchyTheme: config.omarchyTheme ?? true,
    ownOrigins: config.ownOrigins ?? [],
    // Both live in the tray, so neither works without it
    runInTray: tray !== false && (config.runInTray ?? false),
    startAtLogin: tray !== false && (config.startAtLogin ?? false),
    labels: {
      notifications: "Notifications",
      find: "Find in page",
      findPlaceholder: "Find",
      previousMatch: "Previous match",
      nextMatch: "Next match",
      closeFind: "Close find",
      cut: "Cut",
      copy: "Copy",
      paste: "Paste",
      selectAll: "Select all",
      copyLink: "Copy link",
      openLink: "Open link in browser",
      quit: "Quit",
      startAtLogin: "Start at login",
      downloadFinished: "Download finished",
      ...config.labels,
    },
  };
};

/** The origin of a URL, such as `http://127.0.0.1:7380`, if it has one. */
const originOf = (url: string): string | undefined => {
  const origin = URL.parse(url)?.origin;

  return origin === undefined || origin === "null" ? undefined : origin;
};

/** Whether a URL is one of the app's own pages from `ownOrigins`. */
export const isOwnOrigin = (
  url: string,
  config: ResolvedDesktopConfig,
): boolean => {
  const origin = originOf(url);

  return (
    origin !== undefined &&
    config.ownOrigins.some((own) => originOf(own) === origin)
  );
};

/** Whether a URL may open in the system browser under this config. */
export const isExternal = (
  url: string,
  config: ResolvedDesktopConfig,
): boolean => {
  if (isOwnOrigin(url, config)) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();

  return (
    scheme === "http" ||
    scheme === "https" ||
    (scheme !== undefined && config.externalSchemes.includes(scheme))
  );
};
