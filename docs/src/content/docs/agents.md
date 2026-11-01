---
title: Agents
description: Where MCP, Code Mode and WebMCP each fit, and the theme tools every Groundwork web app can offer an agent.
---

Agents reach an app in three layers. Each does what the others can't, and an app offers the smallest set of tools in each.

| Layer | Runs | Good for | Example |
| --- | --- | --- | --- |
| MCP server | The app's backend or a local process | Reading and changing data with no page open | Triage's `list_issues` and `set_issue_status` |
| Code Mode | The agent's own sandbox, calling MCP tools | Composing many calls into one script | A script that triages ten issues at once |
| WebMCP | The open page, with the user watching | Acting through the UI the user sees, with its state and sign-in | "Show me only regressed issues", "use my Omarchy theme here" |

## The rule

Data and actions go in the app's MCP server first. [WebMCP](https://github.com/webmachinelearning/webmcp) adds only the tools that change what the user is looking at, and never repeats the server's data tools. Tools act on what the app means, such as filtering issues, never on its widgets, so a page stays within an agent's tool budget.

## Theme tools

Every Groundwork web app can let an agent set its theme. `registerThemeTools` from `@timmo001/groundwork-tokens/webmcp` registers three tools on `document.modelContext`, and does nothing in a browser without it:

- `get-theme`: the user's own theme document, and any roles that miss their contrast target.
- `list-themes`: the built-in themes, by id and name.
- `set-theme`: applies a built-in theme by id, a theme document, or an Omarchy `colors.toml`, keeps it with the app's store, and returns any contrast misses for the agent to pass on.

```ts
import { localThemeStore } from "@timmo001/groundwork-tokens/runtime";
import { registerThemeTools } from "@timmo001/groundwork-tokens/webmcp";

registerThemeTools({
  store: localThemeStore("my-app:theme"),
  apply: ({ runtime }) => {
    style.textContent = runtime.css;
    document.documentElement.dataset.gwTheme = runtime.theme.id;
  },
});
```

The theme editor on [Themes](/themes) registers them, so an agent in a browser with WebMCP can design or import a theme there while you watch. In Chrome, turn on `chrome://flags/#enable-webmcp-testing` to try it.

A page on [`pageTheme`](/themes/#on-a-page) gets them without this: it registers them itself when the browser offers WebMCP, and keeps an agent's pick with the visitor's own.

## In the apps

| App | WebMCP tools | Stays in MCP |
| --- | --- | --- |
| System Bridge | The theme tools, `show-module`, `filter-processes` | Media, windows, audio and displays |
| Triage | The theme tools, `filter-issues`, `open-issue` | Resolving, muting and merging, which ask the user first |
| [timmo.dev](https://timmo.dev) | The theme tools, `filter-projects` | Nothing; it has no server of its own |

Each app adds its tools in its own repository when it moves onto Groundwork.

## References

- [WebMCP explainer and spec](https://github.com/webmachinelearning/webmcp)
- [Chrome's WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Model Context Protocol](https://modelcontextprotocol.io)
