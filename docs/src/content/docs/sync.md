---
title: Sync
description: How components and token files reach apps as copies, and how edits travel back.
---

Parts reach apps as copies, the way [shadcn/ui](https://ui.shadcn.com) works: each app owns its copy, and the sync keeps it current. Nothing here is published as a package except docs-kit.

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
