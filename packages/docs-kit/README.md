# @timmo001/docs-kit

Shared branding, layout and config for my documentation sites.

The root export renders brand images and doesn't depend on a docs tool. The
`blume` export holds the [Blume](https://github.com/haydenbleasel/blume) parts: a config helper, a
home page banner, a header GitHub link and a layout stylesheet. If the sites
move off Blume, the root export stays and a new tool gets its own entry point.

## Install

```sh
bun add -E @timmo001/docs-kit
```

The `blume` export needs the `blume` version in `peerDependencies`.

## Blume

### Config

`docsConfig` returns a full Blume config from the site details. Pass anything
else Blume accepts alongside them; it overrides the default it replaces, and
`markdown`, `navigation` and `seo` merge one level deep.

```ts
import { docsConfig } from "@timmo001/docs-kit/blume";
import { defineConfig } from "blume";

export default defineConfig(
  docsConfig({
    title: "Triage",
    description: "Pull request triage from the terminal.",
    site: "triage.timmo.dev",
    github: { owner: "timmo001", repo: "triage" },
    navigation: {
      sidebar: ["/", "/getting-started"],
    },
  }),
);
```

The defaults:

- Light and dark logos from `public/logo-light.svg` and `public/logo-dark.svg`,
  with the title as the logo text.
- Content in `src/content/docs`, last-modified dates from git and external links
  opening in a new tab.
- GitHub's high-contrast code themes, since the default ones miss WCAG AA on
  comments and keywords. Set `markdown.code.theme` to change them.
- Cloudflare deployment to `https://<site>`.
- `llms.txt`, the MCP endpoint at `/mcp`, WebMCP and agent readability on. Ask
  AI and page feedback off.
- GitHub `branch` set to `main` and `dir` to `docs`, plus the header repository
  link.
- Generated share cards using `src/assets/logo.svg`, and an organisation logo at
  `/logo.png` (see [Brand images](#brand-images)).

### Components

Blume reads `components.ts` without running it, so import the components there
directly:

```ts
import HeaderSearch from "@timmo001/docs-kit/blume/header-search.astro";
import HomeBanner from "@timmo001/docs-kit/blume/home-banner.astro";
import { defineComponents } from "blume";

export default defineComponents({
  layout: {
    PageHeader: HomeBanner,
    Search: HeaderSearch,
  },
});
```

- `HomeBanner` shows the logo, title and description across the top of the home
  page and hides the page's own heading and lede. Other pages render nothing.
- `HeaderSearch` keeps Blume's search and adds a GitHub link after it when the
  config has a repository.

Both use scoped CSS, so they don't rely on Tailwind scanning `node_modules`.

### Theme

Import the layout styles from the site's `theme.css`:

```css
@import "@timmo001/docs-kit/blume/theme.css";
```

This widens the content column on large screens and keeps the "On this page"
rail next to the content. The banner's full-width layout relies on these
columns.

Then import the Groundwork theme of the app the site documents, such as Base,
Glazing, Survey, Slate, Bridge or Snag:

```css
@import "@timmo001/docs-kit/blume/themes/bridge.css";
```

It sets Blume's colors, radius and fonts from the theme in light, dark and
Darker, and the color of links in page text, so leave `theme.accent` out of
`blume.config.ts`. The fonts are stacks,
so load the theme's font files in `theme.css` too, for example with
`@import "@fontsource-variable/inter";`. Use Base until the app has a theme of
its own.

An app whose own theme isn't in Groundwork's set keeps its theme document in
the app and renders it with `blumeThemeCss` from
`@timmo001/groundwork-tokens/runtime`, in place of a docs-kit theme. Blume
copies `theme.css` into its own build folder, so a relative `@import` of a
generated file there breaks the build. Have a site script write the rules into
`theme.css` itself, between two marker comments, and run it before `dev`,
`build` and `check`. Fail the script on a missed contrast check, so a theme
that reads badly never ships:

```css
/* theme.json, rendered by scripts/theme.ts: start */
/* theme.json, rendered by scripts/theme.ts: end */
```

```ts
import { readFile, writeFile } from "node:fs/promises";

import {
  blumeThemeCss,
  parseTheme,
  runtimeTheme,
} from "@timmo001/groundwork-tokens/runtime";

const start = "/* theme.json, rendered by scripts/theme.ts: start */";
const end = "/* theme.json, rendered by scripts/theme.ts: end */";

const parsed = parseTheme(await readFile("theme.json", "utf8"));

if (parsed._tag === "Failure") throw new Error(String(parsed.failure));

const { theme, checks } = runtimeTheme(parsed.success);
const misses = checks.filter((check) => !check.passes);

if (misses.length > 0) throw new Error(`Contrast misses: ${misses.length}`);

const css = await readFile("theme.css", "utf8");
const from = css.indexOf(start);
const to = css.indexOf(end);

if (from === -1 || to < from) throw new Error("theme.css has no markers");

const rendered = `${css.slice(0, from + start.length)}\n${blumeThemeCss(theme)}\n${css.slice(to)}`;

if (rendered !== css) await writeFile("theme.css", rendered);
```

Blume type-checks site scripts without Bun's types, so use `node:fs` rather
than `Bun.file`.

To offer an app's own theme in the theme picker beside Groundwork's, write
`blumeThemesCss([theme])` between the markers as well. It puts the theme's
rules under `data-gw-docs-theme` set to its id, as `all.css` does for
Groundwork's, so the theme can be listed in `themes` like any other.

`HeaderSearch` adds a mode picker next to Blume's light and dark toggle, with
Auto, Light, Dark and Darker. Auto follows the system setting. To let readers pick the theme as well, import every
theme after the site's default and pass the themes to `HeaderSearch` from a
wrapper component. `all.css` has the core and optional themes.

```css
@import "@timmo001/docs-kit/blume/themes/base.css";
@import "@timmo001/docs-kit/blume/themes/all.css";
```

List the site's own theme first, then any other Groundwork themes, then the
optional ones. The choices from `@timmo001/groundwork-tokens/choices` carry
each optional theme's `family`, which groups it in the select, and `mode` for
one that comes in one scheme only, such as Catppuccin Latte. Picking that
theme moves the page into its scheme, and the other modes can't be picked
while it's in use. Themes without a family go under `group`, which defaults
to Groundwork. From seven themes the select has a search field, which also
finds themes by family, or by `light` or `dark`.

```astro
---
import {
  coreThemeChoices,
  optionalThemeChoices,
} from "@timmo001/groundwork-tokens/choices";
import HeaderSearch from "@timmo001/docs-kit/blume/header-search.astro";

const themes = [
  ...coreThemeChoices.filter((theme) => theme.id === "bridge"),
  ...optionalThemeChoices,
];
---

<HeaderSearch {...Astro.props} themes={themes} defaultTheme="bridge" />
```

For a site in another language, `HeaderSearch` takes the text it shows:
`label` for the theme select, `modeLabel` for the mode control, `modeLabels`
for each mode (`{ auto: "Automatisch" }`), `unavailableHint` for a mode the
theme doesn't come in (with `{mode}` and `{scheme}` filled in) and
`githubLabel` for the GitHub link. Each defaults to its English text.

Set these in `theme.css` to change the banner. The banner shows the logo from
the site's Blume `logo` config, at its own aspect ratio;
`--home-banner-logo-size` sets its height.

```css
.home-banner {
  --home-banner-logo-size: 20rem;
  --home-banner-height: 30rem;
  --home-banner-background: #e4e4e7;
  --home-banner-background-dark: #09090b;
}
```

## Brand images

`writeBrandImages` renders PNGs from a square SVG logo with a `viewBox`: Open
Graph and GitHub social preview cards, a 512px logo and an Apple touch icon.
Leave an output out to skip it.

```ts
import { writeBrandImages } from "@timmo001/docs-kit";

await writeBrandImages({
  logo: "src/assets/logo.svg",
  title: "Triage",
  tagline: ["Pull request triage", "from the terminal."],
  site: "triage.timmo.dev",
  background: "#18181b",
  accent: "#d97706",
  outputs: {
    socialPreview: "../.github/social-preview.png",
    logo: "public/logo.png",
    appleTouchIcon: "public/apple-touch-icon.png",
  },
});
```

Blume makes its own per-page share cards, so a Blume site only needs `og` for
links outside the docs. GitHub doesn't read the social preview from the
repository; upload it under the repository settings.

## Development

See the [repository README](https://github.com/timmo001/groundwork#development).
