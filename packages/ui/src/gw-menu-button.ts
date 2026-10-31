import { LitElement, css, html, nothing } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { base, icon } from "./styles.js";

export interface MenuItem {
  readonly value: string;
  readonly label: string;
  /** A second line, such as what the item does. */
  readonly description?: string;
  /** SVG path data for an icon before the label. */
  readonly icon?: string;
  readonly disabled?: boolean;
}

/**
 * A button that opens a menu on the Popover API, so it shows in the top
 * layer and closes on Esc or a click outside. Set `items`; arrow keys, Home
 * and End move between them, and choosing one fires `select` with its
 * `value` and closes the menu.
 *
 * Contextual actions, such as "Add a schedule", go in `actions`: they stay
 * below the items as the list scrolls, so they're found without scrolling to
 * the end, and with no items the menu says `empty` above them.
 *
 * Items render inside the component, so a page's own button styles can't
 * reach them.
 */
export class GwMenuButton extends LitElement {
  static override properties = {
    label: {},
    empty: {},
    items: { type: Array },
    actions: { type: Array },
    expanded: { state: true },
  };

  static override styles = [
    base,
    css`
      :host {
        position: relative;
        display: inline-block;
        anchor-scope: --gw-menu;
      }

      .trigger {
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        height: 2.5rem;
        padding: 0 var(--gw-space-4);
        font: inherit;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        cursor: pointer;
        background: var(--gw-color-fill-neutral-resting);
        border: var(--gw-border-width) solid var(--gw-border-colour);
        border-radius: var(--gw-radius-control);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
        anchor-name: --gw-menu;
      }

      .trigger:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .chevron {
        width: 0.4rem;
        height: 0.4rem;
        margin-inline-start: var(--gw-space-1);
        border-inline-end: 1.5px solid currentColor;
        border-block-end: 1.5px solid currentColor;
        rotate: 45deg;
        translate: 0 -0.125rem;
        transition:
          rotate var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      .trigger[aria-expanded="true"] .chevron {
        rotate: 225deg;
        translate: 0 0.125rem;
      }

      [popover] {
        position-anchor: --gw-menu;
        position-try-fallbacks: flip-block, flip-inline;
        inset: auto;
        top: anchor(bottom);
        left: anchor(left);
        box-sizing: border-box;
        min-width: 15rem;
        max-height: min(24rem, 60vh);
        padding: 0;
        margin: var(--gw-space-1) 0 0;
        overflow: hidden;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-overlay);
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
        border-radius: var(--gw-radius-l);
        box-shadow: var(--gw-shadow-m);
        opacity: 0;
        translate: 0 -0.25rem;
        transition:
          opacity var(--gw-motion-fast) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      [popover]:popover-open {
        display: flex;
        flex-direction: column;
        opacity: 1;
        translate: 0 0;
      }

      @starting-style {
        [popover]:popover-open {
          opacity: 0;
          translate: 0 -0.25rem;
        }
      }

      /* The items scroll; the actions stay put below them, so "Add" is always
         in reach rather than at the end of a long list */
      .items,
      .actions {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-0-5);
        padding: var(--gw-space-1);
      }

      .items {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }

      .actions {
        border-block-start: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
      }

      .empty {
        padding: var(--gw-space-3);
        margin: 0;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }

      .item {
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        box-sizing: border-box;
        min-height: 2.5rem;
        padding: var(--gw-space-2) var(--gw-space-3);
        font: inherit;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        text-align: start;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-radius: var(--gw-radius-m);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
        --gw-icon-size: 1.125rem;
      }

      .item:hover,
      .item:focus-visible {
        background: var(--gw-color-fill-neutral-hovered);
        outline: none;
      }

      .item:focus-visible {
        box-shadow: inset 0 0 0 var(--gw-focus-width) var(--gw-color-focus);
      }

      .item:disabled {
        color: var(--gw-color-text-disabled);
        cursor: not-allowed;
        background: transparent;
      }

      .action {
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-accent);
      }

      .text {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-0-5);
      }

      .description {
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
      }
    `,
  ];

  declare label: string;
  /** What the menu says when it has no items, such as "No backups yet". */
  declare empty: string;
  declare items: readonly MenuItem[];
  declare actions: readonly MenuItem[];
  declare expanded: boolean;

  readonly #popover = createRef<HTMLElement>();

  readonly #trigger = createRef<HTMLButtonElement>();

  constructor() {
    super();
    this.label = "";
    this.empty = "Nothing here yet";
    this.items = [];
    this.actions = [];
    this.expanded = false;
  }

  /** The enabled items then actions, in the order arrow keys move through them. */
  get #buttons() {
    const popover = this.#popover.value;

    if (popover === undefined) return [];

    return [...popover.querySelectorAll("button")].filter(
      (button) => !button.disabled,
    );
  }

  readonly #onToggle = (event: ToggleEvent) => {
    this.expanded = event.newState === "open";

    if (this.expanded) this.#buttons[0]?.focus();
  };

  readonly #onKeydown = (event: KeyboardEvent) => {
    const buttons = this.#buttons;

    const index = buttons.findIndex(
      (button) => button === this.shadowRoot?.activeElement,
    );

    const next = {
      ArrowDown: (index + 1) % buttons.length,
      ArrowUp: (index - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];

    if (next === undefined) return;

    event.preventDefault();
    buttons[next]?.focus();
  };

  #choose(value: string) {
    this.dispatchEvent(
      new CustomEvent("select", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );

    this.#popover.value?.hidePopover();
    this.#trigger.value?.focus();
  }

  #renderItem(item: MenuItem, kind: "item" | "action") {
    return html`<button
      class="item ${kind === "action" ? "action" : ""}"
      role="menuitem"
      value=${item.value}
      ?disabled=${item.disabled === true}
      @click=${() => this.#choose(item.value)}
    >
      ${item.icon ? icon(item.icon) : nothing}
      <span class="text">
        <span>${item.label}</span>
        ${
          item.description
            ? html`<span class="description">${item.description}</span>`
            : nothing
        }
      </span>
    </button>`;
  }

  override render() {
    return html`
      <button
        ${ref(this.#trigger)}
        class="trigger"
        part="trigger"
        popovertarget="menu"
        aria-haspopup="menu"
        aria-expanded=${this.expanded ? "true" : "false"}
      >
        ${this.label}<span class="chevron" aria-hidden="true"></span>
      </button>
      <div
        ${ref(this.#popover)}
        id="menu"
        popover
        role="menu"
        aria-label=${this.label}
        @toggle=${this.#onToggle}
        @keydown=${this.#onKeydown}
      >
        <div class="items" role="none">
          ${
            this.items.length === 0
              ? html`<p class="empty" role="none">${this.empty}</p>`
              : this.items.map((item) => this.#renderItem(item, "item"))
          }
        </div>
        ${
          this.actions.length === 0
            ? nothing
            : html`<div class="actions" role="none">
                ${this.actions.map((item) => this.#renderItem(item, "action"))}
              </div>`
        }
      </div>
    `;
  }
}

customElements.define("gw-menu-button", GwMenuButton);

declare global {
  interface HTMLElementTagNameMap {
    "gw-menu-button": GwMenuButton;
  }
}
