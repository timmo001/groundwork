/**
 * The page half of `@timmo001/groundwork-pwa`: registers the service worker,
 * holds the browser's install prompt for the app to offer, and hands shares
 * from the share target to the app as a `gw-share` event, the same event the
 * Android shell sends for a received share.
 *
 *   import config from "../pwa.config.ts";
 *
 *   const pwa = connectPwa(config, { onShare: (share) => openDraft(share) });
 *
 *   if (pwa.canInstall()) showInstallButton(() => pwa.install());
 */
import { Option, Schema } from "effect";

import {
  resolveConfig,
  shareParams,
  type PwaConfig,
  type ResolvedPwaConfig,
  type Share,
} from "./config.ts";
import {
  pushRoutes,
  VapidKey,
  type PushClient,
  type PushSubscription as ContractSubscription,
} from "./push.ts";

export * from "./config.ts";

/** Where the app subscribes to a service's pushes. */
export interface PushServiceOptions {
  /** The service's base URL, which serves the push contract's routes. */
  readonly service: string;
  /** This install, the same client the pairing sent. */
  readonly client: PushClient;
  /** Sent with each request, such as the pairing's `Authorization`. */
  readonly headers?: Record<string, string>;
}

/** Where push stands: off in this browser, not asked, refused, or on. */
export type PushState = "unsupported" | "default" | "denied" | "subscribed";

const decodeVapidKey = Schema.decodeUnknownOption(VapidKey);

/** Whether this browser can push and whether the app is subscribed. */
export const pushState = async (
  registration: ServiceWorkerRegistration | undefined,
): Promise<PushState> => {
  if (registration === undefined || !("PushManager" in window))
    return "unsupported";

  if (Notification.permission === "denied") return "denied";

  const existing = await registration.pushManager.getSubscription();

  return existing === null ? "default" : "subscribed";
};

/**
 * Asks for notifications, subscribes with the service's VAPID key and posts
 * the subscription. Only a tap or click may ask, so call it from one, as the
 * install offer is. Returns the state it ends in.
 */
export const subscribePush = async (
  registration: ServiceWorkerRegistration | undefined,
  { service, client, headers = {} }: PushServiceOptions,
): Promise<PushState> => {
  if (registration === undefined || !("PushManager" in window))
    return "unsupported";

  const permission = await Notification.requestPermission();

  // Dismissing the prompt leaves it at "default", to ask again later
  if (permission !== "granted")
    return permission === "denied" ? "denied" : "default";

  const key = await fetch(new URL(pushRoutes.vapidKey, service), { headers })
    .then((response) => response.json())
    .then((body) => Option.getOrUndefined(decodeVapidKey(body)));

  if (key === undefined) return "default";

  // One made with another key, such as the service's last, can't be reused
  await (await registration.pushManager.getSubscription())?.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key.publicKey,
  });

  const { endpoint, keys } = subscription.toJSON();
  const p256dh = keys?.["p256dh"];
  const auth = keys?.["auth"];

  if (endpoint === undefined || p256dh === undefined || auth === undefined)
    return "default";

  const body: ContractSubscription = {
    endpoint,
    keys: { p256dh, auth },
    client,
  };

  const response = await fetch(new URL(pushRoutes.subscriptions, service), {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.ok ? "subscribed" : "default";
};

/** Stops the app's pushes, here and at the service. */
export const unsubscribePush = async (
  registration: ServiceWorkerRegistration | undefined,
  { service, headers = {} }: PushServiceOptions,
): Promise<void> => {
  const subscription = await registration?.pushManager.getSubscription();

  if (subscription === null || subscription === undefined) return;

  await fetch(new URL(pushRoutes.subscriptions, service), {
    method: "DELETE",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
};

/** Chromium's `beforeinstallprompt` event, which other engines don't send. */
interface InstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
}

const isInstallPrompt = (event: Event): event is InstallPromptEvent =>
  "prompt" in event && "userChoice" in event;

/** What `connectPwa` sets up. */
export interface ConnectPwaOptions {
  /** Called with each share, from the share target or the Android shell. */
  readonly onShare?: (share: Share) => void;
  /** Called when the app can offer to install itself, and again when it can't. */
  readonly onInstallChange?: (canInstall: boolean) => void;
}

/** The answer to an install offer. */
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/** The page's PWA connection. */
export interface Pwa {
  readonly config: ResolvedPwaConfig;
  /** True when the app runs installed, in its own window. */
  readonly installed: () => boolean;
  /** True while the browser has an install prompt to show. */
  readonly canInstall: () => boolean;
  /** Shows the browser's install prompt, which only a tap or click may do. */
  readonly install: () => Promise<InstallOutcome>;
  /** The service worker's registration, once it's registered. */
  readonly worker: Promise<ServiceWorkerRegistration | undefined>;
}

/** Reads a share from the page's address and takes its parameters off it. */
const takeShare = (): Share | undefined => {
  const url = new URL(location.href);

  const share = Object.fromEntries(
    Object.entries(shareParams).flatMap(([key, param]) => {
      const value = url.searchParams.get(param);

      url.searchParams.delete(param);

      return value === null || value === "" ? [] : [[key, value]];
    }),
  ) satisfies Share;

  if (Object.keys(share).length === 0) return undefined;

  // A reload shouldn't deliver the same share twice
  history.replaceState(history.state, "", url);

  return share;
};

/** Sets up what the config leaves on. */
export const connectPwa = (
  config: PwaConfig,
  options: ConnectPwaOptions = {},
): Pwa => {
  const pwa = resolveConfig(config);
  let prompt: InstallPromptEvent | undefined;

  const installed = () =>
    matchMedia("(display-mode: standalone)").matches ||
    matchMedia("(display-mode: fullscreen)").matches;

  const setPrompt = (event: InstallPromptEvent | undefined) => {
    prompt = event;
    options.onInstallChange?.(event !== undefined);
    window.dispatchEvent(
      new CustomEvent("gw-install-change", {
        detail: { canInstall: event !== undefined },
      }),
    );
  };

  if (pwa.install) {
    window.addEventListener("beforeinstallprompt", (event) => {
      if (!isInstallPrompt(event)) return;
      // Kept for the app's own button, rather than the browser's banner
      event.preventDefault();
      setPrompt(event);
    });
    window.addEventListener("appinstalled", () => setPrompt(undefined));
  }

  window.addEventListener("gw-share", (event) => {
    if (event instanceof CustomEvent) options.onShare?.(event.detail);
  });

  if (pwa.shareTarget !== false) {
    const share = takeShare();

    // After the app's own listeners, which it adds once this returns
    if (share !== undefined)
      queueMicrotask(() =>
        window.dispatchEvent(new CustomEvent("gw-share", { detail: share })),
      );
  }

  const worker =
    pwa.offline !== false && "serviceWorker" in navigator
      ? navigator.serviceWorker
          .register(pwa.offline.worker, { scope: pwa.scope })
          .catch((error: Error) => {
            console.warn("The service worker didn't register", error);

            return undefined;
          })
      : Promise.resolve(undefined);

  return {
    config: pwa,
    installed,
    canInstall: () => prompt !== undefined,
    install: async () => {
      if (prompt === undefined) return "unavailable";
      const event = prompt;

      setPrompt(undefined);
      await event.prompt();

      return (await event.userChoice).outcome;
    },
    worker,
  };
};
