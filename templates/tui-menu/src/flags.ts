/**
 * The command line: flags, and subcommands that resolve to menu items by
 * greedy longest match.
 *
 * @module
 */
import { menuItemsById, submenus } from "./menu.js";

/** Parsed CLI flags */
export interface Flags {
  /** Resolved subcommand (dot-separated path) matching a menu item ID or submenu */
  readonly subcommand: string | undefined;
  /** Show help and exit */
  readonly help: boolean;
  /** Remaining args not consumed by subcommand or flag parsing */
  readonly rest: readonly string[];
}

/** Whether a subcommand names a menu item or submenu */
export function isKnownTarget(candidate: string): boolean {
  return menuItemsById.has(candidate) || submenus.has(candidate);
}

/**
 * Parse CLI args into structured flags with greedy subcommand resolution.
 *
 * Positional args are joined with `.` using greedy longest-match against
 * the menu registry. For example, `["settings", "display", "colors"]` resolves
 * to subcommand `"settings.display.colors"` if that ID exists in the registry.
 */
export function parseFlags(args: readonly string[]): Flags {
  let subcommand: string | undefined;
  let help = false;
  const rest: string[] = [];

  const firstFlag = args.findIndex((arg) => arg.startsWith("-"));
  const positionals = firstFlag === -1 ? [...args] : args.slice(0, firstFlag);
  const flagArgs = firstFlag === -1 ? [] : args.slice(firstFlag);

  if (positionals.length > 0) {
    let consumed = 0;

    for (let len = positionals.length; len >= 1; len--) {
      const candidate = positionals.slice(0, len).join(".");

      if (isKnownTarget(candidate)) {
        subcommand = candidate;
        consumed = len;
        break;
      }
    }

    // An unknown subcommand is kept so the caller can report it
    if (consumed === 0) {
      subcommand = positionals[0];
      consumed = 1;
    }

    rest.push(...positionals.slice(consumed));
  }

  for (const arg of flagArgs) {
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else {
      rest.push(arg);
    }
  }

  return { subcommand, help, rest };
}

/** Print help text */
export function printHelp(): void {
  console.log(`Usage: tui-menu [subcommand...] [options]

Launch the TUI menu. Without a subcommand, opens the main menu.

Subcommands can be specified as space-separated paths that resolve
against the menu registry:

  tui-menu settings              Open the settings submenu
  tui-menu settings display      Open display settings
  tui-menu greet                 Execute the greet action

Options:
  --help, -h  Show this help message

Environment:
  GW_THEME    A Groundwork core theme's id, such as glazing (default: base)
  GW_MODE     light, dark or darker (default: dark)

Examples:
  tui-menu                       Main menu
  tui-menu settings display      Display settings submenu
  tui-menu system-info           Execute system info directly`);
}
