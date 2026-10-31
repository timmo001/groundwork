import { GwElement, css, h, setAttribute } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

/**
 * A native button styled through `--gw-*` variables, so it follows the
 * theme and mode around it. With `href` it renders a link that looks the
 * same. Put an icon in the `icon` slot.
 *
 * `variant` picks the color and `appearance` how it's applied, from most to
 * least important: `accent` (a solid fill), `filled` (a soft tint),
 * `outlined` (a stroke) or `plain` (text only). Every button is a pill.
 * Sizes run `xs` to `xl`, and `--gw-button-scale` sets any size in between.
 *
 * While `loading`, a spinning ring takes the icon's place, or the text's
 * when there's no icon, so the button keeps its size, and clicks are
 * ignored. The icon fades back once it's done.
 */
export class GwButton extends GwElement {
  static override properties = {
    variant: { reflect: true },
    appearance: { reflect: true },
    size: { reflect: true },
    type: {},
    href: {},
    label: {},
    disabled: { type: "boolean", reflect: true },
    loading: { type: "boolean", reflect: true },
    icon: {},
    labels: { reflect: true },
  } as const;

  /** Focusing the element focuses its native button, such as from a dialog opening. */
  static override shadowRootOptions: ShadowRootInit = {
    mode: "open",
    delegatesFocus: true,
  };

  static override styles = [
    base,
    css`
      :host {
        --gw-button-tone: var(--gw-color-accent);

        display: inline-block;
      }

      /* Everything scales from --gw-button-scale, around a 40px medium
         button: the presets give 24, 32, 48 and 56px, and an app can set any
         value for a size between or beyond them */
      :host([size="xs"]) {
        --gw-button-scale: 0.6;
      }

      :host([size="small"]) {
        --gw-button-scale: 0.8;
      }

      :host([size="large"]) {
        --gw-button-scale: 1.2;
      }

      :host([size="xl"]) {
        --gw-button-scale: 1.4;
      }

      :host([variant="neutral"]) {
        --gw-button-tone: var(--gw-color-text-secondary);
        --gw-button-ink: var(--gw-color-text-strong);
      }

      :host([variant="info"]) {
        --gw-button-tone: var(--gw-color-info);
      }

      :host([variant="success"]) {
        --gw-button-tone: var(--gw-color-success);
      }

      :host([variant="warning"]) {
        --gw-button-tone: var(--gw-color-warning);
      }

      :host([variant="danger"]) {
        --gw-button-tone: var(--gw-color-danger);
      }

      .button {
        --gw-scale: var(--gw-button-scale, 1);
        --gw-icon-size: calc(1.125rem * var(--gw-scale));

        position: relative;
        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-scale));
        align-items: center;
        justify-content: center;
        min-height: calc(2.5rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-4) * var(--gw-scale));
        font: inherit;
        font-size: calc(var(--gw-font-size-s) * var(--gw-scale));
        font-weight: var(--gw-font-weight-strong);
        line-height: 1;
        color: var(--gw-button-ink, var(--gw-button-tone));
        text-decoration: none;
        text-transform: var(--gw-label-transform);
        letter-spacing: var(--gw-label-tracking);
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: max(var(--gw-border-width), 1px) solid transparent;
        border-radius: var(--gw-radius-pill);
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          border-color var(--gw-motion-fast) var(--gw-motion-easing),
          color var(--gw-motion-fast) var(--gw-motion-easing),
          scale var(--gw-motion-fast) var(--gw-motion-easing);
      }

      /* A slight press, so a click feels physical */
      .button:active {
        scale: 0.97;
      }

      .button:hover {
        background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
      }

      .button:active {
        background: color-mix(in oklch, var(--gw-button-tone) 24%, transparent);
      }

      /* A solid fill, with text that flips between black and white by the
         fill's lightness so it reads on every theme's colors */
      :host([appearance="accent"]) .button {
        color: oklch(
          from var(--gw-button-tone) clamp(0, (0.66 - l) * 1000, 1) 0 0
        );
        background: var(--gw-button-tone);
      }

      :host([appearance="accent"]) .button:hover {
        background: oklch(
          from var(--gw-button-tone) calc(l + (0.6 - l) * 0.2) c h
        );
      }

      :host([appearance="accent"]) .button:active {
        background: oklch(
          from var(--gw-button-tone) calc(l + (0.6 - l) * 0.35) c h
        );
      }

      :host([appearance="filled"]) .button {
        background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
      }

      :host([appearance="filled"]) .button:hover {
        background: color-mix(in oklch, var(--gw-button-tone) 24%, transparent);
      }

      :host([appearance="filled"]) .button:active {
        background: color-mix(in oklch, var(--gw-button-tone) 32%, transparent);
      }

      :host([appearance="outlined"]) .button {
        border-color: var(--gw-button-tone);
      }

      .button:disabled,
      .button[aria-disabled="true"] {
        color: var(--gw-color-text-disabled);
        pointer-events: none;
        cursor: not-allowed;
        background: var(--gw-color-fill-neutral-disabled);
        border-color: transparent;
      }

      :host([appearance="plain"]) .button:disabled,
      :host([appearance="plain"]) .button[aria-disabled="true"] {
        background: transparent;
      }

      ::slotted([slot="icon"]),
      .icon {
        flex: none;
        width: var(--gw-icon-size);
        height: var(--gw-icon-size);
        fill: currentColor;
      }

      /* The icon and the ring share one cell and crossfade */
      .lead {
        display: grid;
        place-items: center;
      }

      .lead > * {
        grid-area: 1 / 1;
      }

      .lead > *,
      .text,
      .ring {
        transition: opacity var(--gw-motion-normal) cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Sized to the icon's drawn area, which is inset in its 24px box */
      .ring {
        width: calc(var(--gw-icon-size) * 0.8);
        height: calc(var(--gw-icon-size) * 0.8);
        border: calc(2px * var(--gw-scale)) solid
          color-mix(in oklch, currentColor 25%, transparent);
        border-top-color: currentColor;
        border-radius: 50%;
        opacity: 0;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Without an icon, the ring sits over the hidden text */
      .ring.over {
        position: absolute;
        inset: 0;
        margin: auto;
      }

      :host([loading]) .button {
        cursor: progress;
      }

      :host([loading]) .lead > .ring,
      :host([loading]) .button:not(.has-icon) > .ring.over {
        opacity: 1;
      }

      :host([loading]) .lead > :not(.ring),
      :host([loading]) .button:not(.has-icon) > .text {
        opacity: 0;
      }

      .button:not(.has-icon) > .lead {
        display: none;
      }

      /* Icon only, to save space: square, with the text kept for assistive
         technology. auto does this on narrow screens */
      :host([labels="hide"]) .button.has-icon {
        min-width: calc(2.5rem * var(--gw-scale));
        padding: 0;
      }

      :host([labels="hide"]) .has-icon .text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (width < 40rem) {
        :host([labels="auto"]) .button.has-icon {
          min-width: calc(2.5rem * var(--gw-scale));
          padding: 0;
        }

        :host([labels="auto"]) .has-icon .text {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
      }
    `,
  ];

  declare variant:
    "brand" | "neutral" | "info" | "success" | "warning" | "danger";
  declare appearance: "accent" | "filled" | "outlined" | "plain";
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  declare type: "button" | "submit" | "reset";
  declare href: string;
  declare label: string;
  declare disabled: boolean;
  /** Shows a spinning ring in place of the icon and ignores clicks. */
  declare loading: boolean;
  /** SVG path data for an icon before the text. */
  declare icon: string;
  /** Whether the text shows beside an icon: always, never, or not on narrow screens. */
  declare labels: "show" | "hide" | "auto";

  readonly #icon = createIcon("");

  readonly #iconSlot = h("slot", { name: "icon" });

  readonly #lead = h(
    "span",
    { class: "lead" },
    this.#icon,
    this.#iconSlot,
    h("span", { class: "ring" }),
  );

  readonly #text = h("span", { class: "text" }, h("slot"));

  readonly #over = h("span", { class: "ring over" });

  #control: HTMLButtonElement | HTMLAnchorElement = h("button", {
    class: "button",
    part: "button",
  });

  constructor() {
    super();
    this.icon = "";
    this.labels = "show";
    this.variant = "brand";
    this.appearance = "accent";
    this.size = "medium";
    this.type = "button";
    this.href = "";
    this.label = "";
    this.disabled = false;
    this.loading = false;

    // Registered first, so it runs before any listener an app adds
    this.addEventListener("click", (event) => {
      if (this.loading) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });

    this.#iconSlot.addEventListener("slotchange", () => {
      this.requestUpdate("icon");
    });
  }

  protected override create(root: ShadowRoot) {
    this.#control.append(this.#lead, this.#text, this.#over);
    root.append(this.#control);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("href")) {
      const wanted = this.href ? "A" : "BUTTON";

      if (this.#control.tagName !== wanted) {
        const next = this.href
          ? h("a", { class: "button", part: "button" })
          : h("button", { class: "button", part: "button" });

        next.append(...this.#control.childNodes);
        this.#control.replaceWith(next);
        this.#control = next;
      }
    }

    const control = this.#control;

    const hasIcon =
      this.icon !== "" || this.querySelector("[slot='icon']") !== null;

    control.classList.toggle("has-icon", hasIcon);
    setIconPath(this.#icon, this.icon);
    this.#icon.style.display = this.icon ? "" : "none";
    setAttribute(
      control,
      "title",
      hasIcon && this.labels !== "show"
        ? this.textContent.trim() || null
        : null,
    );
    setAttribute(control, "aria-label", this.label || null);
    setAttribute(control, "aria-busy", this.loading ? "true" : null);

    if (control instanceof HTMLAnchorElement) {
      setAttribute(control, "href", this.disabled ? null : this.href);
      setAttribute(control, "aria-disabled", this.disabled ? "true" : null);
    } else {
      control.type = this.type;
      control.disabled = this.disabled;
    }
  }
}

GwButton.define("gw-button");

declare global {
  interface HTMLElementTagNameMap {
    "gw-button": GwButton;
  }
}
