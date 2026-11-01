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
| [Built-in services](/effect/platform) | Commands, files, the terminal, HTTP, sockets, SQL and more, before writing a wrapper | Reference |

## Rules

- Write an operation once, as an Effect behind a service. Each surface (CLI, MCP, web, TUI, panel) calls it rather than reimplementing it.
- Decode everything that comes from outside with Schema, and keep the decoded type inside.
- Failures are typed errors, shown to people as one line and returned to agents as the tool's result.
- Pin `effect` and `@effect/*` to the same exact version across a repository.

## Skills

Agents working on Groundwork systems load one of these, never both:

| Skill | When |
| --- | --- |
| [`effect`](https://github.com/kitlangton/skills/tree/main/skills/effect) | Code that uses Effect: services, layers, schemas, config, streams and tests on Effect 4 |
| [`effect-service-design`](https://github.com/dmmulroy/skills/tree/main/effect-service-design) | Alongside `effect`, when designing a new service or auditing services, layers and how they compose |
| [`effect-principles`](https://github.com/timmo001/skills/tree/main/effect-principles) | Code that doesn't use Effect, in any language: the same thinking about dependencies, failures and boundaries, without Effect's shapes |

The [skills repository](https://github.com/timmo001/skills) shares them with each repository.

## References

These pages show how Groundwork uses Effect, not everything Effect does. The official documentation is the source of truth for its APIs.

- [Effect documentation](https://effect.website/docs)
- [Effect 4 source](https://github.com/Effect-TS/effect-smol)
