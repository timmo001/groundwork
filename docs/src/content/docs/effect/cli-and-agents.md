---
title: CLI and agents
description: One Effect command tree for the CLI, Code Mode and MCP, with typed flags, pickers and agent tools.
---

A system has one command tree, built with `effect/cli`. The same operations serve people at a terminal, scripts with `--json`, and agents over MCP, so a new command reaches all three at once. [Behavior](/behavior) sets how they act; this page shows how they're built.

## Commands

```ts
const status = Command.make(
  "status",
  { json },
  Effect.fn("status")(function* ({ json }) {
    const items = yield* (yield* Items).list();

    if (json) return yield* Console.log(JSON.stringify({ items }, null, 2));

    for (const item of items) yield* Console.log(formatItem(item));
  }),
).pipe(Command.withDescription("List every item and whether it has something to apply"));
```

- Flags are typed, with a description and a default, and shared between commands (`json`, `yes`).
- Pickers use `Prompt.MultiSelect` with the sensible choices ticked, and only run on a terminal.
- Help and completions come from the tree.

## MCP

`effect/ai` turns the operations into MCP tools. Each tool's parameters and result are [schemas](/effect/schema), and its annotations tell the client what it does:

```ts
const Status = Tool.make("status", {
  description: "List every item and whether it has something to apply",
  success: Schema.Struct({ items: Schema.Array(Item) }),
  failure: ItemsError,
  failureMode: "return",
}).annotate(Tool.Readonly, true);
```

`failureMode: "return"` hands failures back as the tool's result, so an agent reads them and carries on. Destructive operations, such as `restart`, are left out of the server unless they're asked for.

## Where it runs here

| Tool | Commands |
| --- | --- |
| [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool) | `status`, `apply`, `restart` and `mcp`, the [CLI demo](/demo) |
| `conventions` | `check`, `gen` and `labels` for the [conventions](/conventions) |
| `sync` | Copies registry items into apps, see [Sync](/sync) |
| `bump-consumers` | Rolls a docs-kit release out to the sites that use it |
