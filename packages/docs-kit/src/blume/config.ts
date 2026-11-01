import type { BlumeConfig } from "blume";
import { cloudflare } from "blume/deploy";

/** Options for {@link docsConfig}: a Blume config plus the shared site details. */
export interface DocsConfigOptions extends Omit<
  BlumeConfig,
  "github" | "title"
> {
  /** Site title, also used for the header logo text and alt text. */
  title: string;
  /** Host name the site deploys to, such as `docs.example.dev`. */
  site: string;
  /** Repository the docs live in. `branch` defaults to `main` and `dir` to `docs`. */
  github: NonNullable<BlumeConfig["github"]>;
}

/**
 * Build a Blume config with the shared defaults: light and dark logos from
 * `public/`, Cloudflare deployment, agent surfaces on, Ask AI and feedback off,
 * high-contrast code themes and generated share cards. Any option given here
 * wins over the default it replaces; `markdown`, `navigation` and `seo` merge
 * one level deep.
 */
export const docsConfig = ({
  site,
  github,
  markdown,
  navigation,
  seo,
  ...config
}: DocsConfigOptions): BlumeConfig => ({
  logo: {
    image: {
      alt: config.title,
      dark: "/logo-dark.svg",
      light: "/logo-light.svg",
    },
    text: config.title,
  },
  content: {
    root: "src/content/docs",
  },
  ai: {
    assistant: {
      enabled: false,
    },
  },
  agents: {
    agentReadability: true,
    contentSignals: {
      aiInput: true,
      aiTrain: false,
      search: true,
    },
    llmsTxt: true,
    mcp: {
      enabled: true,
      route: "/mcp",
    },
    webmcp: true,
  },
  deployment: cloudflare({
    site: `https://${site}`,
  }),
  feedback: false,
  lastModified: "git",
  ...config,
  github: {
    branch: "main",
    dir: "docs",
    ...github,
  },
  // The high-contrast GitHub themes, since the default ones miss WCAG AA on
  // comments and keywords
  markdown: {
    externalLinks: true,
    ...markdown,
    code: {
      ...markdown?.code,
      theme: {
        dark: "github-dark-high-contrast",
        light: "github-light-high-contrast",
        ...markdown?.code?.theme,
      },
    },
  },
  navigation: {
    repo: true,
    ...navigation,
  },
  seo: {
    ...seo,
    og: {
      enabled: true,
      logo: "src/assets/logo.svg",
      site,
      ...seo?.og,
    },
    organization: {
      logo: "/logo.png",
      sameAs: [`https://github.com/${github.owner}/${github.repo}`],
      ...seo?.organization,
    },
  },
});
