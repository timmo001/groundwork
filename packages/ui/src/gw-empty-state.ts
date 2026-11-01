/**
 * `gw-empty-state`: what a list or page shows when there's nothing in it.
 * Docs: https://groundwork.timmo.dev/components/feedback/#empty-state
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

/**
 * What a list or page shows when there's nothing in it, or nothing to do:
 * an icon, a heading, a line of text and an optional action.
 */
export class GwEmptyState extends GwElement {
  static override properties = {
    icon: {},
    heading: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .empty {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-1);
        align-items: center;
        justify-content: center;
        padding: var(--gw-space-12) var(--gw-space-3);
        color: var(--gw-color-text-secondary);
        text-align: center;
        --gw-icon-size: 2.5rem;
      }

      h2 {
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      ::slotted(p) {
        margin: 0;
      }

      ::slotted([slot="actions"]) {
        margin-block-start: var(--gw-space-2);
      }
    `,
  ];

  declare icon: string;
  declare heading: string;

  readonly #icon = createIcon("");

  readonly #heading = h("h2");

  constructor() {
    super();
    this.icon = "";
    this.heading = "";
  }

  protected override create(root: ShadowRoot) {
    root.append(
      h(
        "div",
        { class: "empty", part: "empty" },
        this.#icon,
        this.#heading,
        h("slot"),
        h("slot", { name: "actions" }),
      ),
    );
  }

  protected override update() {
    setIconPath(this.#icon, this.icon);
    this.#icon.toggleAttribute("hidden", !this.icon);
    this.#heading.textContent = this.heading;
    this.#heading.hidden = !this.heading;
  }
}

GwEmptyState.define("gw-empty-state");

declare global {
  interface HTMLElementTagNameMap {
    "gw-empty-state": GwEmptyState;
  }
}
