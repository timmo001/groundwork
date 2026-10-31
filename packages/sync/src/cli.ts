#!/usr/bin/env bun
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, Path } from "effect";
import { Argument, Command, Flag } from "effect/cli";
import {
  addItems,
  commitsBehind,
  configuredApps,
  planApp,
  preview,
  readRegistry,
  run,
  SyncError,
  type Change,
} from "./sync.ts";

const json = Flag.Boolean("json").pipe(
  Flag.withDescription("Print JSON for scripts and agents instead of text"),
  Flag.withDefault(false),
);

const appFlag = Flag.String("app").pipe(
  Flag.withDescription(
    "An app folder with a sync.json; repeatable. Defaults to the apps in $XDG_CONFIG_HOME/groundwork/sync/apps.json",
  ),
  Flag.atLeast(0),
);

/** The apps named, or the configured ones, as absolute paths. */
const appsFrom = Effect.fnUntraced(function* (named: readonly string[]) {
  const path = yield* Path.Path;
  const apps = named.length > 0 ? named : yield* configuredApps;

  if (apps.length === 0) {
    return yield* new SyncError({
      message:
        "No apps: pass --app or list them in $XDG_CONFIG_HOME/groundwork/sync/apps.json",
    });
  }

  return apps.map((app) => path.resolve(app));
});

const marks = {
  copied: "→",
  "carried back": "←",
  flagged: "✗",
} satisfies { readonly [C in Change["change"]]: string };

const printChanges = (changes: readonly Change[]) =>
  Console.log(
    changes
      .map(
        (change) =>
          `${marks[change.change]} ${change.app}/${change.path}  ${change.reason}`,
      )
      .join("\n"),
  );

const items = Command.make(
  "items",
  { json },
  Effect.fn("items")(function* ({ json }) {
    const registry = yield* readRegistry;

    if (json) return yield* Console.log(JSON.stringify(registry, null, 2));

    for (const item of registry.items) {
      yield* Console.log(`${item.name}  ${item.kind}  ${item.description}`);
    }
  }),
).pipe(Command.withDescription("List what apps can take from registry.json"));

const status = Command.make(
  "status",
  { json, app: appFlag },
  Effect.fn("status")(function* ({ json, app }) {
    const registry = yield* readRegistry;
    const apps = yield* appsFrom(app);

    const plans = yield* Effect.forEach(apps, (entry) =>
      planApp(registry, entry),
    );

    const report = [];

    for (const plan of plans) {
      report.push({
        app: plan.app,
        commitsBehind: yield* commitsBehind(plan),
        copies: plan.copies.map((copy) => ({
          path: copy.path,
          item: copy.item.name,
          state: copy.state,
          action: copy.action,
        })),
      });
    }

    if (json)
      return yield* Console.log(JSON.stringify({ apps: report }, null, 2));

    for (const entry of report) {
      yield* Console.log(`${entry.app}  ${entry.commitsBehind} commits behind`);

      for (const copy of entry.copies) {
        yield* Console.log(
          `  ${copy.state === "current" ? "○" : "●"} ${copy.path}  ${copy.state}`,
        );
      }
    }
  }),
).pipe(Command.withDescription("Show where every copy stands"));

const sync = Command.make(
  "run",
  {
    json,
    app: appFlag,
    check: Flag.Boolean("check").pipe(
      Flag.withDescription("List what would change without changing anything"),
      Flag.withDefault(false),
    ),
  },
  Effect.fn("run")(function* ({ json, app, check }) {
    const registry = yield* readRegistry;
    const apps = yield* appsFrom(app);

    const changes = check
      ? preview(
          yield* Effect.forEach(apps, (entry) => planApp(registry, entry)),
        )
      : yield* run(registry, apps);

    if (json) {
      yield* Console.log(JSON.stringify({ check, changes }, null, 2));
    } else if (changes.length === 0) {
      yield* Console.log("Nothing to sync");
    } else {
      yield* printChanges(changes);
    }

    if (changes.some((change) => change.change === "flagged")) {
      yield* Console.error(
        "✗ copies need a person or the fixer agent: move the edit into groundwork or a wrapper",
      );

      yield* Effect.sync(() => {
        process.exitCode = 1;
      });
    }
  }),
).pipe(
  Command.withDescription(
    "Carry QML edits back to groundwork, then copy changed sources out to the apps",
  ),
);

const add = Command.make(
  "add",
  {
    app: Flag.String("app").pipe(Flag.withDescription("The app folder")),
    to: Flag.String("to").pipe(
      Flag.withDescription("The folder in the app the files go in"),
      Flag.withDefault("."),
    ),
    names: Argument.String("item").pipe(
      Argument.withDescription("Items from registry.json"),
      Argument.atLeast(1),
    ),
  },
  Effect.fn("add")(function* ({ app, to, names }) {
    const path = yield* Path.Path;
    const registry = yield* readRegistry;
    const folder = path.resolve(app);

    yield* addItems(registry, folder, names, to);

    const changes = yield* run(registry, [folder]);

    yield* changes.length === 0
      ? Console.log("Already in place")
      : printChanges(changes);
  }),
).pipe(
  Command.withDescription("Add items to an app's sync.json and copy them in"),
);

const cli = Command.make("sync").pipe(
  Command.withDescription(
    "Keep groundwork's items in sync with the apps that take them",
  ),
  Command.withSubcommands([items, status, sync, add]),
);

cli.pipe(
  Command.run({ version: "0.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
