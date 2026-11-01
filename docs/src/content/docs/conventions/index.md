---
title: Conventions
description: The four kinds of repository, how issues and Discussions work in each, and where the label manifest lives.
---

Every repository has a kind. It sets how open the repository is to outside input, which extra labels it takes, and how its issues work. Every repository starts Personal and moves up a kind when it's used more widely.

| Kind | What it means | Issues |
| --- | --- | --- |
| Community | Open to ideas and contributions when they don't break my flow | A bug form, a stale bot that skips No Stale, and ideas as Feature Request issues unless Discussions are on |
| Shared | Built for others to use. Issues for bugs and drift; input is taken when it fits, otherwise people fork | Blank issues allowed, no stale bot |
| Library | Follows my apps and setup. Issues for bugs; the README says to fork for other needs | Blank issues allowed, no stale bot |
| Personal | My own issue tracker | Blank issues allowed, no stale bot |

Discussions go by size, not kind. A big community project routes questions and ideas to Discussions; a smaller one takes ideas as issues labeled Feature Request.

## Tracking work

Work is tracked in one of two places:

- **In public, on GitHub.** Work goes in issues, with sub-issues, parents and blocked-by relationships set. Plans, mocks, research and decisions are attached to the issue they belong to, so the issue carries its own design history. Questions, ideas and feature requests go to Discussions where a repository has them on, and to Feature Request issues where it doesn't. One label scheme everywhere, so an overview can track issues the same way across every repository.
- **In private, with whatever fits.** It's fluid: the [Plannotator](https://github.com/backnotprop/plannotator) board, Inbox threads and shared plans, [notes](https://github.com/timmo001/notes) and handoffs, local Markdown and scratch files, or a tracker such as Linear.

Private tracking suits work that isn't ready to share or doesn't belong in public. When it turns into work on a public repository, it moves to GitHub there.

## Source files

Each hand-written source file opens with a short header saying what it is and, where it isn't obvious, why it's there. A reader, or an agent, opening one file cold should know what they're looking at before the first import.

- **TypeScript:** a `/** */` block before the imports, after any shebang, ending in `@module`. A package's entry point uses `@packageDocumentation` instead.
- **Components:** the header names the element and links to its docs page. The class docstring documents its whole API for editor hovers and the Custom Elements Manifest: `@element`, `@summary`, then `@attr` with its type, `@slot`, `@csspart`, `@cssprop` and `@fires` for each it has.
- **Astro:** a `/** */` block at the top of the frontmatter.
- **CSS, QML, YAML, TOML and shell:** their own comment syntax, at the top. In YAML it goes after the `---`.
- **Skipped:** generated files, which already say so, data files such as a repository's conventions file, and one-line configs.

```ts
/**
 * `gw-button`: the button, in every variant, appearance and size.
 * Docs: https://groundwork.timmo.dev/components/actions/#button
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
```

In Groundwork, the `groundwork/element-docs` Oxlint rule checks each element's docstring against its code, so a new attribute, slot, part or event fails the check until it's documented.

## Package names

First-party packages publish under the `@timmo001` scope. A project's own scope becomes the start of the name: `@<scope>/<name>` becomes `@timmo001/<scope>-<name>`. The name in the repository is the one that's published, so imports read the same inside and outside it.

| In a project | Published as |
| --- | --- |
| `@groundwork/ui` | `@timmo001/groundwork-ui` |
| `@groundwork/tokens` | `@timmo001/groundwork-tokens` |
| `@groundwork/sync` | `@timmo001/groundwork-sync` |

## Demos

Every app with a UI ships a demo of each target it has, and hosts the web one in its docs.

- **Web, in the docs:** the app's real UI, built from the same code that ships, running in the browser on fixture data with no server behind it. People can click through it without installing anything, and it can't drift from the app.
- **Every other target the same way:** the CLI, TUI, desktop and panel demos run the same fixture data, and each runs from a mise task such as `mise run demo:tui`.
- **One service between the UI and the data:** the app's data and actions sit behind one service, with a fixture implementation beside the real one. A demo swaps in the fixture in one place, and a change to the service reaches every target.

Groundwork's own [Demo](/demo) is the reference.

## The manifest

The conventions are data in [`conventions/`](https://github.com/timmo001/groundwork/tree/main/conventions):

- `kinds.yml`: the four kinds.
- `labels.yml`: the [label sets](/conventions/labels).
- `repos/`: a file per repository with its kind, opt-in label sets and areas. See [Repositories](/conventions/repositories).

Repositories that aren't public keep their files in `$XDG_CONFIG_HOME/groundwork/conventions/repos`, which the tools read alongside. `mise run check` checks every file: label names, descriptions, and that every color in a repository is distinct in OKLab. `bun run src/cli.ts labels <owner/repo>` in `packages/conventions` prints the labels a repository should have, for the label job to apply.
