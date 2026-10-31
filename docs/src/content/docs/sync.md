---
title: Sync
description: How packages roll out to apps, and how QML panel components travel both ways as copies.
---

Everything Groundwork makes reaches what uses it on its own, as soon as it changes. Nothing waits on Renovate or a go-ahead: each update runs the consumer's checks, with [agent-checks](https://github.com/timmo001/agent-checks) and an agent where a check needs judgment, pushes when they pass, and sends a notification. If it can be automated, it is; only what can't is flagged.

- Packages roll out to every consumer on each release: docs-kit, and the web components, tokens and lit-effect once they publish.
- QML panel components reach apps as copies. Each app owns its copy, and the sync keeps it current and carries edits back.
- Until the web packages publish, web components and token files travel as copies too.

Today the sync runs with `mise run sync`. Running it on every push is part of [#38](https://github.com/timmo001/groundwork/issues/38).

## Files

| File | Where | What it holds |
| --- | --- | --- |
| `registry.json` | groundwork | Every item an app can take: its kind, files and the items it needs |
| `sync.json` | each app | The items it takes, the folder each goes in, and its theme, font and icon set |
| `sync.lock.json` | each app | For each copy, the groundwork SHA it came from and its hash then |

An app's `sync.json` looks like this:

```json
{
  "items": {
    "panel-header": "omarchy-plugin",
    "panel-flickable": "omarchy-plugin"
  }
}
```

## What a sync does

The sync compares three hashes for every copy: the one in the lock, the source's now and the copy's now.

| Source | Copy | What happens |
| --- | --- | --- |
| Changed | Untouched | The copy is replaced |
| Unchanged | Edited | QML: the edit goes back into groundwork and out to the other copies. Anything else is flagged |
| Changed | Edited | Flagged, for a person or the fixer agent to merge |

If two apps edit the same QML component differently, both are flagged. Apps extend a component by wrapping it and setting properties, not by editing the copy. Drift is how many groundwork commits an app's oldest copy is behind.

## Commands

```sh
mise run sync          # carry QML edits back, then copy changes out
mise run sync:check    # list what a sync would change
mise run sync:status   # every copy and where it stands
bun packages/sync/src/cli.ts add --app ../my-app --to src/theme themes-css
bun packages/sync/src/cli.ts items
```

Every command takes `--json`. Without `--app`, the sync uses the apps listed in `$XDG_CONFIG_HOME/groundwork/sync/apps.json`, kept outside this repository:

```json
{ "apps": ["~/repos/my-app"] }
```

A sync that carries an edit back changes groundwork's own files, so commit those alongside the apps' copies.
