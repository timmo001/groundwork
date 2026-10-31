# Groundwork

The groundwork for designing and building my apps, sites, CLIs, terminal UIs,
Omarchy panels and agents: a shared starting point for how they look, how they
behave and how they're put together. Each app builds on the same base and adds
its own theme, so they stay related without all looking the same.

It's early: the themes and tokens and the docs site are in, with components and
the rest to follow. The plan and its progress live in
[#32](https://github.com/timmo001/groundwork/issues/32), with the working
document attached to it.

## What's here

| Path                                                                      | What it is                                                                              |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`packages/tokens`](packages/tokens/themes)                               | Theme documents, the solver and the generators for CSS, JSON, TS, QML, OpenTUI and ANSI |
| [`docs`](docs)                                                            | The Groundwork docs site, showing every theme live                                      |
| [`conventions`](conventions)                                              | Repository kinds, the label manifest and a file per repository                          |
| [`templates/cli-tool`](templates/cli-tool)                                | A CLI built to the behavior conventions, with Code Mode and MCP                        |
| [`qml`](qml)                                                              | The shared Omarchy panel components                                                     |
| [`registry.json`](registry.json)                                          | What apps can take through the sync                                                     |
| [`packages/sync`](packages/sync)                                          | Copies items into apps and carries QML edits back                                       |
| [`packages/conventions`](packages/conventions)                            | Checks the manifest and prints each repository's labels                                 |
| [`packages/docs-kit`](packages/docs-kit)                                  | `@timmo001/docs-kit`, published on npm and JSR                                          |
| [`packages/bump-consumers`](packages/bump-consumers)                      | Rolls a docs-kit release out to the sites that use it                                   |
| [`skills/docs-kit`](skills/docs-kit/SKILL.md)                             | An agent skill for setting up or changing a site with docs-kit                          |
| [`skills/groundwork-conventions`](skills/groundwork-conventions/SKILL.md) | An agent skill for repository kinds and labeling from the manifest                     |

## docs-kit

### Sites using it

| [dotfiles.timmo.dev](https://dotfiles.timmo.dev)                                    | [upnext.timmo.dev](https://upnext.timmo.dev)                                |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [![Dotfiles docs](.github/screenshots/dotfiles.png)](https://dotfiles.timmo.dev)    | [![Up Next docs](.github/screenshots/upnext.png)](https://upnext.timmo.dev) |
| [ha-bridge.timmo.dev](https://ha-bridge.timmo.dev)                                  | [triage.timmo.dev](https://triage.timmo.dev)                                |
| [![HA Bridge docs](.github/screenshots/ha-bridge.png)](https://ha-bridge.timmo.dev) | [![Triage docs](.github/screenshots/triage.png)](https://triage.timmo.dev)  |

### Agent skill

[The docs-kit skill](skills/docs-kit/SKILL.md) guides agents setting up or
changing a docs site with the package. Install it with:

```sh
npx skills add timmo001/groundwork
```

Or import the `skills/docs-kit/` directory unchanged into your skill collection.

## Development

Use the tool versions pinned in [mise.toml](mise.toml) and Bun for
dependencies. The root `package.json` is a Bun workspace over `packages/*` and
`docs`.

```sh
mise run install
mise run gen     # regenerate tokens and the generated theme pages
mise run check
```

Themes are data in [`packages/tokens/themes`](packages/tokens/themes). `mise
run check` fails when generated files are stale or a core theme misses a
contrast target.

Run the docs site in the background with `mise run serve:docs`. Pitchfork
serves it at <https://docs.groundwork.localhost>.

[hk](hk.pkl) runs the same checks plus the shared Markdown, YAML and workflow
linters before each push. Run them by hand with `hk check --all`.

docs-kit ships TypeScript, Astro and CSS source, so there's no build step. To
try a change in a site, pack it with `npm pack` in `packages/docs-kit` and
install the tarball there. A linked or `file:` install points Vite at the
source path, which breaks Astro's style compilation.

## Releases

Only docs-kit is published. Before the first automated publication, configure
npm trusted publishing for `timmo001/groundwork` with workflow filename
`release.yml`, and link the JSR package to the repository. An initial npm
publication may be needed before trusted publishing is available.

For a release, set the same version in `packages/docs-kit/package.json` and
`packages/docs-kit/jsr.json`, keep `bun.lock` in sync and pass `mise run check`.
Commit and push, then publish a GitHub release with a tag matching the version
exactly, such as `0.1.0`. The release workflow checks the tag against both
versions, validates the package and publishes it to npm with provenance and to
JSR.

Once npm serves the release, roll it out to the sites that use it:

```sh
mise run bump-consumers -- --push
```

This pins the new version in each site, builds it, and commits and pushes only
the sites that build.
