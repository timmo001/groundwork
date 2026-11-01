/**
 * The main process half of `@timmo001/groundwork-desktop`: opens an app's
 * window with the browser defaults its `desktop.config` leaves on, such as
 * the tray, remembered size and zoom, one instance only, external links in
 * the system browser and the requests the view part makes.
 *
 * It takes the app's own Electrobun, so the app keeps its pinned release:
 *
 *   import Electrobun, { BrowserView } from "electrobun/main";
 *   await openDesktopWindow(Electrobun, { title, url, frame, config, createRPC });
 */
import { join } from "node:path";

import {
  readOmarchyTheme,
  watchOmarchyTheme,
} from "@timmo001/groundwork-tokens/omarchy-current";

import {
  isExternal,
  resolveConfig,
  type DesktopConfig,
  type ResolvedDesktopConfig,
} from "./config.ts";
import type { DesktopRequests, Notice, OmarchyThemeMessage } from "./rpc.ts";

export * from "./config.ts";

export type * from "./rpc.ts";

interface Frame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A webview event: the URL, or for links and downloads what the webview sent. */
interface WebviewEvent {
  readonly data: {
    readonly detail: string | { readonly url?: string; readonly path?: string };
  };
}

interface MainView {
  readonly id: number;
  setPageZoom(zoom: number): void;
  findInPage(text: string, options?: { forward?: boolean }): void;
  stopFindInPage(): void;
  toggleDevTools(): void;
  setNavigationRules(rules: string[]): void;
}

interface MainWindow {
  readonly webview: MainView;
  on(name: "resize" | "move", handler: () => void): void;
  getFrame(): Frame;
  show(): void;
  focus(): void;
  unminimize(): void;
}

interface MainRPC {
  readonly send: {
    notice(notice: Notice): void;
    deepLink(link: { url: string }): void;
    omarchyTheme(message: OmarchyThemeMessage): void;
  };
}

interface MainTray {
  readonly id: number;
  setMenu(
    menu: Array<
      { type: "divider" } | { type: "normal"; label: string; action: string }
    >,
  ): void;
}

/** The parts of Electrobun's main process this uses, with the app's RPC type. */
export interface ElectrobunMain<RPC extends MainRPC> {
  readonly BrowserWindow: new (options: {
    title: string;
    url: string;
    frame: { x?: number; y?: number; width: number; height: number };
    rpc: RPC;
    spellCheck: boolean;
  }) => MainWindow;
  readonly Tray: new (options: {
    title?: string;
    image?: string;
    template?: boolean;
    width?: number;
    height?: number;
  }) => MainTray;
  readonly Utils: {
    openExternal(url: string): boolean;
    clipboardReadText(): string | null;
    clipboardWriteText(text: string): void;
    showNotification(options: { title: string; body?: string }): void;
    quit(code?: number): boolean;
    readonly paths: { readonly userData: string };
  };
  readonly BuildConfig: { getSync(): { channel: string } };
  readonly events: {
    on(
      name: "open-url",
      handler: (event: { readonly data: { readonly url: string } }) => void,
    ): void;
    /** Webview events, per webview id; Electrobun's typed `webview.on` passes `unknown`. */
    on(
      name: `${"dom-ready" | "will-navigate" | "download-completed" | "new-window-open"}-${number}`,
      handler: (event: WebviewEvent) => void,
    ): void;
    /** Tray clicks, per tray id. */
    on(
      name: `tray-clicked-${number}`,
      handler: (event: { readonly data: { readonly action: string } }) => void,
    ): void;
  };
}

/** What `openDesktopWindow` opens. */
export interface DesktopWindowOptions<RPC extends MainRPC> {
  readonly title: string;
  /** The view, such as `views://mainview/index.html`. */
  readonly url: string;
  /** The first size and place, before one is remembered. */
  readonly frame: {
    readonly width: number;
    readonly height: number;
    readonly x?: number;
    readonly y?: number;
  };
  readonly config?: DesktopConfig;
  /**
   * Defines the window's RPC from the desktop requests, beside the app's own:
   *
   *   (requests: DesktopRequests) => BrowserView.defineRPC<DesktopSchema<AppRequests>>({
   *     handlers: { requests: { ...requests, ...appRequests } },
   *   })
   *
   * Type `requests` as here, so the window takes the RPC's own type.
   */
  readonly createRPC: (requests: DesktopRequests) => RPC;
}

/** The open window, and a way to show a notice in it. */
export interface DesktopWindow<RPC extends MainRPC> {
  readonly window: MainWindow;
  readonly rpc: RPC;
  readonly config: ResolvedDesktopConfig;
  /** A system notification when the config turns them on, otherwise in the app. */
  readonly notify: (notice: Notice) => void;
}

interface SavedState {
  frame?: Frame;
  zoom?: number;
}

/** The state file as written, before it's checked. */
interface SavedFile {
  readonly frame?: Partial<Frame>;
  readonly zoom?: number;
}

const zoomSteps = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

const detailUrl = ({ data }: WebviewEvent): string | undefined =>
  data.detail instanceof Object ? data.detail.url : data.detail;

// GTK 3 only takes whole numbers in GDK_SCALE and drops the fraction, so on
// Linux the page zoom makes up the rest: 1.6 renders at 1 and zooms by 1.6
const toolkitZoom = (): number => {
  const scale = Number(process.env.GDK_SCALE);

  return process.platform === "linux" && scale > 0
    ? scale / Math.max(1, Math.floor(scale))
    : 1;
};

// Electrobun runs GTK on X11, where nothing hands GTK the system's color
// scheme, so WebKitGTK reports light to `prefers-color-scheme`. WebKitGTK also
// takes a `:dark` GTK_THEME as dark, so set one from the desktop portal's
// scheme, unless the user set GTK_THEME themselves. It goes through libc's
// setenv, since Bun's `process.env` doesn't reach the native side
const followSystemScheme = async () => {
  if (process.platform !== "linux" || process.env.GTK_THEME !== undefined)
    return;

  try {
    const result = Bun.spawnSync([
      "gdbus",
      "call",
      "--session",
      "--dest=org.freedesktop.portal.Desktop",
      "--object-path=/org/freedesktop/portal/desktop",
      "--method=org.freedesktop.portal.Settings.ReadOne",
      "org.freedesktop.appearance",
      "color-scheme",
    ]);

    // 1 is prefer dark; 0 (no preference) and 2 (prefer light) stay light
    if (!(result.success && /\buint32 1\b/.test(result.stdout.toString())))
      return;

    const { dlopen, FFIType } = await import("bun:ffi");

    const { symbols } = dlopen("libc.so.6", {
      setenv: {
        args: [FFIType.cstring, FFIType.cstring, FFIType.i32],
        returns: FFIType.i32,
      },
    });

    symbols.setenv(
      Buffer.from("GTK_THEME\0"),
      Buffer.from("Adwaita:dark\0"),
      0,
    );
  } catch {
    // No gdbus or no portal: the webview keeps GTK's own scheme
  }
};

const toFrame = (frame: Partial<Frame> = {}): Frame | undefined => {
  const { x, y, width, height } = frame;

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  )
    return undefined;

  return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
    ? { x, y, width, height }
    : undefined;
};

const readState = async (path: string): Promise<SavedState> => {
  const state: SavedState = {};

  try {
    const saved: SavedFile = await Bun.file(path).json();
    const frame = toFrame(saved.frame);

    if (frame !== undefined) state.frame = frame;

    if (saved.zoom !== undefined && zoomSteps.includes(saved.zoom))
      state.zoom = saved.zoom;
  } catch {
    // No state yet, or a broken file: the app opens as if new
  }

  return state;
};

// The first copy listens on a socket in the app's data folder. A second one
// finds it there, asks it to come to the front and quits.
const claimInstance = async (
  socket: string,
  onShow: () => void,
): Promise<boolean> => {
  try {
    const other = await Bun.connect({ unix: socket, socket: { data() {} } });

    other.write("show");
    other.end();

    return false;
  } catch {
    await Bun.file(socket)
      .delete()
      .catch(() => undefined);
  }

  try {
    Bun.listen({ unix: socket, socket: { data: onShow } });
  } catch {
    // Without a socket each copy runs on its own
  }

  return true;
};

/** Opens the app's window with the defaults its config leaves on. */
export const openDesktopWindow = async <RPC extends MainRPC>(
  electrobun: ElectrobunMain<NoInfer<RPC>>,
  options: DesktopWindowOptions<RPC>,
): Promise<DesktopWindow<RPC>> => {
  const { Utils } = electrobun;
  const config = resolveConfig(options.config);
  const dev = electrobun.BuildConfig.getSync().channel === "dev";
  const statePath = join(Utils.paths.userData, "desktop-state.json");

  const state =
    config.windowState || config.zoomKeys ? await readState(statePath) : {};

  let window: MainWindow | undefined;

  const bringForward = () => {
    window?.unminimize();
    window?.show();
    window?.focus();
  };

  if (
    config.singleInstance &&
    !(await claimInstance(
      join(Utils.paths.userData, "instance.sock"),
      bringForward,
    ))
  ) {
    Utils.quit(0);

    return new Promise(() => {});
  }

  const baseZoom =
    toolkitZoom() *
    (Number(process.env.GROUNDWORK_DESKTOP_ZOOM) || 1) *
    config.zoom;

  let zoom = config.zoomKeys ? (state.zoom ?? 1) : 1;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const next: SavedState = {};

      if (config.windowState && window !== undefined)
        next.frame = window.getFrame();

      if (config.zoomKeys) next.zoom = zoom;
      void Bun.write(statePath, JSON.stringify(next));
    }, 500);
  };

  const desktopRequests: DesktopRequests = {
    config: () => ({ config, dev }),
    openExternal: ({ url }) =>
      config.externalLinks &&
      isExternal(url, config) &&
      Utils.openExternal(url),
    clipboardRead: () =>
      config.clipboard ? (Utils.clipboardReadText() ?? "") : "",
    clipboardWrite: ({ text }) => {
      if (!config.clipboard) return false;
      Utils.clipboardWriteText(text);

      return true;
    },
    find: ({ text, forward }) => {
      if (!config.find) return false;
      window?.webview.findInPage(text, { forward });

      return true;
    },
    stopFind: () => {
      window?.webview.stopFindInPage();

      return true;
    },
    zoom: ({ step }) => {
      if (!config.zoomKeys) return zoom;
      const index = zoomSteps.indexOf(zoom);

      const next = Math.min(
        zoomSteps.length - 1,
        Math.max(0, index + (step === "in" ? 1 : -1)),
      );

      zoom = step === "reset" ? 1 : (zoomSteps[next] ?? 1);
      window?.webview.setPageZoom(baseZoom * zoom);
      save();

      return zoom;
    },
    devTools: () => {
      if (!(config.devTools && dev)) return false;
      window?.webview.toggleDevTools();

      return true;
    },
    notify: ({ heading, body }) => {
      if (!config.notifications) return false;
      Utils.showNotification(
        body === undefined ? { title: heading } : { title: heading, body },
      );

      return true;
    },
    omarchyTheme: async () => ({
      theme: config.omarchyTheme ? await readOmarchyTheme() : null,
    }),
  };

  const rpc = options.createRPC(desktopRequests);

  await followSystemScheme();
  window = new electrobun.BrowserWindow({
    title: options.title,
    url: options.url,
    frame: (config.windowState ? state.frame : undefined) ?? options.frame,
    rpc,
    spellCheck: config.spellcheck,
  });

  const opened = window;
  const applyZoom = () => opened.webview.setPageZoom(baseZoom * zoom);

  const id = opened.webview.id;

  applyZoom();
  electrobun.events.on(`dom-ready-${id}`, applyZoom);

  if (config.windowState) {
    opened.on("resize", save);
    opened.on("move", save);
  }

  if (config.externalLinks) {
    const openOutside = (event: WebviewEvent) => {
      const url = detailUrl(event);

      if (url !== undefined && isExternal(url, config)) Utils.openExternal(url);
    };

    // Only the app's own views load in the window; links out go to the browser
    opened.webview.setNavigationRules(["^*", "views://*"]);
    electrobun.events.on(`will-navigate-${id}`, openOutside);
    electrobun.events.on(`new-window-open-${id}`, openOutside);
  }

  const notify = (notice: Notice) => {
    if (!desktopRequests.notify(notice)) rpc.send.notice(notice);
  };

  if (config.downloads) {
    electrobun.events.on(`download-completed-${id}`, ({ data }) => {
      const path =
        data.detail instanceof Object ? data.detail.path : data.detail;

      notify(
        path === undefined || path === ""
          ? { heading: "Download finished", tone: "success" }
          : { heading: "Download finished", body: path, tone: "success" },
      );
    });
  }

  if (config.deepLinks) {
    electrobun.events.on("open-url", ({ data }) => {
      bringForward();
      rpc.send.deepLink({ url: data.url });
    });
  }

  if (config.omarchyTheme) {
    watchOmarchyTheme((theme) => rpc.send.omarchyTheme({ theme }));
  }

  if (config.tray !== false) {
    const tray = new electrobun.Tray({
      title: config.tray.title,
      image: config.tray.image,
      template: false,
      width: 22,
      height: 22,
    });

    tray.setMenu([
      { type: "normal", label: `Show ${options.title}`, action: "show" },
      { type: "divider" },
      { type: "normal", label: "Quit", action: "quit" },
    ]);
    electrobun.events.on(`tray-clicked-${tray.id}`, ({ data }) => {
      if (data.action === "quit") Utils.quit(0);
      else bringForward();
    });
  }

  return { window: opened, rpc, config, notify };
};
