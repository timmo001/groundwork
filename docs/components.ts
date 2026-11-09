/**
 * The site's own components for Blume: the header and banner in the layout,
 * and the ones the MDX pages use, such as `<Demo>` and `<ThemePreview>`.
 *
 * @module
 */
import HomeBanner from "@timmo001/docs-kit/blume/home-banner.astro";
import { defineComponents } from "blume";
import AppTones from "./components/app-tones.astro";
import Demo from "./components/demo.astro";
import DemoApp from "./components/demo-app.astro";
import ElementApi from "./components/element-api.astro";
import Embed from "./components/embed.astro";
import FontSpecimen from "./components/font-specimen.astro";
import HeaderSearch from "./components/header-search.astro";
import HomeSample from "./components/home-sample.astro";
import LabelSet from "./components/label-set.astro";
import OwnLook from "./components/own-look.astro";
import PageCards from "./components/page-cards.astro";
import RepoKinds from "./components/repo-kinds.astro";
import ThemeGrid from "./components/theme-grid.astro";
import ThemePreview from "./components/theme-preview.astro";
import ThemeSwatches from "./components/theme-swatches.astro";
import ThemeEditor from "./components/theme-editor.astro";
import TokenScale from "./components/token-scale.astro";

export default defineComponents({
  layout: {
    PageHeader: HomeBanner,
    Search: HeaderSearch,
  },
  mdx: {
    AppTones,
    Demo,
    DemoApp,
    ElementApi,
    Embed,
    FontSpecimen,
    HomeSample,
    LabelSet,
    OwnLook,
    PageCards,
    RepoKinds,
    ThemeGrid,
    ThemePreview,
    ThemeEditor,
    ThemeSwatches,
    TokenScale,
  },
});
