/**
 * `gw-toaster`: brief, non-interactive toasts in the bottom end corner.
 * Docs: https://groundwork.timmo.dev/components/feedback/#toast
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import { fadeEasing, motionDuration, reducedMotion } from "./motion.js";
import { base, type Tone } from "./styles.js";

/**
 * Where toasts appear: the bottom corner on the end side, away from what
 * people click. Call `show(message, tone)`; each toast is announced politely
 * and fades out after `duration` milliseconds.
 *
 * A toast only tells; it has no actions and lets every click through, since
 * it may sit over something interactive and leaves before it can be used.
 * It's in the top layer and rises above any dialog each time one shows. It's
 * a last resort: show an outcome where it happened instead.
 *
 * @element gw-toaster
 * @summary Brief, non-interactive toasts in the bottom end corner.
 *
 * @attr {number} duration - Milliseconds each toast shows for. Defaults to 5000.
 */
export class GwToaster extends GwElement {
  static override properties = {
    duration: { type: "number" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        position: fixed;
        inset: auto var(--gw-space-4) var(--gw-space-4) auto;
        width: min(22rem, calc(100vw - 2 * var(--gw-space-4)));
        padding: 0;
        margin: 0;
        overflow: visible;
        color: inherit;
        pointer-events: none;
        user-select: none;
        background: none;
        border: 0;
      }

      :host(:dir(rtl)) {
        inset: auto auto var(--gw-space-4) var(--gw-space-4);
      }

      :host(:not(:popover-open)) {
        display: none;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-1);
        align-items: flex-end;
      }

      .toast {
        max-width: 100%;
        padding: var(--gw-space-2) var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-overlay);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-inline-start: calc(var(--gw-border-width) * 4) solid
          var(--gw-toast-tone);
        border-radius: var(--gw-radius-control);
        box-shadow: var(--gw-shadow-m);
      }
    `,
  ];

  declare duration: number;

  readonly #list = h("div", {
    class: "list",
    role: "status",
    "aria-live": "polite",
  });

  constructor() {
    super();
    this.duration = 5000;
  }

  override connectedCallback() {
    this.setAttribute("popover", "manual");
    super.connectedCallback();
    document.addEventListener("gw-dialog-open", this.#onDialogOpen);
    // It stays open while empty, as nothing in it can be clicked, so the
    // live region is in place before a message arrives.
    this.#raise();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("gw-dialog-open", this.#onDialogOpen);
  }

  readonly #onDialogOpen = () => {
    if (this.#list.childElementCount > 0) this.#raise();
  };

  protected override create(root: ShadowRoot) {
    root.append(this.#list);
  }

  show(message: string, tone: Tone = "neutral") {
    const toast = h("div", { class: "toast" }, message);

    toast.style.setProperty(
      "--gw-toast-tone",
      tone === "neutral"
        ? "var(--gw-color-border-loud)"
        : `var(--gw-color-${tone})`,
    );
    this.#raise();
    this.#list.append(toast);

    const reduced = reducedMotion();
    const slow = motionDuration(this, "--gw-motion-slow", 350);

    toast.animate(
      [
        { opacity: 0, translate: "0 0.5rem" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: reduced ? 0 : slow, easing: fadeEasing },
    );

    setTimeout(() => {
      const leave = toast.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reduced ? 0 : slow,
        easing: fadeEasing,
        fill: "forwards",
      });

      leave.addEventListener("finish", () => toast.remove());
      leave.addEventListener("cancel", () => toast.remove());
    }, this.duration);
  }

  /**
   * Puts the toaster on top of the top layer, above any dialog opened since
   * it last showed.
   */
  #raise() {
    if (!this.isConnected) return;

    if (this.matches(":popover-open")) this.hidePopover();

    this.showPopover();
  }
}

GwToaster.define("gw-toaster");

declare global {
  interface HTMLElementTagNameMap {
    "gw-toaster": GwToaster;
  }
}
