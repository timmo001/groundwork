---
title: Deploying
description: Every Cloudflare resource a repository runs is code in an Alchemy stack, deployed from GitHub Actions through the shared workflows.
---

Everything a repository runs on Cloudflare, from a docs site to an app Worker and its database, is declared in an [Alchemy](https://alchemy.run) stack in the repository and deployed from GitHub Actions. There are no Wrangler configs, no Workers Builds connections and no dashboard edits: what's in the stack is what runs, and a change to it goes through a pull request like any other.

The deploy jobs come from the shared workflows in [timmo001/workflows](https://github.com/timmo001/workflows), so a repository only says when to deploy and which mise task does it.

## What every stack has

- **The stack:** `alchemy.run.ts`, at the root for an app or in `docs/` for a docs site, with `Cloudflare.providers()` and `Cloudflare.state()`, so its state lives in the Cloudflare account rather than on a machine.
- **CI's credentials as code:** `stacks/github.ts` mints a Cloudflare API token scoped to what the stack deploys and writes it to the repository's `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. It's deployed once from a machine with the `deploy:github` task, and again only when the token's scope changes.
- **mise tasks:** `deploy` builds and deploys the `prod` stage, `plan` shows what a deploy would change, and `deploy:github` deploys the credentials stack. A docs site in `docs/` prefixes them with `docs:`.
- **A deploy workflow** that calls the shared one on pushes to the default branch that touch what the stack builds, queued rather than cancelled so a stack update never stops halfway.
- **Alchemy's packages** pinned exactly in the package that holds the stack: `alchemy`, `@alchemy.run/cloudflare`, `@alchemy.run/github` and `@effect/platform-bun`. `.alchemy/` is ignored.

Secrets a Worker needs, such as a webhook secret, are read with `effect/Config` in the stack, so Alchemy binds them onto the Worker. CI passes them to the deploy job from the repository's Actions secrets. Nothing is set by hand in the dashboard.

## Setups

| Setup | Alchemy resources | Examples |
| --- | --- | --- |
| [Docs site](#docs-site) | `Cloudflare.Worker` from docs-kit's `blumeWorker` | Every Blume docs site |
| [Single-page app](#single-page-app) | `Cloudflare.Website.Vite` or `StaticSite` | System Bridge's web client |
| [Astro site](#astro-site) | `Cloudflare.Website.Astro` | timmo.dev |
| [App Worker](#app-worker) | `Cloudflare.Worker` with D1, R2, KV and Queue bindings | Cardstock, notes capture, Upkeep's events Worker |
| [Redirect Worker](#redirect-worker) | A small `Cloudflare.Worker` with only a domain | timmo.dev's `www` redirect |
| [Files in R2](#files-in-r2) | An R2 bucket and its domain, with releases publishing into it | The Arch package repository, Android F-Droid repositories |

### Docs site

A [docs-kit](https://github.com/timmo001/groundwork/tree/main/packages/docs-kit) site deploys as a `<repo>-docs` Worker at `<repo>.timmo.dev`. `blumeWorker` reads what `blume build` left in `dist/` (its entry, compatibility settings, assets and the routes that run the Worker first) and returns them as the Worker's settings, so the stack only adds the name and the domain. Keep `nodejs_compat` in the flags. The [docs-kit README](https://github.com/timmo001/groundwork/tree/main/packages/docs-kit#deploy) has the whole stack, and Groundwork's own `docs/alchemy.run.ts` is one to copy.

A repository that deploys one docs site per branch, such as one per distro, gives each branch its own stage and Worker name, and runs the deploy on pushes to each of those branches.

### Single-page app

A web client with no server of its own, built by Vite, deploys as Worker static assets with not-found requests falling back to `index.html`. Use `Cloudflare.Website.Vite` when the app is plain Vite, or `Cloudflare.Website.StaticSite` around any build command's output.

### Astro site

An Astro site on the Cloudflare adapter deploys with `Cloudflare.Website.Astro`: server routes in the Worker, prerendered pages as assets, and Workers Cache for the routes that set cache headers. Anything the build reads from the environment, such as an API token for data it fetches, is passed to the build step in CI.

### App Worker

A Worker with its own code and storage declares each resource in the stack and binds it into the Worker: a D1 database with its migrations, an R2 bucket, a KV namespace, or a Queue it produces to. The binding gives the Worker a typed client, and Alchemy creates the resource on the first deploy and keeps it across later ones.

When the app has a docs site too, both go in the one stack, so one deploy updates them together.

### Redirect Worker

A domain that only redirects, such as `www` to the apex, is a Worker with a few lines of code and a custom domain, and no assets or bindings. It lives in the stack of the site it redirects to.

### Files in R2

A package repository, such as an Arch repository or an F-Droid repository for Android apps, is an R2 bucket on a custom domain. The bucket and its domain are Alchemy resources in the stack. The files in it aren't: each release publishes into the bucket from its workflow, syncing the files over R2's S3 API and purging the domain's cache for what changed.

## Moving an existing Worker over

1. Write the stack with the Worker's current name and domain.
2. Adopt the Worker in code with `.pipe(Alchemy.AdoptPolicy.adopt(true))`, so the first deploy from CI takes it over rather than failing because it already exists.
3. Deploy `stacks/github.ts` once to write CI's secrets.
4. Disconnect the Worker's Workers Builds before pushing, so its builds don't run the new scripts.
5. Remove the Wrangler config and the `wrangler deploy` scripts. Keep `wrangler` as a dev dependency when something else needs it, such as `@astrojs/cloudflare`.
6. Push, and check the first deploy kept the domain serving.

## References

- [Alchemy: Cloudflare](https://alchemy.run/cloudflare)
- [Alchemy: CI](https://alchemy.run/environments/ci)
- [Alchemy: Secrets and config](https://alchemy.run/environments/secrets)
- [Alchemy: Frontend frameworks](https://alchemy.run/cloudflare/frontend/frontends)
- [Alchemy: D1](https://alchemy.run/cloudflare/data/d1)
