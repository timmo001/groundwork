/**
 * `gw-section`: a section of a page under a heading that folds it away.
 * Docs: https://groundwork.timmo.dev/components/layout/#section
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-chip.js";
import { getStorage } from "./storage.js";
import { base, createIcon } from "./styles.js";

// MDI's chevron-right
const chevronIcon =
  "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";

/**
 * A section of a page under a heading that folds it away, flat on the page's
 * own surface, as `gw-list` and `gw-table` fold their groups: a chevron, the
 * heading and an optional chip counting what's in it. Pressing the heading
 * folds the content; it starts open unless `collapsed` is set. Folded
 * content stays in the page, hidden until found, so find-in-page still
 * reaches it and opens the section. `storage-key` keeps whether it's open in
 * this browser, once someone folds or opens it, so it comes back as they
 * left it. Controls in `actions` sit at the end of the heading's row.
 *
 * Use `gw-section-title` for a heading that doesn't fold, and `gw-expansion`
 * for a raised panel.
 *
 * @element gw-section
 * @summary A section of a page under a heading that folds it away.
 *
 * @attr {string} heading - The heading.
 * @attr {string} count - What the chip after the heading says, such as how many items the section has. No chip without it.
 * @attr {number} level - The heading level. Defaults to 2.
 * @attr {boolean} collapsed - Folds the content away; how it starts when it has a `storage-key`.
 * @attr {string} storage-key - Keeps whether it's open in `localStorage` under this key.
 *
 * @slot - The content.
 * @slot actions - Controls at the end of the heading's row, which don't fold it.
 *
 * @csspart header - The heading's row.
 * @csspart toggle - The button that folds and opens it.
 * @csspart icon - The chevron.
 * @csspart heading - The heading's text.
 * @csspart count - The chip after the heading, a `gw-chip`.
 * @csspart actions - The actions' wrapper.
 * @csspart content - The content's wrapper.
 *
 * @cssprop --gw-section-count-scale - Scales the count chip, around 1 for medium. Defaults to `0.8`, small.
 * @cssprop --gw-section-gap - The space between the heading and the content. Defaults to `--gw-space-2`.
 *
 * @fires {Event} toggle - When it folds or opens. Read `collapsed`.
 */
export class GwSection extends GwElement {
  static override properties = {
    heading: {},
    count: {},
    level: { type: "number" },
    collapsed: { type: "boolean", reflect: true },
    storageKey: { attribute: "storage-key" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .header {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
      }

      .title {
        flex: 1;
        min-width: 0;
        margin: 0;
        font: inherit;
      }

      .toggle {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        width: 100%;
        padding: var(--gw-space-1) var(--gw-space-2);
        font: inherit;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-align: start;
        cursor: pointer;
        background: none;
        border: 0;
        border-radius: var(--gw-radius-control);
        --gw-icon-size: 1.35em;
      }

      .toggle:hover {
        color: var(--gw-color-text-primary);
        background: var(--gw-color-fill-neutral-hovered);
      }

      .toggle:focus-visible {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: calc(-1 * var(--gw-focus-width));
      }

      .toggle .icon {
        flex: none;
        color: var(--gw-color-accent);
        transition: rotate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      .toggle[aria-expanded="true"] .icon {
        rotate: 90deg;
      }

      .toggle gw-chip {
        --gw-chip-scale: var(--gw-section-count-scale, 0.8);
      }

      .toggle gw-chip[hidden],
      .actions[hidden] {
        display: none;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        align-items: center;
      }

      .content {
        padding-block-start: var(--gw-section-gap, var(--gw-space-2));
      }

      /* Folded content is hidden until found, which keeps its box */
      .content[hidden] {
        padding: 0;
      }

      @media (forced-colors: active) {
        .toggle:hover {
          outline: var(--gw-border-width) solid CanvasText;
        }
      }
    `,
  ];

  declare heading: string;
  declare count: string;
  declare level: number;
  declare collapsed: boolean;
  declare storageKey: string;

  readonly #heading = h("span", { part: "heading" });

  readonly #count = h("gw-chip", { part: "count", hidden: true });

  readonly #toggle: HTMLButtonElement = h(
    "button",
    {
      type: "button",
      class: "toggle",
      part: "toggle",
      "aria-controls": "content",
    },
    createIcon(chevronIcon, { part: "icon" }),
    this.#heading,
    this.#count,
  );

  readonly #title = h("div", { class: "title", role: "heading" }, this.#toggle);

  readonly #actionsSlot = h("slot", { name: "actions" });

  readonly #actions = h(
    "div",
    { class: "actions", part: "actions", hidden: true },
    this.#actionsSlot,
  );

  readonly #content = h(
    "div",
    { class: "content", part: "content", id: "content" },
    h("slot"),
  );

  constructor() {
    super();
    this.heading = "";
    this.count = "";
    this.level = 2;
    this.collapsed = false;
    this.storageKey = "";
  }

  /** Folds or opens it, keeping the choice under `storage-key`. */
  #set(collapsed: boolean) {
    this.collapsed = collapsed;

    if (this.storageKey !== "") getStorage().set(this.storageKey, !collapsed);

    this.dispatchEvent(new Event("toggle", { bubbles: true, composed: true }));
  }

  protected override create(root: ShadowRoot) {
    this.#toggle.addEventListener("click", () => this.#set(!this.collapsed));
    // Find-in-page opens a folded section when it finds a match in it
    this.#content.addEventListener("beforematch", () => this.#set(false));
    this.#actionsSlot.addEventListener("slotchange", () => {
      this.#actions.hidden =
        this.#actionsSlot.assignedNodes({ flatten: true }).length === 0;
    });
    root.append(
      h("div", { class: "header", part: "header" }, this.#title, this.#actions),
      this.#content,
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    // What was kept wins over how the page starts it
    if (changed.has("storageKey") && this.storageKey !== "") {
      const open = getStorage().get(this.storageKey);

      if (open === true || open === false) this.collapsed = !open;
    }

    setAttribute(this.#title, "aria-level", this.level);
    this.#heading.textContent = this.heading;
    this.#count.textContent = this.count;
    this.#count.hidden = this.count === "";
    setAttribute(this.#toggle, "aria-expanded", String(!this.collapsed));
    setAttribute(
      this.#content,
      "hidden",
      this.collapsed ? "until-found" : null,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-section": GwSection;
  }
}
