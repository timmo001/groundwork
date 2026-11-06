/**
 * The report template's dev server: renders the sample report on every
 * request, with the page script rebuilt each time, and reloads open pages
 * when the report package or the components change. Run it with
 * `bun --watch`, which restarts it when the server-side code changes.
 */
import { watch } from "node:fs";
import { fileURLToPath } from "node:url";

import { reportAssets } from "@timmo001/groundwork-report/assets";
import { readReportThemes } from "@timmo001/groundwork-report/desktop";

import { sampleReport } from "./sample.ts";

const port = Number(process.env.PORT ?? 7360);
const encoder = new TextEncoder();
const listeners = new Set<ReadableStreamDefaultController<Uint8Array>>();

// Reconnecting after a restart reloads the page too, so `--watch` restarts
// show up without a manual refresh
const reloadScript = `<script>(()=>{let open=false;const s=new EventSource("/__reload");s.onopen=()=>{if(open)location.reload();open=true};s.onmessage=()=>location.reload()})();</script>`;

const reload = () => {
  for (const listener of listeners) {
    listener.enqueue(encoder.encode("data: reload\n\n"));
  }
};

// The page script is bundled per request, so a change to it or to the
// components only needs the open pages to reload
for (const entry of [
  "@timmo001/groundwork-report/client",
  "@timmo001/groundwork-ui",
]) {
  const folder = fileURLToPath(new URL(".", import.meta.resolve(entry)));

  watch(folder, { recursive: true }, reload);
}

Bun.serve({
  port,
  hostname: "127.0.0.1",
  idleTimeout: 0,
  routes: {
    "/__reload": () => {
      let self: ReadableStreamDefaultController<Uint8Array> | undefined;

      return new Response(
        new ReadableStream<Uint8Array>({
          start: (controller) => {
            self = controller;
            listeners.add(controller);
            controller.enqueue(encoder.encode(": connected\n\n"));
          },
          cancel: () => {
            if (self !== undefined) listeners.delete(self);
          },
        }),
        {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
          },
        },
      );
    },
    "/": async () => {
      const page = sampleReport(await reportAssets(), await readReportThemes());

      return new Response(page.replace("</body>", `${reloadScript}</body>`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  },
});

console.log(`The report template is at http://127.0.0.1:${port}/`);
