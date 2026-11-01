/**
 * How Hutch builds the app: a Bun main process that opens the window, and one
 * view running the demo app. Every platform uses its own webview, not CEF.
 */
import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "Groundwork Desktop Demo",
    identifier: "dev.timmo.groundwork.desktop-demo",
    version: "0.0.1",
  },
  build: {
    mainProcess: "bun",
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    views: {
      mainview: {
        entrypoint: "src/mainview/index.ts",
      },
    },
    copy: {
      "src/mainview/index.html": "views/mainview/index.html",
    },
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
    },
  },
} satisfies ElectrobunConfig;
