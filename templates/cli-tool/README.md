# cli-tool template

A starting point for a CLI built to the Groundwork [behavior conventions](https://groundwork.timmo.dev/behavior). Copy the folder, rename `cli-tool`, and replace the `Items` service in `src/operations.ts` with your system's SDK.

```sh
bun src/cli.ts status
bun src/cli.ts apply --check
bun src/cli.ts apply            # picker on a terminal, everything pending otherwise
bun src/cli.ts apply --json     # for scripts and agents
bun src/cli.ts agent tools --json
bun src/cli.ts mcp              # MCP on stdio, power operations left out
```

What it shows:

- One Effect CLI tree. Every command but `restart` takes `--json`.
- `apply` says "Nothing to apply" and exits 0 when there's nothing to do, ticks every pending item in its picker, skips the picker with `--yes` or without a terminal, prints `[1/2]` progress, lists with `--check` and includes everything with `--force`.
- `restart` is a power operation: it asks on a terminal, needs `--yes` otherwise, and only reaches MCP with `--allow-power`.
- `agent tools --json` prints the Code Mode manifest, and `mcp` serves the same operations over MCP, from one list in `src/operations.ts`.
- `skill-template.md` is the tool-owned skill to adapt. Save it as `skills/<tool>/SKILL.md` in the new repository.
