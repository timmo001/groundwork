/**
 * Tests reading a swipe from fingers' moves: how far, which axis, how many
 * fingers, and a pinch that isn't one.
 *
 * @module
 */
/// <reference types="bun" />
import { expect, test } from "bun:test";
import { swipeOf, type SwipeFinger } from "./swipe.js";

const finger = (
  x0: number,
  y0: number,
  dx: number,
  dy: number,
): SwipeFinger => ({
  x0,
  y0,
  x: x0 + dx,
  y: y0 + dy,
});

test("one finger far enough along one axis swipes that way", () => {
  expect(swipeOf([finger(200, 200, -48, 0)])).toEqual({
    fingers: 1,
    direction: "left",
  });
  expect(swipeOf([finger(200, 200, 10, -80)])).toEqual({
    fingers: 1,
    direction: "up",
  });
});

test("a short move or a diagonal isn't a swipe", () => {
  expect(swipeOf([finger(200, 200, 40, 0)])).toBeUndefined();
  expect(swipeOf([finger(200, 200, 60, 40)])).toBeUndefined();
  expect(swipeOf([])).toBeUndefined();
});

test("fingers moving together swipe as one, counted", () => {
  expect(
    swipeOf([
      finger(100, 300, 0, -90),
      finger(160, 300, 0, -100),
      finger(220, 300, 0, -95),
    ]),
  ).toEqual({ fingers: 3, direction: "up" });
});

test("two fingers spreading or closing are a pinch, not a swipe", () => {
  expect(
    swipeOf([finger(100, 200, -60, 0), finger(200, 200, 60, 0)]),
  ).toBeUndefined();
  expect(swipeOf([finger(100, 200, 70, 0), finger(200, 200, 100, 0)])).toEqual({
    fingers: 2,
    direction: "right",
  });
});

test("an app's own distance and pinch slack", () => {
  expect(swipeOf([finger(0, 0, 30, 0)], { distance: 24 })).toEqual({
    fingers: 1,
    direction: "right",
  });
  expect(
    swipeOf([finger(100, 200, 70, 0), finger(200, 200, 100, 0)], { pinch: 20 }),
  ).toBeUndefined();
});
