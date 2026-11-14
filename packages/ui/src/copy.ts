/**
 * Copying text to the clipboard with the feedback a Copy button gives:
 * what happened for a moment, then its label again. `gw-copy` and `gw-code`
 * share it, so both read and time the same.
 *
 * @module
 */

// MDI's content-copy and check
export const copyIcon =
  "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";

export const copiedIcon =
  "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

/** How long a Copy button says what happened before it's back. */
export const copiedFor = 2000;

/** What a Copy button shows: its label, or what just happened. */
export type CopyState = "idle" | "copied" | "failed";

/**
 * Copies text and holds what happened for `copiedFor`, calling `show` each
 * time that changes. Copying fails where the page has no clipboard access,
 * such as over plain HTTP on a local address.
 */
export class CopyFeedback {
  state: CopyState = "idle";

  readonly #show: (state: CopyState) => void;

  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(show: (state: CopyState) => void) {
    this.#show = show;
  }

  /** Copies the text, and resolves with whether it worked. */
  async copy(text: string) {
    let copied = true;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      copied = false;
    }

    this.#set(copied ? "copied" : "failed");
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#set("idle"), copiedFor);

    return copied;
  }

  #set(state: CopyState) {
    this.state = state;
    this.#show(state);
  }
}
