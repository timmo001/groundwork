/**
 * `gw-expansion`: a heading that opens and closes the content under it.
 * Docs: https://groundwork.timmo.dev/components/display/#expansion-panel
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-skeleton.js";
import { getStorage } from "./storage.js";
import { base } from "./styles.js";

/**
 * A heading that opens and closes the content under it, on a native
 * `<details>`, so find-in-page and the keyboard work as they do anywhere. The
 * content glides open and shut rather than jumping, and the chevron turns
 * with it. `open` reflects its state and it fires `toggle`. Controls in
 * `actions` sit in the summary row before the chevron, and pressing them
 * doesn't open or close it.
 *
 * Content that costs something to build goes in `draw` rather than the slot:
 * it's called with a container the first time it opens, the frame after, so
 * the panel opens at once with skeleton lines and the content follows. While
 * it's open, a new `draw` draws again; while it's shut, that waits until it
 * opens. `storage-key` keeps whether it's open in this browser, once someone
 * opens or shuts it, so it comes back as they left it.
 *
 * @element gw-expansion
 * @summary A heading that opens and closes the content under it.
 *
 * @attr {string} heading - The heading in the summary row.
 * @attr {string} description - A line under the heading.
 * @attr {boolean} open - Whether the content shows; how it starts when it has a `storage-key`.
 * @attr {string} storage-key - Keeps whether it's open in `localStorage` under this key.
 *
 * @prop {(target: HTMLElement) => void} draw - Draws the content into `target`, the first time it opens.
 *
 * @slot - The content.
 * @slot icon - An icon before the heading.
 * @slot actions - Buttons in the summary row, before the chevron.
 *
 * @csspart details - The native `<details>`.
 * @csspart summary - The summary row.
 * @csspart heading - The heading.
 * @csspart description - The line under the heading.
 * @csspart actions - The actions' wrapper.
 * @csspart toggle - The chevron's circle at the end of the summary row.
 * @csspart chevron - The chevron in it, which turns as the panel opens.
 * @csspart content - The content's wrapper.
 *
 * @cssprop --gw-expansion-background - The surface. Defaults to `--gw-color-surface-raised`.
 * @cssprop --gw-expansion-border-color - The border. Defaults to `--gw-color-border-normal`.
 * @cssprop --gw-expansion-radius - The corners. Defaults to `--gw-radius-panel`.
 * @cssprop --gw-expansion-summary-height - The summary row's least height. Defaults to `3rem`.
 * @cssprop --gw-expansion-toggle-size - The chevron's circle. Defaults to `2rem`.
 *
 * @fires {Event} toggle - When it opens or closes.
 */
export class GwExpansion extends GwElement {
  static override properties = {
    heading: {},
    description: {},
    open: { type: "boolean", reflect: true },
    storageKey: { attribute: "storage-key" },
    draw: { attribute: false },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        position: relative;
        display: block;
        interpolate-size: allow-keywords;
      }

      details {
        background: var(
          --gw-expansion-background,
          var(--gw-color-surface-raised)
        );
        border: var(--gw-border-width) solid
          var(--gw-expansion-border-color, var(--gw-color-border-normal));
        border-radius: var(--gw-expansion-radius, var(--gw-radius-panel));
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
        min-height: var(--gw-expansion-summary-height, 3rem);
        padding: var(--gw-space-2) var(--gw-space-4);
        cursor: pointer;
        list-style: none;
        border-radius: calc(
          var(--gw-expansion-radius, var(--gw-radius-panel)) - var(
              --gw-border-width
            )
        );
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
        width: var(--gw-expansion-toggle-size, 2rem);
        height: var(--gw-expansion-toggle-size, 2rem);
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

      /* The actions sit over a gap the summary keeps for them, so they show
         in its row without being controls inside its button */
      .actions {
        position: absolute;
        inset-block-start: var(--gw-border-width);
        inset-inline-end: calc(
          var(--gw-border-width) + var(--gw-space-4) +
            var(--gw-expansion-toggle-size, 2rem) + var(--gw-space-3)
        );
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        align-items: center;
      }

      .actions-space {
        flex: none;
      }

      .actions[hidden],
      .actions-space[hidden] {
        display: none;
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

      gw-skeleton-lines[hidden] {
        display: none;
      }
    `,
  ];

  declare heading: string;
  declare description: string;
  declare open: boolean;
  declare storageKey: string;
  declare draw: ((target: HTMLElement) => void) | undefined;

  readonly #placeholder = h("gw-skeleton-lines", { lines: 3, hidden: true });

  readonly #heading = h("span", { class: "heading", part: "heading" });

  readonly #description = h("span", {
    class: "description",
    part: "description",
  });

  readonly #actionsSlot = h("slot", { name: "actions" });

  readonly #actions = h(
    "span",
    { class: "actions", part: "actions", hidden: "" },
    this.#actionsSlot,
  );

  readonly #actionsSpace = h("span", {
    class: "actions-space",
    "aria-hidden": "true",
    hidden: "",
  });

  readonly #summary: HTMLElement = h(
    "summary",
    { part: "summary" },
    h("slot", { name: "icon" }),
    h("span", { class: "text" }, this.#heading, this.#description),
    this.#actionsSpace,
    h(
      "span",
      { class: "toggle", part: "toggle", "aria-hidden": "true" },
      h("span", { class: "chevron", part: "chevron" }),
    ),
  );

  /** Keeps the summary's gap as wide as the actions, and them as tall as it. */
  readonly #fit = new ResizeObserver(() => {
    this.#actionsSpace.style.inlineSize = `${this.#actions.offsetWidth}px`;
    this.#actions.style.blockSize = `${this.#summary.offsetHeight}px`;
  });

  readonly #details: HTMLDetailsElement = h(
    "details",
    { part: "details" },
    this.#summary,
    h(
      "div",
      { class: "content", part: "content" },
      h("slot"),
      this.#placeholder,
    ),
  );

  /** The container `draw` draws into, made the first time it opens. */
  #drawn: HTMLElement | undefined;

  /** Whether `draw` has changed since it last drew. */
  #stale = false;

  #pending = false;

  constructor() {
    super();
    this.heading = "";
    this.description = "";
    this.open = false;
    this.storageKey = "";
    this.draw = undefined;
  }

  readonly #onToggle = () => {
    // A toggle from setting `open` already matches it; only a press doesn't
    const pressed = this.#details.open !== this.open;

    this.open = this.#details.open;

    if (pressed && this.storageKey !== "") {
      getStorage().set(this.storageKey, this.open);
    }

    this.dispatchEvent(new Event("toggle", { bubbles: true, composed: true }));
  };

  #drawNow() {
    const draw = this.draw;

    if (!this.open || draw === undefined || !this.isConnected) return;

    if (this.#drawn === undefined) {
      this.#drawn = h("div", { "data-gw-drawn": "" });
      this.append(this.#drawn);
    }

    this.#stale = false;
    this.#placeholder.hidden = true;
    draw(this.#drawn);
  }

  /**
   * Draws once it's open. While it stays open, a new `draw` draws at once,
   * like any update. Opening waits for a paint first, so the panel opens
   * before the content is built.
   */
  #drawWhenOpen(opened: boolean) {
    if (!this.open || this.draw === undefined || !this.#stale) return;

    if (this.#drawn !== undefined && !opened) {
      this.#drawNow();

      return;
    }

    // Content drawn before stays up while it redraws
    this.#placeholder.hidden = this.#drawn !== undefined;

    if (this.#pending) return;

    this.#pending = true;
    requestAnimationFrame(() =>
      setTimeout(() => {
        this.#pending = false;
        this.#drawNow();
      }),
    );
  }

  protected override create(root: ShadowRoot) {
    this.#actionsSlot.addEventListener("slotchange", () => {
      const none =
        this.#actionsSlot.assignedNodes({ flatten: true }).length === 0;

      this.#actions.hidden = none;
      this.#actionsSpace.hidden = none;
    });
    this.#details.addEventListener("toggle", this.#onToggle);
    this.#fit.observe(this.#actions);
    this.#fit.observe(this.#summary);
    // Before the details, so the actions come before the content when it's
    // open, as they do on screen
    root.append(this.#actions, this.#details);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("storageKey") && this.storageKey !== "") {
      const kept = getStorage().get(this.storageKey);

      if (kept === true || kept === false) this.open = kept;
    }

    if (changed.has("draw")) this.#stale = this.draw !== undefined;

    if (this.draw === undefined) this.#placeholder.hidden = true;

    this.#details.open = this.open;
    this.#heading.textContent = this.heading;
    this.#description.textContent = this.description;
    this.#description.hidden = !this.description;
    this.#drawWhenOpen(changed.has("open"));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-expansion": GwExpansion;
  }
}
