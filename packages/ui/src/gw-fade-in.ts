/**
 * `gw-fade-in`: fades its content in after a delay.
 * Docs: https://groundwork.timmo.dev/components/feedback/#fading-in
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { fadeEasing, fadeIn, motionDuration, reducedMotion } from "./motion.js";

/**
 * Waits `delay` milliseconds, then fades its content in over `duration`.
 * Wrap a skeleton in one with a delay, so a quick load never flashes a
 * placeholder, and wrap content as it arrives so it eases in rather than
 * popping. With reduced motion it still waits, then shows at once. The tokens
 * stylesheet hides it until it's defined, so its content never shows first.
 *
 * @element gw-fade-in
 * @summary Fades its content in after a delay.
 *
 * @attr {number} delay - Milliseconds to wait before fading in. Defaults to 0.
 * @attr {number} duration - Milliseconds the fade takes. Defaults to `--gw-motion-slow`.
 *
 * @slot - The content to fade in.
 */
export class GwFadeIn extends GwElement {
  static override properties = {
    delay: { type: "number" },
    duration: { type: "number" },
  } as const;

  static override styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];

  declare delay: number;
  declare duration: number | undefined;

  #animation: Animation | undefined;

  constructor() {
    super();
    this.delay = 0;
    this.duration = undefined;
  }

  protected override create(root: ShadowRoot) {
    root.append(h("slot"));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#fadeIn();
  }

  override disconnectedCallback() {
    this.#animation?.cancel();
    this.#animation = undefined;
  }

  /** Fades the content out, then runs the wait and fade in again. */
  async replay() {
    const from = Number(getComputedStyle(this).opacity);

    if (from > 0 && !reducedMotion()) {
      this.#animation?.cancel();

      const out = this.animate([{ opacity: from }, { opacity: 0 }], {
        duration: motionDuration(this, "--gw-motion-fast", 150),
        easing: fadeEasing,
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
    this.#animation = fadeIn(
      this,
      this.duration && this.duration > 0
        ? { delay: this.delay || 0, duration: this.duration }
        : { delay: this.delay || 0 },
    );
  }
}

GwFadeIn.define("gw-fade-in");

declare global {
  interface HTMLElementTagNameMap {
    "gw-fade-in": GwFadeIn;
  }
}
