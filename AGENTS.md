# Groundwork

The groundwork for designing and building apps, sites, CLIs, terminal UIs,
Omarchy panels and agents: tokens and themes, repository conventions, the docs
site and `@timmo001/docs-kit`. The plan is tracked in #32, with the working document attached as
an issue artifact; check it before adding a new part. The READMEs document
usage and development.

## Repository

- It's public. Nothing personal goes in: no home paths, machine or host names,
  private repo details or private config.
- Use mise-pinned tools and Bun. Keep `bun.lock` in sync with the workspace's
  `package.json` files, and pin dependencies to exact versions.
- Use `mise run format` and `mise run check` for validation.
- Put each package under `packages/<name>/`.
- Use lowercase filenames, with kebab-case for multiword names.
- Use the shared `@timmo001/oxlint-rules/configs/recommended` preset and its
  supported Oxlint peers.
- Track public work in issues with sub-issues and blocked-by relationships set;
  plans, research and decisions go on the issue as artifacts. Private work can
  stay on the Plannotator board, Inbox threads, notes and handoffs until it
  lands on a public repo.

## Background Dev Servers

- Start the docs dev server with `mise run serve:docs`, which runs it through
  Pitchfork in the background and restarts it if it exits or stops responding.
  Don't run `mise run docs:dev` or `blume dev` in the foreground from an agent.
- Manage it with `mise run serve:docs:status`, `serve:docs:logs`,
  `serve:docs:restart` and `serve:docs:stop`.
- It's at `https://docs.groundwork.localhost` through the Pitchfork proxy, and
  `http://127.0.0.1:7350/` or the next free port without it. Test through the
  HTTPS address. Never add the proxy's own port, such as `:8443`: run
  `pitchfork proxy doctor`, then `pitchfork proxy setup -y`, to restore the 443
  redirect instead.

## Tokens and themes

- Themes are data in `packages/tokens/themes/*.json`, checked against the
  Schema in `packages/tokens/src/schema.ts`. Change a theme there, never in a
  generated file.
- `mise run gen` writes every target in `packages/tokens/generated/` and the
  generated theme and contrast pages in `docs/src/content/docs/themes/`.
  `mise run check` fails when they're stale or a core theme misses a contrast
  target.

## Conventions

- Repository kinds and the label manifest are data in `conventions/`. Every
  repository has a file in `conventions/repos/` with its kind; private ones
  live outside this repo in `$XDG_CONFIG_HOME/groundwork/conventions/repos`.
- `mise run check` fails when a label is defined two ways, a description
  breaks the voice, or two colours in a repository are too close in OKLab.

## docs-kit

The package lives in `packages/docs-kit/` and is the only one published.

- There is no build; the package ships source.
- Keep `package.json` and `jsr.json` versions and exports in step.
- Keep the root export free of docs-tool dependencies. Put tool-specific code
  under its own entry point, such as `src/blume/`.
- Use scoped CSS in components rather than Tailwind utilities, since consumers'
  Tailwind may not scan `node_modules`.
- Keep site content, sidebars, logos and reference generators in the sites.
- Verify component, theme or config changes by building a site against a packed
  tarball, not a linked install.
- Keep `skills/docs-kit/SKILL.md` in step with the public API.
