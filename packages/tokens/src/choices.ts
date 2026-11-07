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
import tokyoNightMoon from "../themes/tokyo-night-moon.json" with { type: "json" };
import tokyoNightStorm from "../themes/tokyo-night-storm.json" with { type: "json" };
import tokyoNight from "../themes/tokyo-night.json" with { type: "json" };
import type { Theme } from "./schema.ts";

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

/** The theme id the phone's dynamic color is solved under. */
export const androidThemeId = "android";

/** The id of the `<style>` holding the Android theme's CSS. */
export const androidThemeStyleId = "gw-android-theme";

/**
 * A theme to offer, by id and name. A `Theme` document is one. `mode` marks
 * a theme with only one scheme, such as Catppuccin Latte: while it's picked,
 * the page stays in that scheme.
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

/**
 * Whether `mode` can be used with `choice`: any for a theme with both
 * schemes, and only its own for one with one. Auto could land on the other
 * scheme, so it's left out too.
 */
export const themeAllows = (choice: ThemeChoice, mode: ThemeMode) =>
  choice.mode === undefined ||
  (mode !== "auto" && themeCovers(choice, mode === "light" ? "light" : "dark"));

/** A theme choice as a picker's option. */
export interface ThemeOption {
  value: string;
  label: string;
  group?: string;
  keywords: string[];
}

/**
 * Choices as a picker's options, grouped: a choice's `family`, or `group`
 * for those without one, such as an app's name for its own themes. An empty
 * `group` leaves those ungrouped. Each carries the schemes it covers as
 * search keywords. Order the choices as the picker should list them,
 * usually the app's own theme, then the other core themes, then the optional
 * ones.
 */
export const themeOptions = (
  choices: readonly ThemeChoice[],
  group = "Groundwork",
) =>
  choices.map(({ id, name, family, mode }) => {
    const option: ThemeOption = {
      value: id,
      label: name,
      // So a search for light or dark finds the themes that have it
      keywords: mode === undefined ? ["light", "dark"] : [mode],
    };

    const heading = family ?? group;

    if (heading !== "") option.group = heading;

    return option;
  });

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
}

/** The id of the `<style>` holding an app theme's CSS. */
export const appThemeStyleId = (id: string) => `gw-app-theme-${id}`;

/** The local storage key an app theme's solved CSS is cached under. */
export const appThemeStorageKey = (key: string, id: string) =>
  `${key}:app:${id}`;

/** A theme document as a choice, with the one scheme it covers, if any. */
export const themeChoice = (theme: Theme): ThemeChoice => {
  switch (theme.kind) {
    case "solved":
      return { id: theme.id, name: theme.name };
    case "mapped":
      return {
        id: theme.id,
        name: theme.name,
        family: theme.family,
        mode: theme.otherPalette === undefined ? theme.mode : undefined,
      };
  }
};

/** The local storage keys a pick is kept under. */
export const themeStorageKeys = (key: string) => ({
  mode: `${key}:mode`,
  theme: `${key}:id`,
  document: `${key}:custom`,
  css: `${key}:custom-css`,
  name: `${key}:custom-name`,
  scheme: `${key}:custom-mode`,
});

/** The Omarchy theme's cache, kept apart so a reset doesn't drop it. */
export const omarchyStorageKeys = (key: string) => ({
  css: `${key}:omarchy-css`,
  name: `${key}:omarchy-name`,
  mode: `${key}:omarchy-mode`,
});

/** The Android theme's cache, kept apart so a reset doesn't drop it. */
export const androidStorageKeys = (key: string) => ({
  css: `${key}:android-css`,
  name: `${key}:android-name`,
});

/**
 * An inline script that applies the stored mode, theme and any custom,
 * Omarchy, Android or app theme's cached CSS before the first paint. Takes
 * the same key and defaults as `pageTheme`. Picking a theme stores the mode
 * it needs, so the two stay in step.
 */
export const themeBootScript = (options: ThemeBootOptions) => {
  const config = JSON.stringify({
    keys: themeStorageKeys(options.key),
    theme: options.defaultTheme,
    mode: options.defaultMode ?? "auto",
    custom: customThemeId,
    style: customThemeStyleId,
    // Themes the app's host passes in, each cached under its own keys
    system: {
      [omarchyThemeId]: {
        css: omarchyStorageKeys(options.key).css,
        style: omarchyThemeStyleId,
      },
      [androidThemeId]: {
        css: androidStorageKeys(options.key).css,
        style: androidThemeStyleId,
      },
    },
    app: appThemeStorageKey(options.key, ""),
    appStyle: appThemeStyleId(""),
  });

  // An imported, Omarchy or Android theme only applies once it's been
  // picked, and falls back to the default when its CSS has gone. Any other
  // pick with cached CSS is an app theme; `pageTheme` solves it when
  // nothing's cached
  return `(()=>{const c=${config};let s;try{s=localStorage}catch{}const g=(k)=>{try{return s?.getItem(k)??null}catch{return null}};const r=document.documentElement;const a=(id,css)=>{const e=document.createElement("style");e.id=id;e.textContent=css;document.head.append(e)};let m=g(c.keys.mode)??c.mode;let t=g(c.keys.theme)??c.theme;const y=Object.hasOwn(c.system,t)?c.system[t]:null;const o=t===c.custom?g(c.keys.css):y?g(y.css):null;if(t===c.custom||y){if(o)a(t===c.custom?c.style:y.style,o);else{t=c.theme;m=c.mode}}else{const p=g(c.app+t);if(p)a(c.appStyle+t,p)}r.setAttribute("data-gw-theme",t);if(m==="auto")r.removeAttribute("data-gw-mode");else r.setAttribute("data-gw-mode",m)})();`;
};
