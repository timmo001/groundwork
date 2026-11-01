#!/usr/bin/env bun
/**
 * The TUI menu's entry point: parses the flags, picks the Groundwork theme
 * (`GW_THEME` and `GW_MODE`, then the one picked in the menu, then the
 * desktop's Omarchy theme) and starts the OpenTUI renderer with the menu app.
 *
 * @module
 */
import { NodeServices } from "@effect/platform-node";
import { createCliRenderer } from "@opentui/core";
import { Cause, Config, Effect, Exit, Option } from "effect";
import { parseFlags, printHelp, resolveSubcommand } from "./flags.js";
import { menuItemsById, registerUpdates } from "./menu.js";
import { createCommandRunner } from "./services/command-runner.js";
import { createItemsRunner } from "./services/items.js";
import { resolveTheme, Toast, type ThemePick } from "@timmo001/groundwork-tui";
import { readThemePick, saveThemePick } from "./theme-store.js";
import { App } from "./tui/app.js";

const flags = parseFlags(process.argv.slice(2));

if (flags.help) {
  printHelp();
  process.exit(0);
}

/** The item a subcommand asks to run at startup, if any */
const startupItem = (): string | undefined => {
  if (flags.subcommand === undefined) return undefined;

  const resolved = resolveSubcommand(flags.subcommand);

  if (resolved === undefined) {
    console.error(`Unknown subcommand: ${flags.subcommand}`);
    printHelp();
    process.exit(1);
  }

  const type = menuItemsById.get(resolved.itemId)?.action.type;

  return type === "command" ||
    type === "silent" ||
    type === "notify" ||
    type === "submenu"
    ? resolved.itemId
    : undefined;
};

const executeItemId = startupItem();

/** Opens the renderer and the app in a theme; a new pick opens them again. */
const open = (pick: ThemePick): Effect.Effect<void> =>
  Effect.gen(function* () {
    const theme = yield* resolveTheme(pick);
    let reopening = false;

    const renderer = yield* Effect.promise(() =>
      createCliRenderer({
        exitOnCtrlC: true,
        screenMode: "alternate-screen",
        useMouse: true,
        backgroundColor: theme.bg,
        onDestroy: () => {
          if (!reopening) process.exit(0);
        },
      }),
    );

    const toast = new Toast(renderer, theme);
    const commandRunner = createCommandRunner(renderer, toast);
    const itemsRunner = createItemsRunner(toast);

    registerUpdates(yield* Effect.promise(() => itemsRunner.list()));

    // Every view is built in the theme, so a new one starts the app afresh,
    // and the old renderer takes its views and listeners with it
    const onThemePick = (next: ThemePick) => {
      reopening = true;
      renderer.destroy();

      // The terminal is only free for the next renderer once this one closes
      void Effect.runPromise(
        saveThemePick(next).pipe(
          Effect.ignore,
          Effect.andThen(Effect.promise(() => renderer.closed)),
          Effect.andThen(open(next)),
          Effect.provide(NodeServices.layer),
        ),
      );
    };

    // The app builds its views on the renderer, which keeps them alive
    yield* Effect.sync(
      () =>
        new App(
          {
            renderer,
            theme,
            commandRunner,
            itemsRunner,
            themePick: pick,
            onThemePick,
          },
          { title: "TUI menu", subtitle: "Groundwork template", executeItemId },
        ),
    );

    renderer.start();
  });

const program = Effect.gen(function* () {
  // GW_THEME and GW_MODE win over the pick saved from the menu
  const theme = yield* Config.option(Config.String("GW_THEME"));
  const mode = yield* Config.option(Config.String("GW_MODE"));
  const saved = yield* readThemePick;

  yield* open(
    Option.isSome(theme) || Option.isSome(mode) || saved === null
      ? {
          theme: Option.getOrUndefined(theme),
          mode: Option.getOrUndefined(mode),
        }
      : saved,
  );

  // Keep alive until the process exits
  return yield* Effect.never;
});

void Effect.runPromiseExit(
  program.pipe(Effect.provide(NodeServices.layer)),
).then((exit) => {
  if (Exit.isFailure(exit)) {
    console.error(Cause.pretty(exit.cause));
    process.exit(1);
  }
});
