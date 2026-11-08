/**
 * The view half of `@timmo001/groundwork-mobile`: connects the page to the
 * Android shell over the bridge the shell injects, and falls back to the
 * PWA floor's web APIs without one, so one app runs in both. Shares arrive
 * as `gw-share` and deep links as `gw-deep-link` either way.
 *
 *   import mobileConfig from "../mobile.config.ts";
 *   import pwaConfig from "../pwa.config.ts";
 *
 *   const mobile = await connectMobile(mobileConfig, {
 *     pwa: pwaConfig,
 *     onShare: (share) => openDraft(share),
 *     onAndroidTheme: (colors) => void page.setAndroidTheme(colors),
 *   });
 *
 *   // The app's own request, answered by its own Kotlin handler
 *   const battery = await mobile.call("battery", Schema.Number);
 */
import {
  connectPwa,
  pushState,
  subscribePush,
  unsubscribePush,
  type Pwa,
  type PwaConfig,
  type Share,
} from "@timmo001/groundwork-pwa/view";
import { Option, Schema } from "effect";

import {
  AndroidThemeMessage,
  bridgeObjectName,
  decodeIncomingText,
  DeepLink,
  mobileRequests,
  Notice,
  ShellShare,
  type BridgeMessage,
  type DiscoveredService,
  type DiscoveryMode,
  type LocalNetworkState,
  type ShellInfo,
  type ShellPushState,
} from "./bridge.ts";
import {
  resolveConfig,
  type MobileConfig,
  type ResolvedMobileConfig,
} from "./config.ts";

export * from "./bridge.ts";

export * from "./config.ts";

/** The object `WebViewCompat.addWebMessageListener` injects. */
export interface ShellObject {
  readonly postMessage: (text: string) => void;
  onmessage: ((event: { readonly data: string }) => void) | null;
}

declare global {
  var groundworkShell: ShellObject | undefined;
}

/** Where the app subscribes to a service's pushes, in the shell or as a PWA. */
export interface MobilePushOptions {
  readonly service: string;
  readonly client: {
    readonly id: string;
    readonly name: string;
    readonly platform: "web" | "android";
  };
  readonly headers?: Readonly<Record<string, string>>;
}

/** What `connectMobile` sets up. */
export interface ConnectMobileOptions {
  /** The PWA config, for the floor's service worker, install and share target. */
  readonly pwa?: PwaConfig;
  /** Called with each share, from the shell or the share target. */
  readonly onShare?: (share: Share) => void;
  /** Called with each deep link the shell opens the app with. */
  readonly onDeepLink?: (url: string) => void;
  /**
   * Called with the phone's dynamic color once connected and on every
   * change, or `null` where there's none. Pass it to `pageTheme`'s
   * `setAndroidTheme`.
   */
  readonly onAndroidTheme?: (colors: AndroidThemeMessage["colors"]) => void;
  /** Called with a notice the shell sends, or one that can't be a notification. */
  readonly onNotice?: (notice: Notice) => void;
  /**
   * Called with each message the app's own Kotlin sends, by name, with its
   * JSON data for the app to parse with its own schema.
   */
  readonly onMessage?: (name: string, data: Schema.Json) => void;
}

/** The page's connection, to the shell or the PWA floor. */
export interface Mobile {
  /** True inside the Android shell, false as a PWA or in a browser. */
  readonly shell: boolean;
  readonly config: ResolvedMobileConfig;
  /** What the shell reports, or `undefined` outside it. */
  readonly info: ShellInfo | undefined;
  /** The PWA connection, when the app runs without the shell. */
  readonly pwa: Pwa | undefined;
  /**
   * Calls one of the app's own Kotlin handlers and reads the reply with
   * `reply`. Rejects outside the shell, or when the handler fails.
   */
  readonly call: <S extends Schema.ConstraintDecoder<unknown>>(
    name: string,
    reply: S,
    params?: Schema.Json,
  ) => Promise<S["Type"]>;
  /** Opens a URL in the browser or the app that handles it. */
  readonly openExternal: (url: string) => Promise<void>;
  /** A system notification, or `onNotice` where there can't be one. */
  readonly notify: (notice: Notice) => Promise<void>;
  /** Subscribes to a service's pushes: UnifiedPush in the shell, Web Push outside. */
  readonly subscribePush: (
    options: MobilePushOptions,
  ) => Promise<ShellPushState>;
  readonly unsubscribePush: (options: MobilePushOptions) => Promise<void>;
  readonly pushState: () => Promise<ShellPushState>;
  /**
   * Asks for local network access where Android gates it. Always `granted`
   * outside the shell, where the browser decides.
   */
  readonly localNetwork: () => Promise<LocalNetworkState>;
  /**
   * Finds mDNS services of `type`, such as `_http._tcp`, for
   * `timeoutMs` (3 seconds by default) when it browses. Rejects outside the shell.
   */
  readonly discoverServices: (options: {
    readonly type: string;
    readonly mode?: DiscoveryMode;
    readonly timeoutMs?: number;
  }) => Promise<readonly DiscoveredService[]>;
  /**
   * Scans a QR code with the shell's scanner, which needs no Google Play
   * services: its text, or `undefined` when the person cancels. Rejects
   * outside the shell, where `scanPairingLink` scans in the page.
   */
  readonly scanQr: (options?: {
    readonly hint?: string;
  }) => Promise<string | undefined>;
}

interface Waiting {
  readonly resolve: (value: Schema.Json) => void;
  readonly reject: (error: Error) => void;
}

/** The `discoverServices` request's params; a type so it stays JSON. */
type DiscoveryParams = {
  type: string;
  mode?: DiscoveryMode;
  timeoutMs?: number;
};

/** The `scanQr` request's params. */
type ScanParams = { hint?: string };

const read = <S extends Schema.ConstraintDecoder<unknown>>(
  schema: S,
  value: Schema.Json,
): S["Type"] | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(schema)(value));

const noticeJson = Schema.encodeSync(Schema.toCodecJson(Notice));

const pushParams = ({ service, client, headers = {} }: MobilePushOptions) => ({
  service,
  client: { id: client.id, name: client.name, platform: client.platform },
  headers: { ...headers },
});

const dispatchShare = (share: Share) =>
  window.dispatchEvent(new CustomEvent("gw-share", { detail: share }));

const dispatchDeepLink = (link: DeepLink) =>
  window.dispatchEvent(new CustomEvent("gw-deep-link", { detail: link }));

/** The PWA floor, for a page outside the shell. */
const connectFloor = (
  config: ResolvedMobileConfig,
  options: ConnectMobileOptions,
): Mobile => {
  const pwa =
    options.pwa === undefined
      ? undefined
      : connectPwa(options.pwa, {
          onShare: (share) => options.onShare?.(share),
        });

  const registration = async () => pwa?.worker;

  return {
    shell: false,
    config,
    info: undefined,
    pwa,
    call: async () => {
      throw new Error(`There's no ${bridgeObjectName} outside the shell`);
    },
    openExternal: async (url) => {
      window.open(url, "_blank", "noopener");
    },
    notify: async (notice) => {
      const worker = await registration();

      if (
        !config.notifications ||
        worker === undefined ||
        Notification.permission !== "granted"
      ) {
        options.onNotice?.(notice);

        return;
      }

      const shown: NotificationOptions = { data: { link: notice.link } };

      if (notice.body !== undefined) shown.body = notice.body;

      if (notice.tag !== undefined) shown.tag = notice.tag;

      await worker.showNotification(notice.heading, shown);
    },
    subscribePush: async (push) => subscribePush(await registration(), push),
    unsubscribePush: async (push) =>
      unsubscribePush(await registration(), push),
    pushState: async () => pushState(await registration()),
    localNetwork: async () => "granted",
    discoverServices: async () => {
      throw new Error("Service discovery needs the Android shell");
    },
    scanQr: async () => {
      throw new Error("The QR scanner needs the Android shell");
    },
  };
};

/**
 * Connects to the shell when the page runs in it, or sets up the PWA floor
 * with `options.pwa` when it doesn't.
 */
export const connectMobile = async (
  mobileConfig: MobileConfig = {},
  options: ConnectMobileOptions = {},
): Promise<Mobile> => {
  const config = resolveConfig(mobileConfig);
  const shell = globalThis.groundworkShell;

  if (shell === undefined) return connectFloor(config, options);

  const pending = new Map<number, Waiting>();
  let next = 0;

  const send = (name: string, params?: Schema.Json) =>
    new Promise<Schema.Json>((resolve, reject) => {
      next += 1;
      pending.set(next, { resolve, reject });
      shell.postMessage(
        JSON.stringify({ type: "request", id: next, name, params }),
      );
    });

  const call = async <S extends Schema.ConstraintDecoder<unknown>>(
    name: string,
    reply: S,
    params?: Schema.Json,
  ): Promise<S["Type"]> =>
    Schema.decodeUnknownPromise(reply)(await send(name, params));

  const onMessage = ({ name, data = null }: BridgeMessage) => {
    switch (name) {
      case "notice": {
        const notice = read(Notice, data);

        if (notice !== undefined) options.onNotice?.(notice);

        return;
      }

      case "deepLink": {
        const link = read(DeepLink, data);

        if (link === undefined) return;

        options.onDeepLink?.(link.url);
        dispatchDeepLink(link);

        return;
      }

      case "share": {
        const share = read(ShellShare, data);

        if (share === undefined) return;

        options.onShare?.(share);
        dispatchShare(share);

        return;
      }

      case "androidTheme": {
        const theme = read(AndroidThemeMessage, data);

        if (theme !== undefined) options.onAndroidTheme?.(theme.colors);

        return;
      }

      default:
        options.onMessage?.(name, data);
    }
  };

  shell.onmessage = ({ data }) => {
    const incoming = decodeIncomingText(data);

    if (incoming === undefined) return;

    if (incoming.type === "message") {
      onMessage(incoming);

      return;
    }

    const waiting = pending.get(incoming.id);

    pending.delete(incoming.id);

    if (incoming.ok) waiting?.resolve(incoming.value ?? null);
    else
      waiting?.reject(
        new Error(incoming.error ?? "The shell refused the request"),
      );
  };

  const info = await call("info", mobileRequests.info);

  if (config.androidTheme && options.onAndroidTheme !== undefined) {
    const { onAndroidTheme } = options;

    void call("androidTheme", mobileRequests.androidTheme).then(({ colors }) =>
      onAndroidTheme(colors),
    );
  }

  return {
    shell: true,
    config,
    info,
    pwa: undefined,
    call,
    openExternal: async (url) => {
      await call("openExternal", mobileRequests.openExternal, { url });
    },
    notify: async (notice) => {
      const shown =
        config.notifications &&
        (await call("notify", mobileRequests.notify, noticeJson(notice)));

      if (!shown) options.onNotice?.(notice);
    },
    subscribePush: (push) =>
      call("subscribePush", mobileRequests.subscribePush, pushParams(push)),
    unsubscribePush: async (push) => {
      await call(
        "unsubscribePush",
        mobileRequests.unsubscribePush,
        pushParams(push),
      );
    },
    pushState: () => call("pushState", mobileRequests.pushState),
    localNetwork: () => call("localNetwork", mobileRequests.localNetwork),
    discoverServices: ({ type, mode, timeoutMs }) => {
      const params: DiscoveryParams = { type };

      if (mode !== undefined) params["mode"] = mode;

      if (timeoutMs !== undefined) params["timeoutMs"] = timeoutMs;

      return call("discoverServices", mobileRequests.discoverServices, params);
    },
    scanQr: async ({ hint } = {}) => {
      const params: ScanParams = {};

      if (hint !== undefined) params["hint"] = hint;

      return (await call("scanQr", mobileRequests.scanQr, params)) ?? undefined;
    },
  };
};
