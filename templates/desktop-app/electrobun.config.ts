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
      // A classic script for `<head>`, so the theme applies before first paint
      boot: {
        entrypoint: "src/mainview/boot.ts",
        format: "iife",
      },
      mainview: {
        entrypoint: "src/mainview/index.ts",
      },
    },
    copy: {
      "src/mainview/index.html": "views/mainview/index.html",
      "src/tray/icon.png": "views/tray/icon.png",
    },
    // The workspace packages the view bundles, so `dev --watch` rebuilds on
    // their edits too
    watch: [
      "../../packages/demo/src",
      "../../packages/desktop/src",
      "../../packages/ui/src",
      "../../packages/tokens/src",
      "../../packages/tokens/generated",
    ],
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
