import { GwElement, css, h } from "./element.js";
import { base } from "./styles.js";

/**
 * A heading that opens and closes the content under it, on a native
 * `<details>`, so find-in-page and the keyboard work as they do anywhere. The
 * content glides open and shut rather than jumping, and the chevron turns
 * with it. `open` reflects its state and it fires `toggle`.
 */
export class GwExpansion extends GwElement {
  static override properties = {
    heading: {},
    description: {},
    open: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        interpolate-size: allow-keywords;
      }

      details {
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
      }

      details::details-content {
        block-size: 0;
        overflow: clip;
        transition:
          block-size var(--gw-motion-normal) var(--gw-motion-easing),
          content-visibility var(--gw-motion-normal) allow-discrete;
      }

      details[open]::details-content {
        block-size: auto;
      }

      summary {
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        min-height: 3rem;
        padding: var(--gw-space-2) var(--gw-space-4);
        cursor: pointer;
        list-style: none;
        border-radius: calc(var(--gw-radius-panel) - var(--gw-border-width));
        user-select: none;
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          border-radius var(--gw-motion-normal) var(--gw-motion-easing);
      }

      summary::-webkit-details-marker {
        display: none;
      }

      details[open] summary {
        border-end-start-radius: 0;
        border-end-end-radius: 0;
      }

      summary:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      summary:active {
        background: var(--gw-color-fill-neutral-pressed);
      }

      summary:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      .text {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gw-space-0-5);
      }

      .heading {
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .description {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }

      /* The chevron sits in a round neutral button, so the heading reads as
         something to press */
      .toggle {
        display: grid;
        flex: none;
        place-items: center;
        width: 2rem;
        height: 2rem;
        background: var(--gw-color-fill-neutral-resting);
        border-radius: 50%;
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
      }

      summary:hover .toggle {
        background: var(--gw-color-fill-neutral-pressed);
      }

      summary:active .toggle {
        background: var(--gw-color-fill-neutral-selected);
      }

      .chevron {
        width: 0.45rem;
        height: 0.45rem;
        border-inline-end: 1.5px solid var(--gw-color-text-primary);
        border-block-end: 1.5px solid var(--gw-color-text-primary);
        rotate: 45deg;
        translate: 0 -0.125rem;
        transition:
          rotate var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      details[open] .chevron {
        rotate: 225deg;
        translate: 0 0.125rem;
      }

      .content {
        padding: var(--gw-space-3) var(--gw-space-4) var(--gw-space-4);
        border-block-start: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
        font-size: var(--gw-font-size-s);
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare open: boolean;

  readonly #heading = h("span", { class: "heading" });

  readonly #description = h("span", { class: "description" });

  readonly #details = h(
    "details",
    { part: "details" },
    h(
      "summary",
      { part: "summary" },
      h("slot", { name: "icon" }),
      h("span", { class: "text" }, this.#heading, this.#description),
      h(
        "span",
        { class: "toggle", "aria-hidden": "true" },
        h("span", { class: "chevron" }),
      ),
    ),
    h("div", { class: "content", part: "content" }, h("slot")),
  );

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.open = false;
  }

  readonly #onToggle = () => {
    this.open = this.#details.open;
    this.dispatchEvent(new Event("toggle", { bubbles: true, composed: true }));
  };

  protected override create(root: ShadowRoot) {
    this.#details.addEventListener("toggle", this.#onToggle);
    root.append(this.#details);
  }

  protected override update() {
    this.#details.open = this.open;
    this.#heading.textContent = this.heading;
    this.#description.textContent = this.description;
    this.#description.hidden = !this.description;
  }
}

GwExpansion.define("gw-expansion");

declare global {
  interface HTMLElementTagNameMap {
    "gw-expansion": GwExpansion;
  }
}
