/**
 * `gw-command-menu`: a searchable list of commands on Cmd+K or Ctrl+K.
 * Docs: https://groundwork.timmo.dev/components/overlays/#command-menu
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-option-list.js";
import type { OptionItem } from "./gw-option-list.js";
import { base } from "./styles.js";

/**
 * A command menu on Cmd+K or Ctrl+K: a searchable list of commands in a
 * modal near the top of the page, or a bottom sheet below `sheet-below`,
 * 600px wide by default. Picking one closes the menu and fires `pick` with
 * its value. Esc or a click outside closes it. It won't open over another
 * dialog, so only one overlay shows at a time. Set `shortcut="none"` to open
 * it only with `show()`.
 *
 * @element gw-command-menu
 * @summary A searchable list of commands on Cmd+K or Ctrl+K.
 *
 * @attr {OptionItem[]} options - The commands, as JSON.
 * @attr {string} value - The current command, such as the page you're on. It's marked, and selected and scrolled into view each time the menu opens.
 * @attr {string} label - The accessible name. Defaults to `Commands`.
 * @attr {string} placeholder - The search placeholder. Defaults to `Search commands`.
 * @attr {string} no-match-label - What it says when the search matches nothing, for an app in another language. Defaults to `No matches`.
 * @attr {string} shortcut - `mod+` and the key that opens it with Cmd or Ctrl, such as `mod+k` or `mod+p`, or `none`. Defaults to `mod+k`.
 * @attr {string} move-hint - The footer's hint after the arrow keys. Defaults to `to move`.
 * @attr {string} pick-hint - The hint after Enter. Defaults to `to pick`.
 * @attr {string} close-hint - The hint after Esc. Defaults to `to close`.
 * @attr {number} sheet-below - The viewport width in pixels below which it's a bottom sheet; `0` keeps it a modal. Defaults to `600`.
 * @attr {boolean} open - Whether it shows.
 *
 * @csspart dialog - The menu's surface.
 * @csspart list - The `gw-option-list` of commands.
 * @csspart footer - The row of key hints.
 * @csspart hint - Each key hint.
 * @csspart key - Each key in a hint.
 *
 * @cssprop --gw-command-menu-top - How far down the page it opens. Defaults to `12vh`.
 * @cssprop --gw-command-menu-width - The widest it grows. Defaults to `36rem`.
 * @cssprop --gw-command-menu-height - The tallest it grows. Defaults to `70vh`.
 * @cssprop --gw-command-menu-list-height - The tallest the list grows. Defaults to `min(24rem, 56vh)`.
 * @cssprop --gw-command-menu-sheet-list-height - The tallest the list grows as a bottom sheet. Defaults to `60vh`.
 * @cssprop --gw-command-menu-background - The surface. Defaults to `--gw-color-surface-overlay`.
 * @cssprop --gw-command-menu-border-color - The border. Defaults to `--gw-color-border-loud`.
 * @cssprop --gw-command-menu-radius - The corners. Defaults to `--gw-radius-panel`.
 * @cssprop --gw-command-menu-shadow - The shadow. Defaults to `--gw-shadow-l`.
 * @cssprop --gw-command-menu-backdrop - The backdrop over the page. Defaults to `rgb(0 0 0 / 60%)`.
 *
 * @fires {CustomEvent<{ value: string }>} pick - When a command is picked, with its `value` in `detail`.
 */
export class GwCommandMenu extends GwElement {
  static override properties = {
    options: { type: "json" },
    value: {},
    label: {},
    placeholder: {},
    noMatchLabel: { attribute: "no-match-label" },
    shortcut: {},
    moveHint: { attribute: "move-hint" },
    pickHint: { attribute: "pick-hint" },
    closeHint: { attribute: "close-hint" },
    sheetBelow: { type: "number", attribute: "sheet-below" },
    open: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      dialog {
        top: var(--gw-command-menu-top, 12vh);
        width: min(
          var(--gw-command-menu-width, 36rem),
          calc(100vw - 2 * var(--gw-space-3))
        );
        max-height: var(--gw-command-menu-height, 70vh);
        padding: 0;
        margin-block: 0;
        overflow: hidden;
        color: var(--gw-color-text-primary);
        background: var(
          --gw-command-menu-background,
          var(--gw-color-surface-overlay)
        );
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-command-menu-border-color, var(--gw-color-border-loud));
        border-radius: var(--gw-command-menu-radius, var(--gw-radius-panel));
        box-shadow: var(--gw-command-menu-shadow, var(--gw-shadow-l));
        --gw-option-list-height: var(
          --gw-command-menu-list-height,
          min(24rem, 56vh)
        );
      }

      dialog::backdrop {
        background: var(--gw-command-menu-backdrop, rgb(0 0 0 / 60%));
      }

      dialog,
      dialog::backdrop {
        opacity: 0;
        transition:
          opacity var(--gw-motion-normal) var(--gw-motion-easing),
          scale var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          display var(--gw-motion-normal) allow-discrete,
          overlay var(--gw-motion-normal) allow-discrete;
      }

      dialog {
        scale: 0.96;
      }

      dialog[open],
      dialog[open]::backdrop {
        opacity: 1;
      }

      dialog[open] {
        scale: 1;
      }

      @starting-style {
        dialog[open],
        dialog[open]::backdrop {
          opacity: 0;
        }

        dialog[open] {
          scale: 0.96;
        }
      }

      dialog[data-placement="sheet"] {
        inset: auto 0 0;
        width: 100%;
        max-width: none;
        padding-block-end: env(safe-area-inset-bottom);
        border-end-start-radius: 0;
        border-end-end-radius: 0;
        scale: 1;
        translate: 0 100%;
        --gw-option-list-height: var(--gw-command-menu-sheet-list-height, 60vh);
      }

      dialog[data-placement="sheet"][open] {
        opacity: 1;
        translate: 0 0;
      }

      @starting-style {
        dialog[data-placement="sheet"][open] {
          translate: 0 100%;
        }
      }

      footer {
        display: flex;
        gap: var(--gw-space-3);
        padding: var(--gw-space-2) var(--gw-space-3);
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-secondary);
        border-block-start: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      kbd {
        padding: var(--gw-space-0-5) calc(var(--gw-space-1) * 1.5);
        font: inherit;
        line-height: 1;
        background: color-mix(
          in oklab,
          var(--gw-color-surface-overlay),
          var(--gw-color-text-primary) 8%
        );
        border: 1px solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-control);
      }

      dialog[data-placement="sheet"] footer {
        display: none;
      }
    `,
  ];

  declare options: readonly OptionItem[];
  /** The current command, marked and selected when the menu opens. */
  declare value: string;
  declare label: string;
  declare placeholder: string;
  declare noMatchLabel: string;
  /** `mod+` and a key, such as `mod+k` (the default), opens it on Cmd or Ctrl and that key; `none` turns that off. */
  declare shortcut: string;
  declare moveHint: string;
  declare pickHint: string;
  declare closeHint: string;
  /** The viewport width in pixels below which it's a bottom sheet. */
  declare sheetBelow: number;
  declare open: boolean;

  readonly #list = h("gw-option-list", { search: true, part: "list" });

  readonly #moveHint = h("span");

  readonly #pickHint = h("span");

  readonly #closeHint = h("span");

  readonly #dialog: HTMLDialogElement = h(
    "dialog",
    { part: "dialog" },
    this.#list,
    h(
      "footer",
      { part: "footer", "aria-hidden": "true" },
      h(
        "span",
        { part: "hint" },
        h("kbd", { part: "key" }, "↑"),
        " ",
        h("kbd", { part: "key" }, "↓"),
        " ",
        this.#moveHint,
      ),
      h(
        "span",
        { part: "hint" },
        h("kbd", { part: "key" }, "Enter"),
        " ",
        this.#pickHint,
      ),
      h(
        "span",
        { part: "hint" },
        h("kbd", { part: "key" }, "Esc"),
        " ",
        this.#closeHint,
      ),
    ),
  );

  constructor() {
    super();
    this.options = [];
    this.value = "";
    this.label = "Commands";
    this.placeholder = "Search commands";
    this.noMatchLabel = "No matches";
    this.shortcut = "mod+k";
    this.moveHint = "to move";
    this.pickHint = "to pick";
    this.closeHint = "to close";
    this.sheetBelow = 600;
    this.open = false;
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  readonly #onShortcut = (event: KeyboardEvent) => {
    const key = /^mod\+(.+)$/i.exec(this.shortcut.trim())?.[1]?.toLowerCase();

    if (
      key === undefined ||
      event.defaultPrevented ||
      event.key.toLowerCase() !== key ||
      !(event.metaKey || event.ctrlKey) ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    if (this.open) {
      this.close();

      return;
    }

    // One overlay at a time: another open dialog keeps the page
    if (
      document.querySelector(
        "dialog[open], gw-dialog[open], gw-command-menu[open]",
      )
    ) {
      return;
    }

    this.show();
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.#onShortcut);
  }

  override disconnectedCallback() {
    document.removeEventListener("keydown", this.#onShortcut);
    super.disconnectedCallback();
  }

  protected override create(root: ShadowRoot) {
    this.#dialog.addEventListener("close", () => {
      this.open = false;
    });
    this.#dialog.addEventListener("click", (event) => {
      if (event.target === this.#dialog) this.close();
    });
    this.#list.addEventListener("pick", (event) => {
      event.stopPropagation();

      const value =
        event instanceof CustomEvent &&
        event.detail !== null &&
        "value" in event.detail
          ? String(event.detail.value)
          : "";

      this.close();
      this.dispatchEvent(
        new CustomEvent("pick", {
          detail: { value },
          bubbles: true,
          composed: true,
        }),
      );
    });
    root.append(this.#dialog);
  }

  protected override update() {
    const list = this.#list;
    const dialog = this.#dialog;

    list.options = Array.isArray(this.options) ? this.options : [];
    list.value = this.value;
    list.label = this.label;
    list.placeholder = this.placeholder;
    list.noMatchLabel = this.noMatchLabel;
    this.#moveHint.textContent = this.moveHint;
    this.#pickHint.textContent = this.pickHint;
    this.#closeHint.textContent = this.closeHint;
    dialog.setAttribute("aria-label", this.label);

    if (this.open && !dialog.open) {
      dialog.dataset.placement =
        window.innerWidth < this.sheetBelow ? "sheet" : "center";
      dialog.showModal();
      list.reset();
      document.dispatchEvent(new Event("gw-dialog-open"));
    }

    if (!this.open && dialog.open) dialog.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-command-menu": GwCommandMenu;
  }
}
