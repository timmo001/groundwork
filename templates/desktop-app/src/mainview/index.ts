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
import {
  connectDesktop,
  type DesktopSchema,
} from "@timmo001/groundwork-desktop/view";
import { Electroview } from "electrobun/view";

import type { DemoRequests } from "../shared/requests.ts";
import { themeOptions } from "./theme.ts";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

const page = pageTheme({ ...themeOptions, themes: coreThemeChoices });
const picker = document.querySelector("gw-theme-picker");

if (picker !== null) {
  const render = () => {
    const { mode, theme, custom, omarchy } = page.state();
    picker.mode = mode;
    picker.theme = theme;
    picker.themes = [
      ...coreThemeChoices.map(({ id, name }) => ({ value: id, label: name })),
      ...(omarchy === null ? [] : [{ value: omarchy.id, label: omarchy.name }]),
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

// The desktop defaults, the desktop's Omarchy theme as a theme to pick, and a
// card that calls the main process: a notice, the clipboard, the system
// browser and what the machine is
const desktop = await connectDesktop<DemoRequests>(
  (messages) => {
    const rpc = Electroview.defineRPC<DesktopSchema<DemoRequests>>({
      maxRequestTime: 10_000,
      handlers: { messages },
    });

    new Electroview({ rpc });

    return rpc;
  },
  { onOmarchyTheme: (theme) => void page.setOmarchyTheme(theme) },
);

const card = document.createElement("gw-card");
const facts = document.createElement("gw-facts");
const actions = document.createElement("div");

const action = (label: string, run: () => Promise<void>) => {
  const button = document.createElement("gw-button");

  button.setAttribute("appearance", "outlined");
  button.setAttribute("size", "small");
  button.textContent = label;
  button.addEventListener("click", () => void run());

  return button;
};

card.setAttribute("heading", "This machine");

card.setAttribute(
  "description",
  "Calls from the view to the app's main process",
);

facts.loading = true;

actions.slot = "footer";

actions.className = "native-actions";

card.append(facts, actions);

document.querySelector("main")?.append(card);

const info = await desktop.request.systemInfo();

const details = [
  { label: "Platform", value: `${info.platform} (${info.arch})` },
  { label: "Webview", value: info.webview },
  { label: "Bun", value: info.bun },
  { label: "Build", value: desktop.dev ? "Development" : "Release" },
];

facts.items = details;

facts.loading = false;

actions.append(
  action("Send a notification", () =>
    desktop.notify({
      heading: "Hello from the main process",
      body: desktop.config.notifications
        ? undefined
        : "In the app, since system notifications are off.",
      tone: "info",
    }),
  ),
  action("Copy details", async () => {
    await desktop.request.clipboardWrite({
      text: details.map(({ label, value }) => `${label}: ${value}`).join("\n"),
    });
    await desktop.notify({ heading: "Copied the details", tone: "success" });
  }),
  action("Open the docs in the browser", async () => {
    await desktop.request.openExternal({
      url: "https://groundwork.timmo.dev/desktop/",
    });
  }),
);
