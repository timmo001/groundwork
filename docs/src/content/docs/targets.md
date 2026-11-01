---
title: Targets
description: One theme document and one set of roles, with a generator for each kind of app.
---

Every target reads the same theme document and the same roles. What changes is the generator.

| Target | Examples | What it gets |
| --- | --- | --- |
| Web app | System Bridge, notes capture | CSS variables and web components |
| Home Assistant ingress app | Triage | CSS variables and web components |
| Astro site | timmo.dev | CSS variables |
| Docs site | The Blume sites | docs-kit's bridge onto Blume's variables |
| Browser extension | Site Defluffer | CSS variables |
| Desktop app | The multi-boot app on Windows | The web app inside a native shell |
| Terminal app | The OpenTUI TUIs, the OpenCode footer plugin | Resolved colors for OpenTUI |
| CLI output | `dot up`, every SDK's CLI | Roles mapped onto the 16 ANSI colors |
| Omarchy panel or widget | `timmo.updates`, System Bridge's plugin | The QML theme object and shared components |
| Home Assistant card | The HACS cards | Home Assistant's own variables |
| Agents | Code Mode, MCP, WebMCP, skills | Behavior conventions and the docs MCP |

## Generated outputs

`mise run gen` writes each of these from the theme documents in `packages/tokens/themes/`:

| File | For |
| --- | --- |
| `themes.css` | Web apps and sites: `--gw-*` variables per theme and mode, with `prefers-color-scheme` for following the system |
| `themes.json` | Anything else that reads data: every theme's style and resolved colors |
| `themes.ts` | TypeScript apps, typed with each theme's id |
| `Themes.qml` | Omarchy panels: a singleton with every theme's colors |
| `opentui.ts` | OpenTUI apps: resolved hex colors per theme and mode |
| `ansi.json` | Plain CLI output: which ANSI color each role uses |

## Two rules across targets

- **Terminals follow the terminal.** Plain CLI output uses the 16 ANSI colors, so it matches whatever theme the terminal runs, and respects `NO_COLOR`. Full-screen TUIs can use a theme's own colors.
- **Hosts win.** Where a host has a theme (Home Assistant, Omarchy, the terminal), the app maps its roles onto the host's rather than bringing its own.
