/**
 * The report page's script: defines the elements, keeps the theme with
 * `pageTheme` (every core theme, the optional ones grouped by their palette,
 * and the Desktop group: the Omarchy theme the page was made with and the
 * machine's other themes, translated), draws the tables and keeps the
 * scroll position. `reportAssets` bundles it into the page.
 *
 * @module
 */
import "@timmo001/groundwork-ui";
import {
  coreThemeChoices,
  optionalThemeChoices,
  pageTheme,
  type ThemeChoice,
  type ThemeMode,
} from "@timmo001/groundwork-tokens/page";
import { runtimeTheme } from "@timmo001/groundwork-tokens/runtime";
import { on } from "@timmo001/groundwork-ui";
import { Schema } from "effect";

import {
  desktopCssKey,
  desktopStyleId,
  reportConfigId,
  type ReportConfig,
} from "./page.ts";
import { getStorage } from "./storage.ts";
import { hydrateTable } from "./table-client.ts";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

const config: ReportConfig = JSON.parse(
  document.getElementById(reportConfigId)?.textContent ?? "{}",
);

const desktop = config.desktop ?? [];

const desktopChoices: readonly ThemeChoice[] = desktop.map(
  ({ id, name, mode }) => ({ id, name, mode, family: "Desktop" }),
);

const page = pageTheme({
  key: config.key,
  themes: [...coreThemeChoices, ...optionalThemeChoices, ...desktopChoices],
  defaultTheme: config.defaultTheme,
  followOmarchy: false,
});

// A desktop theme is solved the first time it's picked, then cached so the
// boot script puts it on before the first paint next time
const applyDesktop = (id: string) => {
  const theme = desktop.find((entry) => entry.id === id);
  let style = document.getElementById(desktopStyleId);

  if (theme === undefined) {
    style?.remove();

    return;
  }

  if (style?.dataset.theme === id) return;

  const key = desktopCssKey(config.key, id);
  let css: string | null = null;

  try {
    css = localStorage.getItem(key);
  } catch {
    // Blocked: solve it each time
  }

  if (css === null) {
    css = runtimeTheme(theme).css;

    try {
      localStorage.setItem(key, css);
    } catch {
      // Blocked or full: it still applies until the page closes
    }
  }

  if (style === null) {
    style = document.createElement("style");
    style.id = desktopStyleId;
    document.head.append(style);
  }

  style.dataset.theme = id;
  style.textContent = css;
};

applyDesktop(page.state().theme);

page.subscribe((state) => applyDesktop(state.theme));

const picker = document.querySelector("gw-theme-picker");

if (picker !== null) {
  const render = () => {
    const { mode, theme, omarchy } = page.state();

    picker.mode = mode;
    picker.theme = theme;
    picker.themes = [
      ...coreThemeChoices.map(({ id, name }) => ({
        value: id,
        label: name,
        group: "Core",
      })),
      // Grouped by the palette they come from, such as Catppuccin
      ...optionalThemeChoices.map(({ id, name, family }) => ({
        value: id,
        label: name,
        group: family ?? "More themes",
      })),
      // Themes translated from the machine the page was made on: the Omarchy
      // theme in use, which reads `Omarchy (Tokyo Night)`, then the rest,
      // such as `Nord (Omarchy)` or `Ghostty (Ghostty)`
      ...(omarchy === null
        ? []
        : [{ value: omarchy.id, label: omarchy.name, group: "Desktop" }]),
      ...desktopChoices.map(({ id, name }) => ({
        value: id,
        label: name,
        group: "Desktop",
      })),
    ];
  };

  page.subscribe(render);
  render();
  on(picker, "mode", (event) => {
    const mode = modes.find((entry) => entry === event.detail.mode);

    if (mode !== undefined) page.setMode(mode);
  });
  on(picker, "theme", (event) => page.setTheme(event.detail.id));
  on(picker, "reset", () => page.reset());
}

// The Omarchy theme the page was made under, or none, which drops a
// cached one from an earlier report
void page.setOmarchyTheme(config.omarchy ?? null);

for (const table of document.querySelectorAll("gw-table")) {
  if (table.hasAttribute("data-gw-report-table")) hydrateTable(table);
}

// The last scroll position per report, kept across visits, so a reload or
// a rebuilt report opens where it was read up to
const positionKey = `gw-report:position:${location.pathname}`;
const local = getStorage("localStorage");

const savePosition = () =>
  local.set(positionKey, Schema.Number, Math.round(window.scrollY));

history.scrollRestoration = "manual";

const position = local.get(positionKey, Schema.Number);

// After the tables draw, so the page is as tall as it was; a link to a
// section still wins
if (position !== undefined && location.hash === "") {
  void customElements
    .whenDefined("gw-table")
    .then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.scrollTo({ top: position })),
      ),
    );
}

let saving = 0;

window.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(saving);
    saving = requestAnimationFrame(savePosition);
  },
  { passive: true },
);

window.addEventListener("pagehide", savePosition);
