/**
 * The schema for `conventions/`: repository kinds, label sets and each
 * repository's own file.
 *
 * @module
 */
import { Schema } from "effect";

/** A six-digit hex color without `#`, as GitHub takes label colors. */
export const Color = Schema.String.check(Schema.isPattern(/^[0-9a-f]{6}$/));

export const Label = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  color: Color,
  /** Older names the label job renames to this one. Matched without case. */
  aliases: Schema.optionalKey(Schema.Array(Schema.String)),
});

export interface Label extends Schema.Schema.Type<typeof Label> {}

/**
 * Where a set applies: `every` repository, repositories of a `kind` that
 * lists it, or `opt-in` through a repository's own file.
 */
export const LabelSet = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  scope: Schema.Literals(["every", "kind", "opt-in"]),
  labels: Schema.Array(Label),
});

export interface LabelSet extends Schema.Schema.Type<typeof LabelSet> {}

export const LabelsDocument = Schema.Struct({
  sets: Schema.Array(LabelSet),
});

export const Kind = Schema.Struct({
  id: Schema.Literals(["community", "shared", "library", "personal"]),
  name: Schema.String,
  description: Schema.String,
  issues: Schema.String,
  /** The `kind` label sets a repository of this kind takes. */
  labels: Schema.Array(Schema.String),
});

export interface Kind extends Schema.Schema.Type<typeof Kind> {}

export const KindsDocument = Schema.Struct({
  kinds: Schema.Array(Kind),
});

/** The checks `conventions setup` runs, each for a step on the Setup page. */
export const SetupCheck = Schema.Literals([
  "kind",
  "mise-lock",
  "prettier",
  "hk",
  "agents-md",
  "opencode-permissions",
  "claude-permissions",
  "ci",
  "renovate",
  "docs-site",
  "agent-surface",
  "theme",
]);

export type SetupCheck = typeof SetupCheck.Type;

/** One repository: its kind, the opt-in sets it takes and its own areas. */
export const Repo = Schema.Struct({
  repo: Schema.String.check(Schema.isPattern(/^[\w.-]+\/[\w.-]+$/)),
  kind: Kind.fields.id,
  /** Questions and ideas go to Discussions. Set by size, not kind. */
  discussions: Schema.optionalKey(Schema.Boolean),
  /** Opt-in sets, such as `priority`, `os` or `tests`. */
  sets: Schema.optionalKey(Schema.Array(Schema.String)),
  /** The Renovate labels for the ecosystems the repository uses. */
  renovate: Schema.optionalKey(Schema.Array(Schema.String)),
  /** Labels for parts of this repository, described as "Related to ...". */
  areas: Schema.optionalKey(Schema.Array(Label)),
  /** Labels outside the manifest the label job leaves alone, such as ones automation uses. */
  keep: Schema.optionalKey(Schema.Array(Schema.String)),
  /**
   * The theme the owner picked for the repository's app and docs site, such
   * as `bridge` or the app's own. Until it's set, a docs site on Base reads
   * as a Setup step still to do.
   */
  theme: Schema.optionalKey(Schema.String),
  /**
   * Setup checks that don't fit the repository, each with the reason, such
   * as `docs-site` for a Renovate preset its README covers. `conventions
   * setup` leaves them out.
   */
  skip: Schema.optionalKey(
    Schema.Record(SetupCheck, Schema.optionalKey(Schema.String)),
  ),
});

export interface Repo extends Schema.Schema.Type<typeof Repo> {}
