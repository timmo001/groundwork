/**
 * Where the theme picked in the menu is kept between runs:
 * `$XDG_CONFIG_HOME/tui-menu/theme.json`. `GW_THEME` and `GW_MODE` still win
 * over it, so a one-off run can try another theme.
 *
 * @module
 */
import type { ThemePick } from "@timmo001/groundwork-tui";
import { Config, Effect, FileSystem, Path, Schema } from "effect";

const SavedPick = Schema.fromJsonString(
  Schema.Struct({
    theme: Schema.optional(Schema.String),
    mode: Schema.optional(Schema.String),
  }),
);

const pickPath = Effect.gen(function* () {
  const path = yield* Path.Path;

  const config = yield* Config.String("XDG_CONFIG_HOME").pipe(
    Config.orElse(() =>
      Config.String("HOME").pipe(
        Config.map((home) => path.join(home, ".config")),
      ),
    ),
  );

  return path.join(config, "tui-menu", "theme.json");
});

/** The saved pick, or `null` before one is made or when it can't be read. */
export const readThemePick: Effect.Effect<
  ThemePick | null,
  never,
  FileSystem.FileSystem | Path.Path
> = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString(yield* pickPath);

  return yield* Schema.decodeUnknownEffect(SavedPick)(text);
}).pipe(Effect.orElseSucceed(() => null));

/** Keeps the pick for the next run. */
export const saveThemePick = Effect.fn("ThemeStore.save")(function* (
  pick: ThemePick,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const file = yield* pickPath;

  yield* fs.makeDirectory(path.dirname(file), { recursive: true });
  yield* fs.writeFileString(file, `${JSON.stringify(pick, null, 2)}\n`);
});
