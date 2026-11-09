---
name: groundwork-changes
description: Change or extend Groundwork itself, its components, tokens, themes, docs-kit, TUI, panel or mobile pieces, without locking apps in. Use when an app or docs site needs something Groundwork doesn't do or does differently, before editing anything in a Groundwork checkout, or when reviewing a Groundwork change for what it locks.
---

# Changing Groundwork

Groundwork is a starting point each app builds on in its own way. A change to it adds a choice without taking one away: whatever it picks becomes the default, and every app can still pick differently or add its own.

## 1. Move the session into Groundwork

Never change Groundwork from a session working in the app. Move the same session into a local Groundwork checkout before reading or editing it: OpenCode's session move does this in place and keeps the conversation, and a harness without one starts its work there instead. Only then do Groundwork's `AGENTS.md` and its own skills, such as `groundwork-release`, load.

Make the change, check, commit and release it there as its `AGENTS.md` says, then move the session back to the app to take the release. Move as often as the work goes back and forth.

## 2. Add choices, don't lock them

- Keep today's behavior as the default and add a way to change it, rather than changing it for everyone. "Make the toolbar buttons smaller" becomes a smaller default plus a `size` attribute and a `--gw-<element>-…-scale` property, as `gw-code`'s toolbar has.
- Give anything an app might want different a hook: an attribute for the common choices, a `--gw-*` property with the default as its fallback for anything between, and a documented part for each piece an element renders, inner buttons and chips included. Never fix a size, color or spacing on a control inside a shadow root where an app can't reach it.
- Leave room to add: a slot where an app could put its own content beside Groundwork's, such as a toolbar's or a header's actions, or in place of a built-in piece, such as an empty state. Every word an element shows gets a `*-label` attribute, for an app in another language.
- Keep styles in Groundwork's cascade layers with no `!important`, so an app's plain CSS still wins.
- A look only one app wants stays in that app, set through those hooks as [Your own look](https://groundwork.timmo.dev/components#your-own-look) lists. When a hook it needs is missing, add the hook to Groundwork, not the look.

The same holds outside the web components: tokens and themes take overrides and an app's own documents, docs-kit takes options with defaults, and TUI and panel pieces take props rather than fixed values.

## 3. Build from parts

- A composite renders the base `gw-` elements, not its own copy of one: a search field is a `gw-input`, a count a `gw-chip`, an inner button a `gw-button`. Expose each as a part, and size it through a `--gw-<element>-…` property that sets the base element's own scale.
- Import the element's type in its module (`import type {} from "./gw-x.js"`) and the element itself in its `define/` entry, so each piece is defined only when imported. `mise run gen` fails when a `define/` entry misses one, and writes the Built from table on the Components page.
- Keep each base element usable on its own. When a composite needs a piece no base element covers, make it a base element first if another composite or app could use it.

## 4. Keep it accessible

- Build on the native control that does the job, so keyboard use, focus and forms come from the browser. A custom list or menu moves with the arrow keys, Home, End and Page Up or Down, picks with Enter and closes with Esc.
- Every focusable piece gets a `:focus-visible` ring from `--gw-color-focus`, `--gw-focus-width` and `--gw-focus-offset`.
- Every control has an accessible name, kept when its text or label hides. An icon-only button gets one from a `*-label` attribute.
- Anything whose state shows only as a fill or tint gets a `@media (forced-colors: active)` rule with system colors (`Highlight`, `HighlightText`, `CanvasText`, `GrayText`), and `forced-color-adjust: none` where the fill itself is the state.
- Motion goes through the `--gw-motion-*` tokens, so reduced motion stops it.
- Document each of these on the element's docs page, with an example, and run the docs' axe pass (`bun run test:visual` in `docs/`).

## 5. Check the change

Before committing, read the diff for anything an app could no longer change: a value moved inside a shadow root, an inner control given a fixed size, a new piece without a part, a word without a label, a slot removed, a composite drawing its own copy of a base element, or a state lost in forced colors. Fix it with a hook rather than leaving it for the app to work around. Every new attribute, part and property goes in the element's docstring, so the docs' API reference lists it, and on its docs page with an example.
