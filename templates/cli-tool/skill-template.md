---
name: cli-tool
description: Check and apply cli-tool's items from an agent. Use when asked what cli-tool has pending, to apply some or all of it, or to restart its system.
---

# cli-tool

Prefer the `cli-tool` Code Mode namespace or MCP server; fall back to the CLI with `--json`.

1. Read with `status` before changing anything.
2. `apply --check` lists what would change. Apply with `apply --json`, naming items to limit it.
3. `restart` is a power operation. Ask the user every time, then run `restart --yes`.
