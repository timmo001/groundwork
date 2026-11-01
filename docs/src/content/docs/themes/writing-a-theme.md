---
title: Writing a theme
description: The theme document format, checked against a Schema so an agent can write one.
---

Themes live in `packages/tokens/themes/`, one JSON file each, checked against the Schema in `packages/tokens/src/schema.ts`. Run `mise run gen` after adding or changing one: it regenerates every target and this site's theme pages. `mise run check` fails if the theme misses a contrast target.

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
| `style.font`, `figures`, `mono` | The text font, an optional font for figures, and the code font. |
| `style.radius` | Panels, controls and chips, in pixels. 999 is a pill. |
| `style.border` | Width and strength: `none`, `hairline`, `soft` or `strong`. |
| `style.density` | `compact`, `normal` or `roomy`, scaling every space and control height. |
| `style.capitals` | Labels and headings in capitals. |
| `style.link` | Accent or strong text, with a thin or thick underline. |
| `style.surfaceAccent` | `none`, `sheen` (a faint accent gradient), `marker` (an accent bar on the left) or `flange` (an accent edge on top). |
| `style.rows` | `cards` or `dense` table rows for lists. |
| `examples` | Optional. Apps that use the theme, listed on its page as examples. Any app can pick any theme. |

Backgrounds stay plain: a style changes shape and accents, never the background itself.

## An optional theme

Optional themes map an existing palette straight onto the roles, one mode per file, and take Base's style:

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
