---
title: Setup
description: Setting up a new repository on Groundwork, in order, from creating it to its docs site, agent surface and theme.
---

Every new repository goes through the same steps, in this order. Each step names the page or tool that has the detail. The `groundwork-setup` skill walks an agent through them and checks each one off.

Keep a checklist of these steps on the repository's tracking issue, ticking each off with a link to its commit, so what's left is always visible.

## 1. Create the repository

- Decide public or private first. Public repositories take an Apache 2.0 license unless they need another.
- Give it a [kind](/conventions) in `conventions/repos/<name>.yml`, with its areas, and apply its [labels](/conventions/labels). Private repositories keep that file outside this repository.
- Watch it, and only allow squash merges, with auto-merge on and merged branches deleted.
- Open a tracking issue for the plan, with sub-issues for each piece of work and the decisions still open labeled Needs Decision.

## 2. Tools and workspace

- Pin every tool with mise, including Bun and the linters, and commit `mise.lock`.
- Bun, with the [package layout](#package-layout) that fits the repository. Pin every dependency to an exact version (`bun add -E`).
- Effect v4 for the code, following [Effect](/effect).
- The shared Oxlint preset from `@timmo001/oxlint-rules`, with type-aware rules and type checking on, in each package.
- Prettier for formatting. It skips `AGENTS.md`, synced skills, lockfiles and generated output.
- hk hooks running the shared Markdown, YAML, Actions and shell lints before a push.
- mise tasks for `format`, `check`, `test` and `build`, with dev servers as `serve:*` tasks through Pitchfork, each at `https://<daemon>.<repo>.localhost`.

### Package layout

The layout is the repository's choice. Pick the shape that fits what it holds:

- **One part:** a single package at the root, with no workspace.
- **One app and the libraries it publishes:** the app at the root with its binary, and each library in `packages/<name>/`.
- **Several runnable parts,** such as a CLI, a server and a dashboard: the root is only a workspace, and every part, the app included, is a package in `packages/<name>/`.

The docs site lives in `docs/` in every shape. The root holds the tool pins, mise tasks, Prettier, hk, Renovate and the lockfile. A package with its own runtime or its own entry point carries its own `package.json` scripts, `oxlint.config.ts` and `tsconfig.json`.

Every package is in the `@timmo001` scope. Published ones are named for what they are, such as `@timmo001/groundwork-ui` or `@timmo001/effect-triage`. Private ones are `@timmo001/<repo>-<name>` with `private: true`.

Only libraries that other repositories consume publish. Apps ship as binaries and Arch packages, not on npm. A published package needs:

- npm and JSR, with trusted publishing and provenance from GitHub Actions. The `npm-jsr-first-publish` skill sets up a new name.
- An Apache 2.0 license, its own README for the npm and JSR pages, and `repository.directory` pointing at its folder.
- `effect` and other shared libraries as caret `peerDependencies`, with the exact pin in `devDependencies`.

## 3. Agent files

- `AGENTS.md`, saying what the repository is, its stack, how to run its checks and how changes roll out. Write it by hand and keep it short.
- The shared skills it needs, synced into `.agents/skills/`, and the docs MCP servers for the libraries it builds on.
- The [agent permissions](#agent-permissions) below, confirmed with the owner before they're committed.

### Agent permissions

Repositories are public, so they only carry rules that hold for anyone working on them, with no paths. Everything personal stays in the user's own config.

| What                                                                         | Default | Where                                         |
| ---------------------------------------------------------------------------- | ------- | --------------------------------------------- |
| Edits inside the repository                                                  | Allowed | Each agent's default, so nothing to set       |
| GitHub writes to the repository, and to any repository its rollout writes to | Allowed | The repository                                |
| Deletes                                                                      | Ask     | The repository                                |
| Directories outside the repository                                           | Not set | The user's config                             |
| Generated files                                                              | Not set | `mise run check` already fails on a hand edit |

For OpenCode, a root `opencode.json`, written by hand. The generated `.opencode/opencode.jsonc` stays untouched:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permissions": [
    {
      "action": "gh.write *",
      "resource": "gh_* timmo001/<repo>*",
      "effect": "allow"
    },
    {
      "action": "gh.write *",
      "resource": "gh_*delete* timmo001/<repo>*",
      "effect": "ask"
    }
  ]
}
```

For Claude Code, a committed `.claude/settings.json` with only the deletes. Its `gh` rules can't be limited to one repository, so allowing GitHub writes stays in the user's settings. Ask rules win over allow rules, so the deletes still ask:

```json
{
  "permissions": {
    "ask": ["Bash(gh * delete *)", "Bash(gh api * -X DELETE *)"]
  }
}
```

One-off approvals go in `.claude/settings.local.json`, which stays out of git.

Copilot CLI has no repository-level permissions: approvals live in `~/.copilot/` and in its launch flags, so the repository only gives it `AGENTS.md`.

## 4. CI

- CI from the shared workflows in [timmo001/workflows](https://github.com/timmo001/workflows): check, test and build, a smoke test for any binary, and the shared lints.
- Renovate, with automerge for updates that pass.
- A Development ruleset once CI has run, requiring its checks.

## 5. Docs site

- A [docs-kit](https://github.com/timmo001/groundwork/tree/main/packages/docs-kit) site in `docs/`, on Base until the app has its own [theme](#9-theme). Generate the logo PNGs and social preview with its brand script.
- Deployed by Cloudflare Workers Builds as a `<repo>-docs` Worker at `<repo>.timmo.dev`. Pushes to `main` deploy, other branches upload a preview, and builds only run when `docs/`, the lockfile, `package.json` or `mise.toml` change.
- Its `/mcp` added as a `docs-<repo>` MCP server, so agents can read it.
- `blume check --strict --isolated` in `mise run check`, so it doesn't clash with a running dev server.

## 6. README and GitHub

- One README, at the root: the social preview as its banner, what the repository is, and a link to the docs. Only published packages get their own, for their npm and JSR pages.
- The repository's website set to the docs site, topics for its stack and purpose, and the social preview uploaded in its settings. GitHub's API can't upload it, so that's done by hand.

## 7. Agent surface

Every system gets the [agent surface](/behavior#agents), from one command tree built on the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool):

- `<tool> agent tools --json` for Code Mode, `<tool> mcp` for MCP, and `--json` on every command that returns data.
- A tool-owned skill in `skills/<tool>/SKILL.md`, telling an agent to use Code Mode first, then MCP, then the CLI.
- The skill [published](/behavior#publishing-the-skill) on skills.sh and as a Claude Code marketplace, with an Agents page on the docs site.

## 8. Status and notifications

One status source per system, read by the CLI, the bar and any panel, and notifications only for what needs you, as [Behavior](/behavior#status-and-notifications) sets out.

## 9. Theme

Each app starts from one theme, as [Choosing an app's themes](/themes#choosing-an-apps-themes) sets out: a core theme, an [optional theme](/themes/optional), one from elsewhere, or the app's own, kept in the app rather than added to Groundwork's set. Its picker lists that theme first, then any other Groundwork themes and the optional ones it offers. Users can bring [their own theme](/themes#your-own-theme) at runtime, offered beside the rest but never the default. The `groundwork-themes` skill walks an agent through it.

The owner picks the starting theme, which others the app offers, whether users can upload their own, and its [icon set](/foundations/iconography). These are the owner's choices, along with the fonts and the logo's colors, so an agent asks for each one rather than choosing.

An app that can't switch themes yet, such as one with no UI or no `pageTheme`, plans this for later instead: an issue for choosing the themes on offer, uploads and the icon set, linked from the tracking issue, with the docs site on a single theme until then. Once the choices are made, switch everything that showed Base:

- **Docs site:** import the default theme's docs-kit stylesheet in `theme.css` in place of Base's, then `all.css`. Pass the themes on offer to `HeaderSearch` so readers can pick, as the [docs-kit README](https://github.com/timmo001/groundwork/tree/main/packages/docs-kit#readme) shows, and load each theme's fonts. docs-kit only has Groundwork's own themes, so a site for an app with its own theme renders that theme's stylesheet with `blumeThemeCss` from a site script, as the docs-kit README shows.
- **App:** offer the same themes with [`pageTheme`](/themes#on-a-page) and a [theme picker](/components/actions/#theme-picker), including importing your own theme.
- **Brand images:** set the default theme's background and accent in `scripts/brand-images.ts` and run `bun run brand`. Then upload the new social preview in the repository's settings, since GitHub doesn't read it from the repository.
