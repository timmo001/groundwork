/**
 * `gw-action-button`: a button that runs an action and shows how it went
 * where it was pressed.
 * Docs: https://groundwork.timmo.dev/components/actions/#action-button
 *
 * @module
 */
import { copiedFor, copiedIcon } from "./copy.js";
import { GwElement, css, h, setAttribute } from "./element.js";
import type { GwButton } from "./gw-button.js";
import { base } from "./styles.js";

/** What a press runs: it resolves when it worked and rejects when it didn't. */
export type Action = () => Promise<void>;

/**
 * A button that runs `action` and shows its outcome in place, so nothing
 * needs a toast. While it runs the button shows its spinning ring and
 * ignores presses. Once it's worked the icon turns to a check and the text
 * to `done-label` for a moment, and a status announces it. When it fails,
 * why shows under the button as an alert until the next press: the
 * rejection's `message` when it's an `Error` with one, or `failed-label`.
 *
 * Set `quiet` where the page gathers failures in one place instead, such as
 * a `gw-alert` over several actions, and listen for `failed`.
 *
 * @element gw-action-button
 * @summary A button that runs an action and shows how it went where it was pressed.
 *
 * @attr {"brand"|"neutral"|"info"|"success"|"warning"|"danger"} variant - The button's color, as `gw-button`'s. Defaults to `brand`.
 * @attr {"accent"|"filled"|"outlined"|"plain"} appearance - How the color is applied, as `gw-button`'s. Defaults to `accent`.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The button's size, as `gw-button`'s. Defaults to `medium`.
 * @attr {string} icon - SVG path data for an icon before the text.
 * @attr {"show"|"hide"|"auto"} labels - Whether the text shows beside the icon, as `gw-button`'s. Defaults to `show`.
 * @attr {string} label - The accessible name, when the text alone isn't enough.
 * @attr {boolean} disabled - Disables the button. It's disabled too until it has an `action`.
 * @attr {boolean} quiet - Leaves out why it failed, for a page that shows that elsewhere.
 * @attr {string} done-label - What the button says and the status announces once it's worked. Defaults to `Done`.
 * @attr {string} failed-label - Why it failed, when the rejection doesn't say. Defaults to `That didn't work`.
 *
 * @slot - The button's text.
 *
 * @csspart button - The `gw-button`.
 * @csspart error - Why it failed, under the button.
 *
 * @fires {Event} done - When the action has worked.
 * @fires {CustomEvent<{ message: string }>} failed - When the action has failed, with why.
 */
export class GwActionButton extends GwElement {
  static override properties = {
    variant: { reflect: true },
    appearance: { reflect: true },
    size: { reflect: true },
    icon: {},
    labels: {},
    label: {},
    disabled: { type: "boolean", reflect: true },
    quiet: { type: "boolean", reflect: true },
    doneLabel: { attribute: "done-label" },
    failedLabel: { attribute: "failed-label" },
    action: { attribute: false },
  } as const;

  /** Focusing the element focuses its button. */
  static override shadowRootOptions: ShadowRootInit = {
    mode: "open",
    delegatesFocus: true,
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        flex-direction: column;
        gap: var(--gw-space-1);
        align-items: flex-start;
        max-width: 100%;
      }

      .error {
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-danger);
        overflow-wrap: anywhere;
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

  declare variant: string;
  declare appearance: string;
  declare size: string;
  declare icon: string;
  declare labels: string;
  declare label: string;
  declare disabled: boolean;
  declare quiet: boolean;
  declare doneLabel: string;
  declare failedLabel: string;
  /** What a press runs. */
  declare action: Action | undefined;

  // Typed, since inferring through h() and the tag map that holds this
  // element is circular for consumers that type-check the source
  readonly #text: HTMLSpanElement = h("span", {}, h("slot"));

  readonly #done: HTMLSpanElement = h("span");

  readonly #button: GwButton = h(
    "gw-button",
    { part: "button" },
    this.#text,
    this.#done,
  );

  readonly #error: HTMLDivElement = h("div", {
    class: "error",
    part: "error",
    role: "alert",
  });

  readonly #status: HTMLSpanElement = h("span", {
    class: "status",
    role: "status",
  });

  #running = false;

  #succeeded = false;

  #failure = "";

  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.variant = "brand";
    this.appearance = "accent";
    this.size = "medium";
    this.icon = "";
    this.labels = "show";
    this.label = "";
    this.disabled = false;
    this.quiet = false;
    this.doneLabel = "Done";
    this.failedLabel = "That didn't work";
    this.action = undefined;
  }

  /** Runs the action, as a press does, and resolves with whether it worked. */
  async run() {
    const { action } = this;

    if (action === undefined || this.#running || this.disabled) return false;

    clearTimeout(this.#timer);
    this.#running = true;
    this.#succeeded = false;
    this.#failure = "";
    this.requestUpdate("action");

    let worked = true;

    try {
      await action();
    } catch (error) {
      worked = false;
      this.#failure =
        error instanceof Error && error.message !== ""
          ? error.message
          : this.failedLabel;
    }

    this.#running = false;
    this.#succeeded = worked;

    if (worked) {
      this.#timer = setTimeout(() => {
        this.#succeeded = false;
        this.requestUpdate("action");
      }, copiedFor);
      this.dispatchEvent(new Event("done", { bubbles: true, composed: true }));
    } else {
      this.dispatchEvent(
        new CustomEvent("failed", {
          detail: { message: this.#failure },
          bubbles: true,
          composed: true,
        }),
      );
    }

    this.requestUpdate("action");

    return worked;
  }

  override disconnectedCallback() {
    clearTimeout(this.#timer);
    super.disconnectedCallback();
  }

  protected override create(root: ShadowRoot) {
    this.#button.addEventListener("click", () => void this.run());
    root.append(this.#button, this.#error, this.#status);
  }

  protected override update() {
    const button = this.#button;

    setAttribute(button, "variant", this.variant);
    setAttribute(button, "appearance", this.appearance);
    setAttribute(button, "size", this.size);
    setAttribute(button, "labels", this.labels);
    setAttribute(button, "label", this.label || null);
    setAttribute(button, "icon", this.#succeeded ? copiedIcon : this.icon);
    button.loading = this.#running;
    button.disabled = this.disabled || this.action === undefined;

    this.#text.hidden = this.#succeeded;
    this.#done.hidden = !this.#succeeded;
    this.#done.textContent = this.doneLabel;
    this.#status.textContent = this.#succeeded ? this.doneLabel : "";

    this.#error.textContent = this.quiet ? "" : this.#failure;
    this.#error.hidden = this.quiet || this.#failure === "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-action-button": GwActionButton;
  }
}
