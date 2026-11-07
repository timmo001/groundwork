#!/usr/bin/env bun
/**
 * `groundwork-tokens`: builds an app's own theme documents into every
 * target, beside Groundwork's themes if asked, and writes them to a folder.
 * It runs on Bun, since the package ships TypeScript.
 *
 *   groundwork-tokens build theme.json [more.json ...] [--out generated]
 *     [--targets css,qml,opentui] [--with-groundwork] [--strict]
 *
 * @module
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, FileSystem, Path, Schema } from "effect";
import { Argument, Command, Flag } from "effect/cli";
import { build, targets } from "./build.ts";
import { Theme } from "./schema.ts";

class BuildError extends Schema.TaggedError<BuildError>()("BuildError", {
  message: Schema.String,
}) {}

const decodeTheme = Schema.decodeUnknownEffect(Schema.fromJsonString(Theme));

const decodeTargets = Schema.decodeUnknownEffect(
  Schema.Array(Schema.Literals(targets)),
);

/** Reads and decodes one theme document. */
const read = Effect.fn("read")(function* (file: string) {
  const fs = yield* FileSystem.FileSystem;

  return yield* fs.readFileString(file).pipe(
    Effect.flatMap(decodeTheme),
    Effect.mapError(
      (error) =>
        new BuildError({
          message: `${file} isn't a theme document: ${String(error)}`,
        }),
    ),
  );
});

/** Groundwork's own theme documents, in name order. */
const groundworkThemes = Effect.fn("groundworkThemes")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const directory = path.join(import.meta.dirname, "../themes");

  const files = (yield* fs.readDirectory(directory))
    .filter((file) => file.endsWith(".json"))
    .toSorted();

  return yield* Effect.forEach(files, (file) =>
    read(path.join(directory, file)),
  );
});

const buildCommand = Command.make(
  "build",
  {
    files: Argument.String("theme").pipe(
      Argument.withDescription("A theme document, as JSON"),
      Argument.atLeast(0),
    ),
    out: Flag.String("out").pipe(
      Flag.withDescription("The folder to write to"),
      Flag.withDefault("generated"),
    ),
    targets: Flag.String("targets").pipe(
      Flag.withDescription(`Some of ${targets.join(", ")}, comma separated`),
      Flag.withDefault(targets.join(",")),
    ),
    withGroundwork: Flag.Boolean("with-groundwork").pipe(
      Flag.withDescription("Add Groundwork's own themes after yours"),
      Flag.withDefault(false),
    ),
    strict: Flag.Boolean("strict").pipe(
      Flag.withDescription(
        "Fail when one of your themes misses a contrast target",
      ),
      Flag.withDefault(false),
    ),
  },
  Effect.fn("build")(function* (options) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    if (options.files.length === 0 && !options.withGroundwork) {
      return yield* new BuildError({
        message: "Give at least one theme document, or --with-groundwork",
      });
    }

    const wanted = yield* decodeTargets(options.targets.split(",")).pipe(
      Effect.mapError(
        () =>
          new BuildError({
            message: `--targets takes some of ${targets.join(", ")}`,
          }),
      ),
    );

    const own = yield* Effect.forEach(options.files, read);
    const groundwork = options.withGroundwork ? yield* groundworkThemes() : [];
    const result = build([...own, ...groundwork], { targets: wanted });

    for (const [name, contents] of Object.entries(result.files)) {
      const file = path.join(options.out, name);

      yield* fs.makeDirectory(path.dirname(file), { recursive: true });
      yield* fs.writeFileString(file, contents);
    }

    const ownIds = new Set(own.map((theme) => theme.id));

    const misses = result.checks.filter(
      (check) => !check.passes && ownIds.has(check.theme),
    );

    for (const miss of misses) {
      yield* Console.log(
        `✗ ${miss.theme} ${miss.mode} ${miss.role}: ${miss.ratio.toFixed(2)} < ${miss.target}`,
      );
    }

    yield* Console.log(
      `Wrote ${Object.keys(result.files).length} files to ${options.out}, ${misses.length === 0 ? "every role meets its contrast target" : `${misses.length} roles below their contrast target`}`,
    );

    if (options.strict && misses.length > 0) {
      return yield* new BuildError({
        message: `${misses.length} roles miss their contrast target`,
      });
    }
  }),
).pipe(
  Command.withDescription(
    "Build theme documents into CSS, JSON, TypeScript, QML, OpenTUI, ANSI and Blume tokens",
  ),
);

Command.make("groundwork-tokens").pipe(
  Command.withSubcommands([buildCommand]),
  Command.run({ version: "0.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
