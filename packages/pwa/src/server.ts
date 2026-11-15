/**
 * The server half of keeping a page on its release, and of serving the
 * PWA's files. A page of another version than the server's gets a 426, with
 * `server` and `client` in the body, and `./update` moves it onto the new
 * release. A client that sends no version, such as a CLI, a host or an event
 * stream, isn't held to one.
 *
 *   import { versionGuard } from "@timmo001/groundwork-pwa/server";
 *
 *   HttpRouter.middleware(
 *     Effect.succeed(versionGuard({ app: "kestrel", version })),
 *   ).layer;
 *
 * A server not on Effect, such as a Cloudflare Worker, uses
 * `refuseOtherVersion` on its `Request`, and one in another language follows
 * the same contract: read `x-<app>-version`, and when it's there and isn't
 * the server's own, answer 426 with that JSON body.
 */
import { Effect, Predicate } from "effect";
import {
  HttpMiddleware,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";

import { isHashed } from "./config.ts";
import { versionHeader, versionMismatchStatus } from "./update.ts";

export {
  versionHeader,
  versionMetaName,
  versionMismatchStatus,
} from "./update.ts";

/** What the version guard holds pages to. */
export interface VersionGuardOptions {
  /** The app's short name, which names the header, such as `kestrel`. */
  readonly app: string;
  /** The server's version. */
  readonly version: string;
  /**
   * Paths open to any version, so a page can always learn the server's or
   * load its text, such as `/api/health` and `/api/translations`.
   */
  readonly anyVersion?: Iterable<string>;
  /**
   * Which paths are held to a version, such as only those under `/api/`.
   * Defaults to every path.
   */
  readonly guards?: (path: string) => boolean;
}

/** The body of a 426, for a page to read which versions differ. */
export interface VersionMismatch {
  readonly message: string;
  readonly server: string;
  readonly client: string;
}

/**
 * Whether a call to `path` from a page of version `client` is refused, and
 * the body to refuse it with. `undefined` lets it through.
 */
export const versionMismatch = (
  { app, version, anyVersion = [], guards = () => true }: VersionGuardOptions,
  path: string,
  client: string | undefined,
): VersionMismatch | undefined => {
  if (
    client === undefined ||
    client === version ||
    new Set(anyVersion).has(path) ||
    !guards(path)
  )
    return undefined;

  return {
    message: `This page is ${app} ${client} and the server runs ${version}, so it needs to reload.`,
    server: version,
    client,
  };
};

/**
 * Refuses a call from a page of another version with a 426, as Effect HTTP
 * middleware. Wrap it with `HttpRouter.middleware` for a router, or pass it
 * to `HttpServer.serve`.
 */
export const versionGuard = (options: VersionGuardOptions) => {
  const header = versionHeader(options.app);

  return HttpMiddleware.make((httpEffect) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;

      const refusal = versionMismatch(
        options,
        new URL(request.url, "http://localhost").pathname,
        request.headers[header],
      );

      if (refusal === undefined) return yield* httpEffect;

      return HttpServerResponse.jsonUnsafe(refusal, {
        status: versionMismatchStatus,
      });
    }),
  );
};

/**
 * The 426 for a `Request` from a page of another version, for a server on
 * the fetch API, such as a Cloudflare Worker. `undefined` lets it through.
 */
export const refuseOtherVersion = (
  request: Request,
  options: VersionGuardOptions,
): Response | undefined => {
  const refusal = versionMismatch(
    options,
    new URL(request.url).pathname,
    request.headers.get(versionHeader(options.app)) ?? undefined,
  );

  return refusal === undefined
    ? undefined
    : Response.json(refusal, { status: versionMismatchStatus });
};

const contentTypes = new Map([
  ["html", "text/html; charset=utf-8"],
  ["js", "text/javascript; charset=utf-8"],
  ["mjs", "text/javascript; charset=utf-8"],
  ["css", "text/css; charset=utf-8"],
  ["json", "application/json"],
  ["webmanifest", "application/manifest+json"],
  ["svg", "image/svg+xml"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["ico", "image/x-icon"],
  ["woff2", "font/woff2"],
  ["txt", "text/plain; charset=utf-8"],
]);

/** The files `writePwa` and the worker build write: `sw.js`, the manifest and the icons. */
export const isPwaFile = (name: string) =>
  /^(?:sw\.js|manifest\.webmanifest|icons\/.+)$/.test(name);

/** A file whose name carries a content hash, as Bun and Vite name them, such as `index-r20khhep.js`. */
export { isHashed };

/** What {@link fileOptions} decides with. */
export interface FileOptionsOptions {
  /** Which names carry a content hash. Defaults to {@link isHashed}. */
  readonly hashed?: (name: string) => boolean;
}

/**
 * The content type and cache headers to serve a built file with. A file
 * with a content hash in its name never changes, so it's kept for a year.
 * Every other one, the worker, manifest and icons included, is rechecked on
 * each load, so a new release is noticed.
 */
export const fileOptions = (
  name: string,
  { hashed = isHashed }: FileOptionsOptions = {},
) => ({
  contentType: contentTypes.get(name.split(".").pop() ?? ""),
  headers: {
    "cache-control": hashed(name)
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  },
});

/** A built file as an Effect HTTP response, with {@link fileOptions}' headers. */
export const fileResponse = (
  name: string,
  body: Uint8Array | string,
  options?: FileOptionsOptions,
) =>
  Predicate.isString(body)
    ? HttpServerResponse.text(body, fileOptions(name, options))
    : HttpServerResponse.uint8Array(body, fileOptions(name, options));
