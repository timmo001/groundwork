---
title: Principles
description: The rules every part of Groundwork follows, from data-first themes to agents reading and using it.
---

1. **Data first, any surface.** Themes, tokens and behavior rules are data. Each target gets a generator; nothing is designed for the web and ported.
2. **Own look on a shared base.** No Material. Every app picks a theme with its own color, shape, density, type and surface accents, so none of them looks generic or like the others.
3. **Follow the host.** Home Assistant cards use Home Assistant's variables, Omarchy panels the Omarchy theme, and plain CLI output the terminal's own palette.
4. **Native first.** The native button, input and dialog on the web; the terminal's own colors and keys in a TUI; Quickshell's types in a panel. Components only where those fall short.
5. **Global variables on the web.** CSS custom properties the whole page reads. No Tailwind and no utility classes.
6. **Behavior is designed too.** CLIs, agent tools, progress, status, notifications and interfaces have conventions, the same as buttons do.
7. **Small parts, no framework.** Custom elements for web UI, with thin wrappers for any framework that hosts them, OpenTUI for terminals, QML for panels. Composites are built from the base elements themselves, each usable on its own and defined only when imported. See [Building from parts](/components#building-from-parts).
8. **Effect everywhere, on the latest versions**: SDKs, CLIs, servers, MCP, and app state through Atoms.
9. **Accessible by default.** Keyboard, focus, labels and contrast are part of every component, not added later. Names stay when labels hide, every word has an attribute for another language, motion stops under reduced motion, and state that shows only as a fill draws in system colors under forced colors. See [Accessibility](/components#accessibility).
10. **Fast by default.** Long content is windowed, folds draw when they open, and [view state](/behavior#view-state) is kept, all inside the components, so an app stays quick as it grows without asking for it.
11. **Agents read and use it.** Every page is in llms.txt and the docs MCP, every job has a skill, and every system has an agent surface.
12. **Fluid.** No versions or releases for the design itself. The base moves with the apps that follow it, apps pin a commit, and the update system carries changes to them.
13. **The system, in any language.** Groundwork is the rules, the data and the contracts; its TypeScript packages are one way to follow them. A service or app in another language, such as Go, follows the same pages and shared test cases, and builds its own pieces from them until a second project in that language makes sharing them worthwhile.
14. **Only the latest version.** Each app supports only its latest release, and clients only the latest service. A change that breaks clients ships with its migration in the same release (signing clients in again where needed) and drops the old way as soon as the clients that need it have updated, rather than carrying both.

## Interfaces

How an app's screens treat the person using them. The `groundwork-interfaces` skill checks a page against them.

1. **Nothing gets in the way.** What a person is watching or reading comes first. Controls sit beside it, overlays leave it in view, and nothing covers it unless the screen has no room left. See [Layout](/foundations/layout) and [Staying out of the way](/components/overlays#staying-out-of-the-way).
2. **Everything can be pressed with a finger.** Every control has a hit area of at least 44px wherever a finger can point, even where it looks smaller, and one press can't land on two. See [Touch targets](/foundations/spacing#touch-targets).
3. **One press does one thing.** A press does what it's on and shows that at once. Closing an overlay never also presses what's under it, and a page's keys never take one from a field or a control. See [Interfaces](/behavior#interfaces).
4. **Things travel, they don't jump.** Something that changes place, size or container moves there, and something that arrives comes from where it belongs and leaves the same way. See [Motion](/foundations/motion).
5. **One layout, many fillings.** A layout shared by several views is one element with slots and properties, not written again for each. See [Building from parts](/components#building-from-parts).
6. **Follow established patterns, cited.** Every number and pattern comes from a design system, a standard or research, and each page lists its sources under References. Where Groundwork differs, it says why.

## References

- Home Assistant: [Principles](https://contributors.home-assistant.io/design/principles/) · [Code](https://github.com/home-assistant/frontend)
- Web Awesome: [Docs](https://webawesome.com/docs/) · [Code](https://github.com/shoelace-style/webawesome)
