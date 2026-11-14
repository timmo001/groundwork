/**
 * Tests telling a press on a control inside a surface from a press on the
 * surface itself, such as a stage made focusable for its keys.
 *
 * @module
 */
/// <reference types="bun" />
import { expect, test } from "bun:test";
import { pressedBelow } from "./pressed.js";

interface Node {
  readonly name: string;
  readonly tabindex?: string;
}

const focusable = (node: Node) =>
  node.tabindex !== undefined && node.tabindex !== "-1";

const picture: Node = { name: "video" };
const button: Node = { name: "button", tabindex: "0" };
const body: Node = { name: "body", tabindex: "0" };

test("a stage with tabindex=0 isn't a press on something", () => {
  const stage: Node = { name: "stage", tabindex: "0" };

  expect(pressedBelow([picture, stage, body], stage, focusable)).toBe(false);
  expect(pressedBelow([stage, body], stage, focusable)).toBe(false);
});

test("a control inside the stage is a press on something", () => {
  const stage: Node = { name: "stage", tabindex: "0" };

  expect(pressedBelow([button, picture, stage, body], stage, focusable)).toBe(
    true,
  );
});

test("a path that never reaches the stage counts whole", () => {
  const stage: Node = { name: "stage" };

  expect(pressedBelow([picture, body], stage, focusable)).toBe(true);
  expect(pressedBelow([picture], stage, focusable)).toBe(false);
});
