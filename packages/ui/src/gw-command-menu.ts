/**
 * `gw-command-menu`: a searchable list of commands on Cmd+K or Ctrl+K.
 * Docs: https://groundwork.timmo.dev/components/overlays/#command-menu
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import "./gw-option-list.js";
import type { OptionItem } from "./gw-option-list.js";
import { base } from "./styles.js";

/** Below this width the menu is a bottom sheet. */
const sheetBelow = 600;

/**
 * A command menu on Cmd+K or Ctrl+K: a searchable list of commands in a
 * modal near the top of the page, or a bottom sheet on phones. Picking one
 * closes the menu and fires `pick` with its value. Esc or a click outside
 * closes it. It won't open over another dialog, so only one overlay shows at
 * a time. Set `shortcut="none"` to open it only with `show()`.
 *
 * @element gw-command-menu
 * @summary A searchable list of commands on Cmd+K or Ctrl+K.
 *
 * @attr {OptionItem[]} options - The commands, as JSON.
 * @attr {string} label - The accessible name. Defaults to `Commands`.
 * @attr {string} placeholder - The search placeholder. Defaults to `Search commands`.
 * @attr {string} shortcut - The key that opens it with Cmd or Ctrl, such as `mod+k`, or `none`. Defaults to `mod+k`.
 * @attr {boolean} open - Whether it shows.
 *
 * @csspart dialog - The menu's surface.
 * @csspart list - The `gw-option-list` of commands.
 * @csspart footer - The row of key hints.
 *
 * @fires {CustomEvent<{ value: string }>} pick - When a command is picked, with its `value` in `detail`.
 */
export class GwCommandMenu extends GwElement {
  static override properties = {
    options: { type: "json" },
    label: {},
    placeholder: {},
    shortcut: {},
    open: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      dialog {
        top: 12vh;
        width: min(36rem, calc(100vw - 2 * var(--gw-space-3)));
        max-height: 70vh;
        padding: 0;
        margin-block: 0;
        overflow: hidden;
        color: var(--gw-color-text-primary);
        background: var(--gw-color-surface-overlay);
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        box-shadow: var(--gw-shadow-l);
        --gw-option-list-height: min(24rem, 56vh);
      }

      dialog::backdrop {
        background: rgb(0 0 0 / 50%);
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
        --gw-option-list-height: 60vh;
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
  declare label: string;
  declare placeholder: string;
  /** `mod+k` (the default) opens it on Cmd+K or Ctrl+K; `none` turns that off. */
  declare shortcut: string;
  declare open: boolean;

  readonly #list = h("gw-option-list", { search: true, part: "list" });

  readonly #dialog: HTMLDialogElement = h(
    "dialog",
    { part: "dialog" },
    this.#list,
    h(
      "footer",
      { part: "footer", "aria-hidden": "true" },
      h("span", {}, h("kbd", {}, "↑"), " ", h("kbd", {}, "↓"), " to move"),
      h("span", {}, h("kbd", {}, "Enter"), " to pick"),
      h("span", {}, h("kbd", {}, "Esc"), " to close"),
    ),
  );

  constructor() {
    super();
    this.options = [];
    this.label = "Commands";
    this.placeholder = "Search commands";
    this.shortcut = "mod+k";
    this.open = false;
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  readonly #onShortcut = (event: KeyboardEvent) => {
    if (
      this.shortcut === "none" ||
      event.defaultPrevented ||
      event.key.toLowerCase() !== "k" ||
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
    list.label = this.label;
    list.placeholder = this.placeholder;
    dialog.setAttribute("aria-label", this.label);

    if (this.open && !dialog.open) {
      dialog.dataset.placement =
        window.innerWidth < sheetBelow ? "sheet" : "center";
      dialog.showModal();
      list.reset();
      document.dispatchEvent(new Event("gw-dialog-open"));
    }

    if (!this.open && dialog.open) dialog.close();
  }
}

GwCommandMenu.define("gw-command-menu");

declare global {
  interface HTMLElementTagNameMap {
    "gw-command-menu": GwCommandMenu;
  }
}
