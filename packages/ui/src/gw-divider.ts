/**
 * `gw-divider`: a line between groups of controls or content.
 * Docs: https://groundwork.timmo.dev/components/layout/#divider
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A 1px line between two groups that act on different things, such as a
 * camera's Home button and its presets. Across a stack by default, like
 * `<hr>`; `vertical` stands it between groups in a row, centered and
 * shorter than the controls beside it, with `--gw-space-1` on each side, so
 * a row with the gap between controls (`--gw-space-2`) has `--gw-space-3`
 * either side of the line. It's a `separator` for assistive technology.
 *
 * @element gw-divider
 * @summary A line between groups.
 *
 * @attr {"horizontal"|"vertical"} orientation - Which way the line runs. Defaults to `horizontal`.
 *
 * @cssprop --gw-divider-color - The line's color. Defaults to `--gw-color-border-quiet`.
 * @cssprop --gw-divider-length - A vertical line's height, never more than the row's. Defaults to `1.25rem`.
 *
 * @csspart line - The line.
 */
export class GwDivider extends GwElement {
  static override properties = {
    orientation: { reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      /* The line is drawn inside, as a page's resets, such as
         \`* { border: 0; margin: 0 }\`, beat the host's own styles. A border
         rather than a fill, so it stays in forced colors */
      :host {
        display: block;
        flex: none;
        align-self: stretch;
      }

      .line {
        display: block;
        border: 0 solid var(--gw-divider-color, var(--gw-color-border-quiet));
        border-block-start-width: 1px;
      }

      :host([orientation="vertical"]) {
        display: inline-block;
        align-self: center;
        block-size: var(--gw-divider-length, 1.25rem);
        max-block-size: 100%;
        vertical-align: middle;
      }

      :host([orientation="vertical"]) .line {
        block-size: 100%;
        margin-inline: var(--gw-space-1);
        border-block-start-width: 0;
        border-inline-start-width: 1px;
      }
    `,
  ];

  declare orientation: "horizontal" | "vertical";

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.orientation = "horizontal";
    this.#internals.role = "separator";
  }

  protected override create(root: ShadowRoot) {
    root.append(h("span", { class: "line", part: "line" }));
  }

  protected override update() {
    this.#internals.ariaOrientation =
      this.orientation === "vertical" ? "vertical" : "horizontal";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-divider": GwDivider;
  }
}
