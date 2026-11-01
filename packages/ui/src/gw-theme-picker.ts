/**
 * `gw-theme-picker`: a button opening the page's mode, theme and import.
 * Docs: https://groundwork.timmo.dev/components/actions/#theme-picker
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import "./gw-button.js";
import type { OptionItem } from "./gw-option-list.js";
import "./gw-popover.js";
import "./gw-segmented.js";
import "./gw-select.js";
import "./gw-theme-gallery.js";
import { base } from "./styles.js";

// MDI's palette
const paletteIcon =
  "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z";

const modes = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "darker", label: "Darker" },
] as const;

/**
 * A palette button for a page's look. It opens a popover with the mode
 * (auto, light, dark or Darker), the theme, and buttons to import a theme
 * file (a Groundwork theme's `.json` or an Omarchy `colors.toml`) or reset.
 *
 * It only asks: it fires `mode`, `theme`, `import` and `reset`, and the page
 * applies them and sets `mode`, `theme` and `themes` back. `pageTheme` from
 * `@timmo001/groundwork-tokens/page` does all of that. Show an import's
 * result, such as contrast misses, in `status`.
 *
 * `gallery` swaps the theme select for `gw-theme-gallery`'s cards, which
 * preview each theme in the chosen mode.
 *
 * @element gw-theme-picker
 * @summary A button opening the page's mode, theme and import.
 *
 * @attr {"auto"|"light"|"dark"|"darker"} mode - The mode in use. Defaults to `auto`.
 * @attr {string} theme - The theme in use, by id.
 * @attr {OptionItem[]} themes - The themes to offer, as JSON. With `gallery`, a `group` gathers a family's themes.
 * @attr {boolean} gallery - Shows the themes as preview cards rather than a select.
 * @attr {string} status - A line under the controls, such as an import's result.
 * @attr {string} label - The button's accessible name and the popover's heading. Defaults to `Theme`.
 *
 * @csspart gallery - The theme gallery, with `gallery`.
 *
 * @fires {CustomEvent<{ mode: string }>} mode - When a mode is picked.
 * @fires {CustomEvent<{ id: string }>} theme - When a theme is picked.
 * @fires {CustomEvent<{ text: string, name: string }>} import - When a theme file is chosen, with its text and file name.
 * @fires {Event} reset - When Reset is pressed.
 */
export class GwThemePicker extends GwElement {
  static override properties = {
    mode: { reflect: true },
    theme: { reflect: true },
    themes: { type: "json" },
    gallery: { type: "boolean", reflect: true },
    status: {},
    label: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
      }

      :host([gallery]) gw-popover {
        --gw-popover-width: 34rem;
      }

      .gallery {
        max-height: min(24rem, 50vh);
        overflow: auto;
        /* Room for the cards' focus rings */
        padding: var(--gw-space-1);
        margin: calc(var(--gw-space-1) * -1);
      }

      .controls {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-4);
        margin-block-start: var(--gw-space-2);
      }

      .status {
        margin: 0;
        font-size: var(--gw-font-size-s);
        color: var(--gw-color-text-secondary);
      }
    `,
  ];

  declare mode: string;
  declare theme: string;
  declare themes: readonly OptionItem[];
  declare gallery: boolean;
  declare status: string;
  declare label: string;

  readonly #button = h("gw-button", {
    variant: "neutral",
    appearance: "plain",
    icon: paletteIcon,
    labels: "hide",
  });

  readonly #mode = h("gw-segmented");

  readonly #theme = h("gw-select", { label: "Theme" });

  readonly #gallery = h("gw-theme-gallery", {
    class: "gallery",
    part: "gallery",
  });

  readonly #status = h("p", { class: "status", role: "status" });

  readonly #file = h("input", {
    type: "file",
    accept: ".json,.toml,application/json",
    hidden: true,
  });

  readonly #popover = h(
    "gw-popover",
    {},
    h(
      "div",
      { class: "controls" },
      this.#mode,
      this.#theme,
      this.#gallery,
      this.#status,
    ),
    h(
      "gw-button",
      {
        slot: "actions",
        variant: "neutral",
        appearance: "plain",
        class: "reset",
      },
      "Reset",
    ),
    h(
      "gw-button",
      { slot: "actions", appearance: "outlined", class: "import" },
      "Import",
    ),
  );

  constructor() {
    super();
    this.mode = "auto";
    this.theme = "";
    this.themes = [];
    this.gallery = false;
    this.status = "";
    this.label = "Theme";
  }

  /** Opens the popover under the button. */
  show() {
    this.#popover.show(this.#button);

    // A custom theme's CSS may have changed since the cards were drawn
    if (this.gallery) this.#gallery.refresh();
  }

  #detail<Detail>(type: string, detail: Detail) {
    return new CustomEvent(type, { detail, bubbles: true, composed: true });
  }

  protected override create(root: ShadowRoot) {
    this.#mode.options = modes;
    this.#button.addEventListener("click", () => {
      this.show();
    });
    this.#mode.addEventListener("change", (event) => {
      event.stopPropagation();
      this.mode = this.#mode.value;
      this.dispatchEvent(this.#detail("mode", { mode: this.mode }));
    });
    this.#theme.addEventListener("change", (event) => {
      event.stopPropagation();
      this.theme = this.#theme.value;
      this.dispatchEvent(this.#detail("theme", { id: this.theme }));
    });
    this.#gallery.addEventListener("theme", (event) => {
      event.stopPropagation();
      this.theme = this.#gallery.theme;
      this.dispatchEvent(this.#detail("theme", { id: this.theme }));
    });
    this.#popover.querySelector(".import")?.addEventListener("click", () => {
      this.#file.click();
    });
    this.#popover.querySelector(".reset")?.addEventListener("click", () => {
      this.dispatchEvent(new Event("reset", { bubbles: true, composed: true }));
    });
    this.#file.addEventListener("change", async () => {
      const file = this.#file.files?.[0];

      this.#file.value = "";

      if (file === undefined) return;

      const text = await file.text();

      this.dispatchEvent(this.#detail("import", { text, name: file.name }));
    });

    root.append(this.#button, this.#popover, this.#file);
  }

  protected override update() {
    this.#button.label = this.label;
    this.#button.textContent = this.label;
    this.#popover.heading = this.label;
    this.#mode.label = "Mode";
    this.#mode.value = this.mode;
    this.#theme.options = Array.isArray(this.themes) ? this.themes : [];
    this.#theme.value = this.theme;
    this.#theme.hidden = this.gallery;
    this.#gallery.hidden = !this.gallery;
    this.#gallery.themes = Array.isArray(this.themes) ? this.themes : [];
    this.#gallery.theme = this.theme;
    // Auto leaves it to follow the page, or the themed container around it
    this.#gallery.mode = this.mode === "auto" ? "" : this.mode;
    this.#status.textContent = this.status;
    this.#status.hidden = !this.status;
  }
}

GwThemePicker.define("gw-theme-picker");

declare global {
  interface HTMLElementTagNameMap {
    "gw-theme-picker": GwThemePicker;
  }
}
