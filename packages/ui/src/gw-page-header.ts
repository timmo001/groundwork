/**
 * `gw-page-header`: a page's title, icon, description and actions.
 * Docs: https://groundwork.timmo.dev/components/layout/#page-header-and-section-title
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

/**
 * A page's title, with an optional icon tile and description, and its
 * controls at the top right in the `actions` slot.
 */
export class GwPageHeader extends GwElement {
  static override properties = {
    heading: {},
    description: {},
    icon: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        gap: var(--gw-space-3);
        align-items: flex-start;
      }

      .tile {
        display: grid;
        flex: none;
        place-items: center;
        width: 3rem;
        height: 3rem;
        color: var(--gw-color-accent);
        background: var(--gw-color-fill-accent-quiet);
        border-radius: var(--gw-radius-l);
        --gw-icon-size: 1.625rem;
      }

      .titles {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gw-space-0-5);
        min-width: 0;
      }

      h1 {
        margin: 0;
        font-size: var(--gw-font-size-2xl);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1.2;
        color: var(--gw-color-text-strong);
      }

      p {
        margin: 0;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }

      .actions {
        display: flex;
        flex: none;
        gap: var(--gw-space-1);
        align-items: center;
        margin-inline-start: auto;
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare icon: string;

  readonly #icon = createIcon("");

  readonly #tile = h("span", { class: "tile" }, this.#icon);

  readonly #heading = h("h1");

  readonly #description = h("p");

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.icon = "";
  }

  protected override create(root: ShadowRoot) {
    root.append(
      this.#tile,
      h("div", { class: "titles" }, this.#heading, this.#description),
      h("div", { class: "actions" }, h("slot", { name: "actions" })),
    );
  }

  protected override update() {
    setIconPath(this.#icon, this.icon);
    this.#tile.hidden = !this.icon;
    this.#heading.textContent = this.heading;
    this.#description.textContent = this.description;
    this.#description.hidden = !this.description;
  }
}

GwPageHeader.define("gw-page-header");

declare global {
  interface HTMLElementTagNameMap {
    "gw-page-header": GwPageHeader;
  }
}
