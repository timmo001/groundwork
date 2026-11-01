/**
 * The MCP server: the CLI's operations as tools, with the destructive ones
 * left out unless they're asked for.
 *
 * @module
 */
import { NodeStdio } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import { McpProtocol, McpServer, Tool, Toolkit } from "effect/ai";
import { Item, Items, ItemsError } from "./operations.ts";

// Failures go back to the client as the tool's result, so an agent can read
// them and carry on.
const Status = Tool.make("status", {
  description: "List every item and whether it has something to apply",
  success: Schema.Struct({ items: Schema.Array(Item) }),
  failure: ItemsError,
  failureMode: "return",
}).annotate(Tool.Readonly, true);

const Apply = Tool.make("apply", {
  description: "Apply the pending items, or only the ones named",
  parameters: Schema.Struct({
    ids: Schema.optionalKey(Schema.Array(Schema.String)),
  }),
  success: Schema.Struct({ applied: Schema.Array(Item) }),
  failure: ItemsError,
  failureMode: "return",
}).annotate(Tool.Destructive, false);

const Restart = Tool.make("restart", {
  description: "Restart the system the items belong to",
  success: Schema.Struct({ restarted: Schema.Boolean }),
  failure: ItemsError,
  failureMode: "return",
}).annotate(Tool.Destructive, true);

const SafeTools = Toolkit.make(Status, Apply);

const AllTools = Toolkit.make(Status, Apply, Restart);

const handlers = Effect.gen(function* () {
  const items = yield* Items;

  return {
    status: () => Effect.map(items.list(), (list) => ({ items: list })),
    apply: Effect.fn("mcp.apply")(function* ({
      ids,
    }: {
      readonly ids?: readonly string[];
    }) {
      const pending = (yield* items.list()).filter(
        (item) => item.pending && (ids === undefined || ids.includes(item.id)),
      );

      const applied = yield* Effect.forEach(pending, (item) =>
        items.apply(item.id),
      );

      return { applied };
    }),
    restart: () => Effect.as(items.restart(), { restarted: true }),
  };
});

const server = (
  registrations: Layer.Layer<never, never, McpServer.McpServer>,
) =>
  registrations.pipe(
    Layer.provide(
      McpServer.layerStdio({
        name: "cli-tool",
        version: "0.0.0",
        protocols: [McpProtocol.v2026_07_28, McpProtocol.v2025_11_25],
      }),
    ),
    Layer.provide(NodeStdio.layer),
  );

/**
 * Serve the operations over MCP. Power operations stay out unless the server
 * was started with `--allow-power`.
 */
export const serveMcp = Effect.fn("serveMcp")(function* ({
  allowPower,
}: {
  readonly allowPower: boolean;
}) {
  const implementation = yield* handlers;

  const registrations = allowPower
    ? McpServer.toolkit(AllTools).pipe(
        Layer.provide(AllTools.toLayer(Effect.succeed(implementation))),
      )
    : McpServer.toolkit(SafeTools).pipe(
        Layer.provide(SafeTools.toLayer(Effect.succeed(implementation))),
      );

  return yield* Layer.launch(server(registrations));
});
