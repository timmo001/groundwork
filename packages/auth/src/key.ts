/**
 * Client keys: one key per client, shaped `<service>_<kind>_<random><checksum>`
 * so a leaked key says where it's from and a mistyped one is turned away
 * before any lookup. A service keeps only a key's SHA-256 and compares in
 * constant time. Documented on the Behavior page, under Client keys.
 */

/** The 62 characters a key's random part and checksum are written in. */
export const keyAlphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Base62 characters in the random part: 43 of them hold 256 bits. */
export const randomLength = 43;

/** Base62 characters in the checksum, enough for any CRC32. */
export const checksumLength = 6;

/** A key's service or kind: lowercase letters, digits and dashes. */
const namePattern = /^[a-z][\da-z-]*$/u;

const keyPattern = new RegExp(
  `^([a-z][\\da-z-]*)_([a-z][\\da-z-]*)_([\\dA-Za-z]{${randomLength}})([\\dA-Za-z]{${checksumLength}})$`,
  "u",
);

/** What a key names: the service it's for and the kind of key. */
export interface KeyPrefix {
  readonly service: string;
  readonly kind: string;
}

/** A key read into its parts, once its checksum is right. */
export interface ParsedKey extends KeyPrefix {
  readonly random: string;
  readonly checksum: string;
}

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xed_b8_83_20 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

/** The CRC32 (IEEE) of a string's UTF-8 bytes. */
export const crc32 = (text: string): number => {
  let crc = 0xff_ff_ff_ff;

  for (const byte of new TextEncoder().encode(text)) {
    crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }

  return (crc ^ 0xff_ff_ff_ff) >>> 0;
};

/** A number in base62, padded with leading zeros to `length`. */
const toBase62 = (value: number, length: number): string => {
  let rest = value;
  let text = "";

  while (rest > 0) {
    text = keyAlphabet[rest % 62] + text;
    rest = Math.floor(rest / 62);
  }

  return text.padStart(length, "0");
};

/**
 * The checksum for everything before it in a key, such as
 * `kestrel_key_` and the random part: its CRC32 as 6 base62 characters.
 */
export const keyChecksum = (body: string): string =>
  toBase62(crc32(body), checksumLength);

/** `<service>_<kind>_`, after checking both are lowercase names. */
export const keyPrefix = ({ service, kind }: KeyPrefix): string => {
  if (!namePattern.test(service) || !namePattern.test(kind)) {
    throw new RangeError(
      "A key's service and kind are lowercase letters, digits and dashes, starting with a letter",
    );
  }

  return `${service}_${kind}_`;
};

/**
 * Random base62 from the platform's CSPRNG, without modulo bias: bytes of
 * 248 and over are thrown away, since 248 is the largest multiple of 62.
 */
const randomBase62 = (length: number): string => {
  let text = "";

  while (text.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < 248 && text.length < length) text += keyAlphabet[byte % 62];
    }
  }

  return text;
};

/**
 * Makes a key for a client, such as `generateKey({ service: "kestrel", kind:
 * "key" })`. Show it once and keep only {@link hashKey}'s hash of it.
 */
export const generateKey = (prefix: KeyPrefix): string => {
  const body = keyPrefix(prefix) + randomBase62(randomLength);

  return body + keyChecksum(body);
};

/**
 * Reads a key into its parts, or `undefined` when it isn't shaped as one or
 * its checksum is wrong, such as a key that was mistyped or cut short.
 */
export const parseKey = (text: string): ParsedKey | undefined => {
  const match = keyPattern.exec(text);

  if (match === null) return undefined;

  const [, service = "", kind = "", random = "", checksum = ""] = match;

  if (keyChecksum(`${service}_${kind}_${random}`) !== checksum) {
    return undefined;
  }

  return { service, kind, random, checksum };
};

/** True when a key is shaped right and its checksum matches. */
export const isKey = (text: string): boolean => parseKey(text) !== undefined;

/** The hex SHA-256 of a key: the only form of it a service keeps. */
export const hashKey = async (key: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

/**
 * Compares two strings in time that depends only on their length, so a
 * timing difference doesn't say how much of a hash was right.
 */
export const constantTimeEqual = (a: string, b: string): boolean => {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;

  for (let index = 0; index < left.length; index++) {
    difference |= (left[index] ?? 0) ^ (right[index % right.length] ?? 0);
  }

  return difference === 0;
};

/**
 * Finds the record a key belongs to among a service's records, each with
 * the `hash` {@link hashKey} gave. A key with a bad checksum is turned away
 * before any hashing, and every record is compared, in constant time, so the
 * answer takes as long wherever the match is.
 */
export const findByKey = async <Record extends { readonly hash: string }>(
  key: string,
  records: Iterable<Record>,
): Promise<Record | undefined> => {
  if (!isKey(key)) return undefined;

  const hash = await hashKey(key);
  let found: Record | undefined;

  for (const record of records) {
    if (constantTimeEqual(record.hash, hash) && found === undefined) {
      found = record;
    }
  }

  return found;
};

/** The `Authorization` header value for a key: `Bearer <key>`. */
export const bearer = (key: string): string => `Bearer ${key}`;

/**
 * The key in an `Authorization: Bearer` header (RFC 6750), or `undefined`
 * when there's no header or it uses another scheme.
 */
export const readBearer = (
  header: string | null | undefined,
): string | undefined => {
  const match = /^Bearer[ \t]+(\S+)[ \t]*$/iu.exec(header ?? "");

  return match?.[1];
};
