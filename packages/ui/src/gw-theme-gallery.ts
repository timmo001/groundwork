/**
 * `gw-theme-gallery`: picks a theme from cards that preview each one.
 * Docs: https://groundwork.timmo.dev/components/actions/#theme-gallery
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type { OptionItem } from "./gw-option-list.js";
import { base, createIcon } from "./styles.js";

// MDI's check
const checkIcon = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

const other = "Other";

/** The roles a preview is drawn from, by the variable each one sets. */
const roles = {
  "--p-bg": "--gw-color-surface-lower",
  "--p-surface": "--gw-color-surface-raised",
  "--p-border": "--gw-color-border-normal",
  "--p-text": "--gw-color-text-primary",
  "--p-muted": "--gw-color-text-secondary",
  "--p-accent": "--gw-color-accent",
  "--p-info": "--gw-color-info",
  "--p-success": "--gw-color-success",
  "--p-warning": "--gw-color-warning",
  "--p-danger": "--gw-color-danger",
  "--p-important": "--gw-color-important",
  "--p-radius": "--gw-radius-panel",
} as const;

const tones = ["info", "success", "warning", "danger", "important"] as const;

/**
 * A theme's preview colors in a mode. Theme CSS is written for the page, so
 * it can't reach into a shadow root: a hidden probe on the page reads them.
 */
const probe = (id: string, mode: string) => {
  const element = h("div", {
    "data-gw-theme": id,
    "data-gw-mode": mode === "auto" ? null : mode,
    hidden: true,
  });

  document.body.append(element);

  const style = getComputedStyle(element);

  const colors = Object.entries(roles).map(
    ([name, role]) => [name, style.getPropertyValue(role).trim()] as const,
  );

  element.remove();

  return colors;
};

/**
 * The closest element at or above `start` with `attribute`, crossing shadow
 * roots, or `<html>`.
 */
const closestWith = (start: Element, attribute: string) => {
  let node: Node | null = start;

  while (node !== null) {
    if (node instanceof Element && node.hasAttribute(attribute)) return node;

    node = node instanceof ShadowRoot ? node.host : node.parentNode;
  }

  return document.documentElement;
};

/**
 * Themes in groups, in the order they come. A group with one theme joins the
 * others like it under "Other", last. With no groups, one unnamed group.
 */
const grouped = (themes: readonly OptionItem[]) => {
  if (!themes.some((theme) => theme.group)) return [["", themes] as const];

  const groups = new Map<string, OptionItem[]>();

  for (const theme of themes) {
    const name = theme.group ?? other;

    groups.set(name, [...(groups.get(name) ?? []), theme]);
  }

  const own = [...groups].filter(
    ([name, members]) => name !== other && members.length > 1,
  );

  const rest = themes.filter(
    (theme) => !own.some(([name]) => name === theme.group),
  );

  return rest.length === 0 ? own : [...own, [other, rest] as const];
};

/**
 * Picks a theme from a grid of cards, each a small picture of an app in that
 * theme's colors: a rail, a panel and the status tones. For a settings page,
 * or inside `gw-theme-picker` with `gallery`.
 *
 * Themes with a `group` sit together under its name, and lone ones under
 * "Other", so a family's light and dark variants line up. Previews draw in
 * `mode`, or the mode of the page or themed container it sits in, from the
 * theme CSS already on the page, including a custom theme `pageTheme`
 * imported. Call `refresh()` after that CSS changes.
 *
 * It's a `<fieldset>` of native radio buttons, so arrow keys move the choice.
 * It fires `theme`.
 *
 * @element gw-theme-gallery
 * @summary Picks a theme from cards that preview each one.
 *
 * @attr {string} label - The group's accessible name. Defaults to `Theme`.
 * @attr {string} theme - The chosen theme, by id.
 * @attr {OptionItem[]} themes - The themes, as JSON: `value` is the id, `label` the name, and `group` the family.
 * @attr {"auto"|"light"|"dark"|"darker"} mode - The mode the previews show. Defaults to the mode it sits in.
 *
 * @csspart card - Each theme's card.
 * @csspart preview - The picture of an app in the theme.
 * @csspart name - The theme's name under it.
 * @csspart group - Each group's heading.
 *
 * @cssprop --gw-theme-gallery-min - The narrowest a card gets. Defaults to `9rem`.
 *
 * @fires {CustomEvent<{ id: string }>} theme - When a theme is picked.
 */
export class GwThemeGallery extends GwElement {
  static override properties = {
    label: {},
    theme: { reflect: true },
    themes: { type: "json" },
    mode: { reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      fieldset {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-4);
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
      }

      legend {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      .group {
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(var(--gw-theme-gallery-min, 9rem), 1fr)
        );
        gap: var(--gw-space-3);
      }

      .group-name {
        grid-column: 1 / -1;
        margin: 0;
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-transform: var(--gw-label-transform);
        letter-spacing: var(--gw-label-tracking);
      }

      label {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-2);
        padding: var(--gw-space-2);
        cursor: pointer;
        background: var(--gw-color-surface-raised);
        border: 2px solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-panel);
        transition:
          border-color var(--gw-motion-fast) var(--gw-motion-easing),
          background-color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      label:hover {
        border-color: var(--gw-color-border-accent);
      }

      label:has(input:checked) {
        background: var(--gw-color-fill-accent-quiet);
        border-color: var(--gw-color-accent);
      }

      label:has(input:focus-visible) {
        outline: var(--gw-focus-width) solid var(--gw-color-focus);
        outline-offset: var(--gw-focus-offset);
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0;
      }

      /* A small app in the theme's own colors */
      .preview {
        display: grid;
        grid-template-columns: 22% 1fr;
        gap: 6px;
        height: 5.5rem;
        padding: 6px;
        background: var(--p-bg);
        border-radius: calc(var(--gw-radius-panel) - 2px);
      }

      .rail {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
      }

      .rail i {
        height: 5px;
        background: var(--p-muted);
        border-radius: 3px;
        opacity: 0.5;
      }

      .rail i:first-child {
        background: var(--p-accent);
        opacity: 1;
      }

      .panel {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
        padding: 6px;
        background: var(--p-surface);
        border: 1px solid var(--p-border);
        border-radius: min(var(--p-radius), 6px);
      }

      .line {
        width: 60%;
        height: 5px;
        background: var(--p-text);
        border-radius: 3px;
      }

      .line.short {
        width: 40%;
        background: var(--p-muted);
      }

      .bars {
        display: flex;
        flex: 1;
        gap: 3px;
        align-items: flex-end;
      }

      .bars i {
        flex: 1;
        border-radius: 2px 2px 0 0;
      }

      .name {
        display: flex;
        flex-direction: column;
        padding: 0 var(--gw-space-1) var(--gw-space-1);
        font-size: var(--gw-font-size-s);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      .name small {
        font-size: var(--gw-font-size-xs);
        font-weight: normal;
        color: var(--gw-color-text-secondary);
      }

      label:has(input:checked) .name {
        color: var(--gw-color-accent);
      }

      .check {
        position: absolute;
        inset-block-start: var(--gw-space-3);
        inset-inline-end: var(--gw-space-3);
        display: none;
        place-items: center;
        width: 1.5rem;
        height: 1.5rem;
        color: var(--gw-color-on-accent);
        background: var(--gw-color-fill-accent-resting);
        border-radius: 50%;
        --gw-icon-size: 1rem;
      }

      label:has(input:checked) .check {
        display: grid;
      }
    `,
  ];

  declare label: string;
  declare theme: string;
  declare themes: readonly OptionItem[];
  declare mode: string;

  readonly #legend = h("legend");

  readonly #fieldset = h("fieldset", {}, this.#legend);

  readonly #name = `gw-theme-gallery-${Math.random().toString(36).slice(2)}`;

  #cards: {
    input: HTMLInputElement;
    preview: HTMLElement;
    id: string;
  }[] = [];

  readonly #scheme = matchMedia("(prefers-color-scheme: dark)");

  readonly #onScheme = () => {
    if (this.#mode() === "auto") this.refresh();
  };

  // Follows the surrounding mode while `mode` is unset
  readonly #modeRoot = new MutationObserver(() => {
    if (!this.mode) this.refresh();
  });

  constructor() {
    super();
    this.label = "Theme";
    this.theme = "";
    this.themes = [];
    this.mode = "";
  }

  /** `mode`, or the mode of the page or themed container around it. */
  #mode() {
    if (this.mode) return this.mode;

    return (
      closestWith(this, "data-gw-mode").getAttribute("data-gw-mode") ?? "auto"
    );
  }

  /** Redraws the previews from the page's theme CSS, such as after an import. */
  refresh() {
    const mode = this.#mode();

    for (const { preview, id } of this.#cards) {
      for (const [name, value] of probe(id, mode)) {
        preview.style.setProperty(name, value);
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#scheme.addEventListener("change", this.#onScheme);
    this.#modeRoot.observe(closestWith(this, "data-gw-theme"), {
      attributeFilter: ["data-gw-mode"],
    });
    this.refresh();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#scheme.removeEventListener("change", this.#onScheme);
    this.#modeRoot.disconnect();
  }

  #card(theme: OptionItem, inOther: boolean) {
    const input = h("input", {
      type: "radio",
      name: this.#name,
      value: theme.value,
    });

    input.addEventListener("change", () => {
      this.theme = theme.value;
      this.dispatchEvent(
        new CustomEvent("theme", {
          detail: { id: theme.value },
          bubbles: true,
          composed: true,
        }),
      );
    });

    const preview = h(
      "span",
      { class: "preview", part: "preview", "aria-hidden": "true" },
      h("span", { class: "rail" }, h("i"), h("i"), h("i"), h("i")),
      h(
        "span",
        { class: "panel" },
        h("span", { class: "line" }),
        h("span", { class: "line short" }),
        h("span", { class: "bars" }),
      ),
    );

    preview.querySelector(".bars")?.append(
      ...tones.map((tone, index) => {
        const bar = h("i");

        bar.style.height = `${35 + ((index * 37) % 65)}%`;
        bar.style.background = `var(--p-${tone})`;

        return bar;
      }),
    );

    const label = h(
      "label",
      { part: "card" },
      input,
      preview,
      h(
        "span",
        { class: "name", part: "name" },
        theme.label,
        inOther && theme.group ? h("small", {}, theme.group) : null,
      ),
      h("span", { class: "check" }, createIcon(checkIcon)),
    );

    this.#cards.push({ input, preview, id: theme.value });

    return label;
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#fieldset);
  }

  protected override update(changed: ReadonlySet<string>) {
    this.#legend.textContent = this.label;

    if (changed.has("themes")) {
      const themes = Array.isArray(this.themes) ? this.themes : [];

      this.#cards = [];
      this.#fieldset.replaceChildren(
        this.#legend,
        ...grouped(themes).map(([name, members]) =>
          h(
            "div",
            { class: "group" },
            name ? h("h3", { class: "group-name", part: "group" }, name) : null,
            ...members.map((theme) => this.#card(theme, name === other)),
          ),
        ),
      );
    }

    for (const { input, id } of this.#cards) input.checked = id === this.theme;

    if (changed.has("themes") || changed.has("mode")) this.refresh();
  }
}

GwThemeGallery.define("gw-theme-gallery");

declare global {
  interface HTMLElementTagNameMap {
    "gw-theme-gallery": GwThemeGallery;
  }
}
