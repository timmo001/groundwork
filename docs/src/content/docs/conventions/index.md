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

Discussions go by size, not kind. A big community project routes questions and ideas to Discussions; a smaller one takes ideas as issues labelled Feature Request.

## Tracking work

Work is tracked in one of two places:

- **In public, in issues**, with sub-issues, parents and blocked-by relationships set. Plans, mocks, research and decisions are attached to the issue they belong to, so the issue carries its own design history. One label scheme everywhere, so an overview can track issues the same way across every repository.
- **In private, alongside the agent**: the [Plannotator](https://github.com/backnotprop/plannotator) board and Inbox threads, Plannotator plans shared as links, [notes](https://github.com/timmo001/notes) and handoffs (notes flagged for the next session), and local Markdown and scratch files.

Private tracking suits work that isn't ready to share or doesn't belong in public. When it turns into work on a public repository, it moves into issues there.

## The manifest

The conventions are data in [`conventions/`](https://github.com/timmo001/groundwork/tree/main/conventions):

- `kinds.yml`: the four kinds.
- `labels.yml`: the [label sets](/conventions/labels).
- `repos/`: a file per repository with its kind, opt-in label sets and areas. See [Repositories](/conventions/repositories).

Repositories that aren't public keep their files in `$XDG_CONFIG_HOME/groundwork/conventions/repos`, which the tools read alongside. `mise run check` checks every file: label names, descriptions, and that every colour in a repository is distinct in OKLab. `bun run src/cli.ts labels <owner/repo>` in `packages/conventions` prints the labels a repository should have, for the label job to apply.
