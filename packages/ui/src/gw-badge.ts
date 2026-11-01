/**
 * `gw-badge`: a pill with an icon, a value and an optional label.
 * Docs: https://groundwork.timmo.dev/components/display/#badge
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import "./gw-skeleton.js";
import { fadeIn } from "./motion.js";
import {
  base,
  controlSizes,
  createIcon,
  setIconPath,
  type Tone,
} from "./styles.js";

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
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The size, around 36px tall at medium. Defaults to `medium`.
 * @attr {boolean} loading - Shows a skeleton for the value, and the icon if it has none.
 *
 * @slot - The value.
 *
 * @csspart badge - The badge.
 * @csspart label - The label above the value.
 * @csspart value - The value.
 *
 * @cssprop --gw-tone - The icon's color, for a tone of your own. `tone` sets it.
 * @cssprop --gw-badge-scale - Scales the badge, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height and icon with the theme's density. The theme sets it.
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
    controlSizes("badge"),
    css`
      :host {
        display: inline-flex;
        max-width: 100%;
        vertical-align: middle;
      }

      /* 36px tall at medium, 12px padding, 8px between the 18px icon and
         the text */
      .badge {
        --gw-size: var(--gw-badge-scale, 1);
        --gw-scale: calc(var(--gw-size) * var(--gw-control-scale, 1));
        --gw-icon-size: calc(1.125rem * var(--gw-scale));

        display: inline-flex;
        gap: calc(var(--gw-space-2) * var(--gw-size));
        align-items: center;
        box-sizing: border-box;
        max-width: 100%;
        height: calc(2.25rem * var(--gw-scale));
        padding: 0 calc(var(--gw-space-4) * var(--gw-size)) 0
          calc(var(--gw-space-3) * var(--gw-size));
        vertical-align: middle;
        color: var(--gw-color-text-strong);
        background: var(--gw-color-surface-raised);
        border: var(--gw-border-width) solid var(--gw-color-border-normal);
        border-radius: var(--gw-radius-pill);
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
        font-size: max(
          var(--gw-font-size-2xs),
          calc(var(--gw-font-size-2xs) * var(--gw-size))
        );
        line-height: 1.1;
        color: var(--gw-color-text-secondary);
      }

      .content {
        font-size: max(
          var(--gw-font-size-2xs),
          calc(var(--gw-font-size-xs) * var(--gw-size))
        );
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
  declare size: "xs" | "small" | "medium" | "large" | "xl";
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
