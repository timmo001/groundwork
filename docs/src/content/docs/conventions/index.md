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

## The manifest

The conventions are data in [`conventions/`](https://github.com/timmo001/groundwork/tree/main/conventions):

- `kinds.yml`: the four kinds.
- `labels.yml`: the [label sets](/conventions/labels).
- `repos/`: a file per repository with its kind, opt-in label sets and areas. See [Repositories](/conventions/repositories).

Repositories that aren't public keep their files in `$XDG_CONFIG_HOME/groundwork/conventions/repos`, which the tools read alongside. `mise run check` checks every file: label names, descriptions, and that every color in a repository is distinct in OKLab. `bun run src/cli.ts labels <owner/repo>` in `packages/conventions` prints the labels a repository should have, for the label job to apply.
