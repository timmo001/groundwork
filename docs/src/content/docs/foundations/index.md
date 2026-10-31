---
title: Foundations
description: The three layers of tokens, from colour scales to purpose roles to each target's output.
---

Tokens come in three layers, each generated from the one before:

1. **Inputs.** A theme's background and accent, or a palette for an optional theme, plus its style.
2. **Purpose roles.** What a colour is for: `--gw-color-text-primary`, `--gw-color-surface-low`, `--gw-color-border-quiet`, `--gw-color-fill-accent-resting`.
3. **Target outputs.** CSS variables, JSON, TypeScript, QML, OpenTUI colours and ANSI mappings.

Every token starts with `--gw-`, for Groundwork, and every element with `gw-`. Set a theme and mode with `data-gw-theme` and `data-gw-mode`.

- [Colour](/foundations/colour): surfaces, text, fills, accent and status roles, and the contrast targets.
- [Type](/foundations/type): fonts and the type scale.
- [Spacing](/foundations/spacing): the spacing scale, control sizes and focus, drawn to size.
- [Iconography](/foundations/iconography): picking an icon set, using icons with text, and their sizes.
- [Shape and motion](/foundations/layout): radius, elevation and motion.

## References

- Home Assistant: [Foundations](https://contributors.home-assistant.io/design/foundations/) · [Code](https://github.com/home-assistant/frontend/tree/dev/src/resources/theme)
- Web Awesome: [Colour tokens](https://webawesome.com/docs/tokens/color) · [Code](https://github.com/shoelace-style/webawesome/tree/next/packages/webawesome/src/styles)
- Primer: [Primitives](https://primer.style/product/primitives/) · [Code](https://github.com/primer/primitives)
