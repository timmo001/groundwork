/**
 * `Below`, which follows whether the viewport is narrower than a CSS length,
 * for elements whose `*-below` attribute sets where they change. A media
 * query in a stylesheet can't read an attribute or a custom property, so
 * the element follows the width here and sets a class instead.
 *
 * @module
 */

export class Below {
  #query: MediaQueryList | undefined;

  #width = "";

  /** Runs `onChange` each time the viewport crosses the width it follows. */
  constructor(readonly onChange: () => void) {}

  /** Whether the viewport is narrower than the width it follows. */
  get matches() {
    return this.#query?.matches === true;
  }

  /** Follows `width`, a CSS length such as `40rem`, or nothing with `""`. */
  follow(width: string) {
    if (width === this.#width) return;

    this.stop();
    this.#width = width;

    if (width === "") return;

    this.#query = window.matchMedia(`(width < ${width})`);
    this.#query.addEventListener("change", this.onChange);
  }

  /** Stops following, such as when the element is removed. */
  stop() {
    this.#query?.removeEventListener("change", this.onChange);
    this.#query = undefined;
    this.#width = "";
  }
}
