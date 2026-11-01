/**
 * `gw-alert`: a message in the flow of the page.
 * Docs: https://groundwork.timmo.dev/components/display/#alert
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, createIcon, setIconPath, type Tone } from "./styles.js";

// mdi's outlined information, check, alert and alert-decagram icons
const information =
  "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z";

const toneIcons: Readonly<Record<Tone, string>> = {
  neutral: information,
  accent: information,
  info: information,
  success:
    "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z",
  warning: "M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",
  danger:
    "M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",
  important:
    "M23,12L20.56,14.78L20.9,18.46L17.29,19.28L15.4,22.46L12,21L8.6,22.47L6.71,19.29L3.1,18.47L3.44,14.78L1,12L3.44,9.21L3.1,5.53L6.71,4.72L8.6,1.54L12,3L15.4,1.54L17.29,4.72L20.9,5.54L20.56,9.22L23,12M20.33,12L18.5,9.89L18.74,7.1L16,6.5L14.58,4.07L12,5.18L9.42,4.07L8,6.5L5.26,7.09L5.5,9.88L3.67,12L5.5,14.1L5.26,16.9L8,17.5L9.42,19.93L12,18.81L14.58,19.92L16,17.5L18.74,16.89L18.5,14.1L20.33,12M11,15H13V17H11V15M11,7H13V13H11V7",
};

/**
 * A message in the flow of the page. `urgent` announces it at once, for
 * errors that need attention; otherwise it's announced politely.
 *
 * @element gw-alert
 * @summary A message in the flow of the page.
 *
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The color and default icon. Defaults to `info`.
 * @attr {string} heading - A heading above the message.
 * @attr {boolean} urgent - Announces it at once.
 *
 * @slot - The message.
 * @slot icon - An icon in place of the tone's.
 * @slot actions - Buttons beside the message.
 *
 * @csspart alert - The alert.
 *
 * @cssprop --gw-tone - The icon color, for a tone of your own. `tone` sets it.
 * @cssprop --gw-tone-fill - The background. `tone` sets it.
 * @cssprop --gw-tone-border - The border. `tone` sets it.
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
        border-radius: min(var(--gw-radius-control), var(--gw-radius-panel));
      }

      ::slotted(p) {
        margin: 0;
      }

      ::slotted([slot="actions"]) {
        align-self: center;
      }

      ::slotted([slot="icon"]),
      .icon {
        flex: none;
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

  // The tone's icon, shown until an icon is slotted in its place
  readonly #icon = createIcon("");

  constructor() {
    super();
    this.tone = "info";
    this.heading = "";
    this.urgent = false;
  }

  protected override create(root: ShadowRoot) {
    this.#alert.append(
      h("slot", { name: "icon" }, this.#icon),
      h("div", { class: "body" }, this.#heading, h("slot")),
      h("slot", { name: "actions" }),
    );
    root.append(this.#alert);
  }

  protected override update() {
    this.#alert.setAttribute("role", this.urgent ? "alert" : "status");
    setIconPath(this.#icon, toneIcons[this.tone] ?? information);
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
