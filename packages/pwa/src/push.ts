/**
 * The push contract: how a service keeps its clients' push subscriptions and
 * what it sends them. One shape for the PWA's Web Push, the Android shell's
 * UnifiedPush and every service that pushes, documented on the Behavior page.
 */
import { Option, Schema } from "effect";

/** The service's routes, under its own base URL. */
export const pushRoutes = {
  /** `GET`: the VAPID public key, as {@link VapidKey}. */
  vapidKey: "push/vapid-key",
  /** `POST` a {@link PushSubscription}; `DELETE` with `{ endpoint }` to stop. */
  subscriptions: "push/subscriptions",
} as const;

/** The VAPID public key, base64url, for `pushManager.subscribe`. */
export const VapidKey = Schema.Struct({ publicKey: Schema.String });

export interface VapidKey extends Schema.Schema.Type<typeof VapidKey> {}

/** The client a subscription belongs to, kept so one client has one. */
export const PushClient = Schema.Struct({
  /** Stable per install, such as a random id kept in storage. */
  id: Schema.String,
  /** What people see in the service's list of clients, such as "Pixel 9". */
  name: Schema.String,
  platform: Schema.Literals(["web", "android"]),
});

export interface PushClient extends Schema.Schema.Type<typeof PushClient> {}

/**
 * A subscription, as `PushSubscription.toJSON()` gives it in the browser and
 * the shell sends a UnifiedPush endpoint. Posting one for a known client
 * replaces that client's last.
 */
export const PushSubscription = Schema.Struct({
  endpoint: Schema.String,
  keys: Schema.Struct({ p256dh: Schema.String, auth: Schema.String }),
  client: PushClient,
});

export interface PushSubscription extends Schema.Schema.Type<
  typeof PushSubscription
> {}

/** Ongoing work, shown as a Live Update on Android 16 and a plain one below. */
export const PushOngoing = Schema.Struct({
  /** Replaces the last update with the same id, and ends it when `done`. */
  id: Schema.String,
  status: Schema.String,
  progress: Schema.optionalKey(
    Schema.Struct({ value: Schema.Number, max: Schema.Number }),
  ),
  done: Schema.optionalKey(Schema.Boolean),
});

export interface PushOngoing extends Schema.Schema.Type<typeof PushOngoing> {}

/**
 * What a push carries. The notification points at a page: `link` opens it,
 * relative to the app's scope. `data` is the app's own, passed through.
 */
export const PushPayload = Schema.Struct({
  title: Schema.String,
  body: Schema.optionalKey(Schema.String),
  tone: Schema.optionalKey(
    Schema.Literals([
      "neutral",
      "accent",
      "info",
      "success",
      "warning",
      "danger",
      "important",
    ]),
  ),
  link: Schema.optionalKey(Schema.String),
  /** Like notifications share a tag, so a new one replaces the last. */
  tag: Schema.optionalKey(Schema.String),
  /** An alert shows on screen; a passive one only goes to the shade. */
  level: Schema.optionalKey(Schema.Literals(["alert", "passive"])),
  ongoing: Schema.optionalKey(PushOngoing),
  data: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
});

export interface PushPayload extends Schema.Schema.Type<typeof PushPayload> {}

const decodePayloadJson = Schema.decodeUnknownOption(
  Schema.fromJsonString(PushPayload),
);

/** Reads a push's text, or `undefined` when it isn't a payload. */
export const decodePushPayload = (text: string): PushPayload | undefined =>
  Option.getOrUndefined(decodePayloadJson(text));
