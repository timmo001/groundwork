/**
 * Tests the bridge's wire format and that its Android colors stay in step
 * with the roles the tokens' `androidTheme` reads.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { androidColorRoles } from "@timmo001/groundwork-tokens/runtime";

import { AndroidSchemeColors, decodeIncomingText } from "./bridge.ts";

test("carries every role androidTheme reads", () => {
  expect(Object.keys(AndroidSchemeColors.fields).toSorted()).toEqual(
    [...androidColorRoles].toSorted(),
  );
});

test("reads replies and messages, and ignores anything else", () => {
  expect(
    decodeIncomingText('{"type":"reply","id":1,"ok":true,"value":true}'),
  ).toEqual({ type: "reply", id: 1, ok: true, value: true });
  expect(
    decodeIncomingText(
      '{"type":"message","name":"deepLink","data":{"url":"app://x"}}',
    ),
  ).toEqual({ type: "message", name: "deepLink", data: { url: "app://x" } });
  expect(decodeIncomingText('{"type":"request","id":1,"name":"x"}')).toBe(
    undefined,
  );
  expect(decodeIncomingText("not json")).toBe(undefined);
});
