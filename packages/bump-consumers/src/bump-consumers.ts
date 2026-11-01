#!/usr/bin/env bun
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import {
  Api,
  Release,
  Repository,
  Search,
  layer as ghLayer,
  type GhError,
} from "@timmo001/effect-gh";
import {
  Config,
  Console,
  Effect,
  FileSystem,
  Layer,
  Match,
  Option,
  Path,
  Schema,
  Stream,
  type PlatformError,
} from "effect";
import { Command, Flag } from "effect/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

const source = "timmo001/groundwork";
const packageName = "@timmo001/docs-kit";

// The dependency entry in a consumer's package.json, keeping its formatting.
const pin = /("@timmo001\/docs-kit"\s*:\s*")[^"]+(")/g;

type Outcome = "updated" | "current" | "skipped" | "failed";

interface Report {
  readonly outcome: Outcome;
  readonly lines: readonly string[];
}

const report = (outcome: Outcome, lines: readonly string[]): Report => ({
  outcome,
  lines,
});

class CommandError extends Schema.TaggedError<CommandError>()("CommandError", {
  command: Schema.String,
  exitCode: Schema.Int,
  output: Schema.String,
}) {}

const Commit = Schema.Struct({ sha: Schema.String });

const RepositoryInfo = Schema.Struct({
  archived: Schema.Boolean,
  fork: Schema.Boolean,
  default_branch: Schema.String,
});

const cacheRoot = Config.String("XDG_CACHE_HOME").pipe(
  Config.orElse(() =>
    Config.String("HOME").pipe(Config.map((home) => `${home}/.cache`)),
  ),
);

const collectText = (stream: Stream.Stream<Uint8Array, unknown>) =>
  stream.pipe(
    Stream.decodeText(),
    Stream.runFold(
      () => "",
      (all, chunk) => all + chunk,
    ),
  );

/** Run a command to completion and return its stdout, failing on a non-zero exit. */
const run = Effect.fn("run")(function* (
  command: string,
  args: readonly string[],
  cwd: string,
) {
  const label = `${command} ${args.join(" ")}`;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  const [stdout, stderr, exitCode] = yield* Effect.scoped(
    Effect.gen(function* () {
      const handle = yield* spawner.spawn(
        ChildProcess.make(command, args, { cwd, extendEnv: true }),
      );

      return yield* Effect.all(
        [
          collectText(handle.stdout),
          collectText(handle.stderr),
          handle.exitCode,
        ],
        { concurrency: "unbounded" },
      );
    }),
  ).pipe(
    Effect.mapError(
      (cause) =>
        new CommandError({
          command: label,
          exitCode: -1,
          output: String(cause),
        }),
    ),
  );

  if (Number(exitCode) !== 0) {
    return yield* new CommandError({
      command: label,
      exitCode: Number(exitCode),
      output: `${stderr}\n${stdout}`.trim(),
    });
  }

  return stdout;
});

const describeError = (
  error: GhError | CommandError | PlatformError.PlatformError,
) =>
  Match.value(error).pipe(
    Match.tag(
      "CommandError",
      (error) =>
        `${error.command}\n${error.output.split("\n").slice(-15).join("\n")}`,
    ),
    Match.tag("GhCommandError", (error) => error.stderr || error.stdout),
    Match.orElse(String),
  );

const resolveRelease = Effect.fn("resolveRelease")(function* (
  to: Option.Option<string>,
) {
  const tag = Option.isSome(to)
    ? to.value
    : (yield* Release.view({ repo: source, fields: ["tagName"] })).tagName;

  const commit = yield* Api.json(
    { endpoint: `repos/${source}/commits/${tag}`, method: "GET" },
    Commit,
  );

  return { version: tag, sha: commit.sha };
});

/** Every package.json that depends on docs-kit, grouped by repository. */
const discover = Effect.fn("discover")(function* (owner: string) {
  const results = yield* Search.code({
    // Quoted, code search matches only this repository
    query: packageName,
    owner,
    filename: "package.json",
    limit: 1000,
  });

  const consumers = new Map<string, string[]>();

  for (const result of results) {
    const repo = result.repository.nameWithOwner;

    if (repo === source) continue;

    consumers.set(repo, [...(consumers.get(repo) ?? []), result.path]);
  }

  return consumers;
});

const prepareClone = Effect.fn("prepareClone")(function* (
  directory: string,
  repo: string,
  branch: string,
) {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(directory))) {
    yield* Repository.clone({
      repository: repo,
      directory,
      gitArgs: ["--quiet", "--filter=blob:none"],
    });

    return;
  }

  yield* run("git", ["fetch", "--quiet", "origin", branch], directory);
  yield* run(
    "git",
    ["checkout", "--quiet", "--force", "-B", branch, `origin/${branch}`],
    directory,
  );
  yield* run("git", ["clean", "--quiet", "-fdx"], directory);
});

const bumpRepository = Effect.fn("bumpRepository")(
  function* (
    repo: string,
    manifests: readonly string[],
    options: {
      readonly cacheDirectory: string;
      readonly version: string;
      readonly build: boolean;
      readonly push: boolean;
    },
  ) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const info = yield* Api.json(
      { endpoint: `repos/${repo}`, method: "GET" },
      RepositoryInfo,
    );

    if (info.archived || info.fork) {
      return report("skipped", [
        `  ○ ${repo}  skipped, ${info.archived ? "archived" : "fork"}`,
      ]);
    }

    const directory = path.join(options.cacheDirectory, repo);

    yield* prepareClone(directory, repo, info.default_branch);

    const changed: string[] = [];

    for (const manifest of manifests) {
      const target = path.join(directory, manifest);
      const current = yield* fs.readFileString(target);
      const next = current.replace(pin, `$1${options.version}$2`);

      if (next === current) continue;

      yield* fs.writeFileString(target, next);
      changed.push(manifest);
    }

    if (changed.length === 0) {
      return report("current", [`  ○ ${repo}  already on ${options.version}`]);
    }

    for (const manifest of changed) {
      const packageDirectory = path.join(directory, path.dirname(manifest));

      yield* run("bun", ["install"], packageDirectory);

      if (options.build) yield* run("bun", ["run", "build"], packageDirectory);
    }

    // The manifests plus whichever lockfiles the installs rewrote.
    const files = (yield* run("git", ["status", "--porcelain"], directory))
      .split("\n")
      .filter((line) => line.startsWith(" M "))
      .map((line) => line.slice(3));

    let action: string;

    if (options.push) {
      yield* run(
        "dot",
        [
          "git",
          "commit",
          "-m",
          `Update ${packageName} to ${options.version}`,
          ...files.flatMap((file) => ["--path", file]),
          "--push",
        ],
        directory,
      );

      const commit = yield* run(
        "git",
        ["rev-parse", "--short", "HEAD"],
        directory,
      );

      action = `pushed ${commit.trim()}`;
    } else {
      yield* run("git", ["checkout", "--quiet", "--", "."], directory);
      action = "would update";
    }

    return report("updated", [
      "",
      `  ✓ ${repo}  ${action}${options.build ? " · build passed" : ""}`,
      ...files.map((file) => `      M  ${file}`),
    ]);
  },
  (effect, repo) =>
    effect.pipe(
      Effect.catch((error) => {
        const [first = "", ...rest] = describeError(error).trim().split("\n");

        return Effect.succeed(
          report("failed", [
            "",
            `  ✗ ${repo}  ${first}`,
            ...rest.map((line) => `      ${line}`),
          ]),
        );
      }),
    ),
);

const bumpConsumers = Command.make(
  "bump-consumers",
  {
    to: Flag.String("to").pipe(
      Flag.withDescription("Release tag to pin, defaults to the latest"),
      Flag.optional,
    ),
    owner: Flag.String("owner").pipe(
      Flag.withDescription("Owner whose repositories are searched"),
      Flag.withDefault("timmo001"),
    ),
    repo: Flag.String("repo").pipe(
      Flag.withDescription("Only bump this repository, repeatable"),
      Flag.atLeast(0),
    ),
    build: Flag.Boolean("build").pipe(
      Flag.withDescription(
        "Build each site after the bump and stop on failure",
      ),
      Flag.withDefault(true),
    ),
    push: Flag.Boolean("push").pipe(
      Flag.withDescription("Commit and push through dot git commit"),
      Flag.withDefault(false),
    ),
    concurrency: Flag.Int("concurrency").pipe(
      Flag.withDescription("Repositories to process at once"),
      Flag.withDefault(4),
    ),
  },
  Effect.fn("bumpConsumers")(function* ({
    to,
    owner,
    repo,
    build,
    push,
    concurrency,
  }) {
    const path = yield* Path.Path;
    const { version, sha } = yield* resolveRelease(to);
    const found = yield* discover(owner);

    const consumers =
      repo.length > 0
        ? [...found].filter(([name]) => repo.includes(name))
        : [...found];

    const cacheDirectory = path.join(
      yield* cacheRoot,
      "groundwork-bump-consumers",
    );

    yield* Console.log(
      `\nBump ${packageName} to ${version}  ${sha.slice(0, 7)}`,
    );
    yield* Console.log(
      `  ${push ? "Pushing" : "Dry run"} · ${consumers.length} repositories${push ? "" : " · pass --push to commit"}`,
    );

    const outcomes = yield* Effect.forEach(
      consumers.toSorted(([a], [b]) => a.localeCompare(b)),
      ([name, manifests]) =>
        bumpRepository(name, manifests, {
          cacheDirectory,
          version,
          build,
          push,
        }).pipe(
          Effect.tap((report) => Console.log(report.lines.join("\n"))),
          Effect.map((report) => report.outcome),
        ),
      { concurrency: Math.max(1, concurrency) },
    );

    const count = (outcome: Outcome) =>
      outcomes.filter((item) => item === outcome).length;

    yield* Console.log(
      [
        "\nSummary",
        `  ${count("updated")} ${push ? "pushed" : "would update"}`,
        `  ${count("current")} already on ${version}`,
        `  ${count("skipped")} skipped`,
        `  ${count("failed")} failed`,
      ].join("\n"),
    );

    if (count("failed") > 0) {
      yield* Effect.sync(() => {
        process.exitCode = 1;
      });
    }
  }),
).pipe(
  Command.withDescription(`Bump ${packageName} in consuming repositories`),
);

bumpConsumers.pipe(
  Command.run({ version: "0.0.0" }),
  Effect.provide(ghLayer().pipe(Layer.provideMerge(NodeServices.layer))),
  NodeRuntime.runMain,
);
