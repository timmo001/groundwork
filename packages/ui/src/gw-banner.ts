/**
 * `gw-banner`: a slim bar for app-wide state, such as a lost connection.
 * Docs: https://groundwork.timmo.dev/components/feedback/#banner
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, type Tone } from "./styles.js";

/**
 * A slim bar across the top of the app for app-wide state the person can
 * work through: a restart is needed, the connection is lost, or a new
 * version is ready. Put it above the app's content, not over it. Its height
 * opens and closes smoothly, so the page below moves with it rather than
 * jumping. Put one action in the `actions` slot, which opens what it's
 * about. `urgent` announces it at once.
 *
 * @element gw-banner
 * @summary A slim bar for app-wide state, such as a lost connection.
 *
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The color. Defaults to `info`.
 * @attr {boolean} open - Whether it shows.
 * @attr {boolean} urgent - Announces it at once.
 *
 * @slot - The message.
 * @slot icon - An icon before the message.
 * @slot actions - One button, opening what it's about.
 *
 * @csspart bar - The bar.
 */
export class GwBanner extends GwElement {
  static override properties = {
    tone: { reflect: true },
    open: { type: "boolean", reflect: true },
    urgent: { type: "boolean" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: grid;
        grid-template-rows: 0fr;
        transition:
          grid-template-rows var(--gw-motion-normal) var(--gw-motion-easing),
          visibility var(--gw-motion-normal) allow-discrete;
        visibility: hidden;
      }

      :host([open]) {
        grid-template-rows: 1fr;
        visibility: visible;
      }

      .clip {
        min-height: 0;
        overflow: clip;
      }

      .bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-1) var(--gw-space-3);
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
        padding: var(--gw-space-1) var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-strong);
        background: var(--gw-tone-fill, var(--gw-color-fill-info-quiet));
        border-block-end: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-info));
      }

      ::slotted([slot="icon"]) {
        color: var(--gw-tone, var(--gw-color-info));
      }

      ::slotted(p) {
        margin: 0;
      }
    `,
  ];

  declare tone: Tone;
  declare open: boolean;
  declare urgent: boolean;

  readonly #bar = h(
    "div",
    { class: "bar", part: "bar" },
    h("slot", { name: "icon" }),
    h("slot"),
    h("slot", { name: "actions" }),
  );

  constructor() {
    super();
    this.tone = "info";
    this.open = false;
    this.urgent = false;
  }

  protected override create(root: ShadowRoot) {
    root.append(h("div", { class: "clip" }, this.#bar));
  }

  protected override update() {
    setAttribute(this.#bar, "role", this.urgent ? "alert" : "status");
    setAttribute(this, "aria-hidden", this.open ? null : "true");
  }
}

GwBanner.define("gw-banner");

declare global {
  interface HTMLElementTagNameMap {
    "gw-banner": GwBanner;
  }
}
