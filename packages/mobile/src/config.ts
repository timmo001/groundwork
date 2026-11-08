/**
 * An app's `mobile.config`: every default the Android shell gives a
 * Groundwork app, each on unless the config turns it off, so an empty config
 * gives all of them. Shared by the view and, as JSON, the Kotlin shell.
 */

/** The text the shell's defaults show, for an app in another language. */
export interface MobileLabels {
  /** The notification channel for the app's notices. Defaults to `Notifications`. */
  readonly notifications?: string;
  /** The channel for ongoing work. Defaults to `Ongoing`. */
  readonly ongoing?: string;
  /** Defaults to `Download finished`. */
  readonly downloadFinished?: string;
}

export type ResolvedMobileLabels = Required<MobileLabels>;

export interface MobileConfig {
  /**
   * A hosted page to open instead of the bundled build, such as a service's
   * own web UI, for an app that's a remote for a service elsewhere. Its
   * origin may use the bridge. Without it the shell opens the bundled build.
   */
  readonly url?: string;
  /**
   * Origins besides the app's own whose pages may use the bridge, such as a
   * paired service. The bundled app's origin is always allowed.
   */
  readonly origins?: readonly string[];
  /** Shares from other apps, delivered as a `gw-share` event. */
  readonly shares?: boolean;
  /** System notifications from the view and from pushes. */
  readonly notifications?: boolean;
  /** Pushes through UnifiedPush, with the embedded FCM distributor as the fallback. */
  readonly push?: boolean;
  /** Passes the app's deep links and App Links to the view. */
  readonly deepLinks?: boolean;
  /** Links outside the allowed origins open in the browser. */
  readonly externalLinks?: boolean;
  /** Schemes besides http(s) that open outside the app. Defaults to `mailto` and `tel`. */
  readonly externalSchemes?: readonly string[];
  /** Back steps through the page's history before leaving the app. */
  readonly back?: boolean;
  /** Downloads go to the system's Downloads, with a notice when they finish. */
  readonly downloads?: boolean;
  /** The camera and microphone, when the page asks and the person allows it. */
  readonly media?: boolean;
  /** The file chooser for `<input type="file">`. */
  readonly files?: boolean;
  /**
   * Passes the phone's dynamic color to the view, and every change.
   * `pageTheme` offers it and uses it once it's picked.
   */
  readonly androidTheme?: boolean;
  /** The WebView's dev tools through Chrome, in debug builds only. */
  readonly devTools?: boolean;
  /** The text the defaults show. English by default. */
  readonly labels?: MobileLabels;
}

/** Every option filled in. */
export interface ResolvedMobileConfig {
  readonly url: string | null;
  readonly origins: readonly string[];
  readonly shares: boolean;
  readonly notifications: boolean;
  readonly push: boolean;
  readonly deepLinks: boolean;
  readonly externalLinks: boolean;
  readonly externalSchemes: readonly string[];
  readonly back: boolean;
  readonly downloads: boolean;
  readonly media: boolean;
  readonly files: boolean;
  readonly androidTheme: boolean;
  readonly devTools: boolean;
  readonly labels: ResolvedMobileLabels;
}

/** Types a config in the app's `mobile.config.ts`. */
export const defineMobileConfig = (config: MobileConfig = {}): MobileConfig =>
  config;

/** Fills in the defaults. */
export const resolveConfig = (
  config: MobileConfig = {},
): ResolvedMobileConfig => ({
  url: config.url ?? null,
  origins: config.origins ?? [],
  shares: config.shares ?? true,
  notifications: config.notifications ?? true,
  push: config.push ?? true,
  deepLinks: config.deepLinks ?? true,
  externalLinks: config.externalLinks ?? true,
  externalSchemes: config.externalSchemes ?? ["mailto", "tel"],
  back: config.back ?? true,
  downloads: config.downloads ?? true,
  media: config.media ?? true,
  files: config.files ?? true,
  androidTheme: config.androidTheme ?? true,
  devTools: config.devTools ?? true,
  labels: {
    notifications: "Notifications",
    ongoing: "Ongoing",
    downloadFinished: "Download finished",
    ...config.labels,
  },
});
