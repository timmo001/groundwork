import { Schema } from "effect";

/** QML copies mirror both ways; every other kind only travels out. */
export const Kind = Schema.Literals(["qml", "tokens"]);

export type Kind = typeof Kind.Type;

export const Item = Schema.Struct({
  name: Schema.String,
  kind: Kind,
  description: Schema.String,
  files: Schema.Array(Schema.String),
  needs: Schema.optionalKey(Schema.Array(Schema.String)),
});

export interface Item extends Schema.Schema.Type<typeof Item> {}

/** `registry.json`: every item an app can take, and its files. */
export const Registry = Schema.Struct({ items: Schema.Array(Item) });

export interface Registry extends Schema.Schema.Type<typeof Registry> {}

/**
 * `sync.json` in an app: the items it takes, mapped to the folder each one's
 * files go in, plus its theme, font and icon set.
 */
export const AppFile = Schema.Struct({
  theme: Schema.optionalKey(Schema.String),
  font: Schema.optionalKey(Schema.String),
  icons: Schema.optionalKey(Schema.String),
  items: Schema.Record(Schema.String, Schema.String),
});

export interface AppFile extends Schema.Schema.Type<typeof AppFile> {}

/** One copy in the lock: its item, the SHA it came from and its hash then. */
export const LockedCopy = Schema.Struct({
  item: Schema.String,
  sha: Schema.String,
  hash: Schema.String,
});

export interface LockedCopy extends Schema.Schema.Type<typeof LockedCopy> {}

/** `sync.lock.json` in an app, keyed by each copy's path in the app. */
export const Lock = Schema.Struct({
  copies: Schema.Record(Schema.String, LockedCopy),
});

export interface Lock extends Schema.Schema.Type<typeof Lock> {}

/** The private list of apps to sync, outside this repository. */
export const Apps = Schema.Struct({ apps: Schema.Array(Schema.String) });
