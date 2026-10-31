const sheet = new CSSStyleSheet();

sheet.replaceSync(":host { display: block; }");

/**
 * Waits `delay` milliseconds, then fades its content in over `duration`.
 * Wrap a skeleton in one with a delay, so a quick load never flashes a
 * placeholder, and wrap content as it arrives so it eases in rather than
 * popping. With reduced motion it still waits, then shows at once.
 *
 * @attr delay - Milliseconds to wait before fading in. Defaults to 0.
 * @attr duration - Milliseconds the fade takes. Defaults to `--gw-motion-normal`.
 */
export class GwFadeIn extends HTMLElement {
  static readonly observedAttributes = ["delay", "duration"];

  #animation: Animation | undefined;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });

    root.adoptedStyleSheets = [sheet];
    root.append(document.createElement("slot"));
  }

  get delay() {
    return Number(this.getAttribute("delay") ?? 0) || 0;
  }

  set delay(value: number) {
    this.setAttribute("delay", String(value));
  }

  get duration() {
    const own = Number(this.getAttribute("duration"));

    if (own > 0) return own;

    return (
      Number.parseFloat(
        getComputedStyle(this).getPropertyValue("--gw-motion-normal"),
      ) || 250
    );
  }

  set duration(value: number) {
    this.setAttribute("duration", String(value));
  }

  connectedCallback() {
    this.replay();
  }

  disconnectedCallback() {
    this.#animation?.cancel();
    this.#animation = undefined;
  }

  /** Hides the content and runs the wait and fade again. */
  replay() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.#animation?.cancel();
    this.#animation = this.animate([{ opacity: 0 }, { opacity: 1 }], {
      delay: this.delay,
      duration: reduced ? 0 : this.duration,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      fill: "both",
    });
  }
}

customElements.define("gw-fade-in", GwFadeIn);

declare global {
  interface HTMLElementTagNameMap {
    "gw-fade-in": GwFadeIn;
  }
}
