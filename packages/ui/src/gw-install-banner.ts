/**
 * `gw-install-banner`: the offer to install a web app, as a `gw-banner`
 * with Install and Not now, until it's turned down once.
 * Docs: https://groundwork.timmo.dev/components/feedback/#install-banner
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-banner.js";
import type {} from "./gw-button.js";
import { base } from "./styles.js";

// MDI's download
const installIcon = "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z";

/** The answer to an install offer, as `@timmo001/groundwork-pwa`'s `install()` gives it. */
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/**
 * What the banner offers the install through: `connectPwa`'s result from
 * `@timmo001/groundwork-pwa/view`, or anything with the same two members.
 */
export interface InstallSource {
  /** True while the browser has an install prompt to show. */
  readonly canInstall: () => boolean;
  /** Shows the browser's install prompt. */
  readonly install: () => Promise<InstallOutcome>;
}

/**
 * Offers to install the app while the browser can, until it's turned down
 * once, with Not now or in the browser's own prompt. The turn down is kept
 * under `storage-key`, so it stays down across visits. Give it `pwa`, the
 * page's `connectPwa` result, and it opens and closes by itself as the
 * browser offers a prompt and takes it back. Only Chromium browsers offer
 * one, so elsewhere it stays closed.
 *
 * Put it where a `gw-banner` goes, above the app's content. Keep an Install
 * button in the app's Settings too, as the only place left to install from
 * once the banner's turned down. Set `held` to keep it back for a while,
 * such as during a pairing.
 *
 * @element gw-install-banner
 * @summary The offer to install a web app, until it's turned down once.
 *
 * @attr {string} storage-key - The `localStorage` key the turn down is kept under. Defaults to `gw:install-dismissed`.
 * @attr {boolean} held - Keeps it closed while set.
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The banner's color. Defaults to `info`.
 * @attr {string} message - What it says, unless the default slot has something. Defaults to `Install this app to open it from your home screen.`
 * @attr {string} install-label - The Install button's text. Defaults to `Install`.
 * @attr {string} dismiss-label - The Not now button's text. Defaults to `Not now`.
 *
 * @slot - What it says, in place of `message`.
 * @slot icon - An icon before it.
 *
 * @csspart banner - The `gw-banner`.
 * @csspart install - The Install button, a `gw-button`.
 * @csspart dismiss - The Not now button, a `gw-button`.
 *
 * @fires {CustomEvent<{ outcome: "accepted" | "dismissed" | "unavailable" }>} install - When the browser's prompt is answered.
 * @fires {Event} dismiss - When it's turned down, with Not now or in the browser's prompt.
 */
export class GwInstallBanner extends GwElement {
  static override properties = {
    storageKey: { attribute: "storage-key" },
    held: { type: "boolean", reflect: true },
    tone: {},
    message: {},
    installLabel: { attribute: "install-label" },
    dismissLabel: { attribute: "dismiss-label" },
    pwa: { attribute: false },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }
    `,
  ];

  declare storageKey: string;
  declare held: boolean;
  declare tone: string;
  declare message: string;
  declare installLabel: string;
  declare dismissLabel: string;
  /** The page's PWA connection, which the install is offered through. */
  declare pwa: InstallSource | undefined;

  readonly #message = h("span");

  readonly #install = h("gw-button", {
    part: "install",
    slot: "actions",
    size: "small",
    icon: installIcon,
  });

  readonly #dismiss = h("gw-button", {
    part: "dismiss",
    slot: "actions",
    size: "small",
    variant: "neutral",
    appearance: "plain",
  });

  readonly #banner = h(
    "gw-banner",
    { part: "banner" },
    h("slot", { name: "icon", slot: "icon" }),
    h("slot", {}, this.#message),
    this.#install,
    this.#dismiss,
  );

  readonly #show = () => this.requestUpdate("pwa");

  constructor() {
    super();
    this.storageKey = "gw:install-dismissed";
    this.held = false;
    this.tone = "info";
    this.message = "Install this app to open it from your home screen.";
    this.installLabel = "Install";
    this.dismissLabel = "Not now";
    this.pwa = undefined;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The browser offers a prompt, takes it back once it's used, and
    // sometimes offers another later
    window.addEventListener("gw-install-change", this.#show);
    window.addEventListener("appinstalled", this.#show);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("gw-install-change", this.#show);
    window.removeEventListener("appinstalled", this.#show);
  }

  /** Whether it's been turned down here before. */
  get dismissed() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /** Shows the browser's install prompt, which only a tap or click may do. */
  async install(): Promise<InstallOutcome> {
    const outcome = (await this.pwa?.install()) ?? "unavailable";

    this.dispatchEvent(
      new CustomEvent("install", {
        detail: { outcome },
        bubbles: true,
        composed: true,
      }),
    );

    if (outcome === "dismissed") this.dismiss();
    else this.requestUpdate("pwa");

    return outcome;
  }

  /** Turns it down, and keeps it down under `storage-key`. */
  dismiss() {
    localStorage.setItem(this.storageKey, new Date().toISOString());
    this.dispatchEvent(new Event("dismiss", { bubbles: true, composed: true }));
    this.requestUpdate("pwa");
  }

  protected override create(root: ShadowRoot) {
    this.#install.addEventListener("click", () => void this.install());
    this.#dismiss.addEventListener("click", () => this.dismiss());
    root.append(this.#banner);
  }

  protected override update() {
    this.#message.textContent = this.message;
    this.#install.textContent = this.installLabel;
    this.#dismiss.textContent = this.dismissLabel;
    setAttribute(this.#banner, "tone", this.tone);
    this.#banner.open =
      this.pwa?.canInstall() === true && !this.held && !this.dismissed;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-install-banner": GwInstallBanner;
  }
}
