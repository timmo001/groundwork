/**
 * Tests the sync's decision table: each state from the three hashes, and what
 * happens to a copy in it.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { actionFor, classify } from "./rules.ts";

test("classify reads the three hashes", () => {
  expect(classify({ locked: "a", source: "a", copy: undefined })).toBe(
    "missing",
  );
  expect(classify({ locked: "a", source: "b", copy: "b" })).toBe("current");
  expect(classify({ locked: "a", source: "b", copy: "a" })).toBe(
    "source-changed",
  );
  expect(classify({ locked: "a", source: "a", copy: "b" })).toBe("copy-edited");
  expect(classify({ locked: "a", source: "b", copy: "c" })).toBe(
    "both-changed",
  );
  expect(classify({ locked: undefined, source: "a", copy: "b" })).toBe(
    "both-changed",
  );
});

test("only QML edits travel back", () => {
  expect(actionFor("copy-edited", "qml")).toBe("carry-back");
  expect(actionFor("copy-edited", "tokens")).toBe("flag");
  expect(actionFor("source-changed", "tokens")).toBe("copy");
});
