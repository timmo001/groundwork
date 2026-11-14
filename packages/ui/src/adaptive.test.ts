/**
 * Tests when a popup opens as a bottom sheet: a phone upright or on its
 * side, a short window, and either rule turned off.
 *
 * @module
 */
/// <reference types="bun" />
import { expect, test } from "bun:test";
import { opensAsSheet } from "./adaptive.js";

const phone = { width: 390, height: 844 };
const phoneOnItsSide = { width: 844, height: 390 };
const laptop = { width: 1440, height: 900 };

test("a phone is a sheet upright and on its side", () => {
  expect(opensAsSheet({}, phone)).toBe(true);
  expect(opensAsSheet({}, phoneOnItsSide)).toBe(true);
});

test("a large window keeps the anchored popup", () => {
  expect(opensAsSheet({}, laptop)).toBe(false);
  expect(opensAsSheet({}, { width: 600, height: 500 })).toBe(false);
});

test("0 turns either rule off", () => {
  expect(opensAsSheet({ belowHeight: 0 }, phoneOnItsSide)).toBe(false);
  expect(opensAsSheet({ belowHeight: 0 }, phone)).toBe(true);
  expect(opensAsSheet({ below: 0 }, phone)).toBe(false);
  expect(opensAsSheet({ below: 0, belowHeight: 0 }, phoneOnItsSide)).toBe(
    false,
  );
});
