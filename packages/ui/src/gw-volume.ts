/**
 * `gw-volume`: a mute button and a volume slider that stay together, side by
 * side, sliding out, in a popover or as the mute alone.
 * Docs: https://groundwork.timmo.dev/components/inputs/#volume
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type {} from "./gw-button.js";
import type {} from "./gw-popover.js";
import type {} from "./gw-range.js";
import { base, controlSizes } from "./styles.js";

// MDI's volume-off, volume-medium and volume-high
const icons = {
  off: "M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",
  low: "M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z",
  high: "M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",
} as const;

/** How `gw-volume` lays out its mute button and slider. */
export type VolumeMode = "inline" | "expand" | "popover" | "mute";

const volumeModes: readonly string[] = ["inline", "expand", "popover", "mute"];

const isVolumeMode = (mode: string): mode is VolumeMode =>
  volumeModes.includes(mode);

let settable: boolean | undefined;

/**
 * Whether the page can set a media element's volume. iOS and iPadOS leave
 * the volume to the device's own buttons and ignore `volume`, so only
 * muting works there.
 */
export const canSetVolume = (): boolean => {
  if (settable === undefined) {
    const audio = document.createElement("audio");

    audio.volume = 0.5;
    settable = audio.volume === 0.5;
  }

  return settable;
};

/**
 * A mute button and a volume slider as one control, so they never split
 * when a player's bar gets tight. `value` runs 0 to 100, and muting keeps it
 * to come back to: the slider shows 0 while muted, and turning it up, or
 * pressing the button at 0, unmutes, as a speaker would. The button's icon
 * follows the level, and its name says what a press does, Mute or Unmute,
 * with `mute-key` after it.
 *
 * `mode` picks the layout. `inline` puts the button and the slider side by
 * side. `expand` shows the button alone, and the slider slides out beside it
 * on hover or focus. `popover` makes the button open a popover, a bottom
 * sheet on a phone, holding the mute and the slider. `mute` is the button
 * alone, for where the page can't set the volume. `auto`, the default, is
 * `mute` where the volume can't be set, such as on iOS (`canSetVolume`),
 * `inline` while it has the room, and otherwise `expand` with a mouse or
 * `popover` with touch. It decides again as it or its container resizes, so
 * a bar that tightens switches it rather than hiding the slider. In a flex
 * row it gives up the slider's width first, so let it shrink before the
 * controls that shouldn't.
 *
 * `currentMode` is the mode it shows, and `:state(inline)`,
 * `:state(expand)`, `:state(popover)` or `:state(mute)` matches it for
 * styles. `inlineWidth` is its width inline whatever it shows, and
 * `minInlineWidth` its button's, for a bar that measures its controls
 * before laying them out.
 *
 * @element gw-volume
 * @summary A mute button and volume slider that stay together.
 *
 * @attr {number} value - The volume, 0 to 100, kept while muted. Defaults to 100.
 * @attr {boolean} muted - Whether it's muted.
 * @attr {number} step - How far an arrow key moves the slider. Defaults to 5.
 * @attr {boolean} disabled - Disables it.
 * @attr {string} label - The accessible name, the slider's and the popover's heading. Defaults to `Volume`.
 * @attr {"auto"|"inline"|"expand"|"popover"|"mute"} mode - How it lays out. Defaults to `auto`.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The buttons' size, 24 to 56px tall. Defaults to `medium`.
 * @attr {string} mute-label - The button's name while a press mutes. Defaults to `Mute`.
 * @attr {string} unmute-label - The button's name while a press unmutes. Defaults to `Unmute`.
 * @attr {string} mute-key - The key the app mutes with, shown after the button's name, such as `M`.
 * @attr {string} close-label - The popover's close button's name. Defaults to `Close`.
 *
 * @csspart button - The button, a `gw-button`: the mute, or what opens the popover.
 * @csspart panel - Around the slider beside the button.
 * @csspart slider - The slider, a `gw-range`.
 * @csspart popover - The popover in `popover` mode, a `gw-popover`.
 * @csspart popover-mute - The mute button in the popover, a `gw-button`.
 *
 * @cssprop --gw-volume-scale - Scales the buttons, around 1 for medium.
 * @cssprop --gw-volume-slider-width - The slider's width beside the button. Defaults to `6rem`.
 * @cssprop --gw-volume-gap - The space on each side of the slider. Defaults to `--gw-space-2`.
 * @cssprop --gw-volume-popover-width - The popover's width. Defaults to `16rem`.
 *
 * @fires {Event} input - While the slider moves, and when a press brings the volume back from 0. Read `value`.
 * @fires {Event} change - When the slider is let go, and when a press brings the volume back from 0. Read `value`.
 * @fires {CustomEvent<{ muted: boolean }>} mute - When it's muted or unmuted, with the new state in `detail`, also in `muted`.
 */
export class GwVolume extends GwElement {
  static override properties = {
    value: { type: "number" },
    muted: { type: "boolean", reflect: true },
    step: { type: "number" },
    disabled: { type: "boolean", reflect: true },
    label: {},
    mode: { reflect: true },
    size: { reflect: true },
    muteLabel: { attribute: "mute-label" },
    unmuteLabel: { attribute: "unmute-label" },
    muteKey: { attribute: "mute-key" },
    closeLabel: { attribute: "close-label" },
  } as const;

  static override styles = [
    base,
    controlSizes("volume"),
    css`
      :host {
        --_gw-volume-panel: calc(
          var(--gw-volume-slider-width, 6rem) + 2 *
            var(--gw-volume-gap, var(--gw-space-2))
        );

        display: inline-flex;
        align-items: center;
        min-inline-size: calc(
          2.5rem * var(--gw-volume-scale, 1) * var(--gw-control-scale, 1)
        );
        max-inline-size: 100%;
        vertical-align: middle;
      }

      .button,
      .popover-mute {
        --gw-button-scale: var(--gw-volume-scale, 1);

        flex: none;
      }

      /* The slider beside the button, which gives up its width first when
         the room runs out. Its max is the width inline, which inlineWidth
         reads */
      .panel {
        display: flex;
        flex: 0 1 auto;
        align-items: center;
        min-inline-size: 0;
        inline-size: var(--_gw-volume-panel);
        max-inline-size: var(--_gw-volume-panel);
      }

      .slider {
        flex: 1;
        min-inline-size: 0;
        margin-inline: var(--gw-volume-gap, var(--gw-space-2));
      }

      /* Slides out beside the button on hover or focus, clipped at its
         side while it travels but not above, where the value shows while
         it's held */
      :host(:state(expand)) .panel {
        flex: none;
        inline-size: 0;
        clip-path: inset(-4rem 0);
        opacity: 0;
        transition:
          inline-size var(--gw-motion-normal) var(--gw-motion-easing),
          opacity var(--gw-motion-fast) var(--gw-motion-easing);
      }

      :host(:state(expand):is(:hover, :focus-within)) .panel {
        inline-size: var(--_gw-volume-panel);
        opacity: 1;
      }

      :host(:state(expand)) .slider {
        flex: none;
        inline-size: var(--gw-volume-slider-width, 6rem);
      }

      :host(:is(:state(popover), :state(mute))) .panel {
        display: none;
      }

      .popover {
        --gw-popover-width: var(--gw-volume-popover-width, 16rem);
      }

      .popover-row {
        display: flex;
        align-items: center;
      }
    `,
  ];

  /** The volume, 0 to 100, kept while muted. */
  declare value: number;
  declare muted: boolean;
  /** How far an arrow key moves the slider. */
  declare step: number;
  declare disabled: boolean;
  /** The accessible name, the slider's and the popover's heading. */
  declare label: string;
  /** How it lays out; `auto` picks by the room, the pointer and whether the volume can be set. */
  declare mode: "auto" | VolumeMode;
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  declare muteLabel: string;
  declare unmuteLabel: string;
  /** The key the app mutes with, shown after the button's name. */
  declare muteKey: string;
  declare closeLabel: string;

  readonly #internals = this.attachInternals();

  readonly #button = h("gw-button", {
    class: "button",
    part: "button",
    variant: "neutral",
    appearance: "plain",
    labels: "hide",
  });

  readonly #range = h("gw-range", {
    class: "slider",
    part: "slider",
    "label-hidden": "",
    unit: "%",
  });

  readonly #panel = h("div", { class: "panel", part: "panel" }, this.#range);

  readonly #popoverMute = h("gw-button", {
    class: "popover-mute",
    part: "popover-mute",
    variant: "neutral",
    appearance: "plain",
    labels: "hide",
  });

  readonly #popoverRow = h("div", { class: "popover-row" }, this.#popoverMute);

  readonly #popover = h(
    "gw-popover",
    { class: "popover", part: "popover" },
    this.#popoverRow,
  );

  readonly #resize = new ResizeObserver(() => {
    this.#schedule();
  });

  readonly #hover = matchMedia("(hover: hover) and (pointer: fine)");

  #current: VolumeMode = "inline";

  /** The volume a press brings back after it's been turned down to 0. */
  #audible = 50;

  #open = false;

  #frame = 0;

  /** The container's width and the room it had when `auto` last collapsed. */
  #collapsedAt:
    { readonly container: number; readonly room: number } | undefined;

  constructor() {
    super();
    this.value = 100;
    this.muted = false;
    this.step = 5;
    this.disabled = false;
    this.label = "Volume";
    this.mode = "auto";
    this.size = "medium";
    this.muteLabel = "Mute";
    this.unmuteLabel = "Unmute";
    this.muteKey = "";
    this.closeLabel = "Close";
    this.#internals.role = "group";
  }

  /** The mode it shows: `mode`, or what `auto` picked. */
  get currentMode(): VolumeMode {
    return this.#current;
  }

  /** Its width in pixels inline, the button and the slider side by side, whatever mode it shows. */
  get inlineWidth(): number {
    const panel = Number.parseFloat(
      getComputedStyle(this.#panel).maxInlineSize,
    );

    return (
      this.#button.getBoundingClientRect().width +
      (Number.isFinite(panel) ? panel : 0)
    );
  }

  /**
   * The least it can be in pixels, its button alone. It's what its
   * `min-inline-size` asks for, there to read where a page's own styles,
   * such as `* { min-width: 0 }`, override that.
   */
  get minInlineWidth(): number {
    return this.#button.getBoundingClientRect().width;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#hover.addEventListener("change", this.#schedule);
    this.#resize.observe(this);

    const container = this.#container();

    if (container !== null) this.#resize.observe(container);
  }

  override disconnectedCallback() {
    this.#hover.removeEventListener("change", this.#schedule);
    this.#resize.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    super.disconnectedCallback();
  }

  #container(): Element | null {
    const root = this.getRootNode();

    return (
      this.parentElement ?? (root instanceof ShadowRoot ? root.host : null)
    );
  }

  /** Mutes or unmutes, firing `mute` when that changes it. */
  #mute(muted: boolean) {
    if (this.muted === muted) return;

    this.muted = muted;
    this.dispatchEvent(
      new CustomEvent("mute", {
        bubbles: true,
        composed: true,
        detail: { muted },
      }),
    );
  }

  /** A press of the mute: mutes, or unmutes and brings back the volume from 0. */
  #toggle() {
    if (!this.muted && this.value > 0) {
      this.#mute(true);

      return;
    }

    const silent = this.value <= 0;

    if (silent) this.value = this.#audible;

    this.#mute(false);

    if (silent) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
  }

  // The native input event goes on out of the shadow root after this, so
  // the page reads the new value
  readonly #onInput = () => {
    const level = this.#range.value;

    if (this.muted && level > 0) this.#mute(false);

    if (!this.muted) this.value = level;
  };

  // The native change event stops at the shadow root, so it's fired again
  readonly #onChange = (event: Event) => {
    event.stopPropagation();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  #show() {
    // The slider takes focus, so the arrow keys turn it at once
    this.#range.querySelector("input")?.setAttribute("autofocus", "");
    this.#open = true;
    this.#popover.show(this.#button);
  }

  readonly #onClose = (event: Event) => {
    event.stopPropagation();
    this.#open = false;
    this.#range.querySelector("input")?.removeAttribute("autofocus");
    this.#schedule();
  };

  readonly #schedule = () => {
    if (this.#frame !== 0) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#fit();
    });
  };

  /** The mode to show before `auto` has measured. */
  #initial(): VolumeMode {
    if (this.mode !== "auto")
      return isVolumeMode(this.mode) ? this.mode : "inline";

    if (!canSetVolume()) return "mute";

    return this.#collapsedAt === undefined ? "inline" : this.#current;
  }

  /**
   * Inline, it collapses once it has less room than it needs. Collapsed,
   * its own width no longer says how much room there is, so it goes back
   * inline once its container has grown by what it was short, then checks
   * again.
   */
  #fit() {
    if (this.mode !== "auto" || this.#open || !this.isConnected) return;

    if (!canSetVolume()) {
      this.#apply("mute");

      return;
    }

    const collapsed = this.#hover.matches ? "expand" : "popover";
    const container = this.#container()?.getBoundingClientRect().width ?? 0;
    const natural = this.inlineWidth;

    if (this.#current === "inline") {
      const room = this.getBoundingClientRect().width;

      if (room >= natural - 0.5) return;

      this.#collapsedAt = { container, room };
      this.#apply(collapsed);

      return;
    }

    const at = this.#collapsedAt;

    const grown =
      at === undefined || container - at.container >= natural - at.room - 0.5;

    this.#apply(grown ? "inline" : collapsed);
  }

  #apply(mode: VolumeMode) {
    if (mode !== "popover" && this.#open) this.#popover.close();

    const home = mode === "popover" ? this.#popoverRow : this.#panel;

    if (this.#range.parentElement !== home) home.append(this.#range);

    if (mode === this.#current && this.#internals.states.has(mode)) return;

    this.#internals.states.delete(this.#current);
    this.#internals.states.add(mode);
    this.#current = mode;
    this.requestUpdate("currentMode");
  }

  protected override create(root: ShadowRoot) {
    this.#button.addEventListener("click", () => {
      if (this.#current === "popover") this.#show();
      else this.#toggle();
    });
    this.#popoverMute.addEventListener("click", () => {
      this.#toggle();
    });
    this.#range.addEventListener("input", this.#onInput);
    this.#range.addEventListener("change", this.#onChange);
    this.#popover.addEventListener("close", this.#onClose);
    root.append(this.#button, this.#panel, this.#popover);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("mode")) {
      this.#collapsedAt = undefined;
      this.#apply(this.#initial());
      this.#schedule();
    }

    if (this.value > 0) this.#audible = this.value;

    const silent = this.muted || this.value <= 0;
    const key = this.muteKey ? ` (${this.muteKey})` : "";
    const name = `${silent ? this.unmuteLabel : this.muteLabel}${key}`;
    const icon = silent ? icons.off : this.value < 50 ? icons.low : icons.high;

    this.#internals.ariaLabel = this.label || null;

    const texts = [
      [this.#button, this.#current === "popover" ? this.label : name],
      [this.#popoverMute, name],
    ] as const;

    // Only on a change, since new text is a slotchange the button handles
    for (const [button, text] of texts) {
      button.icon = icon;
      button.disabled = this.disabled;

      if (button.textContent !== text) button.textContent = text;
    }

    const range = this.#range;

    range.label = this.label;
    range.step = this.step;
    range.value = this.muted ? 0 : this.value;
    range.disabled = this.disabled;
    this.#popover.heading = this.label;
    this.#popover.closeLabel = this.closeLabel;

    if (this.disabled && this.#open) this.#popover.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-volume": GwVolume;
  }
}
