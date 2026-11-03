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
- A Bun workspace, with each part as its own package under `packages/<name>/` and the docs site in `docs/`. Pin every dependency to an exact version (`bun add -E`).
- Effect v4 for the code, following [Effect](/effect).
- The shared Oxlint preset from `@timmo001/oxlint-rules`, with type-aware rules and type checking on, in each package.
- Prettier for formatting. It skips `AGENTS.md`, synced skills, lockfiles and generated output.
- hk hooks running the shared Markdown, YAML, Actions and shell lints before a push.
- mise tasks for `format`, `check`, `test` and `build`, with dev servers as `serve:*` tasks through Pitchfork, each at `https://<daemon>.<repo>.localhost`.

How packages are laid out inside the workspace, and which ones publish, is still being decided.

## 3. Agent files

- `AGENTS.md`, saying what the repository is, its stack, how to run its checks and how changes roll out. Write it by hand and keep it short.
- The shared skills it needs, synced into `.agents/skills/`, and the docs MCP servers for the libraries it builds on.

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

- One README, at the root: the social preview as its banner, what the repository is, and a link to the docs. Packages and the docs site don't get their own.
- The repository's website set to the docs site, topics for its stack and purpose, and the social preview uploaded in its settings. GitHub's API can't upload it, so that's done by hand.

## 7. Agent surface

Every system gets the [agent surface](/behavior#agents), from one command tree built on the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool):

- `<tool> agent tools --json` for Code Mode, `<tool> mcp` for MCP, and `--json` on every command that returns data.
- A tool-owned skill in `skills/<tool>/SKILL.md`, telling an agent to use Code Mode first, then MCP, then the CLI.
- The skill [published](/behavior#publishing-the-skill) on skills.sh and as a Claude Code marketplace, with an Agents page on the docs site.

## 8. Status and notifications

One status source per system, read by the CLI, the bar and any panel, and notifications only for what needs you, as [Behavior](/behavior#status-and-notifications) sets out.

## 9. Theme

Pick one of the [themes](/themes) or [write one](/themes/writing-a-theme) for the app, so it doesn't look like the others, and one [icon set](/foundations/iconography). Switch the docs site from Base to it.
