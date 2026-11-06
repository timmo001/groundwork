/**
 * The built-in themes as choices, the optional themes' documents and the
 * inline script that applies a stored pick before the first paint. It uses
 * no DOM types, so a server or CLI building a page can import it without
 * the DOM lib; `page` re-exports all of it for the browser.
 *
 * @module
 */
import base from "../themes/base.json" with { type: "json" };
import bridge from "../themes/bridge.json" with { type: "json" };
import catppuccinFrappe from "../themes/catppuccin-frappe.json" with { type: "json" };
import catppuccinLatte from "../themes/catppuccin-latte.json" with { type: "json" };
import catppuccinMacchiato from "../themes/catppuccin-macchiato.json" with { type: "json" };
import catppuccinMocha from "../themes/catppuccin-mocha.json" with { type: "json" };
import githubDimmed from "../themes/github-dimmed.json" with { type: "json" };
import githubHighContrast from "../themes/github-high-contrast.json" with { type: "json" };
import github from "../themes/github.json" with { type: "json" };
import glazing from "../themes/glazing.json" with { type: "json" };
import slate from "../themes/slate.json" with { type: "json" };
import snag from "../themes/snag.json" with { type: "json" };
import survey from "../themes/survey.json" with { type: "json" };
import tokyoNightDay from "../themes/tokyo-night-day.json" with { type: "json" };
import tokyoNightMoon from "../themes/tokyo-night-moon.json" with { type: "json" };
import tokyoNightStorm from "../themes/tokyo-night-storm.json" with { type: "json" };
import tokyoNight from "../themes/tokyo-night.json" with { type: "json" };

/** How light the page is: `auto` follows the system. */
export type ThemeMode = "auto" | "light" | "dark" | "darker";

/** Light or dark: the side of a mode a theme has to cover. Darker is dark. */
export type ThemeScheme = "light" | "dark";

/** The theme id a visitor's own theme is solved under. */
export const customThemeId = "custom";

/** The id of the `<style>` holding a custom theme's CSS. */
export const customThemeStyleId = "gw-custom-theme";

/** The theme id the desktop's Omarchy theme is solved under. */
export const omarchyThemeId = "omarchy";

/** The id of the `<style>` holding the Omarchy theme's CSS. */
export const omarchyThemeStyleId = "gw-omarchy-theme";

/**
 * A theme to offer, by id and name. A `Theme` document is one. `mode` marks
 * a theme with only one scheme, such as Catppuccin Latte: it's offered and
 * kept for that scheme alone, beside a pick for the other.
 */
export interface ThemeChoice {
  readonly id: string;
  readonly name: string;
  readonly mode?: ThemeScheme | undefined;
  /** The palette an optional theme comes from, such as `Catppuccin`. */
  readonly family?: string | undefined;
}

/** Whether `choice` can show in `scheme`. */
export const themeCovers = (choice: ThemeChoice, scheme: ThemeScheme) =>
  choice.mode === undefined || choice.mode === scheme;

/** The core themes by id and name, in the order the docs list them. */
export const coreThemeChoices: readonly ThemeChoice[] = [
  base,
  glazing,
  survey,
  slate,
  bridge,
  snag,
].map(({ id, name }) => ({ id, name }));

/**
 * The optional themes' documents, by family and then from light to dark.
 * They're bundled with the module, so an app compiled to one binary has them
 * without reading `node_modules`. Decode one with the `MappedTheme` Schema.
 */
export const optionalThemeDocuments = [
  catppuccinLatte,
  catppuccinFrappe,
  catppuccinMacchiato,
  catppuccinMocha,
  tokyoNightDay,
  tokyoNight,
  tokyoNightStorm,
  tokyoNightMoon,
  github,
  githubDimmed,
  githubHighContrast,
] as const;

/**
 * The optional themes, mapped from other palettes, by family and then from
 * light to dark. One with a single mode is offered for that scheme alone;
 * one with both, such as GitHub's, for either.
 */
export const optionalThemeChoices: readonly ThemeChoice[] =
  optionalThemeDocuments.map((theme) => ({
    id: theme.id,
    name: theme.name,
    family: theme.family,
    mode:
      "otherPalette" in theme
        ? undefined
        : theme.mode === "light"
          ? "light"
          : "dark",
  }));

/** What the page's pick starts on, and where it's kept. */
export interface ThemeBootOptions {
  /** The local storage key prefix, such as `my-site:theme`. */
  readonly key: string;
  /** The theme id to start with. */
  readonly defaultTheme: string;
  /** The mode to start with. Defaults to `auto`. */
  readonly defaultMode?: ThemeMode;
  /**
   * Whether the Omarchy theme takes over while the visitor hasn't picked
   * one. With `false` it's only offered, and `defaultTheme` stays in use.
   * Defaults to `true`.
   */
  readonly followOmarchy?: boolean;
}

/** The local storage keys a pick is kept under. */
export const themeStorageKeys = (key: string) => ({
  mode: `${key}:mode`,
  theme: `${key}:id`,
  dark: `${key}:id-dark`,
  document: `${key}:custom`,
  css: `${key}:custom-css`,
  name: `${key}:custom-name`,
});

/** The Omarchy theme's cache, kept apart so a reset doesn't drop it. */
export const omarchyStorageKeys = (key: string) => ({
  css: `${key}:omarchy-css`,
  name: `${key}:omarchy-name`,
  mode: `${key}:omarchy-mode`,
});

/**
 * An inline script that applies the stored mode, theme and any custom or
 * Omarchy theme's cached CSS before the first paint. Takes the same key and
 * defaults as `pageTheme`.
 */
export const themeBootScript = (options: ThemeBootOptions) => {
  const config = JSON.stringify({
    keys: themeStorageKeys(options.key),
    omarchy: omarchyStorageKeys(options.key),
    theme: options.defaultTheme,
    mode: options.defaultMode ?? "auto",
    follow: options.followOmarchy !== false,
    custom: customThemeId,
    style: customThemeStyleId,
    omarchyId: omarchyThemeId,
    omarchyStyle: omarchyThemeStyleId,
  });

  // With nothing picked, a cached Omarchy theme for the scheme is the
  // default, unless it's only offered
  return `(()=>{const c=${config};let s;try{s=localStorage}catch{}const g=(k)=>{try{return s?.getItem(k)??null}catch{return null}};const r=document.documentElement;const a=(id,css)=>{const e=document.createElement("style");e.id=id;e.textContent=css;document.head.append(e)};const m=g(c.keys.mode)??c.mode;const d=m==="dark"||m==="darker"||(m==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);const o=g(c.omarchy.css);let t=(d?g(c.keys.dark):null)??g(c.keys.theme)??(c.follow&&o&&g(c.omarchy.mode)===(d?"dark":"light")?c.omarchyId:c.theme);if(t===c.custom){const css=g(c.keys.css);if(css)a(c.style,css);else t=c.theme}else if(t===c.omarchyId){if(o)a(c.omarchyStyle,o);else t=c.theme}r.setAttribute("data-gw-theme",t);if(m==="auto")r.removeAttribute("data-gw-mode");else r.setAttribute("data-gw-mode",m)})();`;
};
