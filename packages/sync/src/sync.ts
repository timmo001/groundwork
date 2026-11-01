/**
 * Copies registry items into apps and records each copy's hash, so the next
 * run can tell a source change from an edit in the app.
 *
 * @module
 */
import { createHash } from "node:crypto";
import { Effect, FileSystem, Path, Schema } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { actionFor, classify, type Action, type State } from "./rules.ts";
import { AppFile, Apps, Item, Lock, LockedCopy, Registry } from "./schema.ts";

export class SyncError extends Schema.TaggedError<SyncError>()("SyncError", {
  message: Schema.String,
}) {}

export const appFileName = "sync.json";

export const lockFileName = "sync.lock.json";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");

/** The groundwork checkout: `GROUNDWORK_DIR`, or the one this file is in. */
export const sourceRoot = Effect.gen(function* () {
  const path = yield* Path.Path;

  return (
    process.env.GROUNDWORK_DIR ?? path.resolve(import.meta.dirname, "../../..")
  );
});

const readJson = <S extends Schema.Top>(file: string, schema: S) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const text = yield* fs
      .readFileString(file)
      .pipe(
        Effect.mapError(() => new SyncError({ message: `Can't read ${file}` })),
      );

    return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(
      text,
    ).pipe(
      Effect.mapError(
        (error) => new SyncError({ message: `${file}: ${String(error)}` }),
      ),
    );
  });

const readIfThere = Effect.fnUntraced(function* (file: string) {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(file))) return undefined;

  return yield* fs.readFileString(file);
});

const git = Effect.fnUntraced(function* (
  root: string,
  args: readonly string[],
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  const output = yield* spawner
    .string(ChildProcess.make("git", ["-C", root, ...args]))
    .pipe(
      Effect.mapError(
        () =>
          new SyncError({ message: `git ${args.join(" ")} failed in ${root}` }),
      ),
    );

  return output.trim();
});

export const readRegistry = Effect.gen(function* () {
  const path = yield* Path.Path;

  return yield* readJson(
    path.join(yield* sourceRoot, "registry.json"),
    Registry,
  );
});

/**
 * The apps to sync when none are named: `apps` in
 * `$XDG_CONFIG_HOME/groundwork/sync/apps.json`, kept outside this repository
 * because app paths are personal.
 */
export const configuredApps = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const home = process.env.HOME ?? "";
  const config = process.env.XDG_CONFIG_HOME ?? path.join(home, ".config");
  const file = path.join(config, "groundwork", "sync", "apps.json");

  if (!(yield* fs.exists(file))) return [];

  const { apps } = yield* readJson(file, Apps);

  return apps.map((app) =>
    app.startsWith("~/") ? path.join(home, app.slice(2)) : app,
  );
});

/** The items named, plus every item they need, each once. */
export const withNeeds = (registry: Registry, names: readonly string[]) =>
  Effect.gen(function* () {
    const found = new Map<string, Item>();
    const queue = [...names];

    while (queue.length > 0) {
      const name = queue.shift();

      if (name === undefined || found.has(name)) continue;

      const item = registry.items.find((entry) => entry.name === name);

      if (item === undefined) {
        return yield* new SyncError({
          message: `No item called ${name} in registry.json`,
        });
      }

      found.set(name, item);
      queue.push(...(item.needs ?? []));
    }

    return [...found.values()];
  });

export interface Copy {
  readonly app: string;
  readonly item: Item;
  /** The copy's path, relative to the app. */
  readonly path: string;
  /** The source file's path, relative to the groundwork checkout. */
  readonly source: string;
  readonly locked: LockedCopy | undefined;
  readonly sourceHash: string;
  readonly copyHash: string | undefined;
  readonly state: State;
  readonly action: Action;
}

export interface AppPlan {
  readonly app: string;
  readonly file: AppFile;
  readonly lock: Lock;
  readonly copies: readonly Copy[];
}

/** Read an app's file and lock and work out where each of its copies stands. */
export const planApp = Effect.fn("planApp")(function* (
  registry: Registry,
  app: string,
) {
  const path = yield* Path.Path;
  const root = yield* sourceRoot;
  const file = yield* readJson(path.join(app, appFileName), AppFile);
  const lockText = yield* readIfThere(path.join(app, lockFileName));

  const lock =
    lockText === undefined
      ? { copies: {} }
      : yield* readJson(path.join(app, lockFileName), Lock);

  const items = yield* withNeeds(registry, Object.keys(file.items));
  const copies: Copy[] = [];

  for (const item of items) {
    // An item pulled in as a need goes beside the item that needs it, unless
    // the app maps it itself.
    const folder = file.items[item.name] ?? Object.values(file.items)[0] ?? ".";

    for (const source of item.files) {
      const copyPath = path.join(folder, path.basename(source));
      const sourceText = yield* readIfThere(path.join(root, source));

      if (sourceText === undefined) {
        return yield* new SyncError({
          message: `${item.name}: ${source} is missing`,
        });
      }

      const copyText = yield* readIfThere(path.join(app, copyPath));
      const locked = lock.copies[copyPath];
      const sourceHash = hash(sourceText);
      const copyHash = copyText === undefined ? undefined : hash(copyText);

      const state = classify({
        locked: locked?.hash,
        source: sourceHash,
        copy: copyHash,
      });

      copies.push({
        app,
        item,
        path: copyPath,
        source,
        locked,
        sourceHash,
        copyHash,
        state,
        action: actionFor(state, item.kind),
      });
    }
  }

  return { app, file, lock, copies };
});

export interface Change {
  readonly app: string;
  readonly path: string;
  readonly item: string;
  readonly change: "copied" | "carried back" | "flagged";
  readonly reason: string;
}

const reasons = {
  current: "Up to date",
  missing: "Not copied yet",
  "source-changed": "The source changed",
  "copy-edited": "The copy was edited",
  "both-changed": "The source and the copy both changed",
} satisfies { readonly [S in State]: string };

const changeFor = {
  copy: "copied",
  "carry-back": "carried back",
  flag: "flagged",
} satisfies { readonly [A in Exclude<Action, "none">]: Change["change"] };

/** The changes a run would make, without making them. */
export const preview = (plans: readonly AppPlan[]): Change[] =>
  plans.flatMap((plan) =>
    plan.copies.flatMap((copy): Change[] =>
      copy.action === "none"
        ? []
        : [
            {
              app: copy.app,
              path: copy.path,
              item: copy.item.name,
              change: changeFor[copy.action],
              reason: reasons[copy.state],
            },
          ],
    ),
  );

const writeLock = Effect.fnUntraced(function* (plan: AppPlan, sha: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const copies: { [path: string]: LockedCopy } = {};

  for (const copy of plan.copies) {
    if (copy.state === "current") {
      copies[copy.path] =
        copy.locked?.hash === copy.sourceHash
          ? copy.locked
          : { item: copy.item.name, sha, hash: copy.sourceHash };
    } else if (copy.locked !== undefined) {
      copies[copy.path] = copy.locked;
    }
  }

  yield* fs.writeFileString(
    path.join(plan.app, lockFileName),
    `${JSON.stringify({ copies }, null, 2)}\n`,
  );
});

/**
 * Sync the apps: carry QML edits back to the source first, then copy every
 * changed source out to the apps, and record what each copy now matches.
 */
export const run = Effect.fn("run")(function* (
  registry: Registry,
  apps: readonly string[],
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = yield* sourceRoot;
  const changes: Change[] = [];
  const first = yield* Effect.forEach(apps, (app) => planApp(registry, app));
  const edits = new Map<string, Copy[]>();

  for (const copy of first.flatMap((plan) => plan.copies)) {
    if (copy.action === "carry-back") {
      edits.set(copy.source, [...(edits.get(copy.source) ?? []), copy]);
    }
  }

  for (const [source, copies] of edits) {
    const distinct = new Set(copies.map((copy) => copy.copyHash));
    const [edit] = copies;

    if (distinct.size > 1 || edit === undefined) {
      for (const copy of copies) {
        changes.push({
          app: copy.app,
          path: copy.path,
          item: copy.item.name,
          change: "flagged",
          reason: `Edited differently in ${copies.length} apps`,
        });
      }

      continue;
    }

    const text = yield* fs.readFileString(path.join(edit.app, edit.path));

    yield* fs.writeFileString(path.join(root, source), text);

    changes.push({
      app: edit.app,
      path: edit.path,
      item: edit.item.name,
      change: "carried back",
      reason: `Into ${source}`,
    });
  }

  const sha = yield* git(root, ["rev-parse", "HEAD"]);

  for (const app of apps) {
    const plan = yield* planApp(registry, app);

    for (const copy of plan.copies) {
      if (copy.action === "copy") {
        const target = path.join(app, copy.path);

        yield* fs.makeDirectory(path.dirname(target), { recursive: true });
        yield* fs.copyFile(path.join(root, copy.source), target);

        changes.push({
          app,
          path: copy.path,
          item: copy.item.name,
          change: "copied",
          reason: reasons[copy.state],
        });
      } else if (
        copy.action === "flag" &&
        !changes.some(
          (change) => change.app === app && change.path === copy.path,
        )
      ) {
        changes.push({
          app,
          path: copy.path,
          item: copy.item.name,
          change: "flagged",
          reason: reasons[copy.state],
        });
      }
    }

    yield* writeLock(yield* planApp(registry, app), sha);
  }

  return changes;
});

/** How many groundwork commits an app's oldest copy is behind. */
export const commitsBehind = Effect.fn("commitsBehind")(function* (
  plan: AppPlan,
) {
  const root = yield* sourceRoot;
  const shas = new Set(Object.values(plan.lock.copies).map((copy) => copy.sha));
  let behind = 0;

  for (const sha of shas) {
    const count = yield* git(root, [
      "rev-list",
      "--count",
      `${sha}..HEAD`,
    ]).pipe(Effect.orElseSucceed(() => "0"));

    behind = Math.max(behind, Number(count));
  }

  return behind;
});

/** Add items to an app's file, creating it if needed. */
export const addItems = Effect.fn("addItems")(function* (
  registry: Registry,
  app: string,
  names: readonly string[],
  folder: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const file = path.join(app, appFileName);

  yield* withNeeds(registry, names);

  const current = (yield* fs.exists(file))
    ? yield* readJson(file, AppFile)
    : { items: {} };

  const items = {
    ...current.items,
    ...Object.fromEntries(names.map((name) => [name, folder])),
  };

  yield* fs.writeFileString(
    file,
    `${JSON.stringify({ ...current, items }, null, 2)}\n`,
  );
});
