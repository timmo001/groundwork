/**
 * The report page: the standard Groundwork header (an app bar with the theme
 * picker, then a page header), the report's blocks, and everything they need
 * inlined, so the page is one HTML file that opens anywhere.
 *
 * @module
 */
import type { MappedTheme } from "@timmo001/groundwork-tokens";
import type { OmarchyCurrentTheme } from "@timmo001/groundwork-tokens/runtime";
// From `choices`, not `page`, so a CLI without the DOM lib type-checks it
import { themeBootScript } from "@timmo001/groundwork-tokens/choices";

import { html, raw, type Content } from "./html.ts";
import { reportCss } from "./styles.ts";

/** The theme CSS and the page script, from `reportAssets`. */
export interface ReportAssets {
  /** Every built-in theme's CSS. */
  readonly css: string;
  /** The page script: the elements, the theme picker and the filters. */
  readonly script: string;
}

/** What the page script reads from the page. */
export interface ReportConfig {
  readonly key: string;
  readonly defaultTheme: string;
  readonly omarchy: OmarchyCurrentTheme | null;
  readonly desktop: readonly MappedTheme[];
}

/** The id of the `<script>` holding the `ReportConfig`. */
export const reportConfigId = "gw-report-config";

/** The local storage key a desktop theme's solved CSS is cached under. */
export const desktopCssKey = (key: string, id: string) =>
  `${key}:desktop-css:${id}`;

/** The id of the `<style>` holding the desktop theme in use. */
export const desktopStyleId = "gw-desktop-theme";

/**
 * Puts a picked desktop theme's cached CSS on before the first paint; the
 * page script solves and caches it the first time it's picked.
 */
const desktopBootScript = (key: string) =>
  `(()=>{try{const t=document.documentElement.getAttribute("data-gw-theme");const css=t&&localStorage.getItem(${JSON.stringify(desktopCssKey(key, ""))}+t);if(css){const e=document.createElement("style");e.id=${JSON.stringify(desktopStyleId)};e.textContent=css;document.head.append(e)}}catch{}})();`;

export interface ReportPageOptions {
  readonly title: string;
  /** A line under the title. */
  readonly description?: string | undefined;
  /** The page's language. Defaults to `en`. */
  readonly lang?: string | undefined;
  /** The app bar's brand. Defaults to the title. */
  readonly brand?: Content;
  /** Chips under the header, such as the date and the commits it read. */
  readonly meta?: readonly Content[] | undefined;
  /** Content in the page header's actions. */
  readonly actions?: Content;
  /** The local storage prefix the theme pick is kept under. Defaults to `gw-report:theme`. */
  readonly storageKey?: string | undefined;
  /** The theme to start with. Defaults to `glazing`. */
  readonly defaultTheme?: string | undefined;
  /**
   * The desktop's Omarchy theme, offered beside the built-in ones. The
   * report starts on `defaultTheme` either way. Read it with `readOmarchyTheme` from
   * `@timmo001/groundwork-tokens/omarchy-current` where the page is made.
   */
  readonly omarchy?: OmarchyCurrentTheme | null | undefined;
  /**
   * The machine's other themes, translated, offered in the Desktop group.
   * Read them with `readReportThemes` from `@timmo001/groundwork-report/desktop`.
   */
  readonly desktop?: readonly MappedTheme[] | undefined;
  readonly assets: ReportAssets;
  /** The report's blocks. */
  readonly body: Content;
}

/** Keeps inlined text from closing the element it's in. */
const inline = (text: string, tag: "script" | "style") =>
  text.replaceAll(`</${tag}`, `<\\/${tag}`);

/** Renders a report as one self-contained HTML document. */
export const reportPage = (options: ReportPageOptions) => {
  const key = options.storageKey ?? "gw-report:theme";
  const defaultTheme = options.defaultTheme ?? "glazing";

  const config: ReportConfig = {
    key,
    defaultTheme,
    omarchy: options.omarchy ?? null,
    desktop: options.desktop ?? [],
  };

  return html`<!doctype html>
    <html lang="${options.lang ?? "en"}">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>${options.title}</title>
        <script>
          ${raw(inline(themeBootScript({ key, defaultTheme, followOmarchy: false }) + desktopBootScript(key), "script"))};
        </script>
        <style>
          ${raw(inline(options.assets.css, "style"))}
        </style>
        <style>
          ${raw(reportCss)}
        </style>
      </head>
      <body>
        <gw-app-bar>
          <span slot="brand" class="gw-report-brand"
            >${options.brand ?? options.title}</span
          >
          <gw-theme-picker slot="actions" no-import></gw-theme-picker>
        </gw-app-bar>
        <gw-page>
          <gw-page-header
            heading="${options.title}"
            ${
              options.description === undefined
                ? ""
                : html` description="${options.description}"`
            }
            >${
              options.actions === undefined
                ? ""
                : html`<span slot="actions">${options.actions}</span>`
            }</gw-page-header
          >
          ${
            options.meta === undefined || options.meta.length === 0
              ? ""
              : html`<div class="gw-report-meta">${options.meta}</div>`
          }
          ${options.body}
        </gw-page>
        <script type="application/json" id="${reportConfigId}">
          ${raw(inline(JSON.stringify(config), "script"))}
        </script>
        <script type="module">
          ${raw(inline(options.assets.script, "script"))};
        </script>
      </body>
    </html> `.value;
};
