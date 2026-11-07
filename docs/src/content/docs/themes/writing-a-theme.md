---
title: Writing a theme
description: The theme document format, checked against a Schema so an agent can write one.
---

A theme is one JSON document, checked against the Schema in `packages/tokens/src/schema.ts`. An app's own theme lives in the app, as a file beside its code. Decode it with `parseTheme` from `@timmo001/groundwork-tokens/runtime`, then:

- On a page, `runtimeTheme` solves it into CSS and checks its contrast, as [Your own theme](/themes#your-own-theme) shows. List it in `pageTheme`'s `themes` with that CSS on the page.
- On a docs site, `blumeThemeCss` turns the solved theme into Blume's tokens, as the [docs-kit README](https://github.com/timmo001/groundwork/tree/main/packages/docs-kit#readme) shows.
- In a TUI, `hexModes` gives each mode's terminal roles, and `fromRoles` from `@timmo001/groundwork-tui` places them.

Groundwork's own themes live in `packages/tokens/themes/`. Run `mise run gen` after adding or changing one: it regenerates every target and this site's theme pages. `mise run check` fails if one misses a contrast target.

## A core theme

```json
{
  "kind": "solved",
  "id": "glazing",
  "name": "Glazing",
  "description": "Cool periwinkle, like glass and Tokyo Night.",
  "background": "#1b1d29",
  "accent": "#749bee",
  "style": {
    "font": "Inter",
    "mono": "Geist Mono",
    "radius": { "panel": 16, "control": 12, "chip": 10 },
    "border": { "width": 1, "strength": "hairline" },
    "weights": { "regular": 400, "strong": 600 },
    "density": "roomy",
    "capitals": false,
    "link": { "color": "accent", "underline": "thin" },
    "surfaceAccent": "sheen",
    "rows": "cards"
  }
}
```

| Field | What it sets |
| --- | --- |
| `background` | The dark mode background. Its hue and chroma tint every surface in both modes. |
| `accent` | The hue and chroma of the one color the theme is known by. Its lightness is solved per mode. An accent with no real color, as Base's, uses the black and white primary. |
| `style.font`, `figures`, `mono` | The text font, an optional font for figures, and the code font. Any family's name works; [Type](/foundations/type) lists the ones Groundwork bundles, and an app loads any other itself. `figuresMono: true` makes `figures` fall back to a monospace font, as it does already for the bundled code fonts. |
| `style.radius` | Panels, controls and chips, in pixels. 999 is a pill. |
| `style.border` | Width and strength: `none`, `hairline`, `soft` or `strong`, or a number from 0 to 3 for anything between, where 1, 2 and 3 are hairline, soft and strong. |
| `style.density` | `compact`, `normal` or `roomy` (0.85, 1 and 1.2), or a number from 0.7 to 1.5, scaling every space. Controls grow by half as much above 1. |
| `style.capitals` | Labels and headings in capitals. |
| `style.link` | Accent or strong text, with a thin or thick underline. |
| `style.surfaceAccent` | `none`, `sheen` (a faint accent gradient), `marker` (an accent bar on the left) or `flange` (an accent edge on top). |
| `style.rows` | `cards` or `dense` table rows for lists. |
| `status` | Optional. The `info`, `success`, `important`, `warning` and `danger` colors to start from in place of the defaults. Each is solved to its contrast target the same way. |
| `roles` | Optional. Any role set to a color in `light`, `dark` or `darker`, after solving and as given, such as `"surface-raised"` or `"accent"`. Darker starts from dark's overrides. A role that doesn't exist fails to decode, and an override's contrast is checked like the rest. |
| `examples` | Optional. Apps that use the theme, listed on its page as examples. Any app can pick any theme. |

Backgrounds stay plain: a style changes shape and accents, never the background itself.

### Overriding colors

`status` keeps the solver's contrast: give it a hue and it finds the lightness. `roles` is for a color that has to be exact, such as a brand's surface. Roles derived from one, such as `fill-accent-hovered` from `accent`, keep the solved value, so set those too when they should follow:

```json
{
  "status": { "danger": "#ff4f5e" },
  "roles": {
    "dark": { "surface-raised": "#202830" },
    "light": { "accent": "#0b63c5", "fill-accent-resting": "#0b63c5" }
  }
}
```

The roles are the `--gw-color-*` names on the [Color](/foundations/color) page.

## An optional theme

Optional themes map an existing palette straight onto the roles, one mode per file, and take Base's style unless they give their own `style`, with the same fields as a core theme's:

```json
{
  "kind": "mapped",
  "id": "catppuccin-mocha",
  "name": "Catppuccin Mocha",
  "family": "Catppuccin",
  "mode": "dark",
  "palette": {
    "lower": "#11111b",
    "background": "#1e1e2e",
    "raised": "#313244",
    "border": "#45475a",
    "text": "#cdd6f4",
    "muted": "#a6adc8",
    "accent": "#cba6f7",
    "info": "#89b4fa",
    "success": "#a6e3a1",
    "important": "#cba6f7",
    "warning": "#f9e2af",
    "danger": "#f38ba8"
  }
}
```

Their contrast is reported but not enforced, so they stay faithful to the palette.

A palette that comes in both modes, such as the GitHub themes, keeps them in one file: `mode` names the side `palette` is for, and `otherPalette` holds the other, with the same twelve colors. The theme then solves to light, dark and Darker like a core theme, and its choice in the picker has no `mode`, so it stays picked when the mode changes.
