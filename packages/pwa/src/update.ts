/**
 * Keeping an open page on its server's release. The page sends its version
 * with each call, and a server on another version answers 426. The page then
 * asks the service worker for the new build, which keeps its files and takes
 * over by itself, and reloads onto it. Without a worker, such as over plain
 * HTTP on the network, the reload fetches the build itself. It does this
 * once per version, then calls the page stale and leaves the next reload to
 * the person, so a server that keeps refusing can't loop the page.
 *
 * The server puts its version in the index it serves, as
 * `<meta name="<app>-version" content="1.2.3">`, so the page knows it without
 * a build step:
 *
 *   import { watchVersion } from "@timmo001/groundwork-pwa/update";
 *
 *   const update = watchVersion({ app: "kestrel", worker: pwa.worker });
 *
 *   const response = await fetch(url, { headers: update.headers });
 *   update.check(response);
 *
 * Nothing here touches the page until `watchVersion` runs, so a server can
 * import the header name and status from this module too.
 */

/** The status a server answers a page of another version with. */
export const versionMismatchStatus = 426;

/** The header a page sends its version in, such as `x-kestrel-version`. */
export const versionHeader = (app: string) => `x-${app.toLowerCase()}-version`;

/** The meta tag a server puts its version in, such as `kestrel-version`. */
export const versionMetaName = (app: string) => `${app}-version`;

/** What `watchVersion` watches with. */
export interface VersionWatchOptions {
  /** The app's short name, which names the header, the meta tag and the stored key. */
  readonly app: string;
  /**
   * The page's version. Defaults to the meta tag's, and without either the
   * page sends no version, which a server doesn't hold to one, such as on a
   * dev server.
   */
  readonly version?: string;
  /** The service worker, as `connectPwa`'s `worker`, to take the new build from. */
  readonly worker?: Promise<ServiceWorkerRegistration | undefined>;
  /** Called when the page is still on another version after reloading once. */
  readonly onStale?: () => void;
  /** How long a new worker gets to take over before the page reloads anyway. Defaults to 10 seconds. */
  readonly takeOverTimeout?: number;
}

/** The page's watch on its version. */
export interface VersionWatch {
  /** The page's version, when it has one. */
  readonly version: string | undefined;
  /** The header's name. */
  readonly header: string;
  /** The headers to send with each call: the version, when the page has one. */
  readonly headers: Readonly<Record<string, string>>;
  /** Moves the page onto the server's release. Call it when the server says it runs another. */
  readonly mismatched: () => void;
  /** Calls `mismatched` when `response` is a 426, and returns whether it was. */
  readonly check: (response: Response) => boolean;
  /** True once the page couldn't move by itself, for a banner with a Reload button. */
  readonly stale: () => boolean;
  /** Reloads the page, for that banner's button. */
  readonly reload: () => void;
}

/**
 * Watches the page's version. When it goes stale, `onStale` runs and the
 * window gets a `gw-version-stale` event.
 */
export const watchVersion = ({
  app,
  version = document
    .querySelector(`meta[name="${versionMetaName(app)}"]`)
    ?.getAttribute("content") ?? undefined,
  worker = Promise.resolve(undefined),
  onStale,
  takeOverTimeout = 10_000,
}: VersionWatchOptions): VersionWatch => {
  const header = versionHeader(app);
  const reloadedKey = `${app}:reloaded-for-version`;
  let updating = false;
  let stale = false;

  const reloadForUpdate = async () => {
    const registration = await worker;

    if (
      registration !== undefined &&
      navigator.serviceWorker.controller !== null
    ) {
      const takenOver = new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () =>
          resolve(),
        );
        setTimeout(resolve, takeOverTimeout);
      });

      await registration.update().catch(() => undefined);

      if (registration.installing !== null || registration.waiting !== null)
        await takenOver;
    }

    location.reload();
  };

  // Every call refused meanwhile waits on the same move
  const mismatched = () => {
    if (updating || stale) return;

    if (sessionStorage.getItem(reloadedKey) !== (version ?? "")) {
      sessionStorage.setItem(reloadedKey, version ?? "");
      updating = true;
      void reloadForUpdate();

      return;
    }

    stale = true;
    onStale?.();
    window.dispatchEvent(new CustomEvent("gw-version-stale"));
  };

  return {
    version,
    header,
    headers: version === undefined ? {} : { [header]: version },
    mismatched,
    check: (response) => {
      if (response.status !== versionMismatchStatus) return false;

      mismatched();

      return true;
    },
    stale: () => stale,
    reload: () => location.reload(),
  };
};
