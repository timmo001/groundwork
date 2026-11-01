/**
 * `gw-spinner`: a spinning ring, for waits a skeleton can't stand in for.
 * Docs: https://groundwork.timmo.dev/components/feedback/#spinner
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A spinning ring while something loads, announced by its `label`.
 *
 * @element gw-spinner
 * @summary A spinning ring for a wait a skeleton can't stand in for.
 *
 * @attr {string} label - What's loading, for assistive technology. Defaults to `Loading`.
 *
 * @csspart ring - The spinning ring.
 *
 * @cssprop --gw-spinner-size - The ring's size. Defaults to `1.25rem`.
 */
export class GwSpinner extends GwElement {
  static override properties = {
    label: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        width: var(--gw-spinner-size, 1.25rem);
        height: var(--gw-spinner-size, 1.25rem);
        color: var(--gw-color-accent);
      }

      .ring {
        width: 100%;
        height: 100%;
        border: 2px solid var(--gw-color-border-quiet);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
    `,
  ];

  declare label: string;

  readonly #label = h("span", { class: "label" });

  constructor() {
    super();
    this.label = "Loading";
  }

  protected override create(root: ShadowRoot) {
    root.append(
      h("span", { class: "ring", part: "ring", role: "status" }, this.#label),
    );
  }

  protected override update() {
    this.#label.textContent = this.label;
  }
}

GwSpinner.define("gw-spinner");

declare global {
  interface HTMLElementTagNameMap {
    "gw-spinner": GwSpinner;
  }
}
