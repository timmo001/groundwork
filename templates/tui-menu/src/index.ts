#!/usr/bin/env bun
/**
 * The TUI menu's entry point: parses the flags, loads the Groundwork theme
 * and starts the OpenTUI renderer with the menu app.
 *
 * @module
 */
import { createCliRenderer } from "@opentui/core";
import { Cause, Effect, Exit } from "effect";
import { parseFlags, printHelp, resolveSubcommand } from "./flags.js";
import { menuItemsById } from "./menu.js";
import { createCommandRunner } from "./services/command-runner.js";
import { loadTheme } from "./theme.js";
import { App } from "./tui/app.js";
import { Toast } from "./tui/toast.js";

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

const program = Effect.gen(function* () {
  const theme = yield* loadTheme;

  const renderer = yield* Effect.promise(() =>
    createCliRenderer({
      exitOnCtrlC: true,
      screenMode: "alternate-screen",
      useMouse: false,
      backgroundColor: theme.bg,
      onDestroy: () => process.exit(0),
    }),
  );

  const toast = new Toast(renderer, theme);
  const commandRunner = createCommandRunner(renderer, toast);

  // The app builds its views on the renderer, which keeps them alive
  yield* Effect.sync(
    () =>
      new App(
        { renderer, theme, commandRunner },
        { title: "TUI menu", subtitle: "Groundwork template", executeItemId },
      ),
  );

  renderer.start();

  // Keep alive until the process exits
  return yield* Effect.never;
});

void Effect.runPromiseExit(program).then((exit) => {
  if (Exit.isFailure(exit)) {
    console.error(Cause.pretty(exit.cause));
    process.exit(1);
  }
});
