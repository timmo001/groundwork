/**
 * `gw-setting-row`: a setting's name and description beside its control.
 * Docs: https://groundwork.timmo.dev/components/inputs/#setting-row
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import { base, controlSizes } from "./styles.js";

/**
 * A setting: its name and description on one side, its control on the
 * other. A wide control drops under the text when there isn't room. Rows
 * after the first in their parent get a line above them. While `loading`, a
 * skeleton stands in for the control, and for the text until it's known.
 *
 * @element gw-setting-row
 * @summary A setting's name and description beside its control.
 *
 * @attr {string} heading - The setting's name.
 * @attr {string} description - What it does.
 * @attr {boolean} loading - Shows skeletons for the control and any unknown text.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The text and spacing size. Defaults to `medium`.
 *
 * @slot - The control.
 *
 * @csspart row - The row.
 *
 * @cssprop --gw-row-padding - The padding above and below. Defaults to `--gw-space-2`.
 * @cssprop --gw-setting-row-scale - Scales the text and spacing, around 1 for medium.
 */
export class GwSettingRow extends GwElement {
  static override properties = {
    heading: {},
    description: {},
    loading: { type: "boolean", reflect: true },
    size: { reflect: true },
  } as const;

  static override styles = [
    base,
    controlSizes("setting-row"),
    css`
      :host {
        --gw-size: var(--gw-setting-row-scale, 1);

        display: block;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--gw-space-1) * var(--gw-size))
          calc(var(--gw-space-3) * var(--gw-size));
        align-items: center;
        justify-content: space-between;
        padding: var(--gw-row-padding, calc(var(--gw-space-2) * var(--gw-size)))
          0;
      }

      /* A full line even in themes without borders, since it separates rows */
      :host(:not(:first-of-type)) .row {
        border-block-start: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-quiet);
      }

      .text {
        flex: 1 1 12rem;
        min-width: 0;
      }

      .heading {
        font-size: max(
          var(--gw-font-size-xs),
          calc(var(--gw-font-size-s) * var(--gw-size))
        );
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .description {
        font-size: max(
          var(--gw-font-size-2xs),
          calc(var(--gw-font-size-xs) * var(--gw-size))
        );
        color: var(--gw-color-text-secondary);
      }

      .control {
        max-width: 100%;
      }

      .control-skeleton {
        width: 3.25rem;
        min-height: 0;
        height: 2rem;
        --gw-skeleton-radius: var(--gw-radius-pill);
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare loading: boolean;
  declare size: "xs" | "small" | "medium" | "large" | "xl";

  readonly #row = h("div", { class: "row", part: "row" });

  readonly #heading = h("span");

  readonly #headingSkeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 8rem",
  });

  readonly #description = h("div", { class: "description" });

  readonly #descriptionSkeleton: HTMLDivElement = h(
    "div",
    { class: "description" },
    h("gw-skeleton-text", { style: "--gw-skeleton-width: 12rem" }),
  );

  readonly #slot = h("slot");

  readonly #controlSkeleton = h("gw-skeleton", { class: "control-skeleton" });

  readonly #control = h(
    "div",
    { class: "control" },
    this.#controlSkeleton,
    this.#slot,
  );

  #rendered = false;

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.loading = false;
    this.size = "medium";
  }

  protected override create(root: ShadowRoot) {
    this.#row.append(
      h(
        "div",
        { class: "text" },
        h("div", { class: "heading" }, this.#heading, this.#headingSkeleton),
        this.#description,
        this.#descriptionSkeleton,
      ),
      this.#control,
    );
    root.append(this.#row);
  }

  protected override update(changed: ReadonlySet<string>) {
    setAttribute(this.#row, "aria-busy", this.loading ? "true" : null);
    this.#heading.textContent = this.heading;
    this.#headingSkeleton.hidden = !this.loading || this.heading !== "";
    this.#description.textContent = this.description;
    this.#description.hidden = !this.description;
    this.#descriptionSkeleton.hidden =
      !this.loading || this.heading !== "" || this.description !== "";
    this.#controlSkeleton.hidden = !this.loading;
    this.#slot.hidden = this.loading;

    if (this.#rendered && changed.has("loading") && !this.loading) {
      fadeIn(this.#control);
    }

    this.#rendered = true;
  }
}

GwSettingRow.define("gw-setting-row");

declare global {
  interface HTMLElementTagNameMap {
    "gw-setting-row": GwSettingRow;
  }
}
