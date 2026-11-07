/**
 * The demo page's script: Base's fonts, the theme CSS, the components, the
 * demo app and the app bar's theme picker, kept with `pageTheme`. Then the
 * shell: the phone's dynamic color as a theme to pick, shares and deep
 * links, notifications, a Live Update and the app's own `battery` request,
 * shown in a "This phone" card. Outside the shell it runs as a plain page.
 */
import "@fontsource-variable/mona-sans";
import "@fontsource-variable/geist-mono";
import "@timmo001/groundwork-tokens/themes.css";
import "@timmo001/groundwork-demo/web.css";
import "./index.css";
import "@timmo001/groundwork-ui";
import "@timmo001/groundwork-demo/web";
import { connectMobile, ShellShare } from "@timmo001/groundwork-mobile/view";
import {
  coreThemeChoices,
  customThemeId,
  optionalThemeChoices,
  pageTheme,
  themeOptions as pickerOptions,
  type ThemeMode,
} from "@timmo001/groundwork-tokens/page";
import { on } from "@timmo001/groundwork-ui";
import { Schema } from "effect";

import mobileConfig from "../mobile.config.ts";
import { themeOptions } from "./theme.ts";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

// The app's own theme first, then the other core themes, then the optional
// ones by family. Trim or extend the list to suit the app
const themes = [
  ...coreThemeChoices.filter(({ id }) => id === themeOptions.defaultTheme),
  ...coreThemeChoices.filter(({ id }) => id !== themeOptions.defaultTheme),
  ...optionalThemeChoices,
];

const page = pageTheme({ ...themeOptions, themes });
const picker = document.querySelector("gw-theme-picker");

if (picker !== null) {
  const render = () => {
    const { mode, theme, only, custom, android } = page.state();
    picker.mode = mode;
    picker.theme = theme;
    picker.scheme = only ?? "";
    // The phone's dynamic color and an imported theme are offered, never
    // the default
    picker.themes = [
      ...pickerOptions(themes),
      ...(android === null
        ? []
        : [{ value: android.id, label: android.name, group: "Phone" }]),
      ...(custom === null
        ? []
        : [{ value: customThemeId, label: custom, group: "Imported" }]),
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

const facts = document.querySelector("gw-facts");
let lastShare = "None yet";
let lastLink = "None yet";
let battery = "Unknown";
let running = "In the browser";

const describeShare = ({ title, text, url }: typeof ShellShare.Type) =>
  [title, text, url].filter((part) => part !== undefined).join(" · ");

const mobile = await connectMobile(mobileConfig, {
  onShare: (share) => {
    lastShare = describeShare(share);
    render();
  },
  onDeepLink: (url) => {
    lastLink = url;
    render();
  },
  onAndroidTheme: (colors) => void page.setAndroidTheme(colors),
  onNotice: (notice) => console.info(notice.heading, notice.body ?? ""),
});

if (mobile.shell) running = `In the shell ${mobile.info?.version ?? ""}`;

// A function declaration, so a share arriving while the shell connects can
// already render
function render() {
  if (facts === null) return;

  facts.items = [
    { label: "Running", value: running },
    { label: "Battery", value: battery },
    { label: "Last share", value: lastShare },
    { label: "Last link", value: lastLink },
  ];
}

render();

// The app's own request, answered by `MainActivity`'s handler
if (mobile.shell) {
  battery = `${await mobile.call("battery", Schema.Number)}%`;
  render();
}

const button = (selector: string, run: () => Promise<void>) =>
  document.querySelector(selector)?.addEventListener("click", () => void run());

button("gw-button.notify", () =>
  mobile.notify({
    heading: "Firmware 1.21 is ready",
    body: "Apply it from Updates when it suits you.",
    tone: "info",
    tag: "firmware",
    link: "#phone",
  }),
);

// A download as ongoing work: a Live Update on Android 16, counted down by
// the app's own `ongoing` request
button("gw-button.ongoing", async () => {
  await mobile.call("ongoing", Schema.Boolean, { id: "download", steps: 10 });
});

button("gw-button.external", () =>
  mobile.openExternal("https://groundwork.timmo.dev/phones/shell"),
);
