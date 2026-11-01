---
title: Built-in services
description: The services Effect already has for commands, files, the terminal, HTTP, sockets, SQL and more, to reach for before writing your own.
---

Effect ships services for most of what a system talks to. Use them before writing a wrapper: they're typed, testable through their layers, and traced. The platform layer (`NodeServices.layer` from `@effect/platform-node`, or the Bun and browser equivalents) provides the ones that touch the machine.

Modules under `effect/<name>` are still marked unstable in Effect 4, so pin the version and read the release notes before bumping.

## The machine

| Need | Service | Module |
| --- | --- | --- |
| Run a command and read its output | [`ChildProcess`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/unstable/process/ChildProcess.ts), [`ChildProcessSpawner`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/unstable/process/ChildProcessSpawner.ts) | `effect/process` |
| Read and write files | [`FileSystem`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/FileSystem.ts) | `effect` |
| Join and resolve paths | [`Path`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Path.ts) | `effect` |
| Read keys and lines, write to the screen | [`Terminal`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Terminal.ts), [`Stdio`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Stdio.ts) | `effect` |
| Environment variables and settings | [`Config`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Config.ts), [`ConfigProvider`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/ConfigProvider.ts) | `effect` |
| Time, for code that tests can control | [`Clock`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Clock.ts), [`Cron`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Cron.ts) | `effect` |

## Commands and agents

| Need | Service | Module |
| --- | --- | --- |
| Commands, flags, prompts and completions | [`Command`, `Flag`, `Argument`, `Prompt`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/cli) | `effect/cli` |
| MCP servers and tools | [`McpServer`, `Tool`, `Toolkit`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/ai) | `effect/ai` |
| Calling a language model | [`LanguageModel`, `Chat`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/ai) | `effect/ai` |

[CLI and agents](/effect/cli-and-agents) shows them working.

## Talking to other systems

| Need | Service | Module |
| --- | --- | --- |
| HTTP requests | [`HttpClient`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/unstable/http/HttpClient.ts), `FetchHttpClient` | `effect/http` |
| An HTTP server and router | [`HttpServer`, `HttpRouter`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/http) | `effect/http` |
| A typed HTTP API with a client and OpenAPI | [`HttpApi`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/httpapi) | `effect/http-api` |
| Unix and TCP sockets, WebSockets | [`Socket`, `SocketServer`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/socket) | `effect/socket` |
| Typed requests over any transport | [`RpcGroup`, `RpcClient`, `RpcServer`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/rpc) | `effect/rpc` |
| Server-sent events and NDJSON streams | [`Sse`, `Ndjson`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/encoding) | `effect/encoding` |

A daemon with a CLI on the same machine, such as a bridge or a sync service, talks over a Unix socket with `effect/rpc`, so both ends share one schema.

## Data

| Need | Service | Module |
| --- | --- | --- |
| SQL, with migrations | [`SqlClient`, `Migrator`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/sql), and a driver from `@effect/sql-*` | `effect/sql` |
| Key-value storage | [`KeyValueStore`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/unstable/persistence/KeyValueStore.ts) | `effect/persistence` |
| Caches that survive a restart, rate limits | [`PersistedCache`, `RateLimiter`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/persistence) | `effect/persistence` |
| In-memory caches | [`Cache`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Cache.ts) | `effect` |

## Work over time

| Need | Service | Module |
| --- | --- | --- |
| Retries, polling and backoff | [`Schedule`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Schedule.ts) | `effect` |
| Streams of output or events | [`Stream`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Stream.ts) | `effect` |
| Queues and fan-out | [`Queue`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Queue.ts), [`PubSub`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/PubSub.ts) | `effect` |
| Work in a worker thread | [`Worker`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/workers) | `effect/workers` |
| Long jobs that resume after a restart | [`Workflow`, `Activity`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/workflow) | `effect/workflow` |
| App state for a UI | [`Atom`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/reactivity), see [Lit](/effect/lit) | `effect/reactivity` |

## Seeing what it does

| Need | Service | Module |
| --- | --- | --- |
| Logs | [`Logger`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Logger.ts) | `effect` |
| Traces and metrics | [`Tracer`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Tracer.ts), [`Metric`](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/Metric.ts) | `effect` |
| Sending them to a collector | [`Otlp`, `PrometheusMetrics`](https://github.com/Effect-TS/effect-smol/tree/main/packages/effect/src/unstable/observability) | `effect/observability` |

## Platform layers

| Runtime | Package |
| --- | --- |
| Node | [`@effect/platform-node`](https://github.com/Effect-TS/effect-smol/tree/main/packages/platform-node) |
| Bun | [`@effect/platform-bun`](https://github.com/Effect-TS/effect-smol/tree/main/packages/platform-bun) |
| Browser | [`@effect/platform-browser`](https://github.com/Effect-TS/effect-smol/tree/main/packages/platform-browser) |
