---
title: Behavior
description: How CLIs, agent tools, status, notifications and interfaces behave, so every tool works alike.
---

The parts that aren't pixels. A new system follows these, and the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool) shows each one working.

## CLIs

- One Effect CLI tree per system. The same tree feeds the CLI, Code Mode and MCP, so a new command reaches all three at once.
- Every command that returns data takes `--json`, which is the agent interface.
- When there's nothing to do, say so in one line and exit 0.
- Choices are a multi-select with the sensible ones ticked, and Enter runs them. `--yes`, `--json` or no terminal skips the picker.
- Long runs print numbered sections with one line each (`[3/7] mise tools`) and stream as they go.
- `--check` lists what would change without changing anything; `--force` skips the check.
- Help, completions and a generated reference come from the tree.
- Plain output uses the terminal's 16 ANSI colors and respects `NO_COLOR`.

## Agents

Every system gets the same agent surface:

| Surface | What it is |
| --- | --- |
| Code Mode | A manifest from `<tool> agent tools --json`, the shape `dot` already prints |
| MCP | A server on stdio from the same operations |
| Skill | A tool-owned skill in the repository's `skills/`, published on skills.sh and as a Claude Code marketplace |

An agent tries Code Mode first, then MCP, then the CLI with `--json`, and the skill says so.

Each operation has one access class, which decides how agents may use it:

| Access | Code Mode | MCP |
| --- | --- | --- |
| Read | Read | A read-only tool |
| Write | Write | A tool |
| Ask every time (fixes, anything destructive) | Write, always asks | A tool marked destructive |
| Power (reboot, shut down) | Write, always asks | Left out unless the server starts with `--allow-power` |

Long commands run as jobs only, so an agent starts them and comes back for the result.

### Publishing the skill

Two files at the repository's root publish `skills/`, and the [`cli-tool` template](https://github.com/timmo001/groundwork/tree/main/templates/cli-tool) has both:

| File | For |
| --- | --- |
| `skills.sh.json` | The [Skills CLI](https://skills.sh), grouping the skills into those for using the tool and those for working on it |
| `.claude-plugin/marketplace.json` | Claude Code, with one plugin whose source is `./skills` |

The docs site gets an Agents page listing each surface, every operation with its access, and how to install the skill:

```bash
npx skills add timmo001/<repo> --skill <tool>
```

```text
/plugin install <tool> --marketplace timmo001/<repo>
```

## Status and notifications

- One status source per system, as `dot updates status --json` is for updates. The bar widget, the OpenCode footer, the CLI and the panel all read it, so each shows the same counts.
- The bar counts what needs you, and hides in quiet hours.
- Avoid toasts. Show an outcome where it happened (the button, a popover from it, or the page), app-wide state in a slim bar, and anything that needs you as a notification. A toast never has an action. Nothing for green runs.

## Notifications

The notification center is the one place an app tells you it needs you. A notification is a pointer to a page: clicking it goes there, and the page has the details.

- **It's yours if** you caused it, you need to decide something, or it's about something you own: a restart after your update, an update to install, a device found, a failed sign-in. How the system works (startup steps, logs, background jobs) stays out.
- **The app decides how loud it is.** An alert shows by the notifications entry until you act on it or hide it; a passive one only goes to the center. Both are the same card in both places, with the same actions.
- **Hiding isn't dismissing.** A hidden alert moves to the center and comes back only when its state changes.
- **System notifications clear themselves.** A pending restart goes when you restart; you dismiss your own.
- **Like ones stack.** One restart notification lists everything that asked; "3 devices discovered" is one card.
- Decisions go to the Plannotator Inbox; reviews go through Plannotator, not GitHub.

## Interfaces

How an app's pages hold up as they grow. Groundwork's components do most of this themselves, so a page gets it by using them: [tables](/components/display#table) and [expansion panels](/components/display#expansion-panel) keep their own view state and draw on open, and long lists are windowed.

### View state

How someone has set a view up to read it: the sort, the search, folded sections, filters and the chosen tab. It isn't data, which comes from the server, and it isn't a setting, which is an app-wide preference.

- The page sets how a view starts. The browser keeps only what someone changes, so a new default still reaches anyone who never touched it.
- It comes back as it was left, in that browser, under a `storage-key`. Keys read `app:view:part`, such as `upkeep:jobs:table`.
- A component with a `storage-key` keeps its own view state, so the page never has to. Code that keeps something of its own reads and writes through the same `getStorage()`.
- It goes in the URL only when a link should carry it, such as a search someone would share.

### Folds

Expansion panels, and the groups in a table or list.

- Each starts as the page chooses: folded for long or reference content, open for what needs you.
- What's in a fold is drawn the first time it opens, never with the page, and stays drawn after that. With `gw-expansion`, that's its `draw`.
- Group headings sit on the page's own surface, the bottom layer, and the rows or cards in them sit raised on top.

### Long content

Anything that can grow past a screen, such as a table, a list, a feed or a diff, draws only the part in view. Inside a fold or a panel, it scrolls in its own frame up to a maximum height (`contained`), rather than stretching the page.

### Respond first

A press shows its result in the same frame: the fold opens and the chevron turns. The work it starts, such as a request, marking something read or drawing heavy content, waits until after that frame. A write shows at once and rolls back if it fails.

### Loading

- A skeleton shaped like the content, for each part rather than the whole page, so nothing jumps when the data arrives.
- A refresh keeps the last data on screen.
- A spinner is only for an action in progress, never for content.

### Refreshing

Polling and live changes redraw only what changed, keyed by each item's id. They never reset view state, the scroll position or open folds.

### Text

Written text from people or agents, such as a description, a reason or a summary, renders as markdown, sanitized. Short plain values, such as a name or a version, stay plain text.
