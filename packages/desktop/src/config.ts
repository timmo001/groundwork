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
  };
};

/** Whether a URL may open in the system browser under this config. */
export const isExternal = (
  url: string,
  config: ResolvedDesktopConfig,
): boolean => {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();

  return (
    scheme === "http" ||
    scheme === "https" ||
    (scheme !== undefined && config.externalSchemes.includes(scheme))
  );
};
