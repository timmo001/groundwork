---
title: Layout
description: Spacing, radius, motion, elevation and focus, the foundations shared by every theme.
---

## Spacing

Home Assistant's scale: 4px steps from `--gw-space-1` to `--gw-space-20`, plus a 2px half step, multiplied by the theme's density (0.85 compact, 1 normal, 1.2 roomy). `--gw-space-N` is N × 4px at normal density, the same as `--ha-space-N`. Terminal UIs use cells instead.

| Token | Size at normal density | Used for |
| --- | --- | --- |
| `--gw-space-0-5` | 2px | Hairline gaps, such as inside a toggle's track |
| `--gw-space-1` | 4px | Icon to text in a chip |
| `--gw-space-2` | 8px | Icon to text in a button or badge, gaps between chips |
| `--gw-space-3` | 12px | Field and badge padding, rows |
| `--gw-space-4` | 16px | Button padding, gaps between controls |
| `--gw-space-5` | 20px | Card padding |
| `--gw-space-6` | 24px | Gaps between sections of a page |
| `--gw-space-8` | 32px | Empty states |
| `--gw-space-12` | 48px | Page margins on wide screens |

## Sizes

Controls follow Home Assistant's heights, so they line up in a row:

| Control | Height |
| --- | --- |
| Button `xs`, `small`, `medium`, `large`, `xl` | 24, 32, 40, 48 and 56px; `--gw-button-scale` sets any other |
| Input and select | 40px |
| Badge | 36px, 18px icon |
| Chip | 28px |
| Toggle (segmented control) | 40px track, 32px options |

Focus rings sit outside a control, so neighbours keep at least `--gw-space-2` between them; inside a track, such as a toggle's, the ring is inset instead.

## Radius

A fixed scale, `--gw-radius-xs` (2px) to `--gw-radius-xl` (16px) and `--gw-radius-pill`, plus three the theme sets: `--gw-radius-panel`, `--gw-radius-control` and `--gw-radius-chip`.

## Motion

Home Assistant's durations: `--gw-motion-instant` (75ms), `--gw-motion-fast` (150ms), `--gw-motion-normal` (250ms) and `--gw-motion-slow` (350ms), with `--gw-motion-easing`, `cubic-bezier(0.2, 0, 0, 1)`. All drop to 1ms under `prefers-reduced-motion`.

Things that move, move fluidly. Inside a component that's a CSS transition: a toggle's picked pill slides to the new option, a switch's knob glides, menus, dialogs and toasts ease in from `@starting-style`. Colour changes use the fast duration, and anything that travels uses the normal one.

Changes to the whole view use the View Transitions API through `withViewTransition()`, which falls back to changing straight away where it isn't supported. Switching theme or mode crossfades the page. Keep them simple, give each `view-transition-name` once, and remember only one runs at a time and that they work at document level, not inside a shadow root.

## Elevation

`--gw-shadow-s`, `-m` and `-l`, from black at low opacity. Dark modes use stronger shadows, since a shadow reads less on a dark surface.

## Focus

A 2px outline in `--gw-color-focus`, offset by 2px: `--gw-focus-width` and `--gw-focus-offset`. Terminals use reverse video or a marker.
