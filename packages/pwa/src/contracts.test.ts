/** Tests for the push and pairing contracts' parsing. */
import { describe, expect, test } from "bun:test";

import {
  normalizePairingCode,
  pairingUrl,
  parsePairingInput,
  parsePairingLink,
} from "./pairing.ts";
import { decodePushPayload } from "./push.ts";

describe("pairing links", () => {
  test("a link round-trips, keeping the service's own path and query", () => {
    const link = {
      service: "https://bridge.local:9170/app/?lang=en",
      code: "4f9c",
    };

    expect(parsePairingLink(pairingUrl(link))).toEqual(link);
    expect(parsePairingLink(pairingUrl(link, "fragment"))).toEqual(link);
  });

  test("a fragment link keeps the code out of the query", () => {
    expect(
      pairingUrl(
        { service: "https://kestrel.local/", code: "4F9C" },
        "fragment",
      ),
    ).toBe("https://kestrel.local/#pair=4F9C");
  });

  test("text without a code isn't a link", () => {
    expect(parsePairingLink("https://bridge.local/")).toBeUndefined();
    expect(parsePairingLink("not a url")).toBeUndefined();
  });
});

describe("pairing input", () => {
  const service = "https://bridge.local/";

  test("a typed code ignores case, spaces and dashes", () => {
    expect(normalizePairingCode(" 4f9c-82kd ")).toBe("4F9C82KD");
    expect(normalizePairingCode("4F9C 82KD")).toBe("4F9C82KD");
    expect(parsePairingInput("4f9c – 82kd", service)).toEqual({
      service,
      code: "4F9C82KD",
    });
  });

  test("a pasted link keeps its own service and code", () => {
    expect(
      parsePairingInput("  https://other.local/?pair=ab12  ", service),
    ).toEqual({ service: "https://other.local/", code: "ab12" });
  });

  test("anything else isn't a code", () => {
    expect(parsePairingInput("", service)).toBeUndefined();
    expect(parsePairingInput("https://other.local/", service)).toBeUndefined();
    expect(parsePairingInput("4F9C/82KD", service)).toBeUndefined();
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
