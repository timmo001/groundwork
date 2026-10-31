#!/usr/bin/env bun
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import {
  Config,
  Console,
  Effect,
  FileSystem,
  Option,
  Path,
  Schema,
} from "effect";
import { Argument, Command, Flag } from "effect/cli";
import { check, labelsFor, setsFor, type Manifest } from "./resolve.ts";
import { KindsDocument, LabelsDocument, Repo } from "./schema.ts";

class ConventionsError extends Schema.TaggedError<ConventionsError>()(
  "ConventionsError",
  { message: Schema.String },
) {}

const root = Effect.gen(function* () {
  const path = yield* Path.Path;

  return path.resolve(import.meta.dirname, "../../..");
});

/** Parse a YAML file and check it against a Schema. */
const readYaml = <S extends Schema.Top>(file: string, schema: S) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const text = yield* fs.readFileString(file);

    const parsed = yield* Effect.try({
      try: () => Bun.YAML.parse(text),
      catch: (cause) =>
        new ConventionsError({ message: `${file}: ${String(cause)}` }),
    });

    return yield* Schema.decodeUnknownEffect(schema)(parsed).pipe(
      Effect.mapError(
        (error) =>
          new ConventionsError({ message: `${file}: ${String(error)}` }),
      ),
    );
  });

const reposFlag = Flag.String("repos").pipe(
  Flag.withDescription(
    "Another directory of repository files, such as a private overlay; repeatable",
  ),
  Flag.atLeast(0),
);

/**
 * Repository files kept outside this public repository, such as for private
 * repositories, in `$XDG_CONFIG_HOME/groundwork/conventions/repos`.
 */
const localRepos = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const configHome = yield* Config.String("XDG_CONFIG_HOME").pipe(
    Config.orElse(() =>
      Config.String("HOME").pipe(Config.map((home) => `${home}/.config`)),
    ),
    Config.option,
  );

  if (Option.isNone(configHome)) return [];

  const directory = path.join(configHome.value, "groundwork/conventions/repos");

  return (yield* fs.exists(directory)) ? [directory] : [];
});

const loadManifest = Effect.fn("loadManifest")(function* (
  extra: readonly string[],
  options: { readonly local: boolean } = { local: true },
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const conventions = path.join(yield* root, "conventions");

  const { kinds } = yield* readYaml(
    path.join(conventions, "kinds.yml"),
    KindsDocument,
  );

  const { sets } = yield* readYaml(
    path.join(conventions, "labels.yml"),
    LabelsDocument,
  );

  const directories = [
    path.join(conventions, "repos"),
    ...(options.local ? yield* localRepos : []),
    ...extra,
  ];

  const repos = yield* Effect.forEach(directories, (directory) =>
    fs
      .readDirectory(directory)
      .pipe(
        Effect.flatMap((files) =>
          Effect.forEach(
            files.filter((file) => file.endsWith(".yml")).toSorted(),
            (file) => readYaml(path.join(directory, file), Repo),
          ),
        ),
      ),
  );

  const manifest: Manifest = { kinds, sets, repos: repos.flat() };

  return manifest;
});

const checkCommand = Command.make(
  "check",
  { repos: reposFlag },
  Effect.fn("check")(function* ({ repos }) {
    const manifest = yield* loadManifest(repos);
    const problems = check(manifest);

    for (const item of problems) {
      yield* Console.log(`✗ ${item.where}: ${item.message}`);
    }

    if (problems.length > 0) {
      return yield* new ConventionsError({
        message: `${problems.length} problems in the conventions`,
      });
    }

    yield* Console.log(
      `${manifest.repos.length} repositories, ${manifest.sets.length} label sets: no problems`,
    );
  }),
).pipe(
  Command.withDescription(
    "Check the label sets, kinds and repository files are sound",
  ),
);

/** The data the docs site renders: kinds, sets and each repository's labels. */
const docsData = (manifest: Manifest) => ({
  kinds: manifest.kinds,
  sets: manifest.sets,
  repos: manifest.repos.map((repo) => ({
    repo: repo.repo,
    kind: repo.kind,
    discussions: repo.discussions ?? false,
    sets: setsFor(manifest, repo).map((set) => set.id),
    areas: repo.areas ?? [],
    labels: labelsFor(manifest, repo).length,
  })),
});

const genCommand = Command.make(
  "gen",
  {
    check: Flag.Boolean("check").pipe(
      Flag.withDescription("Fail when the generated file is out of date"),
      Flag.withDefault(false),
    ),
  },
  Effect.fn("gen")(function* ({ check: checkOnly }) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    // Public repositories only: the docs site is public.
    const manifest = yield* loadManifest([], { local: false });

    const file = path.join(
      yield* root,
      "packages/conventions/generated/conventions.json",
    );

    const contents = `${JSON.stringify(docsData(manifest), null, 2)}\n`;

    const current = (yield* fs.exists(file))
      ? yield* fs.readFileString(file)
      : "";

    if (current === contents) {
      yield* Console.log("Generated conventions are up to date");

      return;
    }

    if (checkOnly) {
      return yield* new ConventionsError({
        message: "Out of date, run mise run gen: generated/conventions.json",
      });
    }

    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFileString(file, contents);
    yield* Console.log("Wrote generated/conventions.json");
  }),
).pipe(
  Command.withDescription("Write the conventions data the docs site reads"),
);

const labelsCommand = Command.make(
  "labels",
  {
    repo: Argument.String("repo").pipe(
      Argument.withDescription("The repository, as owner/name"),
    ),
    repos: reposFlag,
  },
  Effect.fn("labels")(function* ({ repo, repos }) {
    const manifest = yield* loadManifest(repos);
    const entry = manifest.repos.find((item) => item.repo === repo);

    if (entry === undefined) {
      return yield* new ConventionsError({
        message: `${repo} has no repository file`,
      });
    }

    yield* Console.log(
      JSON.stringify(
        {
          repo: entry.repo,
          kind: entry.kind,
          labels: labelsFor(manifest, entry),
          keep: entry.keep ?? [],
        },
        null,
        2,
      ),
    );
  }),
).pipe(
  Command.withDescription(
    "Print the labels a repository should have, as JSON, for the label job",
  ),
);

Command.make("conventions").pipe(
  Command.withSubcommands([checkCommand, genCommand, labelsCommand]),
  Command.run({ version: "0.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
