---
name: groundwork-goals
description: Bring Groundwork back in line with its own goals, fixing whatever goes against them (customizability, extensibility, being a base rather than a framework, composable down to base components, accessibility and the rest of the Principles page) and documenting every part fully with examples and explainers. Use ONLY as an explicitly invoked OpenCode `/goal` objective, such as `/goal @groundwork-goals`, optionally followed by an area to focus on, usually alongside `inbox-reporting` and one review mode.
license: Apache-2.0
compatibility: Runs from the groundwork repository root with mise, Bun and Git. Designed for OpenCode 2 `/goal` with background shells; relies on Upkeep to roll releases out to consumers and heal breaks, and uses Herdr workers and the Plannotator Inbox checklist when available.
disable-model-invocation: true
---

# Groundwork goals

Audits Groundwork against what it's for and fixes what falls short, one area at a time, until every part meets the goals and says so in its docs. It doesn't stop between areas to ask whether to carry on.

```text
/goal @groundwork-goals @inbox-reporting @review-steering
/goal @groundwork-goals @inbox-reporting @review-stages packages/ui
```

Text after the skill names narrows the run to those areas, or adds goals to check alongside the ones below.

## The goals

The sources of truth are `AGENTS.md`, the [Principles page](../../../docs/src/content/docs/principles.md) and `skills/groundwork-changes/SKILL.md`. Read all three first and judge against them, not against this list. The ones to press hardest on:

- **A base, not a framework.** Every part is a starting point an app builds on its own way. Nothing locks a choice in for every app: today's behavior is the default and there's a way to change it.
- **Customizable.** Attributes for common choices, a `--gw-*` property with the default as its fallback for anything between, a documented part for every rendered piece, a `*-label` attribute for every word shown, styles in Groundwork's cascade layers with no `!important`. Outside the web components: tokens take overrides, docs-kit takes options, TUI and QML pieces take props.
- **Extensible.** Slots where an app could add its own content or replace a built-in piece, classes exported without defining a tag, and events and attributes documented well enough for an app to wrap the element.
- **Composable down to base components.** A consumer takes only the parts it wants. Each composite is built from smaller pieces that are each usable, importable and documented on their own: an element's own file exports its class and defines nothing, its `define/` entry defines it and only what it renders, and the "Built from" table on the Components page stays generated and true. Logic a consumer would want without the composite, such as a list's keyboard handling or a popover's placement, lives in a base element, controller or exported helper, not inside the composite. The same holds per package: separate entry points, nothing that imports everything as a side effect, and per-target token files.
- **Accessible by default.** Native elements first, keyboard use, visible focus, an accessible name for every control (kept when labels hide), correct roles and states in shadow roots, contrast that passes in every core theme and mode, reduced motion and forced colors respected.
- **Agents read and use it.** Every job has a skill, and the public skills in `skills/` agree with the code and docs.

## Each area

Work through the areas in this order unless the goal text narrows it: `packages/ui`, `packages/tokens` and themes, `packages/tui`, `qml/`, `packages/docs-kit`, `packages/pwa` and `packages/mobile`, `packages/report`, `templates/`, then the docs site, `README.md`, `AGENTS.md` and `skills/`. Put the areas on the Inbox checklist (`steps`), one step each, and mark each `doing`, `done` or `waiting` as it moves.

For each area:

1. **Audit.** Read the source and its docs page against every goal. Note each gap with the file and line that shows it. Prefer the repository's own checks for evidence: `mise run check`, its lint for undocumented parts, `gen:check`, `contrast`, and for UI the axe pass in `docs/tests/a11y.spec.ts` (`bun run test:visual` in `docs`).
2. **Fix.** Follow `groundwork-changes` for every change, plus `docs-kit`, `groundwork-themes` or `groundwork-conventions` where the area is theirs. Load `effect` for Effect code or `effect-principles` otherwise, and `types-enforce-ts` for TypeScript. Breaking changes are allowed when a goal needs one; see [Breaking changes](#breaking-changes).
3. **Document.** Docs land in the same change as the code, following `maintain-docs`:
   - The class docstring covers the whole API, as `AGENTS.md` lists.
   - The element's or package's docs page explains what it's for and when to reach for it, shows a live example for each attribute, slot, part and property that matters, and shows how to take only the piece wanted and how to restyle, wrap or extend it.
   - Pages describe Groundwork on its own terms with a References section at the end, in US English, as `AGENTS.md` says. Follow `writing-style` for tone; the repository's US English wins over its UK spelling.
   - Regenerate what's generated with `mise run gen`; never edit generated files or pages.
4. **Check.** Run the checks the change needs (`task-runners`, `testing`): `mise run check` always, `bun run test:visual` in `docs` for UI or theme changes, `mise run capture` to look through pages after a large docs change, and a packed tarball build for docs-kit as `AGENTS.md` describes. Add tests only for a concrete regression risk.
5. **Commit and push.** Commit each coherent change through `dot git commit` and push once checks pass, leaving other sessions' work alone. Starting this goal is the request to commit and push for as long as it runs; `AGENTS.md`'s Rollout covers the rest.

A gap too large for the session, or one waiting on a decision, goes in a public issue under a tracking issue for the run, with sub-issues and blocked-by set as `AGENTS.md` says, and labeled per `groundwork-conventions`. Write issue text with `writing-style`.

## Breaking changes

A break is fine when keeping the old shape would leave a gap in place: removing or renaming an attribute, part, slot, event, export or token, changing a default, or splitting a composite into base pieces. Prefer the non-breaking fix `groundwork-changes` describes when it meets the goal just as well, but don't keep a wrong shape just to avoid a break, and don't stop to ask first. Report each break in the Inbox when it lands.

Every consumer must still work once the break reaches it. For each break, choose how its consumers get fixed:

- **Upkeep.** The default. Release it with the break in the notes, under a `Breaking` heading that says what was removed or renamed and what replaces it, as a migration someone can follow without this session. Below 1.0 a break is a minor release, and with those notes Upkeep's `bump` runs each consumer's checks, CI and regression check before it keeps the update. A consumer that fails gets a heal, where one agent session applies the migration to every consumer that broke the same way. Follow the heal runs (`upkeep runs --job heal` or its dashboard) and fix anything they leave for you.
- **This session.** For a few consumers, or a migration that needs judgement: after the release, move the session into each consumer as `groundwork-changes` describes, take the release, migrate, check, commit and push, then move back.
- **Spawned sessions.** For many consumers at once, start Herdr workers through `session-coordination`, one per consumer or group of consumers. Give each one the release, the migration notes, and the instruction to check, commit and push. Starting this goal agrees to spawning workers for consumer migrations, but not for other work.

Find consumers with code search for the package or tag across the owner's repositories, and the apps with a `sync.json` for registry items. Before migrating a consumer directly, check that Upkeep has no heal working on it, so the two don't collide.

## Scope

The groundwork repository, plus consumers only when they're migrating a break as described above. Otherwise consumers take changes through releases and `mise run sync`. A flagged sync copy means an app edited an item: move that edit into Groundwork or a wrapper, as `AGENTS.md` says. Nothing personal goes into the public repository.

## Done or stopped

Before finishing, review the whole run's diff once with `code-review` for anything an app can no longer change that isn't a deliberate break in the notes, a piece without a part, a word without a label, a control without a name, or a page that no longer matches the code.

Done when every area on the checklist is `done` or its remaining gaps are in issues, `mise run check` passes, everything is pushed and the Rollout in `AGENTS.md` has run: one release through `groundwork-release` covering every published package changed, with every break in its notes, then `mise run sync` and a push for each app when a registry item changed. Every consumer a break reached must also pass its checks again, through Upkeep's heals or a direct migration. Report what changed in each area, what was released, the breaks and how each consumer was migrated, and the issues left open.

Stop early only when nothing left can move without the user: every remaining area waits on a decision with no safe default, or a failure has survived two fixes. Report what waits and why, then ask the next-steps question `asking-questions` describes.
