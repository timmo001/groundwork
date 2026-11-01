/**
 * `gw-badge`: a pill with an icon, a value and an optional label.
 * Docs: https://groundwork.timmo.dev/components/display/#badge
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import { base, createIcon, setIconPath, type Tone } from "./styles.js";

/**
 * A pill with an icon, a value and an optional small label above it. The
 * icon takes the `tone`'s color. While `loading`, a skeleton stands in for
 * the value, and for the icon if it has none yet, and the value fades in
 * once it's loaded.
 *
 * @element gw-badge
 * @summary A pill with an icon, a value and an optional label.
 *
 * @attr {string} icon - SVG path data for the icon.
 * @attr {string} label - A small label above the value.
 * @attr {"neutral"|"accent"|"info"|"success"|"warning"|"danger"|"important"} tone - The icon's color. Defaults to `accent`.
 * @attr {"small"|"medium"} size - The size. Defaults to `medium`.
 * @attr {boolean} loading - Shows a skeleton for the value, and the icon if it has none.
 *
 * @slot - The value.
 *
 * @csspart badge - The badge.
 * @csspart label - The label above the value.
 * @csspart value - The value.
 *
 * @cssprop --gw-tone - The icon's color, for a tone of your own. `tone` sets it.
 */
export class GwBadge extends GwElement {
  static override properties = {
    icon: {},
    label: {},
    tone: { reflect: true },
    size: { reflect: true },
    loading: { type: "boolean", reflect: true },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-flex;
        max-width: 100%;
        vertical-align: middle;
      }

      /* 36px tall, 12px padding, 8px between the 18px icon and the text */
      .badge {
        --gw-icon-size: 1.125rem;

        display: inline-flex;
        gap: var(--gw-space-2);
        align-items: center;
        box-sizing: border-box;
        max-width: 100%;
        height: 2.25rem;
        padding: 0 var(--gw-space-4) 0 var(--gw-space-3);
        vertical-align: middle;
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
      }

      :host([size="small"]) .badge {
        --gw-icon-size: 1rem;

        gap: var(--gw-space-1);
        height: 1.75rem;
        padding: 0 var(--gw-space-3) 0 var(--gw-space-2);
      }

      .icon {
        color: var(--gw-tone, var(--gw-color-accent));
      }

      .info {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .label {
        font-size: var(--gw-font-size-2xs);
        line-height: 1.1;
        color: var(--gw-color-text-secondary);
      }

      .content {
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1.2;
        white-space: nowrap;
      }

      .value {
        display: inline-block;
      }
    `,
  ];

  declare icon: string;
  declare label: string;
  declare tone: Tone;
  declare size: "small" | "medium";
  declare loading: boolean;

  readonly #badge = h("span", { class: "badge", part: "badge" });

  readonly #icon = createIcon("");

  readonly #iconSkeleton = h("gw-skeleton-icon");

  readonly #label = h("span", { class: "label", part: "label" });

  readonly #skeleton = h("gw-skeleton-text", {
    style: "--gw-skeleton-width: 3rem",
  });

  readonly #value = h("span", { class: "value" }, h("slot"));

  constructor() {
    super();
    this.icon = "";
    this.label = "";
    this.tone = "accent";
    this.size = "medium";
    this.loading = false;
  }

  protected override create(root: ShadowRoot) {
    this.#badge.append(
      this.#icon,
      this.#iconSkeleton,
      h(
        "span",
        { class: "info" },
        this.#label,
        h(
          "span",
          { class: "content", part: "value" },
          this.#skeleton,
          this.#value,
        ),
      ),
    );
    root.append(this.#badge);
  }

  protected override update(changed: ReadonlySet<string>) {
    const wasLoading = this.#value.hidden;

    setAttribute(this.#badge, "aria-busy", this.loading ? "true" : null);
    setIconPath(this.#icon, this.icon);
    this.#icon.style.display = this.icon ? "" : "none";
    this.#iconSkeleton.hidden = this.icon !== "" || !this.loading;
    this.#label.textContent = this.label;
    this.#label.hidden = !this.label;
    this.#skeleton.hidden = !this.loading;
    this.#value.hidden = this.loading;

    if (changed.has("loading") && wasLoading && !this.loading) {
      fadeIn(this.#value);
    }
  }
}

GwBadge.define("gw-badge");

declare global {
  interface HTMLElementTagNameMap {
    "gw-badge": GwBadge;
  }
}
