/**
 * A stand-in service for the pairing demos. A `gw-pairing` with
 * `data-sample` gets a `make` that answers with a made-up code and link,
 * working for `data-expires` seconds (300), and a `wait` that resolves once
 * a button in the frame with `data-pairs` is pressed, as if a phone used
 * the code.
 *
 * @module
 */
import type { PairingOffer } from "@timmo001/groundwork-ui";

// Crockford's base32, without I, L, O and U
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const codeOf = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => alphabet[byte % 32]).join("");

/** Wires each sample pairing in `frame` to the stand-in service. */
export const fillSamplePairings = (frame: HTMLElement) => {
  for (const pairing of frame.querySelectorAll("gw-pairing")) {
    if (pairing.dataset.sample === undefined) continue;

    const seconds = Number(pairing.dataset.expires ?? 300);

    pairing.make = async (): Promise<PairingOffer> => {
      // A moment's wait, so the spinner and the button's loading state show
      await new Promise((resolve) => setTimeout(resolve, 600));

      const code = codeOf();

      return {
        code,
        link: `https://kestrel.local/#pair=${code}`,
        expires: new Date(Date.now() + seconds * 1000).toISOString(),
      };
    };

    pairing.wait = (_offer, signal) =>
      new Promise((resolve) => {
        const onClick = (event: Event) => {
          const pairs = event
            .composedPath()
            .some((node) => node instanceof HTMLElement && node.dataset.pairs !== undefined);

          if (!pairs) return;

          frame.removeEventListener("click", onClick);
          resolve("Pixel 9");
        };

        frame.addEventListener("click", onClick);
        signal.addEventListener("abort", () => {
          frame.removeEventListener("click", onClick);
          resolve(undefined);
        });
      });
  }
};
