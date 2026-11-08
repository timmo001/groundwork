---
name: groundwork-release
description: Version, check and publish a groundwork release of @timmo001/groundwork-tokens, @timmo001/groundwork-ui, @timmo001/groundwork-tui, @timmo001/groundwork-report, @timmo001/groundwork-pwa, @timmo001/groundwork-mobile and @timmo001/docs-kit, for Upkeep to roll out to consumers. Use when bumping versions, cutting, preparing or publishing a groundwork release, running its pre-release drift checks, checking what a release published on npm and JSR, or debugging the Release workflow.
license: Apache-2.0
compatibility: Requires mise, Bun, npm and the GitHub CLI from the groundwork repository root.
---

# Releasing groundwork

One version covers `@timmo001/groundwork-tokens`, `@timmo001/groundwork-ui`,
`@timmo001/groundwork-tui`, `@timmo001/groundwork-report`,
`@timmo001/groundwork-pwa`, `@timmo001/groundwork-mobile` and
`@timmo001/docs-kit`, and the release tag is that version with no `v` prefix.
Publishing a GitHub release runs `.github/workflows/release.yml`: tokens and ui
go to npm, then tui and pwa once tokens is there, mobile once pwa is, and
report and docs-kit once tokens and ui are there, since they pin them;
docs-kit also goes to JSR. Every package but docs-kit is npm only; JSR rejects
the global tag-map augmentation in ui and tokens.

A package new to npm needs its first publish set up before the release that
adds it, with the `npm-jsr-first-publish` skill: the release's npm job can't
create a package.

The repository's `AGENTS.md` Rollout section authorises the release and its
push whenever `packages/docs-kit` changed. Otherwise
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
- Each published package has a `check` script that passes on its own
  (`bun run check` in its directory). The publish workflow runs it to
  validate, and fails the package's job without one.

## 3. Bump the version

Set the same version in:

- `packages/tokens/package.json`
- `packages/ui/package.json`
- `packages/tui/package.json`, and its `@timmo001/groundwork-tokens`
  dependency, pinned exactly
- `packages/report/package.json`, and its `@timmo001/groundwork-tokens` and
  `@timmo001/groundwork-ui` dependencies, pinned exactly
- `packages/pwa/package.json`, and its `@timmo001/groundwork-tokens`
  dependency, pinned exactly
- `packages/mobile/package.json`, and its `@timmo001/groundwork-pwa` and
  `@timmo001/groundwork-tokens` dependencies, pinned exactly
- `packages/docs-kit/package.json` and `packages/docs-kit/jsr.json`
- docs-kit's `@timmo001/groundwork-tokens` and `@timmo001/groundwork-ui`
  dependencies in `packages/docs-kit/package.json`, pinned exactly

Run `bun install` to refresh `bun.lock`, then `mise run check` again and the
publish dry runs:

```sh
npm pack --dry-run          # in each of packages/tokens, ui, tui, report, pwa, mobile and docs-kit
bunx jsr@0.14.3 publish --dry-run --allow-dirty   # in packages/docs-kit
```

Check the packed file lists: ui must ship `custom-elements.json`.

## 4. Publish

1. Commit only the version files and `bun.lock` through `dot git commit` as
   `Release <version>`, and push.
2. Write the release notes yourself, never `--generate-notes`, which only
   lists merged pull requests and misses the direct commits. Read the commits
   since the last tag and follow the `writing-style` skill and earlier releases:
   a line on anything new about the release itself, then one bullet per
   package, prefixed `**tokens**:`, `**ui**:`, `**tui**:`, `**report**:`,
   `**pwa**:`, `**mobile**:` or `**docs-kit**:`,
   saying what changed for someone using it. A package with nothing new gets
   "released at the same version, with no changes". Leave out repository-only
   work such as skills, CI and demos. Save them to the release's scratch
   directory.
3. Resolve the target after the push with `git rev-parse HEAD`, and create the
   release with that full 40-character SHA, never an abbreviated one:

   ```sh
   gh release create <version> --target <sha> --notes-file <notes.md>
   ```

4. Watch that release's Release workflow run. All eight publish jobs must pass:
   npm tokens, npm ui, npm tui, npm report, npm pwa, npm mobile, npm docs-kit
   and JSR docs-kit.

## 5. Verify publication

npm can lag the workflow. Before anything depends on the release, confirm each
registry serves it:

```sh
npm view @timmo001/groundwork-tokens@<version> version
npm view @timmo001/groundwork-ui@<version> version
npm view @timmo001/groundwork-tui@<version> version
npm view @timmo001/groundwork-report@<version> version
npm view @timmo001/groundwork-pwa@<version> version
npm view @timmo001/groundwork-mobile@<version> version
npm view @timmo001/docs-kit@<version> version
curl -fsS https://jsr.io/@timmo001/docs-kit/meta.json   # lists <version>
```

Retry after a short wait while one is missing. Don't report the release done,
or start the rollout, until all eight serve it.

## 6. Roll out

Upkeep's `bump` job picks up the release by itself and rolls the new packages
out to every consumer, checking each one before it pushes; its run for the
release shows what landed and what failed. When a registry item changed in the
release, run `mise run sync` and push each app.

Report the release URL, the version commit, each registry's result and what
the sync landed or flagged.
