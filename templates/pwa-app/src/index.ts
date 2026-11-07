/**
 * The demo page's script: Base's fonts, the theme CSS, the components, the
 * demo app and the app bar's theme picker, kept with `pageTheme`. Then the
 * PWA pieces: the service worker, the install offer and shares, shown in a
 * "This phone" card.
 */
import "@fontsource-variable/mona-sans";
import "@fontsource-variable/geist-mono";
import "@timmo001/groundwork-tokens/themes.css";
import "@timmo001/groundwork-demo/web.css";
import "./index.css";
import "@timmo001/groundwork-ui";
import "@timmo001/groundwork-demo/web";
import {
  connectPwa,
  pushState,
  subscribePush,
  type PushState,
  type Share,
} from "@timmo001/groundwork-pwa/view";
import {
  coreThemeChoices,
  customThemeId,
  optionalThemeChoices,
  pageTheme,
  themeOptions as pickerOptions,
  type ThemeMode,
} from "@timmo001/groundwork-tokens/page";
import { on } from "@timmo001/groundwork-ui";

import config from "../pwa.config.ts";
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
    const { mode, theme, only, custom } = page.state();
    picker.mode = mode;
    picker.theme = theme;
    picker.scheme = only ?? "";
    picker.themes = [
      ...pickerOptions(themes),
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

// The "This phone" card shows what the PWA pieces did: whether it's
// installed and starts offline, the last share it took, and an install
// button while the browser can offer one
const facts = document.querySelector("gw-facts");
const actions = document.querySelector("div.phone-actions");
const install = document.querySelector("gw-button.install");
const pushActions = document.querySelector("div.push-actions");
const subscribe = document.querySelector("gw-button.subscribe");
const testPush = document.querySelector("gw-button.test-push");
let lastShare = "None yet";
let offline = "Starting";
let push: PushState = "unsupported";

const pushLabels: Record<PushState, string> = {
  unsupported: "Not in this browser",
  default: "Off",
  denied: "Blocked in settings",
  subscribed: "On",
};

// The demo's own server keeps the push routes. A real app subscribes to its
// service, with the client it sent when pairing
const clientId = localStorage.getItem("pwa-app-client") ?? crypto.randomUUID();

localStorage.setItem("pwa-app-client", clientId);

const pushService = {
  service: new URL("./", location.href).href,
  client: { id: clientId, name: "This phone", platform: "web" as const },
};

const describeShare = ({ title, text, url }: Share) =>
  [title, text, url].filter((part) => part !== undefined).join(" · ");

const pwa = connectPwa(config, {
  onShare: (share) => {
    lastShare = describeShare(share);
    render();
  },
  onInstallChange: (canInstall) => {
    if (actions instanceof HTMLElement) actions.hidden = !canInstall;
  },
});

const render = () => {
  if (facts === null) return;

  facts.items = [
    {
      label: "Running",
      value: pwa.installed() ? "Installed" : "In the browser",
    },
    { label: "Offline start", value: offline },
    { label: "Last share", value: lastShare },
    { label: "Notifications", value: pushLabels[push] },
  ];

  if (pushActions instanceof HTMLElement)
    pushActions.hidden = push === "unsupported" || push === "denied";

  if (subscribe instanceof HTMLElement)
    subscribe.hidden = push === "subscribed";

  if (testPush instanceof HTMLElement) testPush.hidden = push !== "subscribed";
};

render();

install?.addEventListener("click", () => void pwa.install());

const registration = await pwa.worker;

offline = registration === undefined ? "Unavailable" : "Ready";

push = await pushState(registration);

render();

subscribe?.addEventListener("click", async () => {
  push = await subscribePush(registration, pushService);
  render();
});

testPush?.addEventListener(
  "click",
  () =>
    void fetch(new URL("push/test", pushService.service), { method: "POST" }),
);
