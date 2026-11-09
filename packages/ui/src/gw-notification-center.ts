/**
 * `gw-notification-center`: where notifications wait until they're dealt with.
 * Docs: https://groundwork.timmo.dev/components/feedback/#notifications
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-button.js";
import type {} from "./gw-empty-state.js";
import type {} from "./gw-notification.js";
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
 *
 * @element gw-notification-center
 * @summary A list of notifications with Clear all and an empty state.
 *
 * @attr {string} heading - The list's heading. Defaults to `Notifications`.
 * @attr {string} clear-label - The Clear all button, for an app in another language. Defaults to `Clear all`.
 * @attr {string} empty-heading - The empty state's heading. Defaults to `You're all caught up`.
 * @attr {string} empty-text - The line under it. Defaults to `New notifications show up here.`
 *
 * @slot - The `gw-notification` cards.
 * @slot actions - Buttons of the app's own in the header, before Clear all, such as Mark all read.
 * @slot empty - What shows once nothing's left, in place of the empty state.
 *
 * @csspart header - The row with the heading, actions and Clear all.
 * @csspart heading - The heading.
 * @csspart clear - The Clear all button, a `gw-button`.
 * @csspart list - The list of cards.
 * @csspart empty - The empty state, a `gw-empty-state`.
 *
 * @cssprop --gw-notification-center-gap - The space between the cards. Defaults to `--gw-space-2`.
 * @cssprop --gw-notification-center-clear-scale - Scales Clear all, around 1 for medium. Defaults to `0.8`, small.
 *
 * @fires {Event} clear - When Clear all is pressed.
 */
export class GwNotificationCenter extends GwElement {
  static override properties = {
    heading: {},
    clearLabel: { attribute: "clear-label" },
    emptyHeading: { attribute: "empty-heading" },
    emptyText: { attribute: "empty-text" },
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

      .clear {
        --gw-button-scale: var(--gw-notification-center-clear-scale, 0.8);
      }

      h2 {
        flex: 1;
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .list {
        display: grid;
        gap: var(--gw-notification-center-gap, var(--gw-space-2));
      }

      [hidden] {
        display: none;
      }

      /* Through its property, so ::part(empty) can still change it */
      gw-empty-state {
        --gw-empty-state-padding: var(--gw-space-6) var(--gw-space-3);
      }
    `,
  ];

  declare heading: string;
  declare clearLabel: string;
  declare emptyHeading: string;
  declare emptyText: string;

  readonly #heading = h("h2", { part: "heading" });

  readonly #clear = h("gw-button", {
    class: "clear",
    part: "clear",
    variant: "neutral",
    appearance: "plain",
  });

  readonly #list = h(
    "div",
    { class: "list", part: "list", role: "list" },
    h("slot"),
  );

  readonly #emptyText = h("p");

  readonly #empty = h(
    "gw-empty-state",
    { icon: emptyIcon, part: "empty" },
    this.#emptyText,
  );

  // An app's own empty view replaces the default through the slot
  readonly #emptySlot = h("slot", { name: "empty" }, this.#empty);

  readonly #body = h("div", {}, this.#list, this.#emptySlot);

  #observer: MutationObserver | undefined;

  constructor() {
    super();
    this.heading = "Notifications";
    this.clearLabel = "Clear all";
    this.emptyHeading = "You're all caught up";
    this.emptyText = "New notifications show up here.";
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
    this.#emptySlot.hidden = !empty;
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
    root.append(
      h(
        "header",
        { part: "header" },
        this.#heading,
        h("slot", { name: "actions" }),
        this.#clear,
      ),
      this.#body,
    );
  }

  protected override update() {
    this.#heading.textContent = this.heading;
    this.#clear.textContent = this.clearLabel;
    this.#empty.setAttribute("heading", this.emptyHeading);
    this.#emptyText.textContent = this.emptyText;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-notification-center": GwNotificationCenter;
  }
}
