/**
 * `gw-theme-editor`: the "Your own theme" editor on the Themes page. It
 * designs a theme document with `gw-` controls, or takes one from a file or a
 * sample, solves it in the browser and applies it to the preview beside it.
 * The document stays in local storage. Docs-only.
 *
 * @module
 */
import { Font, MonoFont, type SolvedTheme } from "@timmo001/groundwork-tokens";
import {
  localThemeStore,
  omarchyTheme,
  parseTheme,
  runtimeTheme,
  type ThemeStore,
} from "@timmo001/groundwork-tokens/runtime";
import { registerThemeTools } from "@timmo001/groundwork-tokens/webmcp";
import {
  GwElement,
  h,
  type GwAlert,
  type GwCheckbox,
  type GwInput,
  type GwSegmented,
  type GwSelect,
} from "@timmo001/groundwork-ui";

const storageKey = "groundwork:custom-theme";

/** The docs keep the theme in this browser; an app with a host passes its own store. */
const store: ThemeStore = localThemeStore(storageKey);

const themeId = "custom";

// MDI's upload, palette, download and restore
const icons = {
  upload: "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z",
  sample:
    "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  reset:
    "M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z",
};

const starter: SolvedTheme = {
  kind: "solved",
  id: "my-theme",
  name: "My theme",
  description: "A theme designed in the editor.",
  background: "#1b1e23",
  accent: "#749bee",
  style: {
    font: "Mona Sans",
    mono: "Geist Mono",
    radius: { panel: 10, control: 8, chip: 6 },
    border: { width: 1, strength: "hairline" },
    weights: { regular: 400, strong: 600 },
    density: "normal",
    capitals: false,
    link: { color: "accent", underline: "thin" },
    surfaceAccent: "none",
    rows: "cards",
  },
};

const sample: SolvedTheme = {
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

const modeLabels: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  darker: "Darker",
};

const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "") || themeId;

const segments = (values: readonly string[]) =>
  values.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

const segmented = (label: string, values: readonly string[]) => {
  const element = h("gw-segmented", { label });

  element.options = segments(values);

  return element;
};

const select = (label: string, values: readonly string[]) => {
  const element = h("gw-select", { label });

  element.options = values.map((value) => ({ value, label: value }));

  return element;
};

const field = (label: string, type: string) => h("gw-input", { label, type });

const labeled = (label: string, control: HTMLElement) =>
  h("div", { class: "editor-field" }, h("span", { class: "editor-label" }, label), control);

/**
 * Designs a theme with `gw-` controls, or takes one from a file or a sample,
 * and applies it to the preview it wraps, with its contrast checks. The
 * document stays in local storage, so it's there on the next visit.
 */
export class GwThemeEditor extends GwElement {
  static override shadow = false;

  #tools: AbortController | undefined;

  readonly #name: GwInput = field("Name", "text");

  readonly #description: GwInput = field("Description", "text");

  readonly #background: GwInput = field("Background", "color");

  readonly #accent: GwInput = field("Accent", "color");

  readonly #font: GwSelect = select("Font", Font.literals);

  readonly #mono: GwSelect = select("Mono font", MonoFont.literals);

  readonly #panel: GwInput = field("Panel radius", "number");

  readonly #control: GwInput = field("Control radius", "number");

  readonly #chip: GwInput = field("Chip radius", "number");

  readonly #border: GwSegmented = segmented("Border", [
    "none",
    "hairline",
    "soft",
    "strong",
  ]);

  readonly #density: GwSegmented = segmented("Density", [
    "compact",
    "normal",
    "roomy",
  ]);

  readonly #surface: GwSegmented = segmented("Surface accent", [
    "none",
    "sheen",
    "marker",
    "flange",
  ]);

  readonly #rows: GwSegmented = segmented("Rows", ["cards", "dense"]);

  readonly #linkColor: GwSegmented = segmented("Link color", ["text", "accent"]);

  readonly #underline: GwSegmented = segmented("Link underline", [
    "thin",
    "thick",
  ]);

  readonly #capitals: GwCheckbox = h("gw-switch", {
    label: "Capitals on labels and buttons",
  });

  readonly #mode: GwSegmented = h("gw-segmented", { label: "Preview mode" });

  readonly #status: GwAlert = h("gw-alert", { tone: "info" });

  readonly #file = h("input", {
    type: "file",
    accept: ".json,.toml,application/json",
    hidden: true,
  });

  readonly #style = h("style");

  #document: SolvedTheme = starter;

  #preview: HTMLElement | null = null;

  protected override create(root: HTMLElement) {
    const button = (label: string, icon: string, action: () => void) => {
      const element = h(
        "gw-button",
        { variant: "neutral", appearance: "outlined", icon },
        label,
      );

      element.addEventListener("click", action);

      return element;
    };

    const form = h(
      "form",
      { class: "editor-form", "aria-label": "Theme" },
      this.#name,
      this.#description,
      h("div", { class: "editor-pair" }, this.#background, this.#accent),
      h("div", { class: "editor-pair" }, this.#font, this.#mono),
      h("div", { class: "editor-trio" }, this.#panel, this.#control, this.#chip),
      labeled("Border", this.#border),
      labeled("Density", this.#density),
      labeled("Surface accent", this.#surface),
      labeled("Rows", this.#rows),
      h("div", { class: "editor-pair" }, labeled("Link color", this.#linkColor), labeled("Link underline", this.#underline)),
      this.#capitals,
    );

    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () => this.#edit());
    form.addEventListener("change", () => this.#edit());

    this.#mode.addEventListener("change", () => this.#showMode());

    this.#file.addEventListener("change", () => {
      const file = this.#file.files?.[0];

      this.#file.value = "";

      if (file !== undefined) void file.text().then((text) => this.#upload(file.name, text));
    });

    this.#preview = this.querySelector(".editor-preview");

    const actions = h(
      "div",
      { class: "editor-actions" },
      button("Upload", icons.upload, () => this.#file.click()),
      button("Use a sample", icons.sample, () => this.#load(JSON.stringify(sample))),
      button("Download", icons.download, () => this.#download()),
      button("Reset", icons.reset, () => {
        void store.clear();
        this.#load(JSON.stringify(starter));
      }),
      this.#file,
    );

    root.prepend(
      actions,
      h("div", { class: "editor-panel" }, form),
    );

    this.#preview?.prepend(labeled("Preview mode", this.#mode));
    this.#preview?.after(this.#status);
    // Starts on the starter, so the form is never empty while the store reads
    this.#load(JSON.stringify(starter));
    void store.load().then((text) => {
      if (text !== null) this.#load(text);
    });
  }

  // The theme's style and the agent tools follow the editor on and off the
  // page, since `create` only runs once
  override connectedCallback() {
    super.connectedCallback();
    document.head.append(this.#style);

    // In a browser with WebMCP, an agent can read, list and set the theme
    // through the editor, so the user sees each change
    this.#tools = new AbortController();
    registerThemeTools({
      store,
      apply: ({ text }) => this.#load(text),
      signal: this.#tools.signal,
    });
  }

  override disconnectedCallback() {
    this.#tools?.abort();
    this.#style.remove();
  }

  /** Puts a document's values into the controls. */
  #fill(theme: SolvedTheme) {
    const { style } = theme;

    this.#name.value = theme.name;
    this.#description.value = theme.description;
    this.#background.value = theme.background;
    this.#accent.value = theme.accent;
    this.#font.value = style.font;
    this.#mono.value = style.mono;
    this.#panel.value = String(style.radius.panel);
    this.#control.value = String(style.radius.control);
    this.#chip.value = String(style.radius.chip);
    this.#border.value = style.border.strength;
    this.#density.value = style.density;
    this.#surface.value = style.surfaceAccent;
    this.#rows.value = style.rows;
    this.#linkColor.value = style.link.color;
    this.#underline.value = style.link.underline;
    this.#capitals.checked = style.capitals;
  }

  /** The document the controls describe, as JSON for the decoder to check. */
  #read() {
    const theme = this.#document;

    return JSON.stringify(
      {
        ...theme,
        id: slug(this.#name.value),
        name: this.#name.value || "Untitled",
        description: this.#description.value,
        background: this.#background.value,
        accent: this.#accent.value,
        style: {
          ...theme.style,
          font: this.#font.value,
          mono: this.#mono.value,
          radius: {
            panel: Number(this.#panel.value),
            control: Number(this.#control.value),
            chip: Number(this.#chip.value),
          },
          border: { ...theme.style.border, strength: this.#border.value },
          density: this.#density.value,
          capitals: this.#capitals.checked,
          link: { color: this.#linkColor.value, underline: this.#underline.value },
          surfaceAccent: this.#surface.value,
          rows: this.#rows.value,
        },
      },
      null,
      2,
    );
  }

  #edit() {
    this.#apply(this.#read(), false);
  }

  #load(text: string) {
    this.#apply(text, true);
  }

  /** A theme document, or an Omarchy theme's `colors.toml`, mapped first. */
  #upload(fileName: string, text: string) {
    if (!fileName.endsWith(".toml")) {
      this.#load(text);

      return;
    }

    const mapped = omarchyTheme(text);

    if (mapped._tag === "Success") {
      this.#load(JSON.stringify(mapped.success, null, 2));
    } else {
      this.#status.setAttribute("tone", "danger");
      this.#status.setAttribute("heading", "That isn't an Omarchy colors.toml");
      this.#status.textContent = String(mapped.failure).slice(0, 400);
    }
  }

  #download() {
    const link = h("a", {
      href: URL.createObjectURL(
        new Blob([this.#read()], { type: "application/json" }),
      ),
      download: `${slug(this.#name.value)}.json`,
    });

    link.click();
    URL.revokeObjectURL(link.href);
  }

  #showMode() {
    this.#preview?.setAttribute("data-gw-mode", this.#mode.value);
  }

  #apply(text: string, fill: boolean) {
    const parsed = parseTheme(text);

    if (parsed._tag === "Failure") {
      this.#status.setAttribute("tone", "danger");
      this.#status.setAttribute("heading", "That isn't a theme document");
      this.#status.textContent = String(parsed.failure).slice(0, 400);

      return;
    }

    const document = parsed.success;
    const { theme, css, checks } = runtimeTheme(document, themeId);
    const misses = checks.filter((result) => !result.passes);
    const modes = Object.keys(theme.modes);

    if (document.kind === "solved") {
      this.#document = document;

      if (fill) this.#fill(document);
    }

    void store.save(text);
    this.#style.textContent = css;
    this.#preview?.setAttribute("data-gw-theme", themeId);

    this.#mode.options = modes.map((mode) => ({
      value: mode,
      label: modeLabels[mode] ?? mode,
    }));

    if (!modes.includes(this.#mode.value)) this.#mode.value = modes.includes("dark") ? "dark" : (modes[0] ?? "dark");

    this.#showMode();
    this.#status.setAttribute("tone", misses.length === 0 ? "success" : "warning");
    this.#status.setAttribute("heading", theme.name);

    this.#status.textContent =
      misses.length === 0
        ? `Solved into ${modes.map((mode) => modeLabels[mode] ?? mode).join(", ")}, and every role meets its contrast target.`
        : `Applied, with ${misses.length} roles below target: ${misses
            .slice(0, 4)
            .map((miss) => `${miss.role} in ${miss.mode} (${miss.ratio.toFixed(2)})`)
            .join(", ")}.`;
  }
}

GwThemeEditor.define("gw-theme-editor");

declare global {
  interface HTMLElementTagNameMap {
    "gw-theme-editor": GwThemeEditor;
  }
}
