import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import "./gw-skeleton.js";
import { animateHeight } from "./motion.js";
import { base } from "./styles.js";

/**
 * A surface for one group of content, with an optional heading and actions.
 * With `href` the whole card is a link. While `loading`, lines of skeleton
 * stand in for the content, and for the heading until it's known.
 */
export class GwCard extends LitElement {
  static override properties = {
    heading: {},
    href: {},
    flush: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    lines: { type: Number },
  };

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
    `,
  ];

  declare heading: string;
  declare href: string;
  declare flush: boolean;
  declare loading: boolean;
  /** How many lines of skeleton stand in for the content while loading. */
  declare lines: number;

  constructor() {
    super();
    this.heading = "";
    this.href = "";
    this.flush = false;
    this.loading = false;
    this.lines = 3;
  }

  #before = 0;

  override willUpdate(changed: PropertyValues<this>) {
    if (this.hasUpdated && changed.has("loading")) {
      this.#before = this.offsetHeight;
    }
  }

  override updated(changed: PropertyValues<this>) {
    if (changed.has("loading") && this.#before > 0) {
      animateHeight(this, this.#before);
      this.#before = 0;
    }
  }

  override render() {
    const heading = this.heading
      ? html`<h2>${this.heading}</h2>`
      : this.loading
        ? html`<h2><gw-skeleton-text></gw-skeleton-text></h2>`
        : nothing;

    const content = html`
      ${
        heading === nothing
          ? nothing
          : html`<header>
              ${heading}
              <slot name="actions"></slot>
            </header>`
      }
      ${
        this.loading
          ? html`<gw-skeleton-lines lines=${this.lines}></gw-skeleton-lines>`
          : html`<slot></slot>`
      }
    `;

    const busy = this.loading ? "true" : nothing;

    return this.href
      ? html`<a class="card" part="card" href=${this.href} aria-busy=${busy}
          >${content}</a
        >`
      : html`<section class="card" part="card" aria-busy=${busy}>
          ${content}
        </section>`;
  }
}

customElements.define("gw-card", GwCard);

declare global {
  interface HTMLElementTagNameMap {
    "gw-card": GwCard;
  }
}
