import { LitElement, css, html, nothing } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { base, icon } from "./styles.js";

export interface Segment {
  readonly value: string;
  readonly label: string;
  /** SVG path data for an icon beside, or instead of, the label. */
  readonly icon?: string;
}

/**
 * Picks one of a few options, as a row of native radio buttons, so arrow
 * keys move between them and a form submits the choice. Fires `change`.
 *
 * Options can carry icons, as Home Assistant's toggles do. `labels` decides
 * whether their text shows: `show` (the default), `hide` (icons only, with
 * the text as a tooltip and accessible name) or `auto`, which shows the text
 * on wide screens and only the icons on narrow ones.
 */
export class GwSegmented extends LitElement {
  static override properties = {
    label: {},
    name: {},
    value: { reflect: true },
    labels: { reflect: true },
    options: { type: Array },
  };

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
      }

      /* A pill track with the picked option as a pill inside, as Home
         Assistant's toggles are */
      fieldset {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        margin: 0;
        background: var(--gw-color-surface-lower);
        border: max(var(--gw-border-width), 1px) solid
          var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
      }

      legend {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      label {
        position: relative;
        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        /* 32px options in a 40px track, matching fields and buttons */
        height: 2rem;
        padding: 0 var(--gw-space-3);
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-primary);
        cursor: pointer;
        background: transparent;
        border-radius: var(--gw-radius-pill);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
        --gw-icon-size: 1.125rem;
      }

      :host([labels="hide"]) label.has-icon {
        padding-inline: var(--gw-space-2);
      }

      :host([labels="hide"]) label.has-icon .text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (width < 40rem) {
        :host([labels="auto"]) label.has-icon {
          padding-inline: var(--gw-space-2);
        }

        :host([labels="auto"]) label.has-icon .text {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
      }

      label:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0;
      }

      /* The picked pill is one element that slides between options, under
         their text, so the choice moves rather than jumps */
      fieldset {
        position: relative;
        isolation: isolate;
      }

      .indicator {
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        z-index: -1;
        background: var(--gw-color-fill-accent-resting);
        border-radius: var(--gw-radius-pill);
        box-shadow: var(--gw-shadow-s);
        opacity: 0;
      }

      .indicator.placed {
        opacity: 1;
      }

      .indicator.moving {
        transition:
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          width var(--gw-motion-normal) var(--gw-motion-easing),
          height var(--gw-motion-normal) var(--gw-motion-easing);
      }

      label {
        transition:
          background-color var(--gw-motion-fast) var(--gw-motion-easing),
          color var(--gw-motion-normal) var(--gw-motion-easing);
      }

      label:has(input:checked),
      label:has(input:checked):hover {
        color: var(--gw-color-on-accent);
        background: transparent;
      }

      label:has(input:focus-visible) {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        /* Inset, so the ring sits inside the track rather than on its border */
        outline-offset: calc(var(--gw-focus-width) * -1);
      }
    `,
  ];

  declare label: string;
  declare name: string;
  declare value: string;
  declare labels: "show" | "hide" | "auto";
  declare options: readonly Segment[];

  constructor() {
    super();
    this.label = "";
    this.name = `gw-segmented-${Math.random().toString(36).slice(2)}`;
    this.value = "";
    this.labels = "show";
    this.options = [];
  }

  readonly #indicator = createRef<HTMLSpanElement>();

  readonly #resize = new ResizeObserver(() => this.#place(false));

  #pick(value: string) {
    this.value = value;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  /** Puts the pill under the picked option, sliding there unless it's the first placing. */
  #place(animate: boolean) {
    const indicator = this.#indicator.value;

    if (indicator === undefined) return;

    const picked = [...(indicator.parentElement?.children ?? [])].find(
      (child) =>
        child instanceof HTMLLabelElement &&
        child.querySelector("input")?.checked === true,
    );

    if (!(picked instanceof HTMLLabelElement)) {
      indicator.classList.remove("placed");

      return;
    }

    indicator.classList.toggle(
      "moving",
      animate && indicator.classList.contains("placed"),
    );
    indicator.style.translate = `${picked.offsetLeft}px ${picked.offsetTop}px`;
    indicator.style.width = `${picked.offsetWidth}px`;
    indicator.style.height = `${picked.offsetHeight}px`;
    indicator.classList.add("placed");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#resize.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
  }

  override updated() {
    this.#place(true);
  }

  override render() {
    return html`<fieldset>
      <legend>${this.label}</legend>
      <span class="indicator" part="indicator" ${ref(this.#indicator)}></span>
      ${this.options.map(
        (option) =>
          html`<label
            class=${option.icon ? "has-icon" : ""}
            title=${option.icon && this.labels !== "show" ? option.label : nothing}
          >
            <input
              type="radio"
              name=${this.name}
              value=${option.value}
              .checked=${option.value === this.value}
              @change=${() => this.#pick(option.value)}
            />
            ${option.icon ? icon(option.icon) : nothing}
            <span class="text">${option.label}</span>
          </label>`,
      )}
    </fieldset>`;
  }
}

customElements.define("gw-segmented", GwSegmented);

declare global {
  interface HTMLElementTagNameMap {
    "gw-segmented": GwSegmented;
  }
}
