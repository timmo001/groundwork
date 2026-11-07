/**
 * Serves the built app from `dist/`, with any other path in the app falling
 * back to the page, as a static host set up for a single-page app would.
 * `bun run start` builds first.
 *
 * It's also a small push service, keeping the push contract's routes so the
 * demo can subscribe, and `POST push/test` sends every subscription a sample
 * payload. A real service keeps its subscriptions in storage.
 */
import path from "node:path";

import {
  decodePushSubscription,
  decodePushUnsubscribe,
  pushRoutes,
  type PushPayload,
  type PushSubscription,
} from "@timmo001/groundwork-pwa/push";
import {
  generateVAPIDKeys,
  sendNotification,
  setVapidDetails,
  WebPushError,
} from "web-push";

const dist = path.join(import.meta.dir, "..", "dist");
const port = Number(process.env.PORT ?? 7370);

// New keys each run, as the subscriptions only live in memory. Set
// VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to keep your own
const vapid =
  process.env.VAPID_PUBLIC_KEY !== undefined &&
  process.env.VAPID_PRIVATE_KEY !== undefined
    ? {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      }
    : generateVAPIDKeys();

setVapidDetails("mailto:demo@example.com", vapid.publicKey, vapid.privateKey);

const subscriptions = new Map<string, PushSubscription>();

const send = async (payload: PushPayload) => {
  for (const [client, subscription] of subscriptions) {
    await sendNotification(subscription, JSON.stringify(payload)).catch(
      (error: Error) => {
        // Gone at the push service, so it's dropped here too
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        )
          subscriptions.delete(client);
        else console.warn("A push didn't send", error);
      },
    );
  }
};

const route = (pathname: string) => pathname.replace(/^\//, "");

Bun.serve({
  port,
  hostname: "127.0.0.1",
  fetch: async (request) => {
    const { pathname } = new URL(request.url);

    if (route(pathname) === pushRoutes.vapidKey)
      return Response.json({ publicKey: vapid.publicKey });

    if (route(pathname) === pushRoutes.subscriptions) {
      const text = await request.text();

      if (request.method === "POST") {
        const subscription = decodePushSubscription(text);

        if (subscription === undefined)
          return new Response(null, { status: 400 });

        subscriptions.set(subscription.client.id, subscription);

        return new Response(null, { status: 204 });
      }

      if (request.method === "DELETE") {
        const gone = decodePushUnsubscribe(text);

        for (const [client, { endpoint }] of subscriptions)
          if (endpoint === gone?.endpoint) subscriptions.delete(client);

        return new Response(null, { status: 204 });
      }
    }

    if (route(pathname) === "push/test" && request.method === "POST") {
      await send({
        title: "Firmware 1.21 is ready",
        body: "Apply it from Updates when it suits you.",
        tone: "info",
        link: "./#phone",
        tag: "firmware",
      });

      return new Response(null, { status: 204 });
    }

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
