#!/usr/bin/env bun
/**
 * The CLI: `status`, `apply` and `restart` for people, with `--json` for
 * scripts and agents, and `mcp` to serve the same operations over MCP.
 *
 * @module
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, Layer } from "effect";
import { Argument, Command, Flag, Prompt } from "effect/cli";
import { serveMcp } from "./mcp.ts";
import { Items, ItemsError, operations, type Item } from "./operations.ts";

const json = Flag.Boolean("json").pipe(
  Flag.withDescription("Print JSON for scripts and agents instead of text"),
  Flag.withDefault(false),
);

const yes = Flag.Boolean("yes").pipe(
  Flag.withAlias("y"),
  Flag.withDescription("Skip the picker or the confirmation"),
  Flag.withDefault(false),
);

/** Pickers and confirmations only run on a terminal, never under an agent or script. */
const interactive = Effect.sync(
  () => process.stdin.isTTY === true && process.stdout.isTTY === true,
);

const status = Command.make(
  "status",
  { json },
  Effect.fn("status")(function* ({ json }) {
    const items = yield* (yield* Items).list();

    if (json) return yield* Console.log(JSON.stringify({ items }, null, 2));

    for (const item of items) {
      yield* Console.log(
        `${item.pending ? "●" : "○"} ${item.name}${item.pending ? "  pending" : ""}`,
      );
    }
  }),
).pipe(
  Command.withDescription(
    "List every item and whether it has something to apply",
  ),
);

/** The items to apply: those named, all ticked in a picker, or all pending. */
const choose = Effect.fn("choose")(function* (
  pending: readonly Item[],
  named: readonly string[],
  skipPicker: boolean,
) {
  if (named.length > 0) {
    return pending.filter((item) => named.includes(item.id));
  }

  if (skipPicker || !(yield* interactive)) return pending;

  return yield* Prompt.run(
    Prompt.MultiSelect({
      message: "Apply",
      choices: pending.map((item) => ({
        title: item.name,
        value: item,
        selected: true,
      })),
    }),
  );
});

const apply = Command.make(
  "apply",
  {
    json,
    yes,
    check: Flag.Boolean("check").pipe(
      Flag.withDescription(
        "List what would be applied without changing anything",
      ),
      Flag.withDefault(false),
    ),
    force: Flag.Boolean("force").pipe(
      Flag.withDescription("Apply every item, even ones with nothing pending"),
      Flag.withDefault(false),
    ),
    ids: Argument.String("id").pipe(
      Argument.withDescription("Only these items"),
      Argument.variadic(),
    ),
  },
  Effect.fn("apply")(function* ({ json, yes, check, force, ids }) {
    const items = yield* Items;
    const all = yield* items.list();
    const pending = force ? all : all.filter((item) => item.pending);

    if (pending.length === 0) {
      return yield* json
        ? Console.log(JSON.stringify({ applied: [] }, null, 2))
        : Console.log("Nothing to apply");
    }

    if (check) {
      return yield* json
        ? Console.log(JSON.stringify({ wouldApply: pending }, null, 2))
        : Console.log(pending.map((item) => `● ${item.name}`).join("\n"));
    }

    const chosen = yield* choose(pending, ids, yes || json);
    const applied: Item[] = [];

    for (const [index, item] of chosen.entries()) {
      if (!json) {
        yield* Console.log(`[${index + 1}/${chosen.length}] ${item.name}`);
      }

      applied.push(yield* items.apply(item.id));
    }

    if (json) yield* Console.log(JSON.stringify({ applied }, null, 2));
  }),
).pipe(
  Command.withDescription("Apply the pending items, all or the ones picked"),
);

const restart = Command.make(
  "restart",
  { yes },
  Effect.fn("restart")(function* ({ yes }) {
    if (!yes) {
      if (!(yield* interactive)) {
        return yield* new ItemsError({
          message: "restart needs --yes when not run from a terminal",
        });
      }

      const confirmed = yield* Prompt.run(
        Prompt.Confirm({ message: "Restart now?", initial: false }),
      );

      if (!confirmed) return yield* Console.log("Not restarted");
    }

    yield* (yield* Items).restart();
    yield* Console.log("Restarting");
  }),
).pipe(Command.withDescription("Restart the system the items belong to"));

/** The Code Mode manifest: every operation with how an agent may use it. */
const agentTools = Command.make(
  "tools",
  { json },
  Effect.fn("agentTools")(function* () {
    const manifest = {
      tool: "cli-tool",
      operations: operations.map((operation) => ({
        name: operation.name,
        description: operation.description,
        access: operation.access,
        command: ["cli-tool", operation.name],
        json: operation.name !== "restart",
      })),
    };

    yield* Console.log(JSON.stringify(manifest, null, 2));
  }),
).pipe(Command.withDescription("Print the Code Mode manifest as JSON"));

const agent = Command.make("agent").pipe(
  Command.withDescription("Agent surfaces"),
  Command.withSubcommands([agentTools]),
);

const mcp = Command.make(
  "mcp",
  {
    allowPower: Flag.Boolean("allow-power").pipe(
      Flag.withDescription("Include power operations such as restart"),
      Flag.withDefault(false),
    ),
  },
  ({ allowPower }) => serveMcp({ allowPower }),
).pipe(Command.withDescription("Serve the operations over MCP on stdio"));

const cli = Command.make("cli-tool").pipe(
  Command.withDescription(
    "An example tool built to the Groundwork CLI conventions",
  ),
  Command.withSubcommands([status, apply, restart, agent, mcp]),
);

cli.pipe(
  Command.run({ version: "0.0.0" }),
  Effect.provide(Layer.mergeAll(Items.layer, NodeServices.layer)),
  NodeRuntime.runMain,
);
