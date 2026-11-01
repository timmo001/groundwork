/**
 * `gw-button`: the button, in every variant, appearance and size.
 * Docs: https://groundwork.timmo.dev/components/actions/#button
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, controlSizes, createIcon, setIconPath } from "./styles.js";

/**
 * A native button styled through `--gw-*` variables, so it follows the
 * theme and mode around it. With `href` it renders a link that looks the
 * same. Put an icon in the `icon` slot.
 *
 * For a link the page's HTML has to carry, such as one with `rel="me"`, a
 * `target` or `aria-current="page"`, put a plain `<a>` inside instead of
 * `href`. The button styles it, a click anywhere on the pill follows it, and
 * `aria-current` on it gets a current style.
 *
 * `variant` picks the color and `appearance` how it's applied, from most to
 * least important: `accent` (a solid fill), `filled` (a soft tint),
 * `outlined` (a stroke) or `plain` (text only). Every button is a pill.
 * Sizes run `xs` to `xl`, and `--gw-button-scale` sets any size in between.
 *
 * While `loading`, a spinning ring takes the icon's place, or the text's
 * when there's no icon, so the button keeps its size, and clicks are
 * ignored. The icon fades back once it's done.
 *
 * @element gw-button
 * @summary A pill button, or a link that looks like one.
 *
 * @attr {"brand"|"neutral"|"info"|"success"|"warning"|"danger"} variant - The color. Defaults to `brand`.
 * @attr {"accent"|"filled"|"outlined"|"plain"} appearance - How the color is applied. Defaults to `accent`.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The size, 24 to 56px tall. Defaults to `medium`.
 * @attr {"button"|"submit"|"reset"} type - The native button type. Defaults to `button`.
 * @attr {string} href - Renders a link to this address instead of a button.
 * @attr {string} label - The accessible name, when the text alone isn't enough.
 * @attr {boolean} disabled - Disables the button.
 * @attr {boolean} loading - Shows a spinning ring in the icon's place and ignores clicks.
 * @attr {string} icon - SVG path data for an icon before the text.
 * @attr {string} swatch - A CSS color, drawn as a small round dot in the icon's place, such as a tag's own color.
 * @attr {"show"|"hide"|"auto"} labels - Whether the text shows beside an icon: always, never, or not on narrow screens. Defaults to `show`.
 *
 * @slot - The text, or an `<a>` holding it, in place of `href`.
 * @slot icon - An icon before the text, in place of `icon`.
 *
 * @csspart button - The native button or link, or the pill around a slotted link.
 *
 * @cssprop --gw-button-scale - Scales every dimension, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icon with the theme's density. The theme sets it.
 * @cssprop --gw-button-tone - The color, set by `variant`.
 * @cssprop --gw-button-ink - The text color, when it differs from the tone.
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
    swatch: {},
    labels: { reflect: true },
  } as const;

  /** Focusing the element focuses its native button, such as from a dialog opening. */
  static override shadowRootOptions: ShadowRootInit = {
    mode: "open",
    delegatesFocus: true,
  };

  static override styles = [
    base,
    controlSizes("button"),
    css`
      :host {
        --gw-button-tone: var(--gw-color-accent);

        display: inline-block;
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
        --gw-size: var(--gw-button-scale, 1);
        --gw-scale: calc(var(--gw-size) * var(--gw-control-scale, 1));
        --gw-icon-size: calc(1.125rem * var(--gw-scale));

        position: relative;
        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-size));
        align-items: center;
        justify-content: center;
        min-height: calc(2.5rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-4) * var(--gw-size));
        font: inherit;
        font-size: calc(var(--gw-font-size-s) * var(--gw-size));
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

      /* The tint lowers the tone's contrast, so the text leans toward the
         strongest text color to stay readable on it */
      :host([appearance="filled"]) .button {
        color: var(
          --gw-button-ink,
          color-mix(
            in oklch,
            var(--gw-button-tone) 70%,
            var(--gw-color-text-strong)
          )
        );
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

      /* A slotted link carries the text; the pill draws its focus ring */
      ::slotted(a) {
        color: inherit;
        text-decoration: none;
        outline: none;
      }

      .button.focused {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      :host([appearance="plain"]) .button.current,
      :host([appearance="outlined"]) .button.current {
        background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
      }

      :host([appearance="filled"]) .button.current {
        background: color-mix(in oklch, var(--gw-button-tone) 32%, transparent);
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

      /* The icon slot is display: contents, so its slotted icon is a grid
         item of its own and needs the shared cell too */
      .lead > *,
      ::slotted([slot="icon"]) {
        grid-area: 1 / 1;
      }

      /* A color dot in the icon's place */
      .swatch {
        width: calc(var(--gw-icon-size) * 0.6);
        height: calc(var(--gw-icon-size) * 0.6);
        border: 1px solid
          color-mix(in oklab, var(--gw-color-text-primary) 20%, transparent);
        border-radius: 50%;
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
  /** A CSS color, drawn as a small round dot in the icon's place. */
  declare swatch: string;
  /** Whether the text shows beside an icon: always, never, or not on narrow screens. */
  declare labels: "show" | "hide" | "auto";

  readonly #icon = createIcon("");

  readonly #iconSlot = h("slot", { name: "icon" });

  readonly #swatch = h("span", { class: "swatch", "aria-hidden": "true" });

  // Typed, since inferring through h() and the tag map that holds this
  // element is circular for consumers that type-check the source
  readonly #lead: HTMLSpanElement = h(
    "span",
    { class: "lead" },
    this.#icon,
    this.#swatch,
    this.#iconSlot,
    h("span", { class: "ring" }),
  );

  readonly #text: HTMLSpanElement = h("span", { class: "text" }, h("slot"));

  readonly #over = h("span", { class: "ring over" });

  #control: HTMLButtonElement | HTMLAnchorElement | HTMLSpanElement = h(
    "button",
    {
      class: "button",
      part: "button",
    },
  );

  /** A plain `<a>` the page put inside, which the button wraps instead of `href`. */
  #link(): HTMLAnchorElement | null {
    return this.querySelector(":scope > a:not([slot])");
  }

  constructor() {
    super();
    this.icon = "";
    this.swatch = "";
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

        return;
      }

      // A click on the pill around a slotted link follows the link
      const link = this.#link();

      if (link !== null && !event.composedPath().includes(link)) {
        link.click();
      }
    });

    const focus = () => {
      this.#control.classList.toggle(
        "focused",
        this.#link()?.matches(":focus-visible") === true,
      );
    };

    this.addEventListener("focusin", focus);
    this.addEventListener("focusout", focus);

    this.#iconSlot.addEventListener("slotchange", () => {
      this.requestUpdate("icon");
    });

    this.#text.addEventListener("slotchange", () => {
      this.requestUpdate("href");
    });

    new MutationObserver(() => {
      this.requestUpdate("href");
    }).observe(this, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-current"],
    });
  }

  protected override create(root: ShadowRoot) {
    this.#control.append(this.#lead, this.#text, this.#over);
    root.append(this.#control);
  }

  protected override update(changed: ReadonlySet<string>) {
    const link = this.#link();

    if (changed.has("href")) {
      const wanted = link ? "SPAN" : this.href ? "A" : "BUTTON";

      if (this.#control.tagName !== wanted) {
        const next = h(link ? "span" : this.href ? "a" : "button", {
          class: "button",
          part: "button",
        });

        next.append(...this.#control.childNodes);
        this.#control.replaceWith(next);
        this.#control = next;
      }
    }

    const control = this.#control;

    const hasIcon =
      this.icon !== "" ||
      this.swatch !== "" ||
      this.querySelector("[slot='icon']") !== null;

    control.classList.toggle("has-icon", hasIcon);
    control.classList.toggle(
      "current",
      link !== null &&
        (link.getAttribute("aria-current") ?? "false") !== "false",
    );
    setIconPath(this.#icon, this.icon);
    this.#icon.style.display = this.icon ? "" : "none";
    this.#swatch.style.background = this.swatch;
    this.#swatch.hidden = this.swatch === "" || this.icon !== "";
    setAttribute(
      control,
      "title",
      hasIcon && this.labels !== "show"
        ? this.textContent.trim() || null
        : null,
    );
    setAttribute(control, "aria-busy", this.loading ? "true" : null);

    if (control instanceof HTMLSpanElement) {
      // The slotted link is the control, so it carries the name
      setAttribute(control, "aria-label", null);
    } else {
      setAttribute(control, "aria-label", this.label || null);
    }

    if (control instanceof HTMLAnchorElement) {
      setAttribute(control, "href", this.disabled ? null : this.href);
      setAttribute(control, "aria-disabled", this.disabled ? "true" : null);
    } else if (control instanceof HTMLButtonElement) {
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
