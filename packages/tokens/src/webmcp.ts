/**
 * Theme tools for WebMCP: lets an agent in the browser read, list and set the
 * page's theme through the page's own code, so the UI the user sees changes
 * with it. It does nothing where the browser has no `document.modelContext`.
 * Spec: https://github.com/webmachinelearning/webmcp
 *
 * @module
 */
import { Result, Schema } from "effect";
import base from "../themes/base.json" with { type: "json" };
import bridge from "../themes/bridge.json" with { type: "json" };
import glazing from "../themes/glazing.json" with { type: "json" };
import slate from "../themes/slate.json" with { type: "json" };
import snag from "../themes/snag.json" with { type: "json" };
import survey from "../themes/survey.json" with { type: "json" };
import { omarchyTheme } from "./omarchy.ts";
import {
  parseTheme,
  runtimeTheme,
  type RuntimeTheme,
  type ThemeStore,
} from "./runtime.ts";
import { SolvedTheme, type Theme } from "./schema.ts";

/**
 * The part of WebMCP's `ModelContext` these tools use. Declared here rather
 * than taken from a types package, since the API is still moving.
 */
export interface ModelContext {
  readonly registerTool: (
    tool: ModelContextTool,
    options?: { readonly signal?: AbortSignal },
  ) => Promise<void> | void;
}

/** A tool's text result, in the shape MCP uses. */
export interface ToolResult {
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
}

export interface ModelContextTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema?: object;
  /** Takes the agent's arguments, which the tool still decodes itself. */
  readonly execute: (input: ToolArguments) => Promise<ToolResult>;
}

/** The arguments these tools take. Agents can send anything, so they're decoded. */
export interface ToolArguments {
  readonly id?: string;
  readonly theme?: string;
}

declare global {
  interface Document {
    /** WebMCP's tool registry, where the browser has it. */
    readonly modelContext?: ModelContext;
  }
}

/** What `set-theme` takes: a built-in theme's id, or a theme's text. */
const SetThemeInput = Schema.Struct({
  id: Schema.optionalKey(Schema.String),
  theme: Schema.optionalKey(Schema.String),
});

/** The core themes, in the order the docs list them. */
export const coreThemes: readonly SolvedTheme[] = [
  base,
  glazing,
  survey,
  slate,
  bridge,
  snag,
].map((document) => Schema.decodeUnknownSync(SolvedTheme)(document));

export interface ThemeToolsOptions {
  /** Where the user's theme document is kept. */
  readonly store: ThemeStore;
  /** Applies a solved theme to the page, as the app's own picker would. */
  readonly apply: (theme: {
    readonly text: string;
    readonly document: Theme;
    readonly runtime: RuntimeTheme;
  }) => void;
  /** Themes an agent can pick by id. Defaults to the core themes. */
  readonly themes?: readonly Theme[];
  /** Unregisters the tools when aborted. */
  readonly signal?: AbortSignal;
  /** The model context to register on. Defaults to `document.modelContext`. */
  readonly context?: ModelContext;
}

const text = (message: string): ToolResult => ({
  content: [{ type: "text", text: message }],
});

/** The roles a theme misses its contrast target on, for the agent to report. */
const misses = (runtime: RuntimeTheme) =>
  runtime.checks
    .filter((result) => !result.passes)
    .map(
      (result) =>
        `${result.role} in ${result.mode} (${result.ratio.toFixed(2)})`,
    );

/** Reads a theme from JSON text or an Omarchy `colors.toml`. */
const readTheme = (input: string) => {
  const parsed = parseTheme(input);

  if (Result.isSuccess(parsed)) return parsed;

  return input.trimStart().startsWith("{") ? parsed : omarchyTheme(input);
};

/**
 * Registers `get-theme`, `list-themes` and `set-theme`. Returns whether the
 * browser offered a model context to register them on.
 */
export const registerThemeTools = (options: ThemeToolsOptions): boolean => {
  const context =
    options.context ??
    ("document" in globalThis ? document.modelContext : undefined);

  if (context === undefined) return false;

  const themes = options.themes ?? coreThemes;

  const registration =
    options.signal === undefined ? {} : { signal: options.signal };

  const apply = async (document: Theme) => {
    const source = JSON.stringify(document, null, 2);
    const runtime = runtimeTheme(document);

    options.apply({ text: source, document, runtime });
    await options.store.save(source);

    const missed = misses(runtime);

    return text(
      missed.length === 0
        ? `Applied ${document.name}. Every role meets its contrast target.`
        : `Applied ${document.name}, with ${missed.length} roles below target: ${missed.join(", ")}.`,
    );
  };

  void context.registerTool(
    {
      name: "get-theme",
      description:
        "Returns the user's own theme document on this page, if they have one, and any roles that miss their contrast target.",
      execute: async () => {
        const stored = await options.store.load();

        if (stored === null)
          return text(
            "No custom theme is set; the page uses its built-in theme.",
          );

        const parsed = readTheme(stored);

        if (Result.isFailure(parsed))
          return text(
            "The stored theme no longer decodes, so the page ignores it.",
          );

        const report = {
          document: parsed.success,
          misses: misses(runtimeTheme(parsed.success)),
        };

        return text(JSON.stringify(report, null, 2));
      },
    },
    registration,
  );

  void context.registerTool(
    {
      name: "list-themes",
      description:
        "Lists the built-in themes by id and name, to pick one with set-theme.",
      execute: async () =>
        text(
          JSON.stringify(
            themes.map((theme) => ({ id: theme.id, name: theme.name })),
            null,
            2,
          ),
        ),
    },
    registration,
  );

  void context.registerTool(
    {
      name: "set-theme",
      description:
        "Applies a theme to this page and keeps it. Give the id of a built-in theme, or a Groundwork theme document as JSON, or the text of an Omarchy colors.toml.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "A built-in theme's id, from list-themes.",
          },
          theme: {
            type: "string",
            description:
              "A Groundwork theme document as JSON, or an Omarchy colors.toml's text.",
          },
        },
      },
      execute: async (input) => {
        const decoded = Schema.decodeUnknownResult(SetThemeInput)(input);

        if (Result.isFailure(decoded))
          return text("Give id or theme as a string.");

        const { id, theme } = decoded.success;

        if (id !== undefined) {
          const found = themes.find((item) => item.id === id);

          return found === undefined
            ? text(
                `No built-in theme has the id "${id}". Call list-themes for the ids.`,
              )
            : apply(found);
        }

        if (theme === undefined) return text("Give either id or theme.");

        const parsed = readTheme(theme);

        return Result.isSuccess(parsed)
          ? apply(parsed.success)
          : text(
              `That isn't a theme document or an Omarchy colors.toml: ${String(parsed.failure).slice(0, 400)}`,
            );
      },
    },
    registration,
  );

  return true;
};
