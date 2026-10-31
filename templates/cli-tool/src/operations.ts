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
  pending: Schema.Boolean,
});

export interface Item extends Schema.Schema.Type<typeof Item> {}

export class ItemsError extends Schema.TaggedError<ItemsError>()("ItemsError", {
  message: Schema.String,
}) {}

/** The system the tool controls. Replace it with the real SDK's service. */
export class Items extends Context.Service<
  Items,
  {
    readonly list: () => Effect.Effect<readonly Item[], ItemsError>;
    readonly apply: (id: string) => Effect.Effect<Item, ItemsError>;
    readonly restart: () => Effect.Effect<void, ItemsError>;
  }
>()("cli-tool/Items") {
  static readonly layer = Layer.sync(Items, () => {
    const items = new Map<string, Item>([
      ["tools", { id: "tools", name: "mise tools", pending: true }],
      ["skills", { id: "skills", name: "Shared skills", pending: true }],
      ["themes", { id: "themes", name: "Themes", pending: false }],
    ]);

    return Items.of({
      list: () => Effect.succeed([...items.values()]),
      apply: Effect.fn("Items.apply")(function* (id: string) {
        const item = items.get(id);

        if (item === undefined) {
          return yield* new ItemsError({ message: `No item called ${id}` });
        }

        const applied = { id: item.id, name: item.name, pending: false };

        items.set(id, applied);

        return applied;
      }),
      restart: () => Effect.void,
    });
  });
}

/** One operation, described once for the CLI, the manifest and MCP. */
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
