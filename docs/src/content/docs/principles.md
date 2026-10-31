---
title: Principles
description: The rules every part of Groundwork follows, from data-first themes to agents reading and using it.
---

1. **Data first, any surface.** Themes, tokens and behaviour rules are data. Each target gets a generator; nothing is designed for the web and ported.
2. **Own look on a shared base.** No Material. Every app picks a theme with its own colour, shape, density, type and surface accents, so none of them looks generic or like the others.
3. **Follow the host.** Home Assistant cards use Home Assistant's variables, Omarchy panels the Omarchy theme, and plain CLI output the terminal's own palette.
4. **Native first.** The native button, input and dialog on the web; the terminal's own colours and keys in a TUI; Quickshell's types in a panel. Components only where those fall short.
5. **Global variables on the web.** CSS custom properties the whole page reads. No Tailwind and no utility classes.
6. **Behaviour is designed too.** CLIs, agent tools, progress, status and notifications have conventions, the same as buttons do.
7. **Small parts, no framework.** Lit for web UI, Astro can host it, OpenTUI for terminals, QML for panels.
8. **Effect everywhere, on the latest versions**: SDKs, CLIs, servers, MCP, and app state through Atoms.
9. **Accessible by default.** Keyboard, focus, labels and contrast are part of every component, not added later.
10. **Agents read and use it.** Every page is in llms.txt and the docs MCP, every job has a skill, and every system has an agent surface.
11. **Fluid.** No versions or releases for the design itself. The base moves with the apps that follow it, apps pin a commit, and the update system carries changes to them.

## References

- Home Assistant: [Principles](https://contributors.home-assistant.io/design/principles/) · [Code](https://github.com/home-assistant/frontend)
- Web Awesome: [Docs](https://webawesome.com/docs/) · [Code](https://github.com/shoelace-style/webawesome)
