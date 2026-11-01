/**
 * `gw-section-title`: a heading for a section of a page.
 * Docs: https://groundwork.timmo.dev/components/layout/#page-header-and-section-title
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A small heading between groups on a page, as an `<h2>` unless `level` says otherwise.
 *
 * @element gw-section-title
 * @summary A heading for a section of a page.
 *
 * @attr {number} level - The heading level. Defaults to 2.
 *
 * @slot - The heading text.
 * @slot actions - Buttons at the end of the row.
 *
 * @csspart heading - The heading.
 */
export class GwSectionTitle extends GwElement {
  static override properties = {
    level: { type: "number" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
      }

      [role="heading"] {
        flex: 1;
        margin: 0;
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ];

  declare level: number;

  readonly #heading = h("div", { role: "heading", part: "heading" }, h("slot"));

  constructor() {
    super();
    this.level = 2;
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#heading, h("slot", { name: "actions" }));
  }

  protected override update() {
    this.#heading.setAttribute("aria-level", String(this.level));
  }
}

GwSectionTitle.define("gw-section-title");

declare global {
  interface HTMLElementTagNameMap {
    "gw-section-title": GwSectionTitle;
  }
}
