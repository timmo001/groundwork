import { css, h } from "./element.js";
import "./gw-button.js";
import { animateHeight } from "./motion.js";

/**
 * The discard view's styles, for any surface that uses `Dismissal`. While it
 * asks, the surface shows only the question, in place of its content, since
 * an overlay never opens another over itself.
 */
export const dismissalStyles = css`
  .discard {
    display: none;
  }

  [data-view="discard"] > :not(.discard) {
    display: none;
  }

  [data-view="discard"] > .discard {
    display: block;
  }

  .discard p {
    margin: 0;
    font-size: var(--gw-font-size-m);
    font-weight: var(--gw-font-weight-strong);
    color: var(--gw-color-text-strong);
  }

  .discard footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gw-space-2);
    justify-content: flex-end;
    margin-block-start: var(--gw-space-4);
    padding: 0;
  }
`;

/**
 * Shared by dialogs and popovers that hold edits, so they close the same
 * way: at once while nothing has changed, and only after asking once
 * something has. Content `input` and `change` events mark it changed, and
 * actions marked `data-needs-changes`, such as Save, stay disabled until
 * then. The question replaces the content in the same surface rather than
 * opening a second layer.
 */
export class Dismissal {
  dirty = false;

  readonly #host: HTMLElement;

  readonly #surface: HTMLElement;

  readonly #close: () => void;

  readonly #resized: () => void;

  readonly #keep = h(
    "gw-button",
    { size: "small", variant: "neutral", appearance: "plain" },
    "Keep editing",
  );

  readonly #discard = h(
    "gw-button",
    { size: "small", variant: "danger" },
    "Discard",
  );

  readonly #view = h(
    "div",
    { class: "discard", role: "alert" },
    h("p", {}, "Discard your changes?"),
    h("footer", {}, this.#keep, this.#discard),
  );

  constructor(
    host: HTMLElement,
    surface: HTMLElement,
    close: () => void,
    resized: () => void = () => undefined,
  ) {
    this.#host = host;
    this.#surface = surface;
    this.#close = close;
    this.#resized = resized;
    surface.append(this.#view);

    for (const type of ["input", "change"]) {
      host.addEventListener(type, () => {
        this.mark(true);
      });
    }

    this.#keep.addEventListener("click", () => {
      this.keep();
    });
    this.#discard.addEventListener("click", () => {
      this.#close();
    });
  }

  /** Whether it's showing the question rather than the content. */
  get asking() {
    return this.#surface.dataset.view === "discard";
  }

  /** Marks it changed or not, and enables or disables the actions that need a change. */
  mark(dirty: boolean) {
    this.dirty = dirty;

    for (const action of this.#host.querySelectorAll("[data-needs-changes]")) {
      action.toggleAttribute("disabled", !dirty);
    }
  }

  /** Back to a clean slate, showing the content, as when it opens. */
  reset() {
    this.mark(false);
    delete this.#surface.dataset.view;
  }

  /**
   * Closes at once when nothing changed, or asks first. Asked again while
   * the question shows, such as a second Esc, it goes back to editing.
   */
  request() {
    if (this.asking) {
      this.keep();
    } else if (this.dirty) {
      this.#swap(() => {
        this.#surface.dataset.view = "discard";
      });
      this.#keep.focus();
    } else {
      this.#close();
    }
  }

  /** Goes back to the content, with its edits as they were. */
  keep() {
    this.#swap(() => {
      delete this.#surface.dataset.view;
    });

    const first = this.#host.querySelector("[slot='actions']");

    if (first instanceof HTMLElement) first.focus();
  }

  #swap(change: () => void) {
    const before = this.#surface.offsetHeight;

    change();
    this.#resized();
    animateHeight(this.#surface, before);
  }
}
