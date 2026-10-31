---
name: groundwork-conventions
description: Apply the Groundwork repository conventions to timmo001 repositories, from a repository's kind and Discussions to the label scheme. Use when creating or inducting a repository, choosing or changing its kind, adding area labels, labeling issues or pull requests, or editing the manifest in timmo001/groundwork's conventions/.
license: Apache-2.0
compatibility: Reads the manifest from a timmo001/groundwork checkout, or from https://groundwork.timmo.dev/conventions when there isn't one. Checking it needs Bun and mise.
---

# Groundwork conventions

Every repository of mine has a kind and takes its labels from one manifest, so issues read the same everywhere. The manifest is data in [`conventions/`](https://github.com/timmo001/groundwork/tree/main/conventions); the site explains it at <https://groundwork.timmo.dev/conventions>. Forks follow their upstream's labels, and repositories I don't own keep their own.

## Kinds

| Kind      | Use when                                          | Extras                                    |
| --------- | ------------------------------------------------- | ----------------------------------------- |
| Personal  | The default: every repository starts here         | None                                      |
| Library   | It follows my apps and setup; others should fork  | None                                      |
| Shared    | Built for others to use, input taken when it fits | Shared labels                             |
| Community | Open to ideas and contributions                   | Community labels, a bug form, a stale bot |

Move a repository up a kind only when it's used more widely, and ask before moving one. Discussions go by size, not kind: only a big community project turns them on.

## Add or change a repository

1. Add or edit its file in `conventions/repos/<name>.yml`: `repo`, `kind`, the Renovate ecosystems it uses, any opt-in sets (`priority`, `os`, `tests`), `areas` and labels to `keep`. Private repositories go in `$XDG_CONFIG_HOME/groundwork/conventions/repos` instead, never in the public repository.
2. Areas are the repository's own parts. Name them in Title Case and describe them as "Related to ...".
3. Run `mise run check`. It fails on a description in the wrong voice or two colors in the repository closer than the OKLab threshold. Pick a new color in the family's hue band rather than loosening the check.
4. Print the result with `bun run src/cli.ts labels <owner/repo>` in `packages/conventions`.

## Label issues and pull requests

- Use the repository's labels from its manifest entry, never GitHub's lowercase defaults.
- Give an issue one type label (Bug, Feature, Enhancement, Refactor, Documentation and the rest) and a status label when it has one (Planned, Ready, In Progress, Needs Decision, Needs Research, Blocked, On Hold, Future).
- Add an area label when the issue is about one part of the repository.
- When no label fits, suggest a new area in the draft; add it to the manifest only once the user agrees.

## Editing the label sets

Change `conventions/labels.yml` only for a change every repository should get. Keep names in Title Case and families as `Group: Value`. When a label is renamed, keep its old name in `aliases` so the label job renames it rather than deleting it.
