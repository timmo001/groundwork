/**
 * docs-kit's Cloudflare deploy helper: the Worker settings Blume's build
 * leaves in `dist/server/wrangler.json`, shaped for an Alchemy
 * `Cloudflare.Worker`. Blume wraps Astro's Worker in its Markdown negotiation
 * and lists the paths that skip it, so a deploy has to start from what the
 * build wrote rather than from a hand-kept config.
 *
 * @module
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The parts of the built Worker config the deploy needs. */
interface BuiltWorkerConfig {
  readonly main: string;
  readonly compatibility_date: string;
  readonly compatibility_flags?: ReadonlyArray<string>;
  readonly assets?: {
    readonly directory?: string;
    readonly run_worker_first?: ReadonlyArray<string>;
  };
}

/** The Worker settings {@link blumeWorker} returns, with absolute paths. */
export interface BlumeWorker {
  /** The built entry, which is already bundled. */
  readonly main: string;
  readonly bundle: false;
  readonly compatibility: {
    readonly date: string;
    readonly flags: Array<string>;
  };
  readonly assets: {
    readonly directory: string;
    readonly runWorkerFirst?: Array<string>;
  };
}

/**
 * Read the Worker Blume built into `dist`, for a deploy tool such as Alchemy:
 *
 * ```ts
 * const docs = yield* Cloudflare.Worker("Docs", {
 *   name: "triage-docs",
 *   domain: "triage.timmo.dev",
 *   ...(yield* Effect.promise(() => blumeWorker())),
 * });
 * ```
 *
 * @param dist The site's build folder, `dist` beside the working directory
 * by default.
 */
export const blumeWorker = async (
  dist: string | URL = "dist",
): Promise<BlumeWorker> => {
  const server = resolve(
    dist instanceof URL ? fileURLToPath(dist) : dist,
    "server",
  );

  const built: BuiltWorkerConfig = JSON.parse(
    await readFile(resolve(server, "wrangler.json"), "utf-8"),
  );

  const runWorkerFirst = built.assets?.run_worker_first;

  return {
    main: resolve(server, built.main),
    bundle: false,
    compatibility: {
      date: built.compatibility_date,
      flags: [...(built.compatibility_flags ?? [])],
    },
    assets: {
      directory: resolve(server, built.assets?.directory ?? "../client"),
      ...(runWorkerFirst && { runWorkerFirst: [...runWorkerFirst] }),
    },
  };
};
