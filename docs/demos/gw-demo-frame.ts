import tokens from "@groundwork/tokens/themes.json";
import { LitElement, css, html } from "lit";

const tones = ["neutral", "accent", "info", "success", "warning", "danger", "important"] as const;

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
 * button with `data-opens="id"` opens that dialog, one with `data-toast`
 * shows a toast in the frame's `gw-toaster`, and the last `change`, `select`
 * or `close` event is shown in the toolbar.
 */
export class GwDemoFrame extends LitElement {
  static override properties = {
    theme: { attribute: "data-gw-theme", reflect: true },
    mode: { attribute: "data-gw-mode", reflect: true },
    layout: { reflect: true },
    event: { state: true },
  };

  static override styles = css`
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
      gap: var(--gw-space-3);
      align-items: center;
      padding: var(--gw-space-3) var(--gw-space-5);
      font-size: var(--gw-font-size-xs);
      background: var(--gw-color-surface-lower);
      border-bottom: 1px solid var(--gw-color-border-quiet);
    }

    select {
      padding: var(--gw-space-2) var(--gw-space-3);
      font: inherit;
      color: var(--gw-color-text-strong);
      background: var(--gw-color-surface-raised);
      border: 1px solid var(--gw-color-border-normal);
      border-radius: var(--gw-radius-control);
    }

    .modes {
      display: inline-flex;
      overflow: hidden;
      border: 1px solid var(--gw-color-border-normal);
      border-radius: var(--gw-radius-control);
    }

    .modes button {
      padding: var(--gw-space-2) var(--gw-space-4);
      font: inherit;
      color: var(--gw-color-text-primary);
      cursor: pointer;
      background: var(--gw-color-surface-raised);
      border: 0;
    }

    .modes button[aria-pressed="true"] {
      color: var(--gw-color-on-accent);
      background: var(--gw-color-fill-accent-resting);
    }

    select:focus-visible,
    .modes button:focus-visible {
      outline: var(--gw-focus-width) solid var(--gw-color-focus);
      outline-offset: var(--gw-focus-offset);
    }

    .stage {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gw-space-4);
      align-items: center;
      padding: var(--gw-space-6) var(--gw-space-5);
    }

    :host([layout="stack"]) .stage {
      flex-direction: column;
      align-items: stretch;
    }

    .event {
      margin-inline-start: auto;
      font-family: var(--gw-font-mono);
      color: var(--gw-color-text-secondary);
    }
  `;

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
        .find((node) => node instanceof HTMLElement && (node.dataset.opens || node.dataset.toast));

      if (!(target instanceof HTMLElement)) return;

      if (target.dataset.opens) {
        const dialog = this.querySelector(`#${target.dataset.opens}`);

        if (dialog !== null && "show" in dialog && typeof dialog.show === "function") {
          dialog.show();
        }
      }

      if (target.dataset.toast) {
        const tone = tones.find((item) => item === target.dataset.tone) ?? "neutral";

        this.querySelector("gw-toaster")?.show(target.dataset.toast, tone);
      }
    });

    for (const type of ["change", "select", "close"]) {
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
    event.stopPropagation();

    if (!(event.target instanceof HTMLSelectElement)) return;

    this.theme = event.target.value;

    if (!this.modes.includes(this.mode)) this.mode = this.modes[0] ?? "dark";
  }

  override render() {
    return html`
      <div class="toolbar">
        <label>
          Theme
          <select @change=${this.pickTheme} .value=${this.theme}>
            ${tokens.themes.map(
              (theme) =>
                html`<option value=${theme.id} ?selected=${theme.id === this.theme}>
                  ${theme.name}
                </option>`,
            )}
          </select>
        </label>
        <span class="modes" role="group" aria-label="Mode">
          ${this.modes.map(
            (mode) =>
              html`<button
                type="button"
                aria-pressed=${mode === this.mode ? "true" : "false"}
                @click=${() => {
                  this.mode = mode;
                }}
              >
                ${labels[mode] ?? mode}
              </button>`,
          )}
        </span>
        <span class="event" aria-live="polite">${this.event}</span>
      </div>
      <div class="stage"><slot></slot></div>
    `;
  }
}

customElements.define("gw-demo-frame", GwDemoFrame);

declare global {
  interface HTMLElementTagNameMap {
    "gw-demo-frame": GwDemoFrame;
  }
}
