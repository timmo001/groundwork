/**
 * `gw-demo-frame`: the frame around each live demo on the docs site, with its
 * theme, mode and tone pickers. It's docs-only, not part of `@groundwork/ui`.
 *
 * @module
 */
import tokens from "@groundwork/tokens/themes.json";
import { GwButton, GwElement, css, h, withViewTransition } from "@groundwork/ui";

const tones = ["neutral", "accent", "info", "success", "warning", "danger", "important"] as const;

// MDI's sunny, waning crescent and night (a moon with stars, for Darker)
const modeIcons: Record<string, string> = {
  light:
    "M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z",
  darker: "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z",
  dark: "M2 12A10 10 0 0 0 15 21.54A10 10 0 0 1 15 2.46A10 10 0 0 0 2 12Z",
};

const labels: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  darker: "Darker",
};

/**
 * Frames a demo with a theme and mode picker. It sets `data-gw-theme` and
 * `data-gw-mode` on itself, so everything slotted inside follows them.
 *
 * Demos are plain markup, so the frame wires up what would need script: a
 * button with `data-opens="id"` opens that dialog, one with `data-toggles="id"`
 * opens or closes that banner, one with `data-toast`
 * shows a toast in the frame's `gw-toaster`, and the last `change`, `select`
 * or `close` event is shown in the toolbar.
 */
export class GwDemoFrame extends GwElement {
  static override properties = {
    theme: { attribute: "data-gw-theme", reflect: true },
    mode: { attribute: "data-gw-mode", reflect: true },
    layout: { reflect: true },
    event: { attribute: false },
  } as const;

  static override styles = [
    css`
    :host {
      display: block;
      overflow: hidden;
      font-family: var(--gw-font-sans);
      color: var(--gw-color-text-primary);
      background: var(--gw-color-surface-default);
      border: 1px solid var(--gw-color-border-normal);
      border-radius: var(--gw-radius-panel);
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gw-space-3) var(--gw-space-6);
      align-items: center;
      padding: var(--gw-space-3) var(--gw-space-4);
      font-size: var(--gw-font-size-s);
      background: var(--gw-color-surface-lower);
      border-bottom: 1px solid var(--gw-color-border-quiet);
    }

    gw-select {
      width: 12rem;
    }

    .stage {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: var(--gw-space-3);
      align-items: center;
      padding: var(--gw-space-6) var(--gw-space-5);
    }

    :host([layout="stack"]) .stage {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
    }

    /* An overlay in the stage's corner, so a new event never moves the
       layout around it */
    .event {
      position: absolute;
      inset-block-start: var(--gw-space-2);
      inset-inline-end: var(--gw-space-2);
      padding: var(--gw-space-1) var(--gw-space-3);
      font-family: var(--gw-font-mono);
      font-size: var(--gw-font-size-xs);
      color: var(--gw-color-text-secondary);
      pointer-events: none;
      background: var(--gw-color-surface-raised);
      border: 1px solid var(--gw-color-border-quiet);
      border-radius: var(--gw-radius-pill);
      box-shadow: var(--gw-shadow-s);
      transition:
        opacity var(--gw-motion-normal) var(--gw-motion-easing),
        translate var(--gw-motion-normal) var(--gw-motion-easing);
    }

    .event[data-empty] {
      opacity: 0;
      translate: 0 calc(var(--gw-space-1) * -1);
    }
  `,
  ];

  declare theme: string;
  declare mode: string;
  declare layout: string;
  declare event: string;

  constructor() {
    super();
    this.theme = "base";
    this.mode = "dark";
    this.layout = "row";
    this.event = "";

    this.addEventListener("click", (event) => {
      const target = event
        .composedPath()
        .find(
          (node) =>
            node instanceof HTMLElement &&
            (node.dataset.opens ||
              node.dataset.toggles ||
              node.dataset.toast ||
              node.dataset.replays !== undefined ||
              node.dataset.loads !== undefined),
        );

      if (!(target instanceof HTMLElement)) return;

      // Stands in for work, such as a refresh, so the button shows its
      // loading state, then returns
      if (target.dataset.loads !== undefined && target instanceof GwButton) {
        target.loading = true;
        setTimeout(() => {
          target.loading = false;
        }, 1500);
      }

      if (target.dataset.replays !== undefined) {
        for (const fade of this.querySelectorAll("gw-fade-in")) fade.replay();
      }

      if (target.dataset.opens) {
        const dialog = this.querySelector(`#${target.dataset.opens}`);

        // A popover opens next to the button that started it. data-centered
        // stands in for something nothing on screen started
        if (dialog !== null && "show" in dialog && typeof dialog.show === "function") {
          dialog.show(target.dataset.centered === undefined ? target : undefined);
        }
      }

      if (target.dataset.toggles) {
        const toggled = this.querySelector(`#${target.dataset.toggles}`);

        toggled?.toggleAttribute("open");
      }

      if (target.dataset.toast) {
        const tone = tones.find((item) => item === target.dataset.tone) ?? "neutral";

        this.querySelector("gw-toaster")?.show(target.dataset.toast, tone);
      }
    });

    for (const type of ["change", "select", "close", "pick"]) {
      this.addEventListener(type, (event) => {
        const source = event.target;

        if (!(source instanceof HTMLElement)) return;

        const value =
          event instanceof CustomEvent && typeof event.detail?.value === "string"
            ? event.detail.value
            : "value" in source && typeof source.value === "string"
              ? source.value
              : "checked" in source && typeof source.checked === "boolean"
                ? String(source.checked)
                : "returnValue" in source && typeof source.returnValue === "string"
                  ? source.returnValue
                  : "";

        this.event = `${type}: ${value || "(empty)"}`;
      });
    }
  }

  private get modes() {
    const theme = tokens.themes.find((item) => item.id === this.theme);

    return Object.keys(theme?.modes ?? {});
  }

  private pickTheme(event: Event) {
    // The frame logs its demos' events, not its own toolbar's
    event.stopPropagation();

    const theme = this.#select.value;

    // A theme change is a change to the whole view, so it crossfades
    void withViewTransition(async () => {
      this.theme = theme;

      if (!this.modes.includes(this.mode)) this.mode = this.modes[0] ?? "dark";

      await this.updateComplete;
    });
  }

  private pickMode(mode: string) {
    void withViewTransition(async () => {
      this.mode = mode;
      await this.updateComplete;
    });
  }

  readonly #select = h("gw-select", { label: "Theme", "label-hidden": "" });

  readonly #segmented = h("gw-segmented", { label: "Mode", labels: "auto" });

  readonly #event = h("span", { class: "event", "aria-live": "polite" });

  protected override create(root: ShadowRoot) {
    this.#select.options = tokens.themes.map((theme) => ({
      value: theme.id,
      label: theme.name,
      group: theme.optional ? "More themes" : "Core themes",
    }));
    this.#select.addEventListener("change", (event) => this.pickTheme(event));
    this.#segmented.addEventListener("change", (event) => {
      // The frame logs its demos' events, not its own toolbar's
      event.stopPropagation();
      this.pickMode(this.#segmented.value);
    });
    root.append(
      h(
        "div",
        { class: "toolbar" },
        this.#select,
        this.#segmented,
      ),
      h("div", { class: "stage" }, h("slot"), this.#event),
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    this.#select.value = this.theme;

    if (changed.has("theme")) {
      this.#segmented.options = this.modes.map((mode) => ({
        value: mode,
        label: labels[mode] ?? mode,
        icon: modeIcons[mode] ?? modeIcons.dark ?? "",
      }));
    }

    this.#segmented.value = this.mode;
    this.#event.textContent = this.event;
    this.#event.toggleAttribute("data-empty", this.event === "");
  }
}

GwDemoFrame.define("gw-demo-frame");

declare global {
  interface HTMLElementTagNameMap {
    "gw-demo-frame": GwDemoFrame;
  }
}
