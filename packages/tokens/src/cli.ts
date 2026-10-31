#!/usr/bin/env bun
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, FileSystem, Path, Schema } from "effect";
import { Command, Flag } from "effect/cli";
import {
  ansi,
  blumeTheme,
  contrastPage,
  css,
  json,
  opentui,
  optionalPage,
  qml,
  themePage,
  typescript,
} from "./generate.ts";
import { Theme } from "./schema.ts";
import { check, resolve, type ResolvedTheme } from "./solve.ts";

class TokensError extends Schema.TaggedError<TokensError>()("TokensError", {
  message: Schema.String,
}) {}

/** A generated file's path and contents. */
type Output = readonly [file: string, contents: string];

/** Core themes in the order the docs present them; optional ones follow. */
const order = ["base", "glazing", "survey", "slate", "bridge", "snag"];

const decodeTheme = Schema.decodeUnknownEffect(Schema.fromJsonString(Theme));

const packageRoot = Effect.gen(function* () {
  const path = yield* Path.Path;

  return path.resolve(import.meta.dirname, "..");
});

const loadThemes = Effect.fn("loadThemes")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const directory = path.join(yield* packageRoot, "themes");

  const files = (yield* fs.readDirectory(directory)).filter((file) =>
    file.endsWith(".json"),
  );

  const themes = yield* Effect.forEach(files, (file) =>
    fs.readFileString(path.join(directory, file)).pipe(
      Effect.flatMap(decodeTheme),
      Effect.mapError(
        (error) => new TokensError({ message: `${file}: ${String(error)}` }),
      ),
    ),
  );

  const base = themes.find((theme) => theme.id === "base");

  if (base === undefined || base.kind !== "solved") {
    return yield* new TokensError({ message: "themes/base.json is missing" });
  }

  const rank = (id: string) => {
    const index = order.indexOf(id);

    return index === -1 ? order.length : index;
  };

  return themes
    .map((theme) => resolve(theme, base.style))
    .toSorted((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
});

const outputs = Effect.fn("outputs")(function* (
  themes: readonly ResolvedTheme[],
) {
  const path = yield* Path.Path;
  const root = yield* packageRoot;
  const generated = (file: string) => path.join(root, "generated", file);

  const docs = (file: string) =>
    path.join(root, "../../docs/src/content/docs/themes", file);

  const docsKit = (file: string) =>
    path.join(root, "../docs-kit/src/blume/themes", file);

  const output = (file: string, contents: string): Output => [file, contents];

  return [
    ...themes.flatMap((theme) =>
      theme.optional
        ? []
        : [
            output(docs(`${theme.id}.mdx`), themePage(theme)),
            output(docsKit(`${theme.id}.css`), blumeTheme(theme)),
          ],
    ),
    output(docs("optional.mdx"), optionalPage(themes)),
    output(generated("themes.css"), css(themes)),
    output(generated("themes.json"), json(themes)),
    output(generated("themes.ts"), typescript(themes)),
    output(generated("Themes.qml"), qml(themes)),
    output(generated("opentui.ts"), opentui(themes)),
    output(generated("ansi.json"), ansi()),
    output(docs("contrast.md"), contrastPage(themes)),
  ];
});

const gen = Command.make(
  "gen",
  {
    check: Flag.Boolean("check").pipe(
      Flag.withDescription("Fail when a generated file is out of date"),
      Flag.withDefault(false),
    ),
  },
  Effect.fn("gen")(function* ({ check: checkOnly }) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const root = yield* packageRoot;
    const files = yield* outputs(yield* loadThemes());
    const stale: string[] = [];

    for (const [file, contents] of files) {
      const current = (yield* fs.exists(file))
        ? yield* fs.readFileString(file)
        : "";

      if (current === contents) continue;

      stale.push(path.relative(root, file));

      if (!checkOnly) {
        yield* fs.makeDirectory(path.dirname(file), { recursive: true });
        yield* fs.writeFileString(file, contents);
      }
    }

    if (checkOnly && stale.length > 0) {
      return yield* new TokensError({
        message: `Out of date, run mise run gen: ${stale.join(", ")}`,
      });
    }

    yield* Console.log(
      stale.length === 0
        ? "Generated files are up to date"
        : `${checkOnly ? "Stale" : "Wrote"} ${stale.join(", ")}`,
    );
  }),
).pipe(
  Command.withDescription("Generate every target from the theme documents"),
);

const contrast = Command.make(
  "contrast",
  {},
  Effect.fn("contrast")(function* () {
    const themes = yield* loadThemes();

    const results = themes.flatMap((theme) =>
      check(theme).map((result) => ({ ...result, optional: theme.optional })),
    );

    const misses = results.filter((result) => !result.passes);
    const failing = misses.filter((result) => !result.optional);

    for (const miss of failing) {
      yield* Console.log(
        `✗ ${miss.theme} ${miss.mode} ${miss.role}: ${miss.ratio.toFixed(2)} < ${miss.target}`,
      );
    }

    yield* Console.log(
      `Core themes: ${failing.length === 0 ? "every role meets its target" : `${failing.length} misses`}. Optional themes: ${misses.length - failing.length} below target, reported in the docs.`,
    );

    if (failing.length > 0) {
      return yield* new TokensError({
        message: `${failing.length} core theme roles miss their contrast target`,
      });
    }
  }),
).pipe(
  Command.withDescription("Check every core theme meets its contrast targets"),
);

Command.make("tokens").pipe(
  Command.withSubcommands([gen, contrast]),
  Command.run({ version: "0.0.0" }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
