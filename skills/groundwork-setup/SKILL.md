---
name: groundwork-setup
description: Set up a new repository on Groundwork, or finish one that's partly set up, following the Setup page step by step. Use when creating a repository, when asked to apply or finish Groundwork in a repository, or to check what a repository is still missing.
---

# Groundwork setup

The [Setup](https://groundwork.timmo.dev/setup) page is the checklist. Read it fresh (`get_page` on `/setup` through the `docs-groundwork` MCP server, or the page itself) rather than working from memory, and follow each step's linked page for the detail.

1. Find where the repository stands: compare each step on the page with the repository, its GitHub settings, CI and docs deployment. Note what's done, what's missing and what's waiting on a decision.
2. Put the steps on the repository's tracking issue as a checklist, ticking what's already done.
3. Work through the missing steps in order, doing every part a step lists rather than only its headline: a theme change, for one, also covers the docs fonts and the brand images. Do everything the available tools can do, including GitHub settings and the Cloudflare Worker, and leave only what needs a person, such as the social preview upload, as an action for the user.
4. Don't build past a decision the repository hasn't made yet: a step that depends on one waits, and says which. Look and feel are always the owner's decisions, so ask before choosing the app's starting theme and which others it offers, whether users can upload their own, fonts, an icon set or the logo's colors, even when one seems obvious. When the app can't switch themes yet, offer to plan the theme step as an issue instead. Agent permissions are the owner's call too: show the rules from the page's Agent permissions section, filled in for this repository, and commit them only once confirmed.
5. Run the repository's checks after each step, then commit and push it as the repository's own rollout rules say, and tick the step off with a link to its commit.

## Skills for each step

Load the skill a step needs when you reach it, where it's available:

| Step | Skill |
| --- | --- |
| 1. Create the repository | `github-repository-setup`, then `groundwork-conventions` for its kind and labels |
| 2. Tools and workspace | `install-timmo-oxlint-rules` for the Oxlint preset; `npm-jsr-first-publish` before a package's first release |
| 2. Android app | the `android-app` template's README and the `android-cli` skill, where available; store the release key in 1Password as well as the Actions secrets |
| 4. CI | `shared-workflows`, then `github-development-rulesets` once CI has run |
| 5. Docs site | `docs-kit` |
| 7. Agent surface | the `cli-tool` template's README |
| 9. Theme | `groundwork-themes` |

When a step turns out to be missing from the page, or a repository does it differently for a good reason, change the page in Groundwork rather than only the repository, so the next one gets it too, following `groundwork-changes`.
