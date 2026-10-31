const sheet = new CSSStyleSheet();

sheet.replaceSync(":host { display: block; }");

// Opacity reads as a pop with a decelerating curve, since most of the change
// lands in the first frames, so fades ease in and out.
const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const motion = (element: Element, token: string, fallback: number) =>
  Number.parseFloat(getComputedStyle(element).getPropertyValue(token)) ||
  fallback;

/**
 * Waits `delay` milliseconds, then fades its content in over `duration`.
 * Wrap a skeleton in one with a delay, so a quick load never flashes a
 * placeholder, and wrap content as it arrives so it eases in rather than
 * popping. With reduced motion it still waits, then shows at once. The tokens
 * stylesheet hides it until it's defined, so its content never shows first.
 *
 * @attr delay - Milliseconds to wait before fading in. Defaults to 0.
 * @attr duration - Milliseconds the fade takes. Defaults to `--gw-motion-slow`.
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

    return motion(this, "--gw-motion-slow", 350);
  }

  set duration(value: number) {
    this.setAttribute("duration", String(value));
  }

  connectedCallback() {
    this.#fadeIn();
  }

  disconnectedCallback() {
    this.#animation?.cancel();
    this.#animation = undefined;
  }

  /** Fades the content out, then runs the wait and fade in again. */
  async replay() {
    const from = Number(getComputedStyle(this).opacity);

    if (from > 0 && !reducedMotion()) {
      this.#animation?.cancel();

      const out = this.animate([{ opacity: from }, { opacity: 0 }], {
        duration: motion(this, "--gw-motion-fast", 150),
        easing,
        fill: "forwards",
      });

      this.#animation = out;

      try {
        await out.finished;
      } catch {
        return;
      }

      if (this.#animation !== out) return;
    }

    this.#fadeIn();
  }

  #fadeIn() {
    this.#animation?.cancel();
    this.#animation = this.animate([{ opacity: 0 }, { opacity: 1 }], {
      delay: this.delay,
      duration: reducedMotion() ? 0 : this.duration,
      easing,
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
