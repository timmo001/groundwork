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
 * For a link the page's HTML has to carry, such as one with a `target` or
 * `rel`, put an `<a>` in the `heading` slot instead of `href`. A click
 * anywhere on the card that isn't on another control follows it, the card
 * shows the link's hover and focus, and the link stays a real one in the
 * page, so the rest of the card's content stays plain text.
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
 * @slot heading - The heading, in place of `heading`. An `<a>` here makes the whole card follow it.
 * @slot actions - Buttons beside the heading.
 *
 * @csspart card - The card's surface.
 * @csspart header - The row with the heading and actions.
 * @csspart heading - The heading.
 * @csspart body - The content.
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

      a.card:hover,
      .card.linked:hover {
        border-color: var(--gw-color-border-accent);
      }

      /* A card following a link in its heading slot */
      .card.linked {
        cursor: pointer;
        transition: border-color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      .card.focused {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      ::slotted([slot="heading"]) {
        font: inherit;
        color: inherit;
      }

      ::slotted(a[slot="heading"]) {
        text-decoration: none;
        outline: none;
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

  readonly #headingSlot = h("slot", { name: "heading" });

  readonly #header = h(
    "header",
    { part: "header" },
    h(
      "h2",
      { part: "heading" },
      this.#title,
      this.#headingSlot,
      this.#titleSkeleton,
    ),
    h("slot", { name: "actions" }),
  );

  readonly #skeleton = h("gw-skeleton-lines");

  readonly #body = h("div", { class: "body", part: "body" }, h("slot"));

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

    // A click on the card, but not on another control in it, follows the
    // link in the heading slot
    this.addEventListener("click", (event) => {
      const link = this.#link();

      if (link === null || this.loading) return;

      const path = event.composedPath();
      const own = path.slice(0, path.indexOf(this));

      if (
        own.some(
          (node) =>
            node instanceof HTMLElement &&
            node.matches(
              "a, button, input, select, textarea, label, [tabindex], gw-button",
            ),
        )
      ) {
        return;
      }

      // Selecting text in the card shouldn't open the link
      if (getSelection()?.toString()) return;

      link.click();
    });

    const focus = () => {
      this.#card.classList.toggle(
        "focused",
        this.#link()?.matches(":focus-visible") === true,
      );
    };

    this.addEventListener("focusin", focus);
    this.addEventListener("focusout", focus);

    this.#headingSlot.addEventListener("slotchange", () => {
      this.requestUpdate("heading");
    });
  }

  /** The `<a>` in the heading slot, or holding it, when there is one. */
  #link(): HTMLAnchorElement | null {
    const heading = this.querySelector(":scope > [slot='heading']");

    if (heading instanceof HTMLAnchorElement) return heading;

    return heading?.querySelector("a") ?? null;
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

    const slotted = this.querySelector(":scope > [slot='heading']") !== null;

    this.#card.classList.toggle("linked", this.#link() !== null && !this.href);
    this.#title.textContent = this.heading;
    this.#titleSkeleton.hidden =
      this.heading !== "" || slotted || !this.loading;
    this.#header.hidden = !this.heading && !slotted && !this.loading;
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
