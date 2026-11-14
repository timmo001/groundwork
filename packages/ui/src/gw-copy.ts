/**
 * `gw-copy`: a short value, such as a code, a link or a key, with a button
 * that copies it.
 * Docs: https://groundwork.timmo.dev/components/display/#copy
 *
 * @module
 */
import { CopyFeedback, copiedIcon, copyIcon } from "./copy.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import { base, controlSizes } from "./styles.js";

/**
 * A short value someone takes somewhere else, such as a pairing code, a
 * link or a key that shows once, with a Copy button. The button says
 * `Copied` for a moment and a status announces it, so a screen reader
 * hears it too. Where the page can't reach the clipboard, such as over
 * plain HTTP, the button says it couldn't and the value is selected, ready
 * for Ctrl+C.
 *
 * The value is selectable text in the mono font, and one click selects all
 * of it. `display` shows something else in its place, such as a code
 * grouped for reading while the link it belongs to is copied.
 *
 * @element gw-copy
 * @summary A short value, such as a code, a link or a key, with a Copy button.
 *
 * @attr {string} value - What's copied, and shown unless `display` is set.
 * @attr {string} display - What shows in the value's place, such as a code grouped for reading.
 * @attr {string} label - The value's accessible name, such as `Pairing code`.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The Copy button's size, as `gw-button`'s. Defaults to `small`.
 * @attr {"show"|"hide"|"auto"} labels - Whether the Copy button's text shows beside its icon, as `gw-button`'s. Defaults to `show`.
 * @attr {string} copy-label - The Copy button's text, for an app in another language. Defaults to `Copy`.
 * @attr {string} copied-label - What the button says and the status announces once it's copied. Defaults to `Copied`.
 * @attr {string} copy-failed-label - What they say when copying fails. Defaults to `Couldn't copy`.
 *
 * @csspart value - The value as shown.
 * @csspart copy - The Copy button, a `gw-button`.
 *
 * @cssprop --gw-copy-font-family - The value's font. Defaults to `--gw-font-mono`.
 * @cssprop --gw-copy-font-size - The value's size. Defaults to `--gw-font-size-m`.
 * @cssprop --gw-copy-scale - Scales the Copy button to any size, around 1 for medium. `size` sets it.
 */
export class GwCopy extends GwElement {
  static override properties = {
    value: {},
    display: {},
    label: {},
    size: { reflect: true },
    labels: {},
    copyLabel: { attribute: "copy-label" },
    copiedLabel: { attribute: "copied-label" },
    copyFailedLabel: { attribute: "copy-failed-label" },
  } as const;

  static override styles = [
    base,
    controlSizes("copy"),
    css`
      :host {
        display: flex;
        gap: var(--gw-space-2);
        align-items: center;
        min-width: 0;
        padding: var(--gw-space-1) var(--gw-space-1) var(--gw-space-1)
          var(--gw-space-3);
        background: var(--gw-color-surface-lower);
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-control);
      }

      :host([size="medium"]) {
        --gw-copy-scale: 1;
      }

      .value {
        flex: 1 1 auto;
        min-width: 0;
        font-family: var(--gw-copy-font-family, var(--gw-font-mono));
        font-size: var(--gw-copy-font-size, var(--gw-font-size-m));
        font-variant-numeric: var(--gw-font-figures);
        color: var(--gw-color-text-strong);
        overflow-wrap: anywhere;
        user-select: all;
      }

      gw-button {
        flex: none;
        --gw-button-scale: var(--gw-copy-scale, 0.8);
      }

      .status {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ];

  declare value: string;
  declare display: string;
  declare label: string;
  declare size: string;
  declare labels: string;
  declare copyLabel: string;
  declare copiedLabel: string;
  declare copyFailedLabel: string;

  readonly #value = h("span", { class: "value", part: "value" });

  readonly #button = h("gw-button", {
    part: "copy",
    variant: "neutral",
    appearance: "plain",
    icon: copyIcon,
  });

  readonly #status = h("span", { class: "status", role: "status" });

  readonly #copy = new CopyFeedback(() => this.#showCopied());

  constructor() {
    super();
    this.value = "";
    this.display = "";
    this.label = "";
    this.size = "small";
    this.labels = "show";
    this.copyLabel = "Copy";
    this.copiedLabel = "Copied";
    this.copyFailedLabel = "Couldn't copy";
  }

  /** Copies the value, and resolves with whether it worked. */
  async copy() {
    const copied = await this.#copy.copy(this.value);

    // Selected, it's one Ctrl+C away where the clipboard isn't reachable
    if (!copied) getSelection()?.selectAllChildren(this.#value);

    return copied;
  }

  #showCopied() {
    const { state } = this.#copy;

    setAttribute(
      this.#button,
      "icon",
      state === "copied" ? copiedIcon : copyIcon,
    );
    this.#button.textContent =
      state === "copied"
        ? this.copiedLabel
        : state === "failed"
          ? this.copyFailedLabel
          : this.copyLabel;
    this.#status.textContent =
      state === "copied"
        ? this.copiedLabel
        : state === "failed"
          ? this.copyFailedLabel
          : "";
  }

  protected override create(root: ShadowRoot) {
    this.#button.addEventListener("click", () => void this.copy());
    root.append(this.#value, this.#button, this.#status);
  }

  protected override update() {
    this.#value.textContent = this.display === "" ? this.value : this.display;
    setAttribute(this.#value, "role", this.label === "" ? undefined : "group");
    setAttribute(
      this.#value,
      "aria-label",
      this.label === "" ? undefined : this.label,
    );
    setAttribute(this.#button, "labels", this.labels);
    setAttribute(this.#button, "disabled", this.value === "");
    this.#showCopied();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-copy": GwCopy;
  }
}
