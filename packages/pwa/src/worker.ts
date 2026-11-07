/**
 * The service worker half of `@timmo001/groundwork-pwa`: keeps the app shell
 * so the app starts offline. Pages come from the network first and fall back
 * to the cached start page; the app's other files come from the cache while
 * a fresh copy is fetched for next time. Requests to other origins, such as
 * the app's backend, are left alone unless one of the app's routes takes them.
 *
 * The app's `sw.ts`, bundled to the config's `offline.worker`:
 *
 *   import { serveShell, type ShellWorkerScope } from "@timmo001/groundwork-pwa/worker";
 *   import config from "../pwa.config.ts";
 *
 *   declare const self: ShellWorkerScope;
 *
 *   serveShell(self, config, { version: "1" });
 */
import { resolveConfig, type PwaConfig } from "./config.ts";
import { decodePushPayload, type PushPayload } from "./push.ts";

/** An install or activate event, which the worker can keep alive. */
export interface ShellExtendableEvent extends Event {
  readonly waitUntil: (promise: Promise<unknown>) => void;
}

/** A request the worker can answer. */
export interface ShellFetchEvent extends ShellExtendableEvent {
  readonly request: Request;
  readonly respondWith: (response: Promise<Response>) => void;
}

/** The parts of a service worker's global scope the shell uses. */
export interface ShellWorkerScope {
  readonly location: { readonly href: string; readonly origin: string };
  readonly caches: CacheStorage;
  readonly clients: { readonly claim: () => Promise<void> };
  readonly skipWaiting: () => Promise<void>;
  readonly addEventListener: {
    (
      type: "install" | "activate",
      listener: (event: ShellExtendableEvent) => void,
    ): void;
    (type: "fetch", listener: (event: ShellFetchEvent) => void): void;
  };
}

/** The shell's cache, for the strategies and the app's own routes. */
export interface ShellCache {
  readonly caches: CacheStorage;
  /** This build's cache, such as `gw-shell-1`. */
  readonly name: string;
}

/**
 * One of the app's own routes, tried before the shell's. Return a response
 * to answer the request, or `undefined` to leave it to the next route and
 * then the shell.
 */
export type ShellRoute = (
  event: ShellFetchEvent,
  cache: ShellCache,
) => Promise<Response> | undefined;

/** What `serveShell` takes beside the config. */
export interface ShellOptions {
  /**
   * The cache's version. A new one, such as the build's commit, replaces the
   * old cache once the new worker takes over.
   */
  readonly version: string;
  /** The app's routes, tried in order before the shell's. */
  readonly routes?: readonly ShellRoute[];
}

const cachePrefix = "gw-shell-";

/** Puts a good same-origin response in the cache, and passes it on. */
export const keepResponse = async (
  cache: ShellCache,
  request: Request,
  response: Response,
): Promise<Response> => {
  if (response.ok && response.type === "basic") {
    const open = await cache.caches.open(cache.name);

    await open.put(request, response.clone());
  }

  return response;
};

/**
 * Fetches from the network and keeps the response, falling back to the
 * cached copy, then to `fallback`, such as the start page, when offline.
 */
export const networkFirst = (
  cache: ShellCache,
  request: Request,
  fallback?: string,
): Promise<Response> =>
  fetch(request)
    .then((response) => keepResponse(cache, request, response))
    .catch(async () => {
      const cached =
        (await cache.caches.match(request, { ignoreSearch: true })) ??
        (fallback === undefined
          ? undefined
          : await cache.caches.match(fallback));

      return cached ?? Response.error();
    });

/** Answers from the cache while a fresh copy is fetched for next time. */
export const staleWhileRevalidate = async (
  cache: ShellCache,
  event: ShellFetchEvent,
): Promise<Response> => {
  const { request } = event;
  const cached = await cache.caches.match(request);

  const fresh = fetch(request).then((response) =>
    keepResponse(cache, request, response),
  );

  if (cached === undefined) return fresh;

  event.waitUntil(fresh.catch(() => undefined));

  return cached;
};

/** Caches the app shell and answers the app's requests from it when offline. */
export const serveShell = (
  scope: ShellWorkerScope,
  config: PwaConfig,
  { version, routes = [] }: ShellOptions,
): void => {
  const pwa = resolveConfig(config);
  const startUrl = new URL(pwa.startUrl, scope.location.href).href;

  const cache: ShellCache = {
    caches: scope.caches,
    name: `${cachePrefix}${version}`,
  };

  const shell =
    pwa.offline === false
      ? []
      : pwa.offline.shell.map((url) => new URL(url, scope.location.href).href);

  scope.addEventListener("install", (event) => {
    event.waitUntil(
      scope.caches
        .open(cache.name)
        .then((open) => open.addAll(shell))
        .then(() => scope.skipWaiting()),
    );
  });

  scope.addEventListener("activate", (event) => {
    event.waitUntil(
      scope.caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter(
                (name) => name.startsWith(cachePrefix) && name !== cache.name,
              )
              .map((name) => scope.caches.delete(name)),
          ),
        )
        .then(() => scope.clients.claim()),
    );
  });

  scope.addEventListener("fetch", (event) => {
    for (const route of routes) {
      const response = route(event, cache);

      if (response !== undefined) {
        event.respondWith(response);

        return;
      }
    }

    const { request } = event;

    if (
      request.method !== "GET" ||
      new URL(request.url).origin !== scope.location.origin
    )
      return;

    event.respondWith(
      request.mode === "navigate"
        ? networkFirst(cache, request, startUrl)
        : staleWhileRevalidate(cache, event),
    );
  });
};

/** A push arriving at the worker. */
export interface ShellPushEvent extends ShellExtendableEvent {
  readonly data: { readonly text: () => string } | null;
}

/** A tap on one of the app's notifications. */
export interface ShellNotificationEvent extends ShellExtendableEvent {
  readonly notification: Notification;
}

/** An open window of the app, which a notification tap can bring forward. */
export interface ShellWindowClient {
  readonly url: string;
  readonly focus: () => Promise<object>;
  readonly navigate: (url: string) => Promise<object | null>;
}

/** The parts of a service worker's global scope push uses. */
export interface PushWorkerScope {
  readonly location: { readonly href: string };
  readonly registration: {
    readonly showNotification: (
      title: string,
      options?: NotificationOptions,
    ) => Promise<void>;
  };
  readonly clients: {
    readonly matchAll: (options: {
      readonly type: "window";
      readonly includeUncontrolled: boolean;
    }) => Promise<readonly ShellWindowClient[]>;
    readonly openWindow: (url: string) => Promise<object | null>;
  };
  readonly addEventListener: {
    (type: "push", listener: (event: ShellPushEvent) => void): void;
    (
      type: "notificationclick",
      listener: (event: ShellNotificationEvent) => void,
    ): void;
  };
}

/** What `servePush` takes beside the config. Each replaces a default. */
export interface PushOptions {
  /** The notification for a payload. Defaults to {@link pushNotification}. */
  readonly show?: (payload: PushPayload) => {
    readonly title: string;
    readonly options: NotificationOptions;
  };
  /** The page a tap opens. Defaults to the payload's `link`, or the start page. */
  readonly open?: (payload: PushPayload) => string | undefined;
  /** Called with a push that isn't a payload, which shows nothing by default. */
  readonly onOther?: (text: string) => Promise<void> | void;
}

/**
 * The default notification for a payload: its title and body, the tag that
 * makes like ones replace each other, quiet for a passive one, and the
 * payload kept on the notification for the tap. Ongoing work shows its status
 * and progress, and stays until it's done.
 */
export const pushNotification = (payload: PushPayload) => {
  const progress =
    payload.ongoing?.progress === undefined
      ? ""
      : ` (${Math.round((payload.ongoing.progress.value / payload.ongoing.progress.max) * 100)}%)`;

  const body =
    payload.ongoing === undefined
      ? payload.body
      : `${payload.ongoing.status}${progress}`;

  const tag = payload.ongoing?.id ?? payload.tag;

  const options: NotificationOptions = {
    data: payload,
    silent: payload.level === "passive",
    requireInteraction:
      payload.ongoing !== undefined && payload.ongoing.done !== true,
  };

  if (body !== undefined) options.body = body;

  if (tag !== undefined) options.tag = tag;

  return { title: payload.title, options };
};

/**
 * Shows the app's pushes as notifications and opens the app at the page a
 * tap points to, bringing an open window forward rather than opening another.
 */
export const servePush = (
  scope: PushWorkerScope,
  config: PwaConfig,
  { show = pushNotification, open, onOther }: PushOptions = {},
): void => {
  const pwa = resolveConfig(config);
  const base = new URL(pwa.scope, scope.location.href).href;

  scope.addEventListener("push", (event) => {
    const text = event.data?.text() ?? "";
    const payload = decodePushPayload(text);

    if (payload === undefined) {
      if (onOther !== undefined)
        event.waitUntil(Promise.resolve(onOther(text)));

      return;
    }

    const { title, options } = show(payload);

    event.waitUntil(scope.registration.showNotification(title, options));
  });

  scope.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const payload = decodePushPayload(JSON.stringify(event.notification.data));

    const target = new URL(
      (payload === undefined ? undefined : open?.(payload)) ??
        payload?.link ??
        pwa.startUrl,
      base,
    ).href;

    event.waitUntil(
      scope.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(async (windows) => {
          const existing = windows.find(({ url }) => url.startsWith(base));

          if (existing === undefined) return scope.clients.openWindow(target);

          await existing.navigate(target);

          return existing.focus();
        }),
    );
  });
};
