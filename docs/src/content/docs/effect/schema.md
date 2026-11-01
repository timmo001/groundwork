---
title: Schema
description: Decoding theme documents, manifests, tool inputs and URLs with Effect Schema, once, at the edge.
---

Anything that comes from outside (a file, a URL, a tool call, local storage) is decoded with Schema where it enters. Inside, code works with the decoded type and never checks shapes again.

## Where it's used

| Data | Schema | Decoded by |
| --- | --- | --- |
| Theme documents | `Theme`, a union of a solved and a mapped theme | `parseTheme`, the theme editor and the `set-theme` tool |
| Repository kinds and labels | `KindsDocument`, `LabelsDocument`, `Repo` | `conventions check` and `conventions gen` |
| Demo items | `Item` | Every demo target, and the MCP tools' results |
| Routes | Each route's params and search | `lit-effect`'s router, which drops search params that don't decode |
| GitHub responses | `RepositoryInfo`, `Commit` | `bump-consumers` |

## Patterns

Decode JSON text and the document in one step, and get a `Result` rather than an exception when the caller shows errors itself:

```ts
export const parseTheme = Schema.decodeUnknownResult(
  Schema.fromJsonString(Theme),
);
```

Inside an Effect, decode with `Schema.decodeUnknownEffect` so a bad file fails the run with a typed error:

```ts
const decodeTheme = Schema.decodeUnknownEffect(Schema.fromJsonString(Theme));

const theme = yield* decodeTheme(text);
```

The same schema describes an MCP tool's parameters and result, so the agent sees the shape it must send and gets back.

## Guidelines

- One schema per document, kept in the package that owns the document. Export its type alongside it.
- Keep stored documents, not derived output: a stored theme is its document, solved again when the solver changes.
