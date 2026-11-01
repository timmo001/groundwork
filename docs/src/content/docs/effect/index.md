---
title: Effect
description: How Groundwork uses Effect, from services and schemas to CLIs, agent tools and app state in Lit.
---

Every system built on Groundwork uses [Effect](https://effect.website), on its latest version. One set of patterns covers the backend, the CLI, the agent tools and the UI, so a system's operations are written once and reach every surface.

| Use | What it covers | Where it runs here |
| --- | --- | --- |
| [Services](/effect/services) | A system's data and actions behind one service, with a layer for each backend | The demo app's `Items`, used by every [demo](/demo) |
| [Schema](/effect/schema) | Documents and inputs decoded once, at the edge | Theme documents, the conventions manifest, router params |
| [CLI and agents](/effect/cli-and-agents) | One command tree for the CLI, Code Mode and MCP | The `cli-tool` template, `conventions`, `sync` and `bump-consumers` |
| [Lit](/effect/lit) | App state in atoms, read by components, with the URL as an atom | The `lit-effect` sync item |

## Rules

- Write an operation once, as an Effect behind a service. Each surface (CLI, MCP, web, TUI, panel) calls it rather than reimplementing it.
- Decode everything that comes from outside with Schema, and keep the decoded type inside.
- Failures are typed errors, shown to people as one line and returned to agents as the tool's result.
- Pin `effect` and `@effect/*` to the same exact version across a repository.

## References

- [Effect documentation](https://effect.website/docs)
- [Effect source](https://github.com/Effect-TS/effect)
