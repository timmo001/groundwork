import { h } from "./element.js";
import "./gw-button.js";
// Type only: gw-popover imports this module, and whichever host uses it has
// defined gw-popover by the time a prompt is needed
import type { GwPopover } from "./gw-popover.js";

/**
 * Shared by dialogs and popovers that hold edits, so they close the same
 * way: at once while nothing has changed, and only after asking once
 * something has. Content `input` and `change` events mark it changed, and
 * actions marked `data-needs-changes`, such as Save, stay disabled until
 * then.
 */
export class Dismissal {
  dirty = false;

  readonly #host: HTMLElement;

  readonly #close: () => void;

  readonly #mount: (prompt: GwPopover) => void;

  #prompt: GwPopover | undefined;

  constructor(
    host: HTMLElement,
    close: () => void,
    mount: (prompt: GwPopover) => void,
  ) {
    this.#host = host;
    this.#close = close;
    this.#mount = mount;

    for (const type of ["input", "change"]) {
      host.addEventListener(type, (event) => {
        // Only the content's edits count, not the prompt's
        if (this.#prompt && event.composedPath().includes(this.#prompt)) return;

        this.mark(true);
      });
    }
  }

  /** Marks it changed or not, and enables or disables the actions that need a change. */
  mark(dirty: boolean) {
    this.dirty = dirty;

    for (const action of this.#host.querySelectorAll("[data-needs-changes]")) {
      action.toggleAttribute("disabled", !dirty);
    }
  }

  /** Closes at once when nothing changed, or asks first, from `anchor` when there is one. */
  request(anchor?: Element) {
    if (this.dirty) {
      this.#ask().show(anchor);
    } else {
      this.#close();
    }
  }

  // Made on first use, since the prompt is a popover itself
  #ask() {
    if (this.#prompt !== undefined) return this.#prompt;

    const prompt = h(
      "gw-popover",
      { confirm: true },
      h("p", {}, "Discard your changes?"),
      h(
        "gw-button",
        {
          slot: "actions",
          size: "small",
          variant: "neutral",
          appearance: "plain",
          value: "keep",
        },
        "Keep editing",
      ),
      h(
        "gw-button",
        { slot: "actions", size: "small", variant: "danger", value: "discard" },
        "Discard",
      ),
    );

    prompt.addEventListener("close", (event) => {
      // The answer is the host's business, not the page's
      event.stopPropagation();

      if (prompt.returnValue === "discard") this.#close();
    });
    this.#mount(prompt);
    this.#prompt = prompt;

    return prompt;
  }
}
