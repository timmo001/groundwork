import { GwElement, css, h } from "./element.js";
import "./gw-button.js";
import "./gw-empty-state.js";
import "./gw-notification.js";
import { animateHeight } from "./motion.js";
import { base } from "./styles.js";

// MDI's bell-check-outline
const emptyIcon =
  "M11.5 21.97C10.7 21.85 10 21.22 10 20.38H11.5V21.97M21.5 13.5L20.08 12.09L16 16.17L13.92 14.09L12.5 15.5L16 19L21.5 13.5M6 17H11.08C11.03 17.33 11 17.66 11 18C11 18.34 11.03 18.67 11.08 19H3V18L5 16V10C5 6.9 7.03 4.17 10 3.29V3A2 2 0 0 1 12 1A2 2 0 0 1 14 3V3.29C16.97 4.17 19 6.9 19 10V11.18C18.37 11.07 17.7 11 17 11V10A5 5 0 0 0 12 5A5 5 0 0 0 7 10V17H6Z";

/**
 * Where notifications wait until they're dealt with: a list of
 * `gw-notification` cards with Clear all, and an empty state once nothing's
 * left. Put it in a page, a panel or a popover from a bell button. Each
 * card folds away when dismissed, and the list closes up smoothly. It fires
 * `clear` when Clear all is pressed.
 */
export class GwNotificationCenter extends GwElement {
  static override properties = {
    heading: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      header {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        justify-content: space-between;
        margin-block-end: var(--gw-space-2);
      }

      h2 {
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .list {
        display: grid;
        gap: var(--gw-space-2);
      }

      [hidden] {
        display: none;
      }

      gw-empty-state::part(empty) {
        padding-block: var(--gw-space-6);
      }
    `,
  ];

  declare heading: string;

  readonly #heading = h("h2");

  readonly #clear = h(
    "gw-button",
    { size: "small", variant: "neutral", appearance: "plain" },
    "Clear all",
  );

  readonly #list = h("div", { class: "list", role: "list" }, h("slot"));

  readonly #empty = h(
    "gw-empty-state",
    { icon: emptyIcon, heading: "You're all caught up" },
    h("p", {}, "New notifications show up here."),
  );

  readonly #body = h("div", {}, this.#list, this.#empty);

  #observer: MutationObserver | undefined;

  constructor() {
    super();
    this.heading = "Notifications";
  }

  /** Dismisses every notification. */
  clear() {
    this.dispatchEvent(new Event("clear", { bubbles: true, composed: true }));

    for (const item of this.querySelectorAll("gw-notification")) item.dismiss();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#observer = new MutationObserver(() => this.#refresh());
    this.#observer.observe(this, { childList: true });
    this.#refresh(false);
  }

  override disconnectedCallback() {
    this.#observer?.disconnect();
    super.disconnectedCallback();
  }

  #refresh(animate = true) {
    const before = this.#body.offsetHeight;
    const empty = this.querySelector("gw-notification") === null;

    this.#list.hidden = empty;
    this.#empty.hidden = !empty;
    this.#clear.hidden = empty;

    for (const item of this.querySelectorAll("gw-notification")) {
      item.setAttribute("role", "listitem");
    }

    if (animate) animateHeight(this.#body, before);
  }

  protected override create(root: ShadowRoot) {
    this.#clear.addEventListener("click", () => {
      this.clear();
    });
    root.append(h("header", {}, this.#heading, this.#clear), this.#body);
  }

  protected override update() {
    this.#heading.textContent = this.heading;
  }
}

GwNotificationCenter.define("gw-notification-center");

declare global {
  interface HTMLElementTagNameMap {
    "gw-notification-center": GwNotificationCenter;
  }
}
