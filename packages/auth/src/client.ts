/**
 * What a service keeps about each client and what crosses the wire: the
 * client record with its key's hash, the key shown once, the exchange from
 * one shared token, and a WebSocket's first message. Documented on the
 * Behavior page, under Client keys.
 */
import { Schema } from "effect";

import { generateKey, hashKey, type KeyPrefix } from "./key.ts";

/** The service's routes, under its own base URL. */
export const keyRoutes = {
  /**
   * `POST` a {@link KeyExchangeRequest} with the old shared token as
   * `Authorization: Bearer`, answered with a {@link NewKey}. Only for the
   * one release that moves a service from a shared token to keys.
   */
  exchange: "keys/exchange",
} as const;

/** The scope every key has to start with: anything its service does. */
export const allScopes: readonly string[] = ["all"];

/**
 * Who a client is: an `id` it keeps, so pairing again replaces its key
 * rather than adding a second one, a name to show (Home Assistant, Pixel 9,
 * CLI on desk) and its kind, such as `phone`, `home-assistant` or `cli`.
 */
export const Client = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  kind: Schema.String,
});

export interface Client extends Schema.Schema.Type<typeof Client> {}

/**
 * What a service keeps for a client: who it is, its key's SHA-256 and never
 * the key, its scopes, and when it was made and last used, as ISO dates.
 * Keep the file of records readable only by the service's user.
 */
export const ClientRecord = Schema.Struct({
  ...Client.fields,
  hash: Schema.String,
  scopes: Schema.Array(Schema.String),
  created: Schema.String,
  lastUsed: Schema.optionalKey(Schema.String),
});

export interface ClientRecord extends Schema.Schema.Type<typeof ClientRecord> {}

/**
 * A key as it's handed out, by hand or by an exchange: the key itself,
 * shown once and never again, and the client it's for.
 */
export const NewKey = Schema.Struct({
  key: Schema.String,
  client: Client,
});

export interface NewKey extends Schema.Schema.Type<typeof NewKey> {}

/** What a client sends to trade the old shared token for its own key. */
export const KeyExchangeRequest = Schema.Struct({
  client: Client,
});

export interface KeyExchangeRequest extends Schema.Schema.Type<
  typeof KeyExchangeRequest
> {}

/**
 * A WebSocket's first message, since a browser can't set headers on one.
 * The service closes the socket when it isn't this, with a right key.
 */
export const SocketAuth = Schema.Struct({
  type: Schema.Literal("auth"),
  key: Schema.String,
});

export interface SocketAuth extends Schema.Schema.Type<typeof SocketAuth> {}

/**
 * Makes a key for a client and the record to keep for it. Hand `key` out
 * once, and store only `record`.
 */
export const generateClientKey = async (
  prefix: KeyPrefix,
  { id, name, kind }: Client,
  now: Date = new Date(),
): Promise<{ readonly key: string; readonly record: ClientRecord }> => {
  const key = generateKey(prefix);

  return {
    key,
    record: {
      id,
      name,
      kind,
      hash: await hashKey(key),
      scopes: allScopes,
      created: now.toISOString(),
    },
  };
};
