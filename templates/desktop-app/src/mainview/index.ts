/**
 * The demo view's script: Base's fonts, the theme CSS, the components, the
 * demo app, and the app bar's theme picker, kept with `pageTheme`.
 */
import "@fontsource-variable/mona-sans";
import "@fontsource-variable/geist-mono";
import "@timmo001/groundwork-tokens/themes.css";
import "@timmo001/groundwork-demo/web.css";
import "./index.css";
import "@timmo001/groundwork-ui";
import "@timmo001/groundwork-demo/web";
import {
  coreThemeChoices,
  customThemeId,
  pageTheme,
  type ThemeMode,
} from "@timmo001/groundwork-tokens/page";
import { on } from "@timmo001/groundwork-ui";

import { themeOptions } from "./theme.ts";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

const page = pageTheme({ ...themeOptions, themes: coreThemeChoices });
const picker = document.querySelector("gw-theme-picker");

if (picker !== null) {
  const render = () => {
    const { mode, theme, custom } = page.state();
    picker.mode = mode;
    picker.theme = theme;
    picker.themes = [
      ...coreThemeChoices.map(({ id, name }) => ({ value: id, label: name })),
      ...(custom === null ? [] : [{ value: customThemeId, label: custom }]),
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
  on(picker, "import", async (event) => {
    const result = await page.importTheme(event.detail.text);

    picker.status = result.ok ? `Using ${result.name}` : result.error;
  });
}
