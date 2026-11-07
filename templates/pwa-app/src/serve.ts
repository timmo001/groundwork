/**
 * Serves the built app from `dist/`, with any other path in the app falling
 * back to the page, as a static host set up for a single-page app would.
 * `bun run start` builds first.
 */
import path from "node:path";

const dist = path.join(import.meta.dir, "..", "dist");
const port = Number(process.env.PORT ?? 7370);

Bun.serve({
  port,
  hostname: "127.0.0.1",
  fetch: async (request) => {
    const { pathname } = new URL(request.url);
    const file = Bun.file(path.join(dist, path.normalize(pathname)));

    if (!pathname.endsWith("/") && (await file.exists())) {
      return new Response(file, {
        headers: pathname.endsWith(".webmanifest")
          ? { "content-type": "application/manifest+json" }
          : {},
      });
    }

    return new Response(Bun.file(path.join(dist, "index.html")));
  },
});

console.log(`The PWA template is at http://127.0.0.1:${port}/`);
