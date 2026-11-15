/**
 * A stand-in browser for the install banner demos. A `gw-install-banner`
 * with `data-sample` gets a `pwa` whose install prompt is offered once a
 * button in the frame with `data-offers-install` is pressed, which also
 * forgets an earlier turn down, and answers Install as accepted.
 *
 * @module
 */

/** Wires each sample install banner in `frame` to the stand-in browser. */
export const fillSampleInstallBanners = (frame: HTMLElement) => {
  for (const banner of frame.querySelectorAll("gw-install-banner")) {
    if (banner.dataset.sample === undefined) continue;

    let offered = false;

    banner.pwa = {
      canInstall: () => offered,
      install: async () => {
        offered = false;

        return "accepted";
      },
    };

    frame.addEventListener("click", (event) => {
      const offers = event
        .composedPath()
        .some((node) => node instanceof HTMLElement && node.dataset.offersInstall !== undefined);

      if (!offers) return;

      offered = true;
      localStorage.removeItem(banner.storageKey);
      banner.requestUpdate("pwa");
    });
  }
};
