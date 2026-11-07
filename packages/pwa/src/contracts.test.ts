/** Tests for the push and pairing contracts' parsing. */
import { describe, expect, test } from "bun:test";

import { pairingUrl, parsePairingLink } from "./pairing.ts";
import { decodePushPayload } from "./push.ts";

describe("pairing links", () => {
  test("a link round-trips, keeping the service's own path and query", () => {
    const link = {
      service: "https://bridge.local:9170/app/?lang=en",
      code: "4f9c",
    };

    expect(parsePairingLink(pairingUrl(link))).toEqual(link);
  });

  test("text without a code isn't a link", () => {
    expect(parsePairingLink("https://bridge.local/")).toBeUndefined();
    expect(parsePairingLink("not a url")).toBeUndefined();
  });
});

describe("push payloads", () => {
  test("reads a payload and refuses anything else", () => {
    expect(
      decodePushPayload('{"title":"Restart needed","tone":"warning"}'),
    ).toEqual({ title: "Restart needed", tone: "warning" });
    expect(decodePushPayload('{"title":1}')).toBeUndefined();
    expect(decodePushPayload("plain text")).toBeUndefined();
  });
});
