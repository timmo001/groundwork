---
name: groundwork-themes
description: Choose, translate or write the theme an app or docs site on Groundwork starts from, and set up the themes it offers. Use when picking an app's theme, comparing a palette or desktop theme with Groundwork's, writing an app's own theme document, or ordering a theme picker. Not for changing Groundwork's own theme set.
---

# Groundwork themes

Most apps and docs sites start from one theme and build from there. Which theme, and which others are offered beside it, are the owner's decisions: lay out the options with your recommendation and ask, even when one seems obvious.

Read the current pages through the `docs-groundwork` MCP server (`get_page`) or the site rather than working from memory: [Themes](https://groundwork.timmo.dev/themes) for the model and the picker order, [Optional themes](https://groundwork.timmo.dev/themes/optional) for the families, [Writing a theme](https://groundwork.timmo.dev/themes/writing-a-theme) for the document format, and the [contrast report](https://groundwork.timmo.dev/themes/contrast).

## 1. Pick the starting point

One of four, in this order of preference:

1. **A core theme** (Base, Glazing, Survey, Slate, Bridge or Snag). Each is solved to the contrast targets in light, dark and Darker. Base until the owner has chosen.
2. **An optional theme** mapped from another palette, such as Catppuccin, Tokyo Night or GitHub. Contrast is reported, not enforced. Some come in one scheme only, such as Catppuccin Latte, and keep the page in it.
3. **A theme from elsewhere**, such as a published palette or the owner's Omarchy theme. Compare it first (step 2): most turn out to be an existing theme with small changes.
4. **The app's own theme**, from another theme's document or from scratch (step 3).

## 2. Compare before adding

Before writing a theme from a palette, check it isn't one Groundwork already has. Map its colors onto the roles (backgrounds onto the surfaces, foregrounds onto text, the accent and the status colors), then measure each against the nearest theme's generated roles in `@timmo001/groundwork-tokens/themes.json` with CIEDE2000 (`differenceCiede2000` in `culori`) and OKLCH:

- Surfaces and accent within about ΔE 3 of a theme: it is that theme. Use it, and report the few roles that differ.
- Only the text tint or the status colors differ: usually tuning for a terminal or an app, not a new theme.
- A clearly different background hue or accent: a candidate for the app's own theme.

An Omarchy `colors.toml` maps with `omarchyTheme` from `@timmo001/groundwork-tokens/runtime`, the same mapping apps use at runtime.

## 3. Write the app's own theme

- Keep the document in the app's repository, not in Groundwork's `packages/tokens/themes/`. A theme joins Groundwork's set only when the owner decides it's general enough, as a Groundwork change following the theme naming rules.
- Start from the closest theme's JSON, or from scratch as Writing a theme shows: a `solved` document with a background, an accent and a style. A palette that has to stay exact is a `mapped` one, with `otherPalette` when it covers both schemes.
- Decode it with `parseTheme` and solve it with `runtimeTheme` from `@timmo001/groundwork-tokens/runtime`. Every entry in `checks` should pass for a solved theme; report any that miss.
- Ship its CSS on the page, from `runtimeTheme(...).css` at build time, and pass its document in `documents` so agents can pick it through the theme tools.
- docs-kit has stylesheets only for Groundwork's own themes. A docs site for an app with its own theme renders its stylesheet from the document with `blumeThemeCss`, failing on any contrast miss, and imports it in place of a docs-kit theme, as the docs-kit README shows.

## 4. Offer the themes

- List the app's own theme first, then any other Groundwork themes it offers, then the optional ones by family. The list is the app's to shape: leave groups out or add its own.
- On a page, pass the choices to `pageTheme` and build the picker's options with `themeOptions` from `@timmo001/groundwork-tokens/page`. Set the picker's `scheme` from `state().only`, so a one-scheme theme's other modes can't be picked.
- On a docs site, pass the same choices to docs-kit's `HeaderSearch`, as the docs-kit README shows.
- A theme the visitor imports, or the desktop's Omarchy theme, is offered where it makes sense, never the default. TUIs are the exception: they follow the terminal's Omarchy theme until `GW_THEME` says otherwise.

Then switch the docs site, the app and the brand images over, as the Setup page's Theme step lists.
