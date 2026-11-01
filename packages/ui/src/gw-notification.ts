import { GwElement, css, h } from "./element.js";
import "./gw-button.js";
import { fadeEasing, motionDuration, reducedMotion } from "./motion.js";
import { base, createIcon, setIconPath, type Tone } from "./styles.js";

// MDI's close
const closeIcon =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/**
 * Something new the person needs to decide or know, kept in a
 * `gw-notification-center` until it's dealt with. It has an icon, a heading,
 * a line of text, when it happened and up to two actions. Its close button
 * dismisses it: it fires `dismiss`, then folds away and removes itself,
 * unless the event is cancelled.
 */
export class GwNotification extends GwElement {
  static override properties = {
    heading: {},
    icon: {},
    tone: { reflect: true },
    time: {},
    unread: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: var(--gw-space-1) var(--gw-space-2);
        align-items: start;
        padding: var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-control);
      }

      /* An inset stripe, so unread and read cards line up */
      :host([unread]) .card {
        box-shadow: inset calc(var(--gw-border-width) * 4) 0 0
          var(--gw-tone, var(--gw-color-accent));
      }

      :host([unread]:dir(rtl)) .card {
        box-shadow: inset calc(var(--gw-border-width) * -4) 0 0
          var(--gw-tone, var(--gw-color-accent));
      }

      .card > .icon {
        margin-block-start: 0.1em;
        color: var(--gw-tone, var(--gw-color-text-secondary));
      }

      .card > .icon[hidden] {
        display: none;
      }

      .body {
        display: grid;
        gap: var(--gw-space-1);
        min-width: 0;
      }

      strong {
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      time {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      time:empty {
        display: none;
      }

      ::slotted(p) {
        margin: 0;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-1);
        margin-block-start: var(--gw-space-1);
      }

      .close {
        margin: calc(var(--gw-space-1) * -1);
      }
    `,
  ];

  declare heading: string;
  declare icon: string;
  declare tone: Tone;
  declare time: string;
  declare unread: boolean;

  readonly #icon = createIcon("");

  readonly #heading = h("strong");

  readonly #time = h("time");

  readonly #close = h(
    "gw-button",
    {
      class: "close",
      variant: "neutral",
      appearance: "plain",
      size: "xs",
      labels: "hide",
      icon: closeIcon,
    },
    "Dismiss",
  );

  constructor() {
    super();
    this.heading = "";
    this.icon = "";
    this.tone = "neutral";
    this.time = "";
    this.unread = false;
  }

  /** Fires `dismiss`, then folds away and removes itself unless that's cancelled. */
  dismiss() {
    const event = new Event("dismiss", {
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    if (!this.dispatchEvent(event)) return;

    const duration = reducedMotion()
      ? 0
      : motionDuration(this, "--gw-motion-normal", 250);

    const leave = this.animate(
      [
        { opacity: 1, height: `${this.offsetHeight}px`, overflow: "clip" },
        { opacity: 0, height: "0px", overflow: "clip" },
      ],
      { duration, easing: fadeEasing, fill: "forwards" },
    );

    leave.addEventListener("finish", () => this.remove());
    leave.addEventListener("cancel", () => this.remove());
  }

  protected override create(root: ShadowRoot) {
    this.#close.addEventListener("click", () => {
      this.dismiss();
    });
    root.append(
      h(
        "article",
        { class: "card", part: "card" },
        this.#icon,
        h(
          "div",
          { class: "body" },
          this.#heading,
          h("slot"),
          this.#time,
          h("div", { class: "actions" }, h("slot", { name: "actions" })),
        ),
        this.#close,
      ),
    );
  }

  protected override update() {
    setIconPath(this.#icon, this.icon);
    this.#icon.toggleAttribute("hidden", !this.icon);
    this.#heading.textContent = this.heading;
    this.#heading.hidden = !this.heading;
    this.#time.textContent = this.time;
  }
}

GwNotification.define("gw-notification");

declare global {
  interface HTMLElementTagNameMap {
    "gw-notification": GwNotification;
  }
}
