/**
 * `gw-page`, `gw-stack`, `gw-row` and `gw-grid`: page width and spacing.
 * Docs: https://groundwork.timmo.dev/components/layout/#stack-row-and-grid
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * Centers a page's content at the theme's width, with the page gap between
 * its children.
 *
 * @element gw-page
 * @summary A page's content column.
 *
 * @attr {boolean} narrow - Uses the narrow content width, for forms and settings.
 *
 * @slot - The page's content.
 *
 * @csspart page - The content column.
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
        /* The same box as gw-app-bar's content, so the two line up */
        width: min(100% - 2 * var(--gw-space-3), var(--gw-content-width));
        margin-inline: auto;
      }

      :host([narrow]) .page {
        width: min(
          100% - 2 * var(--gw-space-3),
          var(--gw-content-width-narrow)
        );
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

/**
 * Stacks its children in a column.
 *
 * @element gw-stack
 * @summary Children in a column.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 *
 * @slot - The children.
 *
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-3`.
 */
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

/**
 * Lines its children up in a row, wrapping when they run out of room.
 *
 * @element gw-row
 * @summary Children in a wrapping row.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 * @attr {boolean} nowrap - Keeps the children on one line.
 *
 * @slot - The children.
 *
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-2`.
 */
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

/**
 * Fills as many columns as fit, each at least `--gw-grid-min` wide, and at
 * most `max` of them when it's set.
 *
 * @element gw-grid
 * @summary Children in responsive columns.
 *
 * @attr {"s"|"l"} gap - A smaller or larger gap.
 * @attr {"2"|"3"|"4"|"5"|"6"} max - The most columns it shows. Sets `--gw-grid-max`.
 *
 * @slot - The children.
 *
 * @cssprop --gw-grid-min - The narrowest a column gets. Defaults to `18rem`.
 * @cssprop --gw-grid-max - The most columns it shows, as a number. Unset by default, so as many fit as the width allows.
 * @cssprop --gw-gap - The gap. Defaults to `--gw-space-3`.
 */
export class GwGrid extends GwSlotted {
  static override styles = [
    base,
    gaps,
    css`
      :host {
        /* A column's width at the cap. Invalid while --gw-grid-max is unset,
           so the var() below falls back to 0px and the cap does nothing */
        --_gw-grid-cap: calc(
          (100% - (var(--gw-grid-max) - 1) * var(--gw-gap, var(--gw-space-3))) /
            var(--gw-grid-max)
        );
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(
            min(100%, max(var(--gw-grid-min, 18rem), var(--_gw-grid-cap, 0px))),
            1fr
          )
        );
        gap: var(--gw-gap, var(--gw-space-3));
      }

      :host([max="2"]) {
        --gw-grid-max: 2;
      }

      :host([max="3"]) {
        --gw-grid-max: 3;
      }

      :host([max="4"]) {
        --gw-grid-max: 4;
      }

      :host([max="5"]) {
        --gw-grid-max: 5;
      }

      :host([max="6"]) {
        --gw-grid-max: 6;
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
