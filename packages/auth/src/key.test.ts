/**
 * Checks the key helpers against the shared test vectors, which services in
 * other languages check against too, and against independent CRC32 and
 * SHA-256 implementations, so the vectors themselves are right.
 */
import { createHash } from "node:crypto";
import { crc32 as zlibCrc32 } from "node:zlib";

import { describe, expect, test } from "bun:test";

import vectors from "../test-vectors.json";
import {
  crc32,
  findByKey,
  hashKey,
  isKey,
  keyChecksum,
  generateKey,
  parseKey,
  readBearer,
} from "./key.ts";

describe("test vectors", () => {
  test("the CRC32 is IEEE", () => {
    expect(crc32(vectors.crc32Check.input)).toBe(vectors.crc32Check.crc32);
  });

  for (const vector of vectors.valid) {
    test(`reads ${vector.service}_${vector.kind}`, async () => {
      const body = `${vector.service}_${vector.kind}_${vector.random}`;

      expect(crc32(body)).toBe(zlibCrc32(body));
      expect(crc32(body)).toBe(vector.crc32);
      expect(keyChecksum(body)).toBe(vector.checksum);
      expect(parseKey(vector.key)).toEqual({
        service: vector.service,
        kind: vector.kind,
        random: vector.random,
        checksum: vector.checksum,
      });
      expect(await hashKey(vector.key)).toBe(vector.sha256);
      expect(createHash("sha256").update(vector.key).digest("hex")).toBe(
        vector.sha256,
      );
    });
  }

  for (const vector of vectors.invalid) {
    test(`turns away: ${vector.reason}`, () => {
      expect(isKey(vector.key)).toBe(false);
    });
  }
});

test("a new key reads back with its prefix", () => {
  const key = generateKey({ service: "system-bridge", kind: "client" });

  expect(parseKey(key)).toMatchObject({
    service: "system-bridge",
    kind: "client",
  });
});

test("a prefix with an underscore is refused", () => {
  expect(() => generateKey({ service: "system_bridge", kind: "key" })).toThrow(
    RangeError,
  );
});

test("findByKey finds the record by hash and turns away a bad checksum", async () => {
  const [first, second] = vectors.valid;

  if (first === undefined || second === undefined) throw new Error("vectors");

  const records = [
    { id: "a", hash: first.sha256 },
    { id: "b", hash: second.sha256 },
  ];

  expect(await findByKey(second.key, records)).toEqual(records[1]);
  expect(await findByKey(`${second.key.slice(0, -1)}0`, records)).toBe(
    undefined,
  );
});

test("readBearer reads only the Bearer scheme", () => {
  expect(readBearer("Bearer abc")).toBe("abc");
  expect(readBearer("bearer abc")).toBe("abc");
  expect(readBearer("Basic abc")).toBe(undefined);
  expect(readBearer(null)).toBe(undefined);
});
