---
title: Behavior
description: How CLIs, agent tools, progress, status and notifications behave, so every tool works alike.
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
| Skill | A tool-owned skill in the repository's `skills/` |

Each operation has one access class, which decides how agents may use it:

| Access | Code Mode | MCP |
| --- | --- | --- |
| Read | Read | A read-only tool |
| Write | Write | A tool |
| Ask every time (fixes, anything destructive) | Write, always asks | A tool marked destructive |
| Power (reboot, shut down) | Write, always asks | Left out unless the server starts with `--allow-power` |

Long commands run as jobs only, so an agent starts them and comes back for the result.

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
