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

// MDI's sunny, moon and night (a moon with stars), for cycle's button. Auto
// keeps the palette
const modeIcons = {
  auto: paletteIcon,
  light:
    "M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z",
  dark: "M2 12A10 10 0 0 0 15 21.54A10 10 0 0 1 15 2.46A10 10 0 0 0 2 12Z",
  darker:
    "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z",
};

const allModes = [
  { value: "auto", label: "Auto", icon: modeIcons.auto },
  { value: "light", label: "Light", icon: modeIcons.light },
  { value: "dark", label: "Dark", icon: modeIcons.dark },
  { value: "darker", label: "Darker", icon: modeIcons.darker },
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
 * `layout` sets how it shows. `popover`, the default, is the palette button
 * and its popover. `cycle` is one button showing the mode in use, which steps
 * to the next mode on each press, for an app bar. `inline` lays the controls
 * out in place, in one wrapping row with Reset and Import, for a footer or a
 * settings page; set `justify-content` on it to align the row. `modes` picks which modes it offers, such as `light dark` without
 * Auto.
 *
 * @element gw-theme-picker
 * @summary A button opening the page's mode, theme and import.
 *
 * @attr {"popover"|"cycle"|"inline"} layout - How it shows: a button and popover, a button cycling the modes, or the controls in place. Defaults to `popover`.
 * @attr {string} modes - The modes to offer, in order and separated by spaces. Defaults to `auto light dark darker`.
 * @attr {"auto"|"light"|"dark"|"darker"} mode - The mode in use. Defaults to `auto`.
 * @attr {string} theme - The theme in use, by id.
 * @attr {OptionItem[]} themes - The themes to offer, as JSON. The select hides with fewer than two. With `gallery`, a `group` gathers a family's themes.
 * @attr {boolean} gallery - Shows the themes as preview cards rather than a select.
 * @attr {string} status - A line under the controls, such as an import's result.
 * @attr {string} label - The button's accessible name and the popover's heading. Defaults to `Theme`. With `cycle`, the button's name also gives the mode in use.
 *
 * @csspart gallery - The theme gallery, with `gallery`.
 * @csspart controls - The mode, theme and status.
 * @csspart actions - Reset and Import, with `inline`.
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
    layout: { reflect: true },
    modes: {},
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

      /* One wrapping row: the controls, then Reset and Import. The host is
         the flex container, so a page can set its justify-content */
      :host([layout="inline"]) {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-4);
        align-items: center;
      }

      :host([layout="inline"]) .controls {
        flex-flow: row wrap;
        align-items: center;
        margin-block-start: 0;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        align-items: center;
      }
    `,
  ];

  declare mode: string;
  declare theme: string;
  declare themes: readonly OptionItem[];
  declare gallery: boolean;
  declare status: string;
  declare label: string;
  /** How it shows: a button and popover, a button cycling the modes, or the controls in place. */
  declare layout: "popover" | "cycle" | "inline";
  /** The modes to offer, in order and separated by spaces. */
  declare modes: string;

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

  readonly #controls = h(
    "div",
    { class: "controls", part: "controls" },
    this.#mode,
    this.#theme,
    this.#gallery,
    this.#status,
  );

  readonly #reset = h(
    "gw-button",
    { variant: "neutral", appearance: "plain" },
    "Reset",
  );

  readonly #import = h("gw-button", { appearance: "outlined" }, "Import");

  readonly #popover = h("gw-popover");

  readonly #actions = h("div", { class: "actions", part: "actions" });

  constructor() {
    super();
    this.mode = "auto";
    this.theme = "";
    this.themes = [];
    this.gallery = false;
    this.status = "";
    this.label = "Theme";
    this.layout = "popover";
    this.modes = "auto light dark darker";
  }

  /** The modes on offer, in the order `modes` gives them. */
  #offered() {
    const wanted = String(this.modes).split(/\s+/);
    const offered = allModes.filter(({ value }) => wanted.includes(value));

    return offered.length > 0 ? offered : allModes;
  }

  /** Opens the popover under the button, or with `cycle`, steps to the next mode. */
  show() {
    if (this.layout === "inline") return;

    if (this.layout === "cycle") {
      const offered = this.#offered();
      const at = offered.findIndex(({ value }) => value === this.mode);
      const next = offered[(at + 1) % offered.length];

      if (next !== undefined) {
        this.mode = next.value;
        this.dispatchEvent(this.#detail("mode", { mode: this.mode }));
      }

      return;
    }

    this.#popover.show(this.#button);

    // A custom theme's CSS may have changed since the cards were drawn
    if (this.gallery) this.#gallery.refresh();
  }

  /** Puts the controls and their buttons in the popover, or in place for `inline`. */
  #place(root: ShadowRoot) {
    const inline = this.layout === "inline";

    this.#reset.slot = inline ? "" : "actions";
    this.#import.slot = inline ? "" : "actions";

    if (inline) {
      this.#actions.append(this.#reset, this.#import);
      root.append(this.#controls, this.#actions);
      this.#button.remove();
      this.#popover.remove();
    } else {
      this.#popover.append(this.#controls, this.#reset, this.#import);
      root.prepend(this.#button, this.#popover);
      this.#actions.remove();
    }
  }

  #detail<Detail>(type: string, detail: Detail) {
    return new CustomEvent(type, { detail, bubbles: true, composed: true });
  }

  protected override create(root: ShadowRoot) {
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
    this.#import.addEventListener("click", () => {
      this.#file.click();
    });
    this.#reset.addEventListener("click", () => {
      this.dispatchEvent(new Event("reset", { bubbles: true, composed: true }));
    });
    this.#file.addEventListener("change", async () => {
      const file = this.#file.files?.[0];

      this.#file.value = "";

      if (file === undefined) return;

      const text = await file.text();

      this.dispatchEvent(this.#detail("import", { text, name: file.name }));
    });

    root.append(this.#file);
    this.#place(root);
  }

  protected override update(changed: ReadonlySet<string>) {
    const root = this.shadowRoot;

    if (changed.has("layout") && root !== null) this.#place(root);

    const offered = this.#offered();
    const current = offered.find(({ value }) => value === this.mode);

    if (this.layout === "cycle") {
      const name = `${this.label}: ${current?.label ?? this.mode}`;

      this.#button.label = name;
      this.#button.textContent = name;
      this.#button.icon = current?.icon ?? paletteIcon;
    } else {
      this.#button.label = this.label;
      this.#button.textContent = this.label;
      this.#button.icon = paletteIcon;
    }

    this.#popover.heading = this.label;
    this.#mode.label = "Mode";
    this.#mode.options = offered.map(({ value, label }) => ({ value, label }));
    this.#mode.value = this.mode;
    this.#theme.options = Array.isArray(this.themes) ? this.themes : [];
    this.#theme.value = this.theme;
    this.#theme.hidden = this.gallery || this.#theme.options.length < 2;
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
