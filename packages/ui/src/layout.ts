/**
 * `gw-page`, `gw-stack`, `gw-row` and `gw-grid`: page width and spacing.
 * Docs: https://groundwork.timmo.dev/components/layout/#stack-row-and-grid
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * Layout: `gw-page` centers a page's content at
 * the theme's width, `gw-stack` stacks its children, `gw-row` lines them up
 * and `gw-grid` fills columns at least `--gw-grid-min` wide.
 */
export class GwPage extends GwElement {
  static override properties = {
    narrow: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .page {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-6);
        width: 100%;
        max-width: var(--gw-content-width);
        margin-inline: auto;
      }

      :host([narrow]) .page {
        max-width: var(--gw-content-width-narrow);
      }
    `,
  ];

  declare narrow: boolean;

  constructor() {
    super();
    this.narrow = false;
  }

  protected override create(root: ShadowRoot) {
    root.append(h("div", { class: "page", part: "page" }, h("slot")));
  }
}

const gaps = css`
  :host([gap="s"]) {
    --gw-gap: var(--gw-space-1);
  }

  :host([gap="l"]) {
    --gw-gap: var(--gw-space-6);
  }
`;

/** A layout element whose shadow root is a single slot. */
class GwSlotted extends GwElement {
  protected override create(root: ShadowRoot) {
    root.append(h("slot"));
  }
}

export class GwStack extends GwSlotted {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--gw-gap, var(--gw-space-3));
      }
    `,
  ];
}

export class GwRow extends GwSlotted {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-gap, var(--gw-space-2));
        align-items: center;
      }

      :host([nowrap]) {
        flex-wrap: nowrap;
      }
    `,
  ];
}

export class GwGrid extends GwSlotted {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(min(100%, var(--gw-grid-min, 18rem)), 1fr)
        );
        gap: var(--gw-gap, var(--gw-space-3));
      }
    `,
  ];
}

GwPage.define("gw-page");

GwStack.define("gw-stack");

GwRow.define("gw-row");

GwGrid.define("gw-grid");

declare global {
  interface HTMLElementTagNameMap {
    "gw-page": GwPage;
    "gw-stack": GwStack;
    "gw-row": GwRow;
    "gw-grid": GwGrid;
  }
}
