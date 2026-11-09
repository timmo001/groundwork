---
title: Omarchy panels
description: The shared QML components for Omarchy shell panels, and how an app sets, extends and translates them.
---

Omarchy panels stay on QML, on Quickshell's types and the Omarchy shell's own `qs.Commons` and `qs.Ui`. Groundwork adds a few components every panel needs, in `qml/`. They reach apps as copies through the [sync](/sync), and `templates/omarchy-panel` uses each one (`mise run demo:panel`).

Each takes properties with today's look as the default, so a panel changes them by setting a property, never by editing its copy. To add behavior, wrap the component in one of the app's own.

## FilterablePanel

A filtered list with a keyboard cursor over its rows. A panel hands it a `model` of entries (`key`, `primaryText`, `secondaryText`, `tertiaryText`, `section`) and reacts to its signals; it owns filtering and moving the cursor.

| Key | What it does |
| --- | --- |
| Typing, Backspace | Filters by the entries' text |
| Up, Down | Moves the cursor |
| Enter | `activateRequested(entry, modifiers)` |
| Menu, Shift+F10 | `menuRequested(entry)` |
| Esc | Clears the filter, then `closeRequested()` |
| Tab, Shift+Tab | `tabRequested(direction)`, to switch panels |
| Backspace on an empty filter | `backRequested()` with `backOnEmptyFilter` |
| Ctrl+R | `refreshRequested()` |

Entries flagged `navigation: true`, such as a back button, stay in the cursor's path but never filter out, and the cursor starts on the first real row. `navigationModel` sets a cursor order other than the filtered rows', `bypassFilter` leaves filtering to the panel, and `keyboardEnabled` turns the keys off while something else has them.

## PanelFlickable

A panel's scrolling body, smooth on the wheel and touchpad. `wheelStep` is the pixels one wheel notch moves (`92`), `wheelDuration` how long it takes in milliseconds (`200`) and `touchpadMultiplier` how far a touchpad moves it (`6`).

## PanelHeader

The panel's title, with an icon, `meta` and `detail`, and a back button before it when `backText` is set. The back button is an icon, so `backText` is its tooltip, shown for the pointer and the keyboard cursor alike. `trailingControl` puts a control of the panel's own at the end, and `backIcon` sets the back button's glyph.

## SectionHeading

A heading between groups, with an optional `icon`, a refresh button with `refreshable`, a collapse chevron with `collapsible` and `expanded`, and a `trailingControl`. The refresh button is an icon, named by its tooltip: `refreshLabel` and `refreshingLabel`, which default to "Refresh" and "Refreshing" and the title. `refreshIcon`, `expandedIcon` and `collapsedIcon` set the glyphs, for a panel on another icon font, and `fillAlpha`, `borderAlpha` and `cursorBorderAlpha` the fill and border over `foreground`.

```qml
SectionHeading {
  title: "Mises à jour"
  refreshable: true
  refreshLabel: "Actualiser les mises à jour"
  refreshingLabel: "Actualisation…"
  onRefreshRequested: root.refresh()
}
```

## OutputView

Read-only monospace output, such as a log or a command's result, that scrolls once it passes `maxHeight` and keeps its text selectable. `followTail` keeps the newest output in view while a command runs, and `fillAlpha` and `borderAlpha` set the fill and border over `foreground`.

## Colors and fonts

Every component takes `foreground` and `fontFamily`, defaulting to the Omarchy theme's, so a panel passes its own once and each piece follows. `Themes.qml` from the [tokens](/targets) has every Groundwork theme's colors for a panel that offers them.
