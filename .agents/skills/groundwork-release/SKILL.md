---
name: groundwork-release
description: Version, check and publish a groundwork release of @timmo001/groundwork-tokens, @timmo001/groundwork-ui, @timmo001/groundwork-tui and @timmo001/docs-kit, then roll it out to consumers. Use when bumping versions, cutting, preparing or publishing a groundwork release, running its pre-release drift checks, checking what a release published on npm and JSR, or debugging the Release workflow.
license: Apache-2.0
compatibility: Requires mise, Bun, npm and the GitHub CLI from the groundwork repository root.
---

# Releasing groundwork

One version covers `@timmo001/groundwork-tokens`, `@timmo001/groundwork-ui`,
`@timmo001/groundwork-tui` and `@timmo001/docs-kit`, and the release tag is
that version with no `v` prefix. Publishing a GitHub release runs
`.github/workflows/release.yml`: tokens and ui go to npm, then tui once tokens
is there, and docs-kit goes to npm and JSR once tokens and ui are there, since
they pin them. tokens, ui and tui are npm only; JSR rejects the global tag-map
augmentation in ui and tokens.

The repository's `AGENTS.md` Rollout section authorises the release, its push
and the consumer rollout whenever `packages/docs-kit` changed. Otherwise
release only when asked.

## 1. Start clean

Work on `main`, up to date with `origin/main`, with only this session's
changes. Read the commits since the latest tag (`gh release list --limit 1`)
to choose patch, minor or major; use the user's version when they give one.

## 2. Drift checks

Run these before bumping, and fix or explain anything they report:

- `mise run check`: lint, types, tests, formatting, contrast, conventions,
  and `gen:check`, which fails when a token target, a generated docs page,
  `custom-elements.json` or `src/events.ts` is stale.
- `mise run sync:check` and `mise run sync:status`: what a sync would change
  and any flagged copy, where an app edited a registry item. Move flagged edits
  into groundwork or a wrapper before releasing; don't overwrite them.
- `mise run docs:build`: the docs site builds against the workspace packages.

## 3. Bump the version

Set the same version in:

- `packages/tokens/package.json`
- `packages/ui/package.json`
- `packages/tui/package.json`, and its `@timmo001/groundwork-tokens`
  dependency, pinned exactly
- `packages/docs-kit/package.json` and `packages/docs-kit/jsr.json`
- docs-kit's `@timmo001/groundwork-tokens` and `@timmo001/groundwork-ui`
  dependencies in `packages/docs-kit/package.json`, pinned exactly

Run `bun install` to refresh `bun.lock`, then `mise run check` again and the
publish dry runs:

```sh
npm pack --dry-run          # in each of packages/tokens, ui, tui and docs-kit
bunx jsr@0.14.3 publish --dry-run --allow-dirty   # in packages/docs-kit
```

Check the packed file lists: ui must ship `custom-elements.json`.

## 4. Publish

1. Commit only the version files and `bun.lock` through `dot git commit` as
   `Release <version>`, and push.
2. Resolve the target after the push with `git rev-parse HEAD`, and create the
   release with that full 40-character SHA, never an abbreviated one:

   ```sh
   gh release create <version> --target <sha> --generate-notes
   ```

3. Watch that release's Release workflow run. All five publish jobs must pass:
   npm tokens, npm ui, npm tui, npm docs-kit and JSR docs-kit.

## 5. Verify publication

npm can lag the workflow. Before anything depends on the release, confirm each
registry serves it:

```sh
npm view @timmo001/groundwork-tokens@<version> version
npm view @timmo001/groundwork-ui@<version> version
npm view @timmo001/groundwork-tui@<version> version
npm view @timmo001/docs-kit@<version> version
curl -fsS https://jsr.io/@timmo001/docs-kit/meta.json   # lists <version>
```

Retry after a short wait while one is missing. Don't report the release done,
or start the rollout, until all five serve it.

## 6. Roll out

The last step, once publication is verified: run
`mise run bump-consumers -- --push`, which pins the new docs-kit in every docs
site and builds each one. The `groundwork-bump-consumers` skill covers its
flags and failures. When a registry item changed in the release, also run
`mise run sync` and push each app.

Report the release URL, the version commit, each registry's result and what
the rollout landed or flagged.
