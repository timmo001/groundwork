/**
 * The main process: opens the app's one window on the demo view, with the
 * browser defaults from `@timmo001/groundwork-desktop` and the demo's own
 * requests. A real app adds its menus and backend connection here.
 */
import Electrobun, { BrowserView } from "electrobun/main";
import {
  openDesktopWindow,
  type DesktopRequests,
  type DesktopSchema,
} from "@timmo001/groundwork-desktop/main";

import config from "../../desktop.config.ts";
import type { DemoRequests } from "../shared/requests.ts";

const webviews = new Map([
  ["linux", "WebKitGTK"],
  ["darwin", "WKWebView"],
  ["win32", "WebView2"],
]);

const demoRequests: DemoRequests = {
  systemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    bun: Bun.version,
    webview: webviews.get(process.platform) ?? "System webview",
  }),
};

await openDesktopWindow(Electrobun, {
  title: "Updates",
  url: "views://mainview/index.html",
  frame: { width: 760, height: 640, x: 200, y: 160 },
  config,
  createRPC: (requests: DesktopRequests) =>
    BrowserView.defineRPC<DesktopSchema<DemoRequests>>({
      maxRequestTime: 10_000,
      handlers: { requests: { ...requests, ...demoRequests } },
    }),
});
