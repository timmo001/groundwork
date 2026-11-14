/**
 * Tests reading what a scroller has out of view at each end, left to right
 * and right to left, where `scrollLeft` runs negative.
 *
 * @module
 */
/// <reference types="bun" />
import { expect, test } from "bun:test";
import { scrollEdges } from "./scroll-buttons.js";

test("content that fits has nothing out of view", () => {
  expect(
    scrollEdges({ scrollWidth: 300.5, clientWidth: 300, scrollLeft: 0 }),
  ).toEqual({
    overflowing: false,
    moreStart: false,
    moreEnd: false,
  });
});

test("an overflowing scroller has more past each end it isn't at", () => {
  const at = (scrollLeft: number) =>
    scrollEdges({ scrollWidth: 500, clientWidth: 300, scrollLeft });

  expect(at(0)).toEqual({ overflowing: true, moreStart: false, moreEnd: true });
  expect(at(100)).toEqual({
    overflowing: true,
    moreStart: true,
    moreEnd: true,
  });
  expect(at(199.5)).toEqual({
    overflowing: true,
    moreStart: true,
    moreEnd: false,
  });
});

test("right to left reads the negative scroll the same way", () => {
  const at = (scrollLeft: number) =>
    scrollEdges({ scrollWidth: 500, clientWidth: 300, scrollLeft });

  expect(at(-100)).toEqual({
    overflowing: true,
    moreStart: true,
    moreEnd: true,
  });
  expect(at(-200)).toEqual({
    overflowing: true,
    moreStart: true,
    moreEnd: false,
  });
});
