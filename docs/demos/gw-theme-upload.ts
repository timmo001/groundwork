/**
 * `gw-theme-upload`: the "Your own theme" demo on the Themes page. It takes a
 * theme document from a file or a sample, keeps it in local storage, solves
 * it in the browser and applies it to what's slotted inside. Docs-only.
 *
 * @module
 */
import { parseTheme, runtimeTheme } from "@groundwork/tokens/runtime";
import { GwElement, css, h } from "@groundwork/ui";

const storageKey = "groundwork:custom-theme";

const themeId = "custom";

// MDI's upload, palette and restore
const icons = {
  upload: "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z",
  sample:
    "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z",
  reset:
    "M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z",
};

const sample = {
  kind: "solved",
  id: "kiln",
  name: "Kiln",
  description: "Warm clay and ember orange, square and dense.",
  background: "#1f1a17",
  accent: "#e08a4f",
  style: {
    font: "IBM Plex Sans",
    mono: "JetBrains Mono",
    radius: { panel: 6, control: 4, chip: 4 },
    border: { width: 1, strength: "soft" },
    weights: { regular: 400, strong: 600 },
    density: "compact",
    capitals: true,
    link: { color: "accent", underline: "thick" },
    surfaceAccent: "flange",
    rows: "dense",
  },
};

/**
 * Applies a theme document from a file or a sample to its slotted content,
 * and shows whether it decoded and met every contrast target. The document
 * stays in local storage, so it's there on the next visit.
 */
export class GwThemeUpload extends GwElement {
  static override styles = [
    css`
      :host {
        display: grid;
        gap: var(--gw-space-4);
        margin-block: 1.5rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gw-space-2);
      }
    `,
  ];

  readonly #file = h("input", {
    type: "file",
    accept: ".json,application/json",
    hidden: true,
  });

  readonly #status = h("gw-alert", { tone: "info", heading: "No theme yet" });

  readonly #style = h("style");

  protected override create(root: ShadowRoot) {
    const upload = h(
      "gw-button",
      { variant: "neutral", appearance: "outlined", icon: icons.upload },
      "Upload a theme",
    );

    const useSample = h(
      "gw-button",
      { variant: "neutral", appearance: "outlined", icon: icons.sample },
      "Use a sample",
    );

    const reset = h(
      "gw-button",
      { variant: "neutral", appearance: "outlined", icon: icons.reset },
      "Reset",
    );

    upload.addEventListener("click", () => this.#file.click());

    useSample.addEventListener("click", () =>
      this.#apply(JSON.stringify(sample, null, 2)),
    );

    reset.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      this.#clear("No theme yet");
    });

    this.#file.addEventListener("change", () => {
      const file = this.#file.files?.[0];

      this.#file.value = "";

      if (file !== undefined) void file.text().then((text) => this.#apply(text));
    });

    this.#status.textContent =
      "Upload a theme document, or use the sample, to see these components take it.";

    root.append(
      h("div", { class: "actions" }, upload, useSample, reset, this.#file),
      this.#status,
      h("slot"),
    );
    document.head.append(this.#style);

    const stored = localStorage.getItem(storageKey);

    if (stored !== null) this.#apply(stored);
  }

  override disconnectedCallback() {
    this.#style.remove();
  }

  #clear(heading: string) {
    this.#style.textContent = "";
    this.dataset.gwTheme = "base";
    this.#status.setAttribute("tone", "info");
    this.#status.setAttribute("heading", heading);
    this.#status.textContent =
      "Upload a theme document, or use the sample, to see these components take it.";
  }

  #apply(text: string) {
    const parsed = parseTheme(text);

    if (parsed._tag === "Failure") {
      this.#clear("That isn't a theme document");
      this.#status.setAttribute("tone", "danger");
      this.#status.textContent = String(parsed.failure).slice(0, 400);

      return;
    }

    const { theme, css: rules, checks } = runtimeTheme(parsed.success, themeId);
    const misses = checks.filter((result) => !result.passes);

    localStorage.setItem(storageKey, text);
    this.#style.textContent = rules;
    this.dataset.gwTheme = themeId;
    this.#status.setAttribute("tone", misses.length === 0 ? "success" : "warning");
    this.#status.setAttribute("heading", theme.name);

    this.#status.textContent =
      misses.length === 0
        ? `Solved into ${Object.keys(theme.modes).join(", ")}, and every role meets its contrast target.`
        : `Applied, with ${misses.length} roles below target: ${misses
            .slice(0, 4)
            .map((miss) => `${miss.role} in ${miss.mode} (${miss.ratio.toFixed(2)})`)
            .join(", ")}.`;
  }
}

GwThemeUpload.define("gw-theme-upload");

declare global {
  interface HTMLElementTagNameMap {
    "gw-theme-upload": GwThemeUpload;
  }
}
