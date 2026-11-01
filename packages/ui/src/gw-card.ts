/**
 * `gw-card`: a surface for one group of content.
 * Docs: https://groundwork.timmo.dev/components/display/#card
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { animateHeight, fadeIn } from "./motion.js";
import { base } from "./styles.js";

/**
 * A surface for one group of content, with an optional heading and actions.
 * With `href` the whole card is a link. While `loading`, lines of skeleton
 * stand in for the content, and for the heading until it's known. The card
 * glides to its new height and the content fades in once it's loaded.
 *
 * @element gw-card
 * @summary A surface for one group of content, or a link to more.
 *
 * @attr {string} heading - The card's heading.
 * @attr {string} href - Makes the whole card a link to this address.
 * @attr {boolean} flush - Drops the padding, for content that runs to the edges.
 * @attr {boolean} loading - Shows skeleton lines for the content and any unknown heading.
 * @attr {number} lines - How many skeleton lines while loading. Defaults to 3.
 *
 * @slot - The content.
 * @slot actions - Buttons beside the heading.
 *
 * @csspart card - The card's surface.
 */
export class GwCard extends GwElement {
  static override properties = {
    heading: {},
    href: {},
    flush: { type: "boolean", reflect: true },
    loading: { type: "boolean", reflect: true },
    lines: { type: "number" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .card {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-3);
        height: 100%;
        padding: var(--gw-space-4);
        color: inherit;
        text-decoration: none;
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        box-shadow: var(--gw-shadow-s);
      }

      :host([flush]) .card {
        padding: 0;
        overflow: hidden;
      }

      a.card {
        transition: border-color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      a.card:hover {
        border-color: var(--gw-color-border-accent);
      }

      header {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
      }

      h2 {
        flex: 1;
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .body:not([hidden]) {
        display: flex;
        flex-direction: column;
        gap: inherit;
      }
    `,
  ];

  declare heading: string;
  declare href: string;
  declare flush: boolean;
  declare loading: boolean;
  /** How many lines of skeleton stand in for the content while loading. */
  declare lines: number;

  readonly #title = h("span");

  readonly #titleSkeleton = h("gw-skeleton-text");

  readonly #header = h(
    "header",
    {},
    h("h2", {}, this.#title, this.#titleSkeleton),
    h("slot", { name: "actions" }),
  );

  readonly #skeleton = h("gw-skeleton-lines");

  readonly #body = h("div", { class: "body" }, h("slot"));

  #card: HTMLElement = h("section", { class: "card", part: "card" });

  #wasLoading = false;

  #rendered = false;

  constructor() {
    super();
    this.heading = "";
    this.href = "";
    this.flush = false;
    this.loading = false;
    this.lines = 3;
  }

  protected override create(root: ShadowRoot) {
    this.#card.append(this.#header, this.#skeleton, this.#body);
    root.append(this.#card);
  }

  protected override update(changed: ReadonlySet<string>) {
    const animate =
      changed.has("loading") &&
      this.#rendered &&
      this.#wasLoading !== this.loading;

    const before = animate ? this.offsetHeight : 0;

    if (
      changed.has("href") &&
      (this.#card.tagName === "A") !== Boolean(this.href)
    ) {
      const next = this.href
        ? h("a", { class: "card", part: "card" })
        : h("section", { class: "card", part: "card" });

      next.append(...this.#card.childNodes);
      this.#card.replaceWith(next);
      this.#card = next;
    }

    if (this.#card instanceof HTMLAnchorElement) this.#card.href = this.href;

    setAttribute(this.#card, "aria-busy", this.loading ? "true" : null);
    this.#title.textContent = this.heading;
    this.#titleSkeleton.hidden = this.heading !== "" || !this.loading;
    this.#header.hidden = !this.heading && !this.loading;
    this.#skeleton.lines = this.lines;
    this.#skeleton.hidden = !this.loading;
    this.#body.hidden = this.loading;

    if (animate) {
      animateHeight(this, before);

      if (!this.loading) fadeIn(this.#body);
    }

    this.#wasLoading = this.loading;
    this.#rendered = true;
  }
}

GwCard.define("gw-card");

declare global {
  interface HTMLElementTagNameMap {
    "gw-card": GwCard;
  }
}
