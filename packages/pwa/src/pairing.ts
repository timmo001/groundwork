/**
 * The pairing contract: connecting a phone to a service without typing an
 * address or a credential. The service shows a one-time link as text and a
 * QR code; the app opens or scans it, trades the code for a token and keeps
 * that. Documented on the Behavior page, beside push.
 */
import { Option, Schema } from "effect";

import { PushClient } from "./push.ts";

/** The service's route, under its own base URL. */
export const pairingRoutes = {
  /** `POST` a {@link PairingRequest}, answered with a {@link Pairing}. */
  pair: "pair",
} as const;

/** The query parameter the link carries its one-time code in. */
export const pairingParam = "pair";

/**
 * Where a link carries its code: the query, `?pair=`, which every client
 * reads, or the fragment, `#pair=`, which the browser never sends, so it
 * stays out of the service's request logs and `Referer` headers.
 */
export type PairingPlace = "query" | "fragment";

/**
 * A pairing link: the service's base URL with the code, such as
 * `https://bridge.local:9170/?pair=4f9c…`. It works once, and the service
 * forgets it after `expires`, a few minutes after it was made.
 */
export const PairingLink = Schema.Struct({
  service: Schema.String,
  code: Schema.String,
});

export interface PairingLink extends Schema.Schema.Type<typeof PairingLink> {}

/**
 * A one-time code as the service's own pairing page shows it, however the
 * service makes one: the code, its link for the QR code and Copy, and when
 * it stops working, as an ISO date. `gw-pairing` takes it as it is.
 */
export const PairingCode = Schema.Struct({
  code: Schema.String,
  link: Schema.String,
  expires: Schema.String,
});

export interface PairingCode extends Schema.Schema.Type<typeof PairingCode> {}

/** What the app sends to trade the code: the code and who it is. */
export const PairingRequest = Schema.Struct({
  code: Schema.String,
  client: PushClient,
});

export interface PairingRequest extends Schema.Schema.Type<
  typeof PairingRequest
> {}

/**
 * The service's answer: a token the app sends as `Authorization: Bearer`
 * from then on, and the name to show for the service. The service keeps the
 * client, when it paired and when it was last seen, and lists them so one
 * can be removed, which ends its token.
 */
export const Pairing = Schema.Struct({
  token: Schema.String,
  service: Schema.Struct({ id: Schema.String, name: Schema.String }),
});

export interface Pairing extends Schema.Schema.Type<typeof Pairing> {}

/**
 * The link for a service and a code, for the text and the QR code. The code
 * goes in the query unless `place` is `fragment`.
 */
export const pairingUrl = (
  { service, code }: PairingLink,
  place: PairingPlace = "query",
): string => {
  const url = new URL(service);

  if (place === "fragment") {
    const fragment = new URLSearchParams(url.hash.slice(1));

    fragment.set(pairingParam, code);
    url.hash = fragment.toString();
  } else {
    url.searchParams.set(pairingParam, code);
  }

  return url.href;
};

/**
 * Reads a pairing link with its code in the query or the fragment, or
 * `undefined` when the text isn't one.
 */
export const parsePairingLink = (text: string): PairingLink | undefined => {
  if (!URL.canParse(text)) return undefined;

  const url = new URL(text);
  const query = url.searchParams.get(pairingParam);

  if (query !== null && query !== "") {
    url.searchParams.delete(pairingParam);

    return { service: url.href, code: query };
  }

  const fragment = new URLSearchParams(url.hash.slice(1));
  const code = fragment.get(pairingParam);

  if (code === null || code === "") return undefined;

  fragment.delete(pairingParam);
  url.hash = fragment.toString();

  return { service: url.href, code };
};

/**
 * A typed code as the service compares it: uppercase, without the spaces
 * and dashes it was shown or typed with, so `4f9c-82kd` reads as `4F9C82KD`.
 */
export const normalizePairingCode = (text: string): string =>
  text.replaceAll(/[\s\u2010-\u2015\u2212-]/gu, "").toUpperCase();

/**
 * Reads what someone typed or pasted into one code field: a whole pairing
 * link, which keeps its own service and code, or a bare code, which pairs
 * with `service`, such as the address the app already knows. `undefined`
 * when it's neither, such as a link without a code.
 */
export const parsePairingInput = (
  text: string,
  service: string,
): PairingLink | undefined => {
  const trimmed = text.trim();
  const link = parsePairingLink(trimmed);

  if (link !== undefined) return link;

  const code = normalizePairingCode(trimmed);

  return /^[\dA-Z]+$/u.test(code) ? { service, code } : undefined;
};

/**
 * Reads a pairing link from the page's own address, as when the app opens
 * from a scanned QR code, and takes the code out of the address so it isn't
 * left in history or a bookmark.
 */
export const takePairingLink = (): PairingLink | undefined => {
  const link = parsePairingLink(location.href);

  if (link !== undefined) history.replaceState(history.state, "", link.service);

  return link;
};

const decodePairing = Schema.decodeUnknownOption(Pairing);

/** Trades a link's code for a token, or `undefined` when the service refuses. */
export const pair = async (
  link: PairingLink,
  client: PushClient,
): Promise<Pairing | undefined> => {
  const request: PairingRequest = { code: link.code, client };

  const response = await fetch(new URL(pairingRoutes.pair, link.service), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) return undefined;

  return Option.getOrUndefined(decodePairing(await response.json()));
};

/** The parts of the Barcode Detection API scanning uses. */
interface QrDetector {
  readonly detect: (
    source: HTMLVideoElement,
  ) => Promise<readonly { readonly rawValue: string }[]>;
}

declare global {
  var BarcodeDetector:
    | (new (options: { readonly formats: readonly string[] }) => QrDetector)
    | undefined;
}

/** True where the browser can read QR codes, as Chromium on Android can. */
export const canScan = (): boolean => globalThis.BarcodeDetector !== undefined;

/**
 * Reads QR codes from a playing camera video until one is a pairing link,
 * or the signal aborts. The page starts the camera, so it owns the
 * permission prompt; the Android shell passes it through.
 */
export const scanPairingLink = async (
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<PairingLink | undefined> => {
  const Detector = globalThis.BarcodeDetector;

  if (Detector === undefined) return undefined;

  const detector = new Detector({ formats: ["qr_code"] });

  while (!signal.aborted) {
    const codes = await detector.detect(video).catch(() => []);

    const link = codes
      .map(({ rawValue }) => parsePairingLink(rawValue))
      .find((found) => found !== undefined);

    if (link !== undefined) return link;

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return undefined;
};
