/**
 * `gw-alert`: a message in the flow of the page.
 * Docs: https://groundwork.timmo.dev/components/display/#alert
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, type Tone } from "./styles.js";

/**
 * A message in the flow of the page. `urgent` announces it at once, for
 * errors that need attention; otherwise it's announced politely.
 */
export class GwAlert extends GwElement {
  static override properties = {
    tone: { reflect: true },
    heading: {},
    urgent: { type: "boolean" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .alert {
        display: flex;
        gap: var(--gw-space-2);
        align-items: flex-start;
        padding: var(--gw-space-2) var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        background: var(--gw-tone-fill, var(--gw-color-fill-info-quiet));
        border: var(--gw-border-width) solid
          var(--gw-tone-border, var(--gw-color-border-info));
        border-inline-start-width: calc(var(--gw-border-width) * 4);
        border-radius: var(--gw-radius-control);
      }

      ::slotted(p) {
        margin: 0;
      }

      ::slotted([slot="actions"]) {
        align-self: center;
      }

      ::slotted([slot="icon"]) {
        color: var(--gw-tone, var(--gw-color-info));
      }

      .body {
        flex: 1;
        min-width: 0;
      }

      strong {
        display: block;
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }
    `,
  ];

  declare tone: Tone;
  declare heading: string;
  declare urgent: boolean;

  readonly #alert = h("div", { class: "alert", part: "alert" });

  readonly #heading = h("strong");

  constructor() {
    super();
    this.tone = "info";
    this.heading = "";
    this.urgent = false;
  }

  protected override create(root: ShadowRoot) {
    this.#alert.append(
      h("slot", { name: "icon" }),
      h("div", { class: "body" }, this.#heading, h("slot")),
      h("slot", { name: "actions" }),
    );
    root.append(this.#alert);
  }

  protected override update() {
    this.#alert.setAttribute("role", this.urgent ? "alert" : "status");
    this.#heading.textContent = this.heading;
    this.#heading.hidden = !this.heading;
  }
}

GwAlert.define("gw-alert");

declare global {
  interface HTMLElementTagNameMap {
    "gw-alert": GwAlert;
  }
}
