/**
 * `gw-pairing`: the screen a service shows to pair a phone or another
 * device, with its one-time code as a QR code, grouped text and a Copy
 * button, a countdown, a way to make a new code, and the paired state.
 * Docs: https://groundwork.timmo.dev/components/display/#pairing
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import type {} from "./gw-copy.js";
import type {} from "./gw-qr.js";
import type {} from "./gw-spinner.js";
import { base, createIcon } from "./styles.js";

// MDI's check-circle
const pairedIcon =
  "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z";

/**
 * A one-time code from the service, as its own route answers with one. It
 * has the same shape as `PairingCode` in `@timmo001/groundwork-pwa/pairing`,
 * so that answer can be passed straight through.
 */
export interface PairingOffer {
  /** The code, such as `4F9C82KD`. */
  readonly code: string;
  /** The link that carries it, for the QR code and the Copy button. */
  readonly link?: string;
  /** When it stops working, as an ISO date, a `Date` or milliseconds. */
  readonly expires?: string | number | Date;
}

/** Makes a new code: the app's call to its service. */
export type PairingMaker = () => Promise<PairingOffer>;

/**
 * Resolves with the device's name once the code has been used, or
 * `undefined` to stop waiting. The signal aborts when the code expires or
 * another replaces it.
 */
export type PairingWaiter = (
  offer: PairingOffer,
  signal: AbortSignal,
) => Promise<string | undefined>;

/** Fills `{name}` placeholders in a label from `values`. */
const fill = (template: string, values: Readonly<Record<string, string>>) =>
  template.replaceAll(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? (values[name] ?? match) : match,
  );

/** A code in groups of `size`, such as `4F9C-82KD`, or as given with 0. */
const grouped = (code: string, size: number) => {
  const plain = code.replaceAll(/[^\da-z]/gi, "");

  if (!Number.isInteger(size) || size <= 0 || plain === "") return code;

  return (plain.match(new RegExp(`.{1,${size}}`, "g")) ?? [plain]).join("-");
};

/** When an offer's `expires` falls, in milliseconds, or `undefined`. */
const timeOf = (expires: string) => {
  if (expires === "") return undefined;

  const time = /^\d+$/.test(expires)
    ? Number(expires)
    : new Date(expires).getTime();

  return Number.isNaN(time) ? undefined : time;
};

/** Minutes and seconds, such as `4:07`. */
const clock = (milliseconds: number) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/**
 * The screen a service shows to pair a phone or another device, following
 * [Pairing](https://groundwork.timmo.dev/behavior#pairing). It shows the
 * one-time code three ways at once: a QR code of the link, which a laptop's
 * camera can scan as well as a phone's, the code in large grouped text, and
 * a Copy button for the link. A countdown says how long it works for.
 *
 * Give it `make`, the app's function that asks the service for a code, and
 * it makes the first when it's shown, and another when Make a new code is
 * pressed. Or set `code`, `link` and `expires` from the app. When the code
 * runs out it's hidden, it says so and fires `expired`.
 *
 * Give it `wait` to hear when each code `make` makes is used, or set
 * `device` to the device's name: it then shows that the device paired, in
 * place, with a Done button that fires `done`, for the app to go back to its
 * list of devices.
 *
 * @element gw-pairing
 * @summary The pairing screen: a one-time code as a QR code and text, a countdown and the paired state.
 *
 * @attr {string} code - The one-time code, such as `4F9C82KD`. `make` sets it.
 * @attr {string} link - The link that carries the code, which the QR code shows and Copy copies. Without one, the QR code shows the code itself.
 * @attr {string} expires - When the code stops working, as an ISO date or milliseconds. Without it, there's no countdown.
 * @attr {string} device - The name of the device that paired, which shows the paired state in place of the used code. Clear it to show a new code.
 * @attr {number} group - How many characters each group of the shown code has, such as 4 for `4F9C-82KD`. 0 shows the code as given. Defaults to `4`.
 * @attr {"link"|"code"} copies - What the Copy button copies, when there's a link. Defaults to `link`.
 * @attr {string} label - The code's accessible name. Defaults to `Pairing code`.
 * @attr {string} qr-label - The QR code's accessible name. Defaults to `QR code of the pairing link`.
 * @attr {string} instructions-label - The line above the code. Defaults to `Scan this with the other device's camera, or enter the code on it.`
 * @attr {string} expires-label - The countdown, with `{time}` as minutes and seconds. Defaults to `Works once. Expires in {time}`.
 * @attr {string} expired-label - What it says once the code runs out. Defaults to `This code expired.`
 * @attr {string} renew-label - The button that makes a new code. Defaults to `Make a new code`.
 * @attr {string} making-label - What's announced while a code is being made. Defaults to `Making a code`.
 * @attr {string} failed-label - What it says when `make` fails. Defaults to `Couldn't make a code.`
 * @attr {string} paired-label - The paired state, with `{name}` as the device's. Defaults to `Paired with {name}`.
 * @attr {string} done-label - The button that leaves the paired state. Defaults to `Done`.
 * @attr {string} copy-link-label - The Copy button's text when it copies the link. Defaults to `Copy link`.
 * @attr {string} copy-code-label - The Copy button's text when it copies the code. Defaults to `Copy code`.
 * @attr {string} copied-label - What the Copy button says once it's copied. Defaults to `Copied`.
 * @attr {string} copy-failed-label - What it says when copying fails. Defaults to `Couldn't copy`.
 *
 * @fires {Event} expired - When the code runs out. It's hidden by then.
 * @fires {CustomEvent<{ name: string }>} paired - When `wait` resolves with the device's name, also in `device`.
 * @fires {Event} done - When Done is pressed in the paired state.
 *
 * @csspart instructions - The line above the code.
 * @csspart qr - The QR code, a `gw-qr`.
 * @csspart copy - The code and its Copy button, a `gw-copy`.
 * @csspart countdown - How long the code works for.
 * @csspart status - What happened: expired, failed or paired.
 * @csspart paired-icon - The icon beside the paired state.
 * @csspart renew - The Make a new code button, a `gw-button`.
 * @csspart done - The Done button, a `gw-button`.
 *
 * @cssprop --gw-pairing-qr-size - The QR code's size. Defaults to `12rem`.
 * @cssprop --gw-pairing-code-size - The code's text size. Defaults to `--gw-font-size-2xl`.
 * @cssprop --gw-pairing-width - The widest it grows. Defaults to `24rem`.
 */
export class GwPairing extends GwElement {
  static override properties = {
    code: {},
    link: {},
    expires: {},
    device: { reflect: true },
    group: { type: "number" },
    copies: {},
    label: {},
    qrLabel: { attribute: "qr-label" },
    instructionsLabel: { attribute: "instructions-label" },
    expiresLabel: { attribute: "expires-label" },
    expiredLabel: { attribute: "expired-label" },
    renewLabel: { attribute: "renew-label" },
    makingLabel: { attribute: "making-label" },
    failedLabel: { attribute: "failed-label" },
    pairedLabel: { attribute: "paired-label" },
    doneLabel: { attribute: "done-label" },
    copyLinkLabel: { attribute: "copy-link-label" },
    copyCodeLabel: { attribute: "copy-code-label" },
    copiedLabel: { attribute: "copied-label" },
    copyFailedLabel: { attribute: "copy-failed-label" },
    make: { attribute: false },
    wait: { attribute: false },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-3);
        align-items: center;
        width: 100%;
        max-width: var(--gw-pairing-width, 24rem);
        margin-inline: auto;
        text-align: center;
      }

      .instructions,
      .countdown {
        margin: 0;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }

      gw-qr {
        --gw-qr-size: var(--gw-pairing-qr-size, 12rem);
      }

      gw-copy {
        align-self: stretch;
        --gw-copy-font-size: var(
          --gw-pairing-code-size,
          var(--gw-font-size-2xl)
        );
      }

      gw-copy::part(value) {
        text-align: center;
        letter-spacing: 0.05em;
      }

      .countdown {
        font-variant-numeric: tabular-nums;
      }

      gw-spinner {
        --gw-spinner-size: 2rem;
        margin-block: var(--gw-space-6);
      }

      .status {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        justify-content: center;
        margin: 0;
        color: var(--gw-color-text-primary);
      }

      .status[data-empty] {
        display: none;
      }

      :host([device]) .status {
        font-size: var(--gw-font-size-l);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .status .icon {
        --gw-icon-size: 1.5rem;
        color: var(--gw-color-success);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        justify-content: center;
      }
    `,
  ];

  declare code: string;
  declare link: string;
  declare expires: string;
  declare device: string;
  declare group: number;
  declare copies: string;
  declare label: string;
  declare qrLabel: string;
  declare instructionsLabel: string;
  declare expiresLabel: string;
  declare expiredLabel: string;
  declare renewLabel: string;
  declare makingLabel: string;
  declare failedLabel: string;
  declare pairedLabel: string;
  declare doneLabel: string;
  declare copyLinkLabel: string;
  declare copyCodeLabel: string;
  declare copiedLabel: string;
  declare copyFailedLabel: string;
  /** The app's function that asks its service for a new code. */
  declare make: PairingMaker | undefined;
  /** The app's function that resolves with the device's name once it pairs. */
  declare wait: PairingWaiter | undefined;

  readonly #instructions = h("p", {
    class: "instructions",
    part: "instructions",
  });

  readonly #qr = h("gw-qr", { part: "qr" });

  readonly #copy = h("gw-copy", { part: "copy" });

  readonly #countdown = h("p", {
    class: "countdown",
    part: "countdown",
    role: "timer",
    "aria-live": "off",
  });

  readonly #spinner = h("gw-spinner");

  readonly #pairedIcon = createIcon(pairedIcon, { part: "paired-icon" });

  readonly #message = h("span");

  readonly #status = h(
    "p",
    { class: "status", part: "status", role: "status" },
    this.#pairedIcon,
    this.#message,
  );

  readonly #renew = h("gw-button", {
    part: "renew",
    variant: "neutral",
    appearance: "outlined",
  });

  readonly #done = h("gw-button", { part: "done" });

  #making = false;

  #failed = false;

  #expired = false;

  #ticker: ReturnType<typeof setInterval> | undefined;

  /** Aborts the current code's `wait` and any `make` still running. */
  #abort: AbortController | undefined;

  constructor() {
    super();
    this.code = "";
    this.link = "";
    this.expires = "";
    this.device = "";
    this.group = 4;
    this.copies = "link";
    this.label = "Pairing code";
    this.qrLabel = "QR code of the pairing link";
    this.instructionsLabel =
      "Scan this with the other device's camera, or enter the code on it.";
    this.expiresLabel = "Works once. Expires in {time}";
    this.expiredLabel = "This code expired.";
    this.renewLabel = "Make a new code";
    this.makingLabel = "Making a code";
    this.failedLabel = "Couldn't make a code.";
    this.pairedLabel = "Paired with {name}";
    this.doneLabel = "Done";
    this.copyLinkLabel = "Copy link";
    this.copyCodeLabel = "Copy code";
    this.copiedLabel = "Copied";
    this.copyFailedLabel = "Couldn't copy";
    this.make = undefined;
    this.wait = undefined;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#ticker = setInterval(this.#tick, 1000);
    document.addEventListener("visibilitychange", this.#tick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.#ticker);
    document.removeEventListener("visibilitychange", this.#tick);
  }

  /**
   * Asks `make` for a new code and shows it, replacing the last, which
   * stops being waited on. Resolves once it's shown, or making it failed.
   */
  async refresh() {
    const make = this.make;

    if (make === undefined) return;

    this.#abort?.abort();

    const controller = new AbortController();

    this.#abort = controller;
    this.#making = true;
    this.#failed = false;
    this.device = "";
    this.requestUpdate("code");

    try {
      const offer = await make();

      if (controller.signal.aborted) return;

      const expires =
        offer.expires === undefined
          ? Number.NaN
          : new Date(offer.expires).getTime();

      this.code = offer.code;
      this.link = offer.link ?? "";
      this.expires = Number.isNaN(expires)
        ? ""
        : new Date(expires).toISOString();
      this.#making = false;
      this.requestUpdate("code");
      this.#listen(offer, controller.signal);
    } catch {
      if (controller.signal.aborted) return;

      this.#making = false;
      this.#failed = true;
      this.requestUpdate("code");
    }
  }

  #listen(offer: PairingOffer, signal: AbortSignal) {
    const wait = this.wait;

    if (wait === undefined) return;

    wait(offer, signal)
      .then((name) => {
        if (signal.aborted || name === undefined || name === "") return;

        this.device = name;
        this.dispatchEvent(
          new CustomEvent("paired", {
            bubbles: true,
            composed: true,
            detail: { name },
          }),
        );
      })
      .catch(() => {});
  }

  /** Moves the countdown on, and expires the code once it runs out. */
  readonly #tick = () => {
    const ends = timeOf(this.expires);

    if (
      ends === undefined ||
      this.code === "" ||
      this.device !== "" ||
      this.#making ||
      this.#expired
    ) {
      return;
    }

    if (Date.now() >= ends) {
      this.#expired = true;
      this.#abort?.abort();
      this.dispatchEvent(
        new Event("expired", { bubbles: true, composed: true }),
      );
    }

    this.requestUpdate("expires");
  };

  protected override create(root: ShadowRoot) {
    this.#renew.addEventListener("click", () => void this.refresh());
    this.#done.addEventListener("click", () => {
      this.dispatchEvent(new Event("done", { bubbles: true, composed: true }));
    });
    root.append(
      this.#instructions,
      this.#spinner,
      this.#qr,
      this.#copy,
      this.#countdown,
      this.#status,
      h("div", { class: "actions" }, this.#renew, this.#done),
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    const paired = this.device !== "";

    // A device that paired used the code, so it's done with and not waited on
    if (changed.has("device") && paired) {
      this.#abort?.abort();
      this.code = "";
      this.link = "";
      this.expires = "";
    }

    if (changed.has("code") || changed.has("expires")) {
      const ends = timeOf(this.expires);

      this.#expired = ends !== undefined && Date.now() >= ends;
    }

    // With nothing to show, a code is made as it's shown, and again when
    // the paired state is left
    if (
      (changed.has("make") || changed.has("device")) &&
      this.make !== undefined &&
      this.code === "" &&
      !paired &&
      !this.#making
    ) {
      void this.refresh();
    }

    const showing =
      !paired &&
      !this.#making &&
      !this.#failed &&
      !this.#expired &&
      this.code !== "";

    const ends = timeOf(this.expires);
    const copiesCode = this.copies === "code" || this.link === "";

    this.#instructions.textContent = this.instructionsLabel;
    this.#instructions.hidden = !showing;
    this.#spinner.hidden = !this.#making || paired;
    setAttribute(this.#spinner, "label", this.makingLabel);

    this.#qr.hidden = !showing;
    this.#qr.value = showing ? this.link || this.code : "";
    this.#qr.label = this.qrLabel;

    this.#copy.hidden = !showing;
    this.#copy.value = showing ? (copiesCode ? this.code : this.link) : "";
    this.#copy.display = showing ? grouped(this.code, this.group) : "";
    this.#copy.label = this.label;
    this.#copy.copyLabel = copiesCode ? this.copyCodeLabel : this.copyLinkLabel;
    this.#copy.copiedLabel = this.copiedLabel;
    this.#copy.copyFailedLabel = this.copyFailedLabel;

    this.#countdown.hidden = !showing || ends === undefined;
    this.#countdown.textContent =
      ends === undefined
        ? ""
        : fill(this.expiresLabel, { time: clock(ends - Date.now()) });

    this.#pairedIcon.toggleAttribute("hidden", !paired);
    this.#message.textContent = paired
      ? fill(this.pairedLabel, { name: this.device })
      : this.#failed
        ? this.failedLabel
        : this.#expired && this.code !== "" && !this.#making
          ? this.expiredLabel
          : "";
    this.#status.toggleAttribute(
      "data-empty",
      this.#message.textContent === "",
    );

    this.#renew.textContent = this.renewLabel;
    this.#renew.hidden = paired || this.make === undefined;
    this.#renew.loading = this.#making;
    this.#done.textContent = this.doneLabel;
    this.#done.hidden = !paired;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-pairing": GwPairing;
  }
}
