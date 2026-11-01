/**
 * `gw-menu-button`: a button that opens a menu of items and actions.
 * Docs: https://groundwork.timmo.dev/components/actions/#menu-button
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, controlSizes, createIcon, setIconPath } from "./styles.js";

export interface MenuItem {
  readonly value: string;
  readonly label: string;
  /** A second line, such as what the item does. */
  readonly description?: string;
  /** SVG path data for an icon before the label. */
  readonly icon?: string;
  readonly disabled?: boolean;
  /**
   * Whether the item is the one picked, for a menu of choices such as a sort
   * order. Give it on every item in the group: the picked one shows a tick.
   */
  readonly checked?: boolean;
  /** Draws a line above the item, starting a new group. */
  readonly separator?: boolean;
}

// mdi's check, for the picked item in a menu of choices
const tick = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

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
 * For a menu of choices, such as sort and order, give each item `checked`:
 * the picked one shows a tick, and `separator` starts the next group.
 *
 * Items render inside the component, so a page's own button styles can't
 * reach them.
 *
 * @element gw-menu-button
 * @summary A button that opens a menu of items and actions.
 *
 * @attr {string} label - The trigger's text.
 * @attr {string} heading - What the menu is for, such as "Sort by", when the trigger shows the current choice: it names the menu, starts the trigger's accessible name and is its tooltip.
 * @attr {string} icon - SVG path data for an icon before the trigger's text.
 * @attr {string} empty - What the menu says with no items. Defaults to `Nothing here yet`.
 * @attr {MenuItem[]} items - The items, as JSON.
 * @attr {MenuItem[]} actions - Actions pinned under the items, as JSON.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The trigger's size, 24 to 56px tall. Defaults to `medium`.
 * @attr {"accent"|"filled"|"outlined"|"plain"} appearance - How the trigger is drawn: `filled` is a neutral fill with a border, and the others match a neutral `gw-button` of that appearance, so it sits in a row of them. Defaults to `filled`.
 * @attr {boolean} active - Marks the trigger as set, such as a grouping that's on, with an accent border and text.
 * @attr {"show"|"hide"|"auto"} labels - Whether the trigger's text shows beside its icon: always, never (a square icon button without the chevron, such as ⋮ for more actions), or not on narrow screens. Defaults to `show`.
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
    heading: {},
    icon: {},
    empty: {},
    items: { type: "json" },
    actions: { type: "json" },
    size: { reflect: true },
    appearance: { reflect: true },
    active: { type: "boolean", reflect: true },
    labels: { reflect: true },
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

      /* The other appearances draw the trigger as gw-button draws a neutral
         one, a pill, so it sits in a row of buttons without a seam */
      :host([appearance="accent"]) .trigger,
      :host([appearance="outlined"]) .trigger,
      :host([appearance="plain"]) .trigger {
        background: transparent;
        border: max(var(--gw-border-width), 1px) solid transparent;
        border-radius: var(--gw-radius-pill);
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          border-color var(--gw-motion-fast) var(--gw-motion-easing),
          color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      :host([appearance="outlined"]) .trigger {
        border-color: var(--gw-color-text-secondary);
      }

      :host([appearance="outlined"]) .trigger:hover,
      :host([appearance="plain"]) .trigger:hover {
        background: color-mix(
          in oklch,
          var(--gw-color-text-secondary) 16%,
          transparent
        );
      }

      /* A solid fill, with text that flips between black and white by the
         fill's lightness, as gw-button's accent does */
      :host([appearance="accent"]) .trigger {
        color: oklch(
          from var(--gw-color-accent) clamp(0, (0.66 - l) * 1000, 1) 0 0
        );
        background: var(--gw-color-accent);
      }

      :host([appearance="accent"]) .trigger:hover {
        background: oklch(
          from var(--gw-color-accent) calc(l + (0.6 - l) * 0.2) c h
        );
      }

      :host([active]:not([appearance="accent"])) .trigger {
        color: var(--gw-color-accent);
        border-color: var(--gw-color-accent);
      }

      /* Icon only, square like an icon-only gw-button, such as a ⋮ for more
         actions, with the text kept for assistive technology */
      :host([labels="hide"]) .trigger.has-icon {
        justify-content: center;
        min-width: calc(2.5rem * var(--gw-scale));
        padding: 0;
      }

      :host([labels="hide"]) .has-icon .chevron {
        display: none;
      }

      :host([labels="hide"]) .has-icon .label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (width < 40rem) {
        :host([labels="auto"]) .trigger.has-icon {
          padding: 0 calc(var(--gw-space-2) * var(--gw-size));
        }

        :host([labels="auto"]) .has-icon .label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
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

      /* Below the button down to the window's edge, or above it when there's
         more room there, growing to its content and scrolling past that */
      [popover] {
        position-anchor: --gw-menu;
        position-try-fallbacks: flip-inline;
        /* The area is the room on that side, so 100% is all of it */
        position-area: block-end span-inline-end;
        inset: auto;
        box-sizing: border-box;
        min-width: 15rem;
        max-width: calc(100vw - 2 * var(--gw-space-2));
        max-height: min(24rem, calc(100% - 2 * var(--gw-space-2)));
        padding: 0;
        margin: var(--gw-space-1) 0;
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

      /* Holds the tick's place on every choice, so the labels line up */
      .tick {
        flex: none;
        width: var(--gw-icon-size);
        height: var(--gw-icon-size);
        color: var(--gw-color-accent);
      }

      .item[aria-checked="false"] .tick {
        visibility: hidden;
      }

      .separator {
        flex: none;
        height: 0;
        margin: var(--gw-space-0-5) calc(-1 * var(--gw-space-1));
        border: 0;
        border-block-start: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
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
  /** What the menu is for, such as "Sort by", when the trigger shows the current choice. */
  declare heading: string;
  /** SVG path data for an icon before the trigger's label. */
  declare icon: string;
  /** What the menu says when it has no items, such as "No backups yet". */
  declare empty: string;
  declare items: readonly MenuItem[];
  declare actions: readonly MenuItem[];
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  /** How the trigger is drawn: a neutral fill, or as a neutral `gw-button` of that appearance. */
  declare appearance: "accent" | "filled" | "outlined" | "plain";
  /** Marks the trigger as set, such as a grouping that's on. */
  declare active: boolean;
  /** Whether the trigger's text shows beside its icon: always, never, or not on narrow screens. */
  declare labels: "show" | "hide" | "auto";

  readonly #trigger = h("button", {
    class: "trigger",
    part: "trigger",
    popovertarget: "menu",
    "aria-haspopup": "menu",
    "aria-expanded": "false",
  });

  readonly #triggerText: HTMLSpanElement = h("span", {
    class: "label",
    id: "label",
  });

  // Read before the label, for a trigger that shows the current choice
  readonly #heading: HTMLSpanElement = h("span", {
    id: "heading",
    hidden: true,
  });

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
    this.heading = "";
    this.icon = "";
    this.empty = "Nothing here yet";
    this.items = [];
    this.actions = [];
    this.size = "medium";
    this.appearance = "filled";
    this.active = false;
    this.labels = "show";
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

    if (!expanded) return;

    // Below the button while the menu fits there or there's more room than
    // above it; the area's height then caps the menu, which scrolls
    const popover = this.#popover;
    const rect = this.#trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;

    popover.style.positionArea = "";

    const items = this.#items;

    const height =
      popover.offsetHeight - items.clientHeight + items.scrollHeight;

    const fitsBelow = below >= height + 16 || below >= rect.top;

    popover.style.positionArea = fitsBelow ? "" : "block-start span-inline-end";
    this.#buttons[0]?.focus({ preventScroll: true });
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
    const choice = item.checked !== undefined;

    const button = h(
      "button",
      {
        class: kind === "action" ? "item action" : "item",
        role: choice ? "menuitemradio" : "menuitem",
        "aria-checked": choice ? String(item.checked) : null,
        value: item.value,
        disabled: item.disabled === true,
      },
      choice ? this.#tick() : null,
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

    return item.separator === true
      ? [h("hr", { class: "separator", role: "separator" }), button]
      : [button];
  }

  #tick() {
    const icon = createIcon(tick);

    icon.classList.add("tick");

    return icon;
  }

  protected override create(root: ShadowRoot) {
    this.#trigger.append(
      this.#triggerIcon,
      this.#triggerText,
      h("span", { class: "chevron", "aria-hidden": "true" }),
    );
    this.#popover.addEventListener("toggle", this.#onToggle);
    this.#popover.addEventListener("keydown", this.#onKeydown);
    root.append(this.#heading, this.#trigger, this.#popover);
  }

  protected override update(changed: ReadonlySet<string>) {
    this.#triggerText.textContent = this.label;
    setIconPath(this.#triggerIcon, this.icon);
    this.#triggerIcon.toggleAttribute("hidden", !this.icon);
    this.#trigger.classList.toggle("has-icon", this.icon !== "");
    this.#heading.textContent = this.heading;
    setAttribute(
      this.#trigger,
      "aria-labelledby",
      this.heading ? "heading label" : null,
    );
    // A tooltip saying what the menu is for, or the text when it's hidden
    setAttribute(
      this.#trigger,
      "title",
      this.heading ||
        (this.icon !== "" && this.labels !== "show"
          ? this.label || null
          : null),
    );
    this.#popover.setAttribute("aria-label", this.heading || this.label);

    if (changed.has("items") || changed.has("empty")) {
      const items = Array.isArray(this.items) ? this.items : [];

      this.#items.replaceChildren(
        ...(items.length === 0
          ? [h("p", { class: "empty", role: "none" }, this.empty)]
          : items.flatMap((item) => this.#renderItem(item, "item"))),
      );
    }

    if (changed.has("actions")) {
      const actions = Array.isArray(this.actions) ? this.actions : [];

      this.#actions.replaceChildren(
        ...actions.flatMap((item) => this.#renderItem(item, "action")),
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
