/**
 * The demo app every target shows: a small update tool with items to apply
 * and a system to restart. Its data and actions sit behind the `Items`
 * service, with fixture data here, so each target swaps in a real backend in
 * one place. Docs: https://groundwork.timmo.dev/demo
 *
 * @packageDocumentation
 */
import { Context, Effect, Layer, Schema } from "effect";

/**
 * How an agent may use an operation. The CLI, the Code Mode manifest and the
 * MCP server all read this, so one command reaches all three at once.
 */
export const Access = Schema.Literals(["read", "write", "ask", "power"]);

export type Access = typeof Access.Type;

export const Item = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  /** The version in use. */
  current: Schema.String,
  /** The version waiting to be applied, the same as `current` when none is. */
  available: Schema.String,
  pending: Schema.Boolean,
});

export interface Item extends Schema.Schema.Type<typeof Item> {}

export class ItemsError extends Schema.TaggedError<ItemsError>()("ItemsError", {
  message: Schema.String,
}) {}

/** The fixture items every demo starts from. */
export const fixtureItems: readonly Item[] = [
  {
    id: "tools",
    name: "mise tools",
    description: "Bun, Node and the linters the checks run",
    current: "2026.10.4",
    available: "2026.11.0",
    pending: true,
  },
  {
    id: "skills",
    name: "Shared skills",
    description: "Agent skills synced from the skills repository",
    current: "a1c09e2",
    available: "f42b7d0",
    pending: true,
  },
  {
    id: "themes",
    name: "Themes",
    description: "Groundwork's tokens and theme CSS",
    current: "0.3.1",
    available: "0.3.1",
    pending: false,
  },
  {
    id: "firmware",
    name: "Firmware",
    description: "The machine's BIOS and device firmware",
    current: "1.19",
    available: "1.21",
    pending: true,
  },
];

/** The system a demo controls. Replace its layer with the real system's. */
export class Items extends Context.Service<
  Items,
  {
    readonly list: () => Effect.Effect<readonly Item[], ItemsError>;
    readonly apply: (id: string) => Effect.Effect<Item, ItemsError>;
    readonly restart: () => Effect.Effect<void, ItemsError>;
  }
>()("groundwork-demo/Items") {
  /** In memory, from the fixture items, reset each time it's built. */
  static readonly fixture = Layer.sync(Items, () => {
    const items = new Map(fixtureItems.map((item) => [item.id, item]));

    return Items.of({
      list: () => Effect.succeed([...items.values()]),
      apply: Effect.fn("Items.apply")(function* (id: string) {
        const item = items.get(id);

        if (item === undefined) {
          return yield* new ItemsError({ message: `No item called ${id}` });
        }

        const applied: Item = {
          id: item.id,
          name: item.name,
          description: item.description,
          current: item.available,
          available: item.available,
          pending: false,
        };

        items.set(id, applied);

        return applied;
      }),
      restart: () => Effect.void,
    });
  });
}

/** One operation, described once for every target and agent surface. */
export interface Operation {
  readonly name: string;
  readonly description: string;
  readonly access: Access;
}

export const operations: readonly Operation[] = [
  {
    name: "status",
    description: "List every item and whether it has something to apply",
    access: "read",
  },
  {
    name: "apply",
    description: "Apply the pending items, all or the ones picked",
    access: "write",
  },
  {
    name: "restart",
    description: "Restart the system the items belong to",
    access: "power",
  },
];
