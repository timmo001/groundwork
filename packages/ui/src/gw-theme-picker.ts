/**
 * `gw-theme-picker`: the page's mode, theme and import, in place or in a popover.
 * Docs: https://groundwork.timmo.dev/components/actions/#theme-picker
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-button.js";
import type {} from "./gw-menu-button.js";
import type { OptionItem } from "./gw-option-list.js";
import type {} from "./gw-popover.js";
import type {} from "./gw-segmented.js";
import type {} from "./gw-select.js";
import type {} from "./gw-theme-gallery.js";
import { base } from "./styles.js";

// MDI's palette
const paletteIcon =
  "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z";

// MDI's theme-light-dark, sunny, moon and night (a moon with stars). Cycle's
// button keeps the palette for auto
const modeIcons = {
  auto: "M7.5,2C5.71,3.15 4.5,5.18 4.5,7.5C4.5,9.82 5.71,11.85 7.53,13C4.46,13 2,10.54 2,7.5A5.5,5.5 0 0,1 7.5,2M19.07,3.5L20.5,4.93L4.93,20.5L3.5,19.07L19.07,3.5M12.89,5.93L11.41,5L9.97,6L10.39,4.3L9,3.24L10.75,3.12L11.33,1.47L12,3.1L13.73,3.13L12.38,4.26L12.89,5.93M9.59,9.54L8.43,8.81L7.31,9.59L7.65,8.27L6.56,7.44L7.92,7.35L8.37,6.06L8.88,7.33L10.24,7.36L9.19,8.23L9.59,9.54M19,13.5A5.5,5.5 0 0,1 13.5,19C12.28,19 11.15,18.6 10.24,17.93L17.93,10.24C18.6,11.15 19,12.28 19,13.5M14.6,20.08L17.37,18.93L17.13,22.28L14.6,20.08M18.93,17.38L20.08,14.61L22.28,17.15L18.93,17.38M20.08,12.42L18.94,9.64L22.28,9.88L20.08,12.42M9.63,18.93L12.4,20.08L9.87,22.27L9.63,18.93Z",
  light:
    "M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z",
  dark: "M2 12A10 10 0 0 0 15 21.54A10 10 0 0 1 15 2.46A10 10 0 0 0 2 12Z",
  darker:
    "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z",
};

/** A mode the picker offers. `scheme` is the one it shows in, if any. */
export interface ModeOption {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
  readonly scheme?: "light" | "dark";
}

const allModes: readonly ModeOption[] = [
  { value: "auto", label: "Auto", icon: modeIcons.auto },
  { value: "light", label: "Light", icon: modeIcons.light, scheme: "light" },
  { value: "dark", label: "Dark", icon: modeIcons.dark, scheme: "dark" },
  { value: "darker", label: "Darker", icon: modeIcons.darker, scheme: "dark" },
];

// MDI's dots-vertical, for the overflow once the mode and theme are in place
const moreIcon =
  "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z";

/**
 * The page's mode, theme and import, in place where there's room and in a
 * popover where there isn't. Offers the mode (auto, light, dark or Darker),
 * the theme, and buttons to import a theme file (a Groundwork theme's `.json`
 * or an Omarchy `colors.toml`) or reset.
 *
 * It only asks: it fires `mode`, `theme`, `import` and `reset`, and the page
 * applies them and sets `mode`, `theme` and `themes` back. `pageTheme` from
 * `@timmo001/groundwork-tokens/page` does all of that. Show an import's
 * result, such as contrast misses, in `status`.
 *
 * `gallery` swaps the theme select for `gw-theme-gallery`'s cards, which
 * preview each theme in the chosen mode.
 *
 * `layout` sets how it shows. `auto`, the default, lays the mode out as icons
 * and the theme as a select in place while they fit the room it's given,
 * then moves them into the popover, the theme first, as the room runs out.
 * Reset, Import, the gallery and `status` stay in the popover, opened from a
 * palette button. Once the mode and theme are in place and only Reset and
 * Import are left, they're a ⋮ menu instead, and with `no-reset` and
 * `no-import` there's no button at all.
 * In a flex row, such as `gw-page-header`'s actions, it gives up room before
 * the title does. `popover` keeps everything behind the palette button. `cycle` is one button
 * showing the mode in use, which steps to the next mode on each press, for an
 * app bar. `inline` lays every control out in place, in one wrapping row with
 * Reset and Import, for a footer or a settings page; set `justify-content` on
 * it to align the row. With `gallery`, the cards take a row of their own
 * under it. `modes` picks which modes it offers, such as
 * `light dark` without Auto.
 *
 * A theme that comes in one scheme only, such as Catppuccin Latte, sets
 * `scheme`: the modes outside it, Auto among them, show but can't be picked,
 * and `cycle` skips them.
 *
 * @element gw-theme-picker
 * @summary The page's mode, theme and import, in place or in a popover.
 *
 * @attr {"auto"|"popover"|"cycle"|"inline"} layout - How it shows: in place while it fits then in a popover, a button and popover, a button cycling the modes, or every control in place. Defaults to `auto`.
 * @attr {string} modes - The modes to offer, in order and separated by spaces, including any from `extra-modes`. Defaults to `auto light dark darker`.
 * @attr {string} mode - The mode in use: `auto`, `light`, `dark`, `darker` or one from `extra-modes`. Defaults to `auto`.
 * @attr {string} theme - The theme in use, by id.
 * @attr {OptionItem[]} themes - The themes to offer, as JSON. The select hides with fewer than two. With `gallery`, a `group` gathers a family's themes.
 * @attr {boolean} gallery - Shows the themes as preview cards rather than a select.
 * @attr {string} status - A line under the controls, such as an import's result.
 * @attr {string} label - The button's accessible name, the popover's heading and the theme select's label. Defaults to `Theme`. With `cycle`, the button's name also gives the mode in use.
 * @attr {"light"|"dark"} scheme - The one scheme the theme in use covers, such as `light` for Catppuccin Latte. The other modes are disabled. Leave it out for a theme with both.
 * @attr {boolean} no-import - Leaves Import out, for a page that offers only the themes it lists, such as one that passes the desktop's Omarchy theme itself.
 * @attr {boolean} no-reset - Leaves Reset out, for a page whose mode and theme are reset by picking them.
 * @attr {string} mode-label - The mode control's name, for an app in another language. Defaults to `Mode`.
 * @attr {Record<string, string>} mode-labels - The modes' names by mode, as JSON, such as `{"auto":"Automatisch"}`. Each defaults to its English name.
 * @attr {string} unavailable-hint - The hint on a mode the theme doesn't come in, with `{mode}` and `{scheme}` filled in. Defaults to `{mode} isn't available: this theme is {scheme} only`.
 * @attr {string} reset-label - The Reset button. Defaults to `Reset`.
 * @attr {string} import-label - The Import button. Defaults to `Import`.
 * @attr {string} import-file-label - Import in the ⋮ menu. Defaults to `Import a theme file`.
 * @attr {string} other-label - The gallery's heading over themes with no family, after a family. Defaults to `Other`.
 * @attr {string} search-label - The theme select's search placeholder. Defaults to `Search`.
 * @attr {string} no-match-label - What the theme select says when its search matches nothing. Defaults to `No matches`.
 * @attr {ModeOption[]} extra-modes - An app's own modes, as JSON: `value`, `label`, `icon` (SVG path data) and an optional `scheme` of `light` or `dark`. List their values in `modes` to offer them.
 * @attr {string} accept - The file types Import takes, as for an input's `accept`. Defaults to `.json,.toml,application/json`.
 * @attr {string} icon - SVG path data for the button's icon, and Auto's with `cycle`. Defaults to a palette.
 *
 * @csspart button - The button that opens the popover, or cycles the modes, a `gw-button`.
 * @csspart mode - The mode control, a `gw-segmented`.
 * @csspart theme - The theme select, a `gw-select`.
 * @csspart gallery - The theme gallery, with `gallery`.
 * @csspart controls - The mode, theme and status.
 * @csspart status - The line under the controls that `status` sets.
 * @csspart actions - Reset and Import, with `inline`.
 * @csspart reset - The Reset button, a `gw-button`.
 * @csspart import - The Import button, a `gw-button`.
 * @csspart menu - The ⋮ menu of Reset and Import, a `gw-menu-button`.
 * @csspart popover - The `gw-popover` the controls move into.
 *
 * @cssprop --gw-theme-picker-gallery-width - The popover's width with `gallery`. Defaults to `34rem`.
 * @cssprop --gw-theme-picker-gallery-height - The tallest the gallery grows before it scrolls. Defaults to `min(24rem, 50vh)`.
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
    extraModes: { attribute: "extra-modes", type: "json" },
    accept: {},
    icon: {},
    scheme: { reflect: true },
    noImport: { attribute: "no-import", type: "boolean", reflect: true },
    noReset: { attribute: "no-reset", type: "boolean", reflect: true },
    modeLabel: { attribute: "mode-label" },
    modeLabels: { attribute: "mode-labels", type: "json" },
    unavailableHint: { attribute: "unavailable-hint" },
    resetLabel: { attribute: "reset-label" },
    importLabel: { attribute: "import-label" },
    importFileLabel: { attribute: "import-file-label" },
    otherLabel: { attribute: "other-label" },
    searchLabel: { attribute: "search-label" },
    noMatchLabel: { attribute: "no-match-label" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
      }

      :host([gallery]) gw-popover {
        --gw-popover-width: var(--gw-theme-picker-gallery-width, 34rem);
      }

      .gallery {
        max-height: var(--gw-theme-picker-gallery-height, min(24rem, 50vh));
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

      /* The cards get a row of their own under the mode, Reset and Import */
      :host([layout="inline"][gallery]) .controls {
        display: contents;
      }

      :host([layout="inline"]) .gallery {
        flex: 1 0 100%;
        order: 1;
        max-height: none;
        overflow: visible;
      }

      :host([layout="inline"][gallery]) .status {
        flex: 1 0 100%;
        order: 2;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
        align-items: center;
      }

      /* Asks for the room to have all of it in place, but gives it up down
         to the button before a flex row's other items shrink. What it keeps
         in place packs to the end, by the button, and a page can set
         justify-content to pack it elsewhere */
      :host([layout="auto"]) {
        display: flex;
        flex: 0 1000 var(--gw-theme-picker-fit, auto);
        gap: var(--gw-space-1);
        align-items: center;
        justify-content: flex-end;
        min-width: 2.5rem;
        contain: inline-size;
      }

      :host([layout="auto"]) > * {
        flex: none;
      }
    `,
  ];

  declare mode: string;
  declare theme: string;
  declare themes: readonly OptionItem[];
  declare gallery: boolean;
  declare status: string;
  declare label: string;
  /** How it shows: in place while it fits then in a popover, a button and popover, a button cycling the modes, or every control in place. */
  declare layout: "auto" | "popover" | "cycle" | "inline";
  /** The modes to offer, in order and separated by spaces. */
  declare modes: string;
  /** An app's own modes, offered when `modes` lists them. */
  declare extraModes: readonly ModeOption[];
  /** The file types Import takes. */
  declare accept: string;
  /** SVG path data for the button's icon, and Auto's with `cycle`. */
  declare icon: string;
  /** The one scheme the theme in use covers, or empty for both. */
  declare scheme: "" | "light" | "dark";
  /** Leaves Import out, so only the themes in `themes` are offered. */
  declare noImport: boolean;
  /** Leaves Reset out. */
  declare noReset: boolean;
  declare modeLabel: string;
  /** The modes' names by mode, each defaulting to its English name. */
  declare modeLabels: Readonly<Record<string, string>>;
  /** The hint on a mode the theme doesn't come in, with `{mode}` and `{scheme}` filled in. */
  declare unavailableHint: string;
  declare resetLabel: string;
  declare importLabel: string;
  declare importFileLabel: string;
  declare otherLabel: string;
  declare searchLabel: string;
  declare noMatchLabel: string;

  readonly #button = h("gw-button", {
    variant: "neutral",
    appearance: "plain",
    icon: paletteIcon,
    labels: "hide",
    part: "button",
  });

  readonly #mode = h("gw-segmented", { part: "mode" });

  readonly #theme = h("gw-select", { part: "theme" });

  readonly #gallery = h("gw-theme-gallery", {
    class: "gallery",
    part: "gallery",
  });

  readonly #status = h("p", {
    class: "status",
    part: "status",
    role: "status",
  });

  readonly #file = h("input", {
    type: "file",
    accept: ".json,.toml,application/json",
    hidden: true,
  });

  readonly #controls = h(
    "div",
    { class: "controls", part: "controls" },
    this.#theme,
    this.#mode,
    this.#gallery,
    this.#status,
  );

  readonly #reset = h("gw-button", {
    variant: "neutral",
    appearance: "plain",
    part: "reset",
  });

  readonly #import = h("gw-button", { appearance: "outlined", part: "import" });

  readonly #popover = h("gw-popover", { part: "popover" });

  // Reset and Import on their own, once nothing else is left in the popover
  readonly #menu = h("gw-menu-button", {
    appearance: "plain",
    icon: moreIcon,
    labels: "hide",
    hidden: true,
    part: "menu",
  });

  readonly #actions = h("div", { class: "actions", part: "actions" });

  constructor() {
    super();
    this.mode = "auto";
    this.theme = "";
    this.themes = [];
    this.gallery = false;
    this.status = "";
    this.label = "Theme";
    this.layout = "auto";
    this.modes = "auto light dark darker";
    this.extraModes = [];
    this.accept = ".json,.toml,application/json";
    this.icon = paletteIcon;
    this.scheme = "";
    this.noImport = false;
    this.noReset = false;
    this.modeLabel = "Mode";
    this.modeLabels = {};
    this.unavailableHint =
      "{mode} isn't available: this theme is {scheme} only";
    this.resetLabel = "Reset";
    this.importLabel = "Import";
    this.importFileLabel = "Import a theme file";
    this.otherLabel = "Other";
    this.searchLabel = "Search";
    this.noMatchLabel = "No matches";
  }

  /** The modes on offer, in the order `modes` gives them, with their names. */
  #offered() {
    const wanted = String(this.modes).split(/\s+/);

    const known = [
      ...allModes,
      ...(Array.isArray(this.extraModes) ? this.extraModes : []),
    ];

    const offered = wanted.flatMap((value) => {
      const entry = known.find((mode) => mode.value === value);

      return entry === undefined ? [] : [entry];
    });

    const names = this.modeLabels ?? {};

    return (offered.length > 0 ? offered : allModes).map((entry) => ({
      ...entry,
      label: names[entry.value] ?? entry.label,
    }));
  }

  /** Whether `mode` can be picked with the theme in use. */
  #allowed(mode: string) {
    if (this.scheme === "") return true;

    return this.#offered().some(
      (entry) => entry.value === mode && entry.scheme === this.scheme,
    );
  }

  /** Opens the popover under the button, or with `cycle`, steps to the next mode. */
  show() {
    if (this.layout === "inline") return;

    if (this.layout === "cycle") {
      const offered = this.#offered();
      const at = offered.findIndex(({ value }) => value === this.mode);

      // The next mode the theme has, skipping the ones it doesn't
      const next = offered
        .map((_, step) => offered[(at + 1 + step) % offered.length])
        .find((entry) => entry !== undefined && this.#allowed(entry.value));

      if (next !== undefined && next.value !== this.mode) {
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
      this.#controls.replaceChildren(
        this.#theme,
        this.#mode,
        this.#gallery,
        this.#status,
      );
      this.#actions.append(this.#reset, this.#import);
      root.append(this.#controls, this.#actions);
      this.#button.remove();
      this.#menu.remove();
      this.#popover.remove();
    } else {
      if (this.#controls.parentNode !== this.#popover) {
        this.#popover.append(this.#controls, this.#reset, this.#import);
      }

      if (this.#button.parentNode !== root) {
        root.prepend(this.#button, this.#menu, this.#popover);
      }

      this.#actions.remove();
    }

    this.#arrange(root);
  }

  /** With `auto`, moves the mode and theme in place or back into the popover, as `#fits` says. */
  #arrange(root: ShadowRoot) {
    // #fit has them in place to measure
    if (this.#measuring) return;

    const auto = this.layout === "auto";
    const mode = auto && this.#fits.mode;
    const theme = mode && this.#fits.theme;

    // The theme comes before the mode, in place and in the popover
    if (mode && this.#mode.parentNode !== root) {
      root.insertBefore(this.#mode, this.#button);
    } else if (!mode && this.#mode.parentNode !== this.#controls) {
      this.#controls.insertBefore(this.#mode, this.#gallery);
    }

    if (theme && this.#theme.parentNode !== root) {
      root.insertBefore(this.#theme, this.#mode);
    } else if (!theme && this.#theme.parentNode !== this.#controls) {
      this.#controls.prepend(this.#theme);
    }

    this.#mode.labels = mode ? "hide" : "show";
    this.#theme.inlineLabel = theme;
    // The popover's heading names it once the mode is out of it
    this.#theme.labelHidden = mode && !theme;
    // The palette while the popover holds the theme; the overflow dots once
    // the theme is in place, as a menu of Reset and Import when they're all
    // that's left
    const more = theme || (mode && this.#theme.hidden && !this.gallery);
    const menu = more && !this.status;

    this.#button.icon =
      this.layout === "cycle" ? this.#button.icon : more ? moreIcon : this.icon;

    if (menu && this.#menu.hidden) this.#popover.close();

    this.#button.hidden = menu;
    // With Reset and Import both left out, the menu would be empty
    this.#menu.hidden = !menu || this.#bare();
  }

  /** Whether nothing's left for the menu: Reset and Import are both left out. */
  #bare() {
    return this.noReset && this.noImport && !this.gallery;
  }

  /**
   * With `auto`, measures the mode and theme in place, sizes the host to fit
   * them all, then keeps in place what the room it gets allows, the mode
   * first. The rest go into the popover.
   */
  async #fit() {
    const root = this.shadowRoot;

    if (this.layout !== "auto" || root === null || !this.isConnected) return;

    const run = ++this.#fitting;
    const theme = !this.#theme.hidden;

    this.#measuring = true;

    if (this.#mode.parentNode !== root) {
      this.#mode.labels = "hide";
      root.insertBefore(this.#mode, this.#button);
    }

    if (theme && this.#theme.parentNode !== root) {
      this.#theme.inlineLabel = true;
      this.#theme.labelHidden = false;
      root.insertBefore(this.#theme, this.#mode);
    }

    // Drawn in place before measuring, still before the next paint
    await Promise.all([this.#mode.updateComplete, this.#theme.updateComplete]);

    if (run !== this.#fitting) return;

    this.#measuring = false;

    if (this.layout !== "auto") {
      this.#arrange(root);

      return;
    }

    const gap = Number.parseFloat(getComputedStyle(this).columnGap) || 0;

    // Whichever of the button and the menu shows; both are square
    const button = Math.max(
      this.#button.getBoundingClientRect().width,
      this.#menu.getBoundingClientRect().width,
    );

    const mode = this.#mode.getBoundingClientRect().width + gap;
    const select = theme ? this.#theme.getBoundingClientRect().width + gap : 0;
    // The button takes no room once everything's in place and no menu is left
    const bare = this.#bare() ? 0 : button;

    this.style.setProperty(
      "--gw-theme-picker-fit",
      `${Math.ceil(bare + mode + select)}px`,
    );

    const room = this.getBoundingClientRect().width + 0.5;

    this.#fits = {
      mode: room >= (theme ? button : bare) + mode,
      theme: theme && room >= bare + mode + select,
    };
    this.#arrange(root);
  }

  #fits = { mode: false, theme: false };

  #fitting = 0;

  #measuring = false;

  readonly #resize = new ResizeObserver(() => {
    void this.#fit();
  });

  override connectedCallback() {
    super.connectedCallback();
    this.#resize.observe(this);
    void document.fonts.ready.then(() => this.#fit());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
  }

  #detail<Detail>(type: string, detail: Detail) {
    return new CustomEvent(type, { detail, bubbles: true, composed: true });
  }

  protected override create(root: ShadowRoot) {
    this.#button.addEventListener("click", () => {
      this.show();
    });

    // A theme or mode applies at once, so it isn't an edit for the popover
    // to ask about discarding, and a click outside still closes it
    for (const type of ["input", "change"]) {
      this.#controls.addEventListener(type, (event) => {
        if (event.target !== this.#controls) event.stopPropagation();
      });
    }

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
    this.#menu.addEventListener("select", (event) => {
      event.stopPropagation();

      if (event instanceof CustomEvent && event.detail.value === "import") {
        this.#file.click();
      } else {
        this.dispatchEvent(
          new Event("reset", { bubbles: true, composed: true }),
        );
      }
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
      this.#button.icon =
        current === undefined || current.value === "auto"
          ? this.icon
          : current.icon;
    } else {
      this.#button.label = this.label;
      this.#button.textContent = this.label;
    }

    this.#popover.heading = this.label;
    this.#menu.label = this.label;
    this.#theme.label = this.label;
    this.#mode.label = this.modeLabel;
    this.#mode.options = offered.map(({ value, label, icon }) =>
      this.#allowed(value)
        ? { value, label, icon }
        : {
            value,
            label,
            icon,
            disabled: true,
            hint: this.unavailableHint
              .replaceAll("{mode}", label)
              .replaceAll("{scheme}", this.scheme),
          },
    );
    this.#mode.value = this.mode;
    this.#theme.options = Array.isArray(this.themes) ? this.themes : [];
    this.#theme.value = this.theme;
    this.#theme.searchLabel = this.searchLabel;
    this.#theme.noMatchLabel = this.noMatchLabel;
    this.#theme.hidden = this.gallery || this.#theme.options.length < 2;
    this.#gallery.hidden = !this.gallery;
    this.#gallery.otherLabel = this.otherLabel;
    this.#gallery.themes = Array.isArray(this.themes) ? this.themes : [];
    this.#gallery.theme = this.theme;
    // Auto leaves it to follow the page, or the themed container around it
    this.#gallery.mode = this.mode === "auto" ? "" : this.mode;
    this.#status.textContent = this.status;
    this.#status.hidden = !this.status;
    this.#import.hidden = this.noImport;
    this.#reset.hidden = this.noReset;
    this.#reset.textContent = this.resetLabel;
    this.#import.textContent = this.importLabel;
    this.#file.accept = this.accept;

    if (
      ["noImport", "noReset", "resetLabel", "importFileLabel"].some((name) =>
        changed.has(name),
      )
    ) {
      this.#menu.setAttribute(
        "items",
        JSON.stringify([
          ...(this.noReset ? [] : [{ value: "reset", label: this.resetLabel }]),
          ...(this.noImport
            ? []
            : [{ value: "import", label: this.importFileLabel }]),
        ]),
      );
    }

    if (root === null) return;

    this.#arrange(root);

    // Measures again for the select's new value or the new set of controls
    if (
      [
        "layout",
        "modes",
        "modeLabels",
        "scheme",
        "theme",
        "themes",
        "gallery",
        "noImport",
        "noReset",
      ].some((name) => changed.has(name))
    ) {
      void this.#fit();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-theme-picker": GwThemePicker;
  }
}
