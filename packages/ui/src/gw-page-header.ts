/**
 * `gw-page-header`: a page's title, icon, description and actions.
 * Docs: https://groundwork.timmo.dev/components/layout/#page-header-and-section-title
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

/**
 * A page's title, with an optional icon tile and description, a back button
 * or similar in the `start` slot, and its controls at the top right in the
 * `actions` slot.
 *
 * @element gw-page-header
 * @summary A page's title, icon, description and actions.
 *
 * @attr {string} heading - The page's title.
 * @attr {string} description - A line under the title.
 * @attr {string} icon - SVG path data for the icon tile.
 *
 * @slot start - Before the icon tile, such as a back button.
 * @slot actions - The page's controls.
 *
 * @csspart tile - The icon tile.
 * @csspart heading - The title.
 * @csspart description - The line under the title.
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

      .start {
        display: flex;
        flex: none;
        align-items: center;
        min-height: 3rem;
      }

      .start[hidden] {
        display: none;
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

  readonly #startSlot = h("slot", { name: "start" });

  // Centered on the tile's height, and out of the row while it's empty
  readonly #start = h("div", { class: "start", hidden: true }, this.#startSlot);

  readonly #tile = h("span", { class: "tile", part: "tile" }, this.#icon);

  readonly #heading = h("h1", { part: "heading" });

  readonly #description = h("p", { part: "description" });

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.icon = "";
  }

  protected override create(root: ShadowRoot) {
    this.#startSlot.addEventListener("slotchange", () => {
      this.#start.hidden = this.#startSlot.assignedElements().length === 0;
    });
    root.append(
      this.#start,
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
