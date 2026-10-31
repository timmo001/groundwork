/**
 * Serves the isolated build (`blume build --isolated`) as static files, so
 * the visual tests run against a site that can't reload under them.
 */
import { join, normalize } from "node:path";

const root = join(import.meta.dirname, "../.blume-verify/dist/client");
const port = Number(process.env.PORT ?? 7360);

const candidates = (path: string) =>
  path.endsWith("/") ? [`${path}index.html`] : [path, `${path}/index.html`, `${path}.html`];

Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(request) {
    const path = normalize(decodeURIComponent(new URL(request.url).pathname));

    for (const candidate of candidates(path)) {
      const file = Bun.file(join(root, candidate));

      if (await file.exists()) return new Response(file);
    }

    return new Response(Bun.file(join(root, "404.html")), { status: 404 });
  },
});

console.log(`Serving the docs build at http://127.0.0.1:${port}`);
