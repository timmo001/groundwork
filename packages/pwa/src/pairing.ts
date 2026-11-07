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
 * A pairing link: the service's base URL with the code, such as
 * `https://bridge.local:9170/?pair=4f9c…`. It works once, and the service
 * forgets it after `expires`, a few minutes after it was made.
 */
export const PairingLink = Schema.Struct({
  service: Schema.String,
  code: Schema.String,
});

export interface PairingLink extends Schema.Schema.Type<typeof PairingLink> {}

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

/** The link for a service and a code, for the text and the QR code. */
export const pairingUrl = ({ service, code }: PairingLink): string => {
  const url = new URL(service);

  url.searchParams.set(pairingParam, code);

  return url.href;
};

/** Reads a pairing link, or `undefined` when the text isn't one. */
export const parsePairingLink = (text: string): PairingLink | undefined => {
  if (!URL.canParse(text)) return undefined;

  const url = new URL(text);
  const code = url.searchParams.get(pairingParam);

  if (code === null || code === "") return undefined;

  url.searchParams.delete(pairingParam);

  return { service: url.href, code };
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
