---
title: Foundations
description: The three layers of tokens, from colour scales to purpose roles to each target's output.
---

Tokens come in three layers, each generated from the one before:

1. **Inputs.** A theme's background and accent, or a palette for an optional theme, plus its style.
2. **Purpose roles.** What a colour is for, named in Home Assistant's pattern so moving onto Home Assistant's own tokens later is a rename: `--gw-color-text-primary`, `--gw-color-surface-low`, `--gw-color-border-quiet`, `--gw-color-fill-accent-resting`.
3. **Target outputs.** CSS variables, JSON, TypeScript, QML, OpenTUI colours and ANSI mappings.

Every token starts with `--gw-`, for Groundwork, and every element with `gw-`. Set a theme and mode with `data-gw-theme` and `data-gw-mode`.

- [Colour](/foundations/colour): surfaces, text, fills, accent and status roles, and the contrast targets.
- [Type](/foundations/type): fonts and the type scale.
- [Spacing](/foundations/spacing): the spacing scale, control sizes and focus, drawn to size.
- [Shape and motion](/foundations/layout): radius, elevation and motion.
