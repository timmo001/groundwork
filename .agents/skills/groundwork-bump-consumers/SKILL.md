---
name: groundwork-bump-consumers
description: Roll a @timmo001/docs-kit release out to the docs sites that use it with `mise run bump-consumers`. Use straight after every groundwork release, or when asked to bump, update or roll out docs-kit to its consumers, instead of waiting for Renovate or editing each site by hand.
---

# Bump consumers

`packages/bump-consumers` finds every `package.json` in the owner's
repositories that depends on `@timmo001/docs-kit`, pins it to the release,
runs `bun install`, builds the site, and commits through `dot git commit`.

## Run it

```bash
mise run bump-consumers                  # dry run against the latest release
mise run bump-consumers -- --push        # commit and push each repository
```

- `--to <tag>` pins an earlier or specific release instead of the latest.
- `--repo <owner/repo>` limits the run to named repositories; repeat it. A
  named repository code search misses is read from its file tree instead.
- `--owner <login>` changes whose repositories code search covers (default
  `timmo001`).
- `--build=false` skips the site build. Keep it on: the build is the proof the
  release works in each site.
- `--concurrency <n>` sets how many repositories run at once (default 4).

Discovery uses GitHub code search, so it covers default branches only and skips
archived repositories and forks. Code search sometimes drops repositories from
its index, so when a run finds fewer consumers than expected, list the local
checkouts with a `"@timmo001/docs-kit"` dependency and rerun naming each with
`--repo`. Work happens in clean clones under
`$XDG_CACHE_HOME/groundwork-bump-consumers`, never in local checkouts, so pull
those afterwards.

## Order

1. Publish the release and verify npm serves it (the `groundwork-release`
   skill's last check); the install fails until it does.
2. Run with `--push` straight after every release. The rollout is automatic and
   doesn't wait for a go-ahead; report what landed afterwards. A site whose
   install or build fails isn't committed; the summary counts it and the
   command exits non-zero. Fix it and rerun with `--repo`.
