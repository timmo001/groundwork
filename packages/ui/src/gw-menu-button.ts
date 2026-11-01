/**
 * `gw-menu-button`: a button that opens a menu of items and actions.
 * Docs: https://groundwork.timmo.dev/components/actions/#menu-button
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { base, controlSizes, createIcon, setIconPath } from "./styles.js";

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
 *
 * @element gw-menu-button
 * @summary A button that opens a menu of items and actions.
 *
 * @attr {string} label - The trigger's text.
 * @attr {string} icon - SVG path data for an icon before the trigger's text.
 * @attr {string} empty - What the menu says with no items. Defaults to `Nothing here yet`.
 * @attr {MenuItem[]} items - The items, as JSON.
 * @attr {MenuItem[]} actions - Actions pinned under the items, as JSON.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The trigger's size, 24 to 56px tall. Defaults to `medium`.
 *
 * @csspart trigger - The button that opens the menu.
 *
 * @cssprop --gw-menu-button-scale - Scales the trigger, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icon with the theme's density. The theme sets it.
 *
 * @fires {CustomEvent<{ value: string }>} select - When an item or action is chosen, with its `value` in `detail`.
 */
export class GwMenuButton extends GwElement {
  static override properties = {
    label: {},
    icon: {},
    empty: {},
    items: { type: "json" },
    actions: { type: "json" },
    size: { reflect: true },
  } as const;

  static override styles = [
    base,
    controlSizes("menu-button"),
    css`
      :host {
        position: relative;
        display: inline-block;
        anchor-scope: --gw-menu;
      }

      .trigger {
        --gw-size: var(--gw-menu-button-scale, 1);
        --gw-scale: calc(var(--gw-size) * var(--gw-control-scale, 1));
        --gw-icon-size: calc(1.25rem * var(--gw-scale));

        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-size));
        align-items: center;
        box-sizing: border-box;
        height: calc(2.5rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-4) * var(--gw-size));
        font: inherit;
        font-size: calc(var(--gw-font-size-s) * var(--gw-size));
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
        cursor: pointer;
        background: var(--gw-color-fill-neutral-resting);
        border: var(--gw-border-width) solid var(--gw-border-color);
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
  /** SVG path data for an icon before the trigger's label. */
  declare icon: string;
  /** What the menu says when it has no items, such as "No backups yet". */
  declare empty: string;
  declare items: readonly MenuItem[];
  declare actions: readonly MenuItem[];
  declare size: "xs" | "small" | "medium" | "large" | "xl";

  readonly #trigger = h("button", {
    class: "trigger",
    part: "trigger",
    popovertarget: "menu",
    "aria-haspopup": "menu",
    "aria-expanded": "false",
  });

  readonly #triggerText = document.createTextNode("");

  readonly #triggerIcon = createIcon("");

  readonly #items = h("div", { class: "items", role: "none" });

  readonly #actions = h("div", { class: "actions", role: "none" });

  readonly #popover = h(
    "div",
    { id: "menu", popover: "auto", role: "menu" },
    this.#items,
    this.#actions,
  );

  constructor() {
    super();
    this.label = "";
    this.icon = "";
    this.empty = "Nothing here yet";
    this.items = [];
    this.actions = [];
    this.size = "medium";
  }

  /** The enabled items then actions, in the order arrow keys move through them. */
  get #buttons() {
    return [...this.#popover.querySelectorAll("button")].filter(
      (button) => !button.disabled,
    );
  }

  readonly #onToggle = (event: ToggleEvent) => {
    const expanded = event.newState === "open";

    this.#trigger.setAttribute("aria-expanded", String(expanded));

    if (expanded) this.#buttons[0]?.focus();
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

    this.#popover.hidePopover();
    this.#trigger.focus();
  }

  #renderItem(item: MenuItem, kind: "item" | "action") {
    const button = h(
      "button",
      {
        class: kind === "action" ? "item action" : "item",
        role: "menuitem",
        value: item.value,
        disabled: item.disabled === true,
      },
      item.icon ? createIcon(item.icon) : null,
      h(
        "span",
        { class: "text" },
        h("span", {}, item.label),
        item.description
          ? h("span", { class: "description" }, item.description)
          : null,
      ),
    );

    button.addEventListener("click", () => this.#choose(item.value));

    return button;
  }

  protected override create(root: ShadowRoot) {
    this.#trigger.append(
      this.#triggerIcon,
      this.#triggerText,
      h("span", { class: "chevron", "aria-hidden": "true" }),
    );
    this.#popover.addEventListener("toggle", this.#onToggle);
    this.#popover.addEventListener("keydown", this.#onKeydown);
    root.append(this.#trigger, this.#popover);
  }

  protected override update(changed: ReadonlySet<string>) {
    this.#triggerText.data = this.label;
    setIconPath(this.#triggerIcon, this.icon);
    this.#triggerIcon.toggleAttribute("hidden", !this.icon);
    this.#popover.setAttribute("aria-label", this.label);

    if (changed.has("items") || changed.has("empty")) {
      const items = Array.isArray(this.items) ? this.items : [];

      this.#items.replaceChildren(
        ...(items.length === 0
          ? [h("p", { class: "empty", role: "none" }, this.empty)]
          : items.map((item) => this.#renderItem(item, "item"))),
      );
    }

    if (changed.has("actions")) {
      const actions = Array.isArray(this.actions) ? this.actions : [];

      this.#actions.replaceChildren(
        ...actions.map((item) => this.#renderItem(item, "action")),
      );
      this.#actions.hidden = actions.length === 0;
    }
  }
}

GwMenuButton.define("gw-menu-button");

declare global {
  interface HTMLElementTagNameMap {
    "gw-menu-button": GwMenuButton;
  }
}
