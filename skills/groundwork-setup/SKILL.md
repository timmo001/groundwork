---
name: groundwork-setup
description: Set up a new repository on Groundwork, or finish one that's partly set up, following the Setup page step by step. Use when creating a repository, when asked to apply or finish Groundwork in a repository, or to check what a repository is still missing.
---

# Groundwork setup

The [Setup](https://groundwork.timmo.dev/setup) page is the checklist. Read it fresh (`get_page` on `/setup` through the `docs-groundwork` MCP server, or the page itself) rather than working from memory, and follow each step's linked page for the detail.

1. Find where the repository stands: compare each step on the page with the repository, its GitHub settings, CI and docs deployment. Note what's done, what's missing and what's waiting on a decision.
2. Put the steps on the repository's tracking issue as a checklist, ticking what's already done.
3. Work through the missing steps in order, doing every part a step lists rather than only its headline: a theme change, for one, also covers the docs fonts and the brand images. Do everything the available tools can do, including GitHub settings and the Cloudflare Worker, and leave only what needs a person, such as the social preview upload, as an action for the user.
4. Don't build past a decision the repository hasn't made yet: a step that depends on one waits, and says which. Look and feel are always the owner's decisions, so ask before choosing a theme, fonts, an icon set or the logo's colours, even when one seems obvious.
5. Run the repository's checks after each step, then commit and push it as the repository's own rollout rules say, and tick the step off with a link to its commit.

When a step turns out to be missing from the page, or a repository does it differently for a good reason, change the page in Groundwork rather than only the repository, so the next one gets it too.
