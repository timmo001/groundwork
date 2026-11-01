/**
 * The site's own components for Blume: the header and banner in the layout,
 * and the ones the MDX pages use, such as `<Demo>` and `<ThemePreview>`.
 *
 * @module
 */
import HomeBanner from "@timmo001/docs-kit/blume/home-banner.astro";
import { defineComponents } from "blume";
import Demo from "./components/demo.astro";
import FontSpecimen from "./components/font-specimen.astro";
import HeaderSearch from "./components/header-search.astro";
import LabelSet from "./components/label-set.astro";
import RepoKinds from "./components/repo-kinds.astro";
import ThemeGrid from "./components/theme-grid.astro";
import ThemePreview from "./components/theme-preview.astro";
import ThemeSwatches from "./components/theme-swatches.astro";
import ThemeUpload from "./components/theme-upload.astro";
import TokenScale from "./components/token-scale.astro";

export default defineComponents({
  layout: {
    PageHeader: HomeBanner,
    Search: HeaderSearch,
  },
  mdx: {
    Demo,
    FontSpecimen,
    LabelSet,
    RepoKinds,
    ThemeGrid,
    ThemePreview,
    ThemeSwatches,
    ThemeUpload,
    TokenScale,
  },
});
