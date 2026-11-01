---
title: Services
description: A system's data and actions behind one Effect service, with a layer for each backend, run from any target.
---

A system's data and actions sit behind one service. Its interface is what every target calls; its layer decides where the data comes from. Swapping the layer moves every target from fixtures to the real system at once.

## The demo's Items

`@timmo001/groundwork-demo` defines the service every [demo](/demo) runs on:

```ts
export class Items extends Context.Service<
  Items,
  {
    readonly list: () => Effect.Effect<readonly Item[], ItemsError>;
    readonly apply: (id: string) => Effect.Effect<Item, ItemsError>;
    readonly restart: () => Effect.Effect<void, ItemsError>;
  }
>()("groundwork-demo/Items") {
  static readonly fixture = Layer.sync(Items, () => /* in-memory items */);
}
```

`Items.fixture` keeps the items in memory and resets each time it's built. A real tool replaces it with a layer that calls the system's SDK, and nothing else changes.

## Running it from a target

| Target | How it runs the service |
| --- | --- |
| CLI and MCP | Each command and tool `yield*`s `Items`, with the layer provided once at the root |
| TUI | A `ManagedRuntime` built from the layer, wrapped as promises for the views |
| Web | A `ManagedRuntime` in the element, read with `runPromiseExit` so failures become messages |

```ts
const runtime = ManagedRuntime.make(Items.fixture);
const exit = await runtime.runPromiseExit(
  Effect.flatMap(Items, (items) => items.list()),
);
```

## Guidelines

- One service per system, named for what it controls. Keep it small: the operations people and agents use.
- Wrap each method in `Effect.fn("Service.method")` so traces name it.
- Fail with a tagged error class carrying a message a person can read, never a thrown `Error`.
- Fixtures live next to the service, so tests, demos and docs share them.
