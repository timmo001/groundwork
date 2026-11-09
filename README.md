# Groundwork

The groundwork for designing and building my apps, sites, CLIs, terminal UIs,
Omarchy panels and agents: a shared starting point for how they look, how they
behave and how they're put together. Each app builds on the same base and adds
its own theme, so they stay related without all looking the same.

It's a starting point, not a finished look: every component takes its sizes,
colors and words from attributes, parts and `--gw-*` properties, with today's
look as the default, and composites are built from the base elements so an app
can use or restyle each piece on its own. The plan and its progress live in
[#32](https://github.com/timmo001/groundwork/issues/32), with the working
document attached to it.

## What's here

| Path                                                                      | What it is                                                                                |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`packages/tokens`](packages/tokens/themes)                               | Theme documents, the solver and the generators for CSS, JSON, TS, QML, OpenTUI and ANSI   |
| [`packages/ui`](packages/ui)                                              | `@timmo001/groundwork-ui`, the framework-free web components                              |
| [`packages/tui`](packages/tui)                                            | `@timmo001/groundwork-tui`, the terminal components on OpenTUI                            |
| [`packages/report`](packages/report)                                      | `@timmo001/groundwork-report`, a self-contained HTML report page built from blocks        |
| [`packages/pwa`](packages/pwa)                                            | `@timmo001/groundwork-pwa`, the manifest, service worker, Web Push and pairing            |
| [`packages/mobile`](packages/mobile)                                      | `@timmo001/groundwork-mobile`, the page side of the Android shell                         |
| [`packages/desktop`](packages/desktop)                                    | The desktop app config and the main process and view halves for Electrobun                |
| [`packages/lit-effect`](packages/lit-effect)                              | Effect for Lit apps: an atom controller, a typed router and `@storage`                    |
| [`packages/demo`](packages/demo)                                          | The demo app's `Items` service and fixture data, shared by every template                 |
| [`docs`](docs)                                                            | The Groundwork docs site, showing every theme live                                        |
| [`conventions`](conventions)                                              | Repository kinds, the label manifest and a file per repository                            |
| [`templates/cli-tool`](templates/cli-tool)                                | A CLI built to the behavior conventions, with Code Mode and MCP                           |
| [`templates/desktop-app`](templates/desktop-app)                          | A desktop app on Electrobun, running the web components in the system's webview           |
| [`templates/pwa-app`](templates/pwa-app)                                  | A web app installable on phones, with `@timmo001/groundwork-pwa`'s manifest and worker    |
| [`templates/android-app`](templates/android-app)                          | The Android shell around a PWA, with `@timmo001/groundwork-mobile`'s bridge               |
| [`templates/tui-menu`](templates/tui-menu)                                | A terminal app using every `@timmo001/groundwork-tui` component                           |
| [`templates/omarchy-panel`](templates/omarchy-panel)                      | An Omarchy panel using the shared QML components                                          |
| [`templates/report`](templates/report)                                    | A sample report on made-up data                                                           |
| [`qml`](qml)                                                              | The shared Omarchy panel components                                                       |
| [`registry.json`](registry.json)                                          | What apps can take through the sync                                                       |
| [`packages/sync`](packages/sync)                                          | Copies items into apps and carries QML edits back                                         |
| [`packages/conventions`](packages/conventions)                            | Checks the manifest and prints each repository's labels                                   |
| [`packages/docs-kit`](packages/docs-kit)                                  | `@timmo001/docs-kit`, published on npm and JSR                                            |
| [`skills/docs-kit`](skills/docs-kit/SKILL.md)                             | An agent skill for setting up or changing a site with docs-kit                            |
| [`skills/groundwork-setup`](skills/groundwork-setup/SKILL.md)             | An agent skill for setting up a repository, step by step from the Setup page              |
| [`skills/groundwork-changes`](skills/groundwork-changes/SKILL.md)         | An agent skill for changing Groundwork so apps can still customize and extend it          |
| [`skills/groundwork-themes`](skills/groundwork-themes/SKILL.md)           | An agent skill for choosing, comparing or writing an app's theme and the themes it offers |
| [`skills/groundwork-conventions`](skills/groundwork-conventions/SKILL.md) | An agent skill for repository kinds and labeling from the manifest                        |

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

Or in Claude Code:

```text
/plugin install groundwork --marketplace timmo001/groundwork
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

`@timmo001/groundwork-tokens`, `-ui`, `-tui`, `-report`, `-pwa`, `-mobile`
and `@timmo001/docs-kit` are published together at one shared version, to npm
with provenance and docs-kit to JSR too. The
[groundwork-release skill](.agents/skills/groundwork-release/SKILL.md) has the
steps: set the version in every package (and docs-kit's `jsr.json`), keep
`bun.lock` in sync, pass `mise run check`, push, then publish a GitHub release
whose tag matches the version exactly, such as `0.1.0`. The release workflow
checks the tag against every version before it publishes.

[Upkeep](https://github.com/timmo001/upkeep) picks up each release and rolls it
out to the apps and sites that use it: it pins the new version in each one,
runs its checks, and pushes only the ones that pass.
