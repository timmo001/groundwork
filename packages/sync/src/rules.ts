import type { Kind } from "./schema.ts";

/**
 * Where a copy stands, from three hashes: the one in the lock, the source's
 * now and the copy's now.
 */
export type State =
  "current" | "missing" | "source-changed" | "copy-edited" | "both-changed";

/** What the sync does about a copy in that state. */
export type Action = "none" | "copy" | "carry-back" | "flag";

export interface Hashes {
  readonly locked: string | undefined;
  readonly source: string;
  readonly copy: string | undefined;
}

export const classify = ({ locked, source, copy }: Hashes): State => {
  if (copy === undefined) return "missing";

  if (copy === source) return "current";

  // A copy that was never synced and differs from the source can't be told
  // apart from an edit, so it's left for a person or the fixer agent.
  if (locked === undefined) return "both-changed";

  if (copy === locked) return "source-changed";

  if (source === locked) return "copy-edited";

  return "both-changed";
};

/**
 * QML edits travel back to the source and out to the other copies. Edits to
 * anything else go into the source or a wrapper by hand, so they're flagged.
 */
export const actionFor = (state: State, kind: Kind): Action => {
  switch (state) {
    case "current":
      return "none";
    case "missing":
    case "source-changed":
      return "copy";
    case "copy-edited":
      return kind === "qml" ? "carry-back" : "flag";
    case "both-changed":
      return "flag";
  }
};
