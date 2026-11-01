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

/** Check whether a candidate string matches any known menu item or submenu */
function isKnownTarget(candidate: string): boolean {
  if (menuItemsById.has(candidate) || submenus.has(candidate)) return true;

  return false;
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

  // The leading positional args, before any flag
  const firstFlag = args.findIndex((arg) => arg.startsWith("-"));
  const positionals = firstFlag === -1 ? [...args] : args.slice(0, firstFlag);
  const flagArgs = firstFlag === -1 ? [] : args.slice(firstFlag);

  // Greedy longest-match resolution for subcommand path
  if (positionals.length > 0) {
    let consumed = 0;

    // Try longest candidate first, shrink until a match is found
    for (let len = positionals.length; len >= 1; len--) {
      const candidate = positionals.slice(0, len).join(".");

      if (isKnownTarget(candidate)) {
        subcommand = candidate;
        consumed = len;
        break;
      }
    }

    if (consumed === 0) {
      // No match: use first positional (will fail in resolveSubcommand)
      subcommand = positionals[0];
      consumed = 1;
    }

    // Push unconsumed positionals to rest
    rest.push(...positionals.slice(consumed));
  }

  // Parse remaining flags
  for (const arg of flagArgs) {
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else {
      rest.push(arg);
    }
  }

  return { subcommand, help, rest };
}

/** Resolve a subcommand string to a menu item target */
export function resolveSubcommand(
  sub: string,
): { type: "item"; itemId: string } | undefined {
  if (menuItemsById.has(sub)) return { type: "item", itemId: sub };

  if (submenus.has(sub)) return { type: "item", itemId: sub };

  return undefined;
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
