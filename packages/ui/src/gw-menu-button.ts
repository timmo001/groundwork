import { LitElement, css, html } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { base } from "./styles.js";

/**
 * A button that opens a menu on the Popover API, so it shows in the top
 * layer and closes on Esc or a click outside. Slot `<button>` elements as
 * its items: arrow keys, Home and End move between them, and choosing one
 * fires `select` with its `value` and closes the menu.
 */
export class GwMenuButton extends LitElement {
  static override properties = {
    label: {},
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
        min-height: 2.25rem;
        padding: 0 var(--gw-space-4);
        font: inherit;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        cursor: pointer;
        background: var(--gw-color-fill-neutral-resting);
        border: var(--gw-border-width) solid var(--gw-border-colour);
        border-radius: var(--gw-radius-control);
        anchor-name: --gw-menu;
      }

      .trigger:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .chevron {
        width: 0.5rem;
        height: 0.5rem;
        border-inline-end: 2px solid currentColor;
        border-block-end: 2px solid currentColor;
        rotate: 45deg;
        translate: 0 -0.125rem;
      }

      [popover] {
        position-anchor: --gw-menu;
        inset: auto;
        top: anchor(bottom);
        left: anchor(left);
        min-width: 12rem;
        padding: var(--gw-space-1);
        margin: var(--gw-space-1) 0 0;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-overlay);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-control);
        box-shadow: var(--gw-shadow-m);
        position-try-fallbacks: flip-block, flip-inline;
      }

      [popover]:popover-open {
        display: flex;
        flex-direction: column;
      }

      ::slotted(button) {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        padding: var(--gw-space-2) var(--gw-space-3);
        font: inherit;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        text-align: start;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-radius: var(--gw-radius-s);
      }

      ::slotted(button:hover),
      ::slotted(button:focus-visible) {
        background: var(--gw-color-fill-neutral-hovered);
        outline: none;
      }
    `,
  ];

  declare label: string;
  declare expanded: boolean;

  constructor() {
    super();
    this.label = "";
    this.expanded = false;
  }

  readonly #popover = createRef<HTMLElement>();

  readonly #trigger = createRef<HTMLButtonElement>();

  get #items() {
    return [...this.children].flatMap((child) =>
      child instanceof HTMLButtonElement && !child.disabled ? [child] : [],
    );
  }

  override firstUpdated() {
    for (const child of this.children) {
      if (child instanceof HTMLButtonElement) {
        child.setAttribute("role", "menuitem");
      }
    }
  }

  readonly #onToggle = (event: ToggleEvent) => {
    this.expanded = event.newState === "open";

    if (this.expanded) this.#items[0]?.focus();
  };

  readonly #onKeydown = (event: KeyboardEvent) => {
    const items = this.#items;
    const index = items.findIndex((item) => item === document.activeElement);

    const next = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key];

    if (next === undefined) return;

    event.preventDefault();
    items[next]?.focus();
  };

  readonly #onClick = (event: Event) => {
    const item = event.target;

    if (!(item instanceof HTMLButtonElement)) return;

    this.dispatchEvent(
      new CustomEvent("select", {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      }),
    );

    this.#popover.value?.hidePopover();
    this.#trigger.value?.focus();
  };

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
        @click=${this.#onClick}
      >
        <slot></slot>
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
