/**
 * `gw-page-header`: a page's title, icon, description and actions.
 * Docs: https://groundwork.timmo.dev/components/layout/#page-header-and-section-title
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

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
 * @attr {number} level - The heading level, 1 to 6. Defaults to 1. From 2 the header is smaller, for a section of a page that reads like a page of its own.
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
    level: { type: "number", reflect: true },
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
        flex: 0 1 auto;
        flex-direction: column;
        gap: var(--gw-space-0-5);
        min-width: 0;
      }

      :host(:not([level="1"])) .tile {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--gw-radius-m);
        --gw-icon-size: 1.375rem;
      }

      :host(:not([level="1"])) .heading {
        font-size: var(--gw-font-size-l);
      }

      :host(:not([level="1"])) .tile:not([hidden]) ~ .actions {
        min-height: 2.5rem;
      }

      .heading {
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

      /* Takes the room the titles leave, and gives it up before them, down
         to its items' smallest */
      .actions {
        display: flex;
        flex: 1 1000 auto;
        gap: var(--gw-space-1);
        align-items: center;
        justify-content: flex-end;
      }

      /* Centered on the tile when there is one */
      .tile:not([hidden]) ~ .actions {
        min-height: 3rem;
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare icon: string;
  /** The heading level, 1 to 6. */
  declare level: number;

  readonly #icon = createIcon("");

  readonly #startSlot = h("slot", { name: "start" });

  // Centered on the tile's height, and out of the row while it's empty
  readonly #start = h("div", { class: "start", hidden: true }, this.#startSlot);

  readonly #tile = h("span", { class: "tile", part: "tile" }, this.#icon);

  #heading: HTMLHeadingElement = h("h1", { class: "heading", part: "heading" });

  readonly #description = h("p", { part: "description" });

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.icon = "";
    this.level = 1;
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
    const level = Math.min(6, Math.max(1, Math.round(this.level) || 1));
    const tag = headingTags[level - 1] ?? "h1";

    if (this.#heading.localName !== tag) {
      const next = h(tag, {
        class: "heading",
        part: "heading",
      });

      this.#heading.replaceWith(next);
      this.#heading = next;
    }

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
