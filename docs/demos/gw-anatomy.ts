/**
 * `gw-anatomy`: a component's measured anatomy on its docs page. It wraps a
 * live component, draws redlines for its height, width, padding, gap and
 * radius, and names the token each value comes from. It's docs-only, not part
 * of `@groundwork/ui`.
 *
 * @module
 */
import { GwElement, css, h } from "@groundwork/ui";

const scales = {
  space: ["0-5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "14", "16", "18", "20"],
  radius: ["xs", "s", "m", "l", "xl", "chip", "control", "panel", "pill"],
  "font-size": ["2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl", "4xl"],
} as const;

type Scale = keyof typeof scales;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const px = (value: string) => Number.parseFloat(value) || 0;



const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Shows a live component with its measured anatomy.
 *
 * @element gw-anatomy
 * @summary A component drawn with redlines and the tokens behind them.
 *
 * @attr {string} target - A selector for the part to measure, looked up in the
 * component's shadow root, then its light DOM. Defaults to the first element
 * with a `part`, or the component itself.
 * @attr {number} scale - How much larger to draw the component, 2 by default.
 * Wide components use 1.
 * @slot - The component to measure. It's made inert, since popovers can't
 * follow the zoom.
 */
export class GwAnatomy extends GwElement {
  static override properties = {
    target: {},
    scale: { type: "number" },
  } as const;

  static override styles = [
    css`
      :host {
        display: block;
        inline-size: 100%;
        font-family: var(--gw-font-sans);
      }

      .stage {
        position: relative;
        display: grid;
        place-items: center;
        min-block-size: 10rem;
        padding: var(--gw-space-10) var(--gw-space-12);
        background-image: radial-gradient(
          var(--gw-color-border-quiet) 1px,
          transparent 1px
        );
        background-size: 8px 8px;
        border-radius: var(--gw-radius-panel);
      }

      ::slotted(*) {
        zoom: var(--gw-anatomy-scale, 2);
      }

      :host([scale="1"]) ::slotted(*) {
        justify-self: stretch;
        max-inline-size: 32rem;
        margin-inline: auto;
      }

      svg {
        position: absolute;
        inset: 0;
        inline-size: 100%;
        block-size: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .pad {
        fill: color-mix(in srgb, var(--gw-color-danger) 18%, transparent);
      }

      .gap {
        fill: color-mix(in srgb, var(--gw-color-info) 22%, transparent);
      }

      .line {
        stroke: var(--gw-color-danger);
        stroke-width: 1;
      }

      .outline {
        fill: none;
        stroke: var(--gw-color-danger);
        stroke-dasharray: 3 3;
      }

      text {
        font-family: var(--gw-font-mono);
        font-size: 11px;
        fill: var(--gw-color-danger);
      }

      text.info {
        fill: var(--gw-color-info);
      }

      dl {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
        gap: var(--gw-space-2) var(--gw-space-4);
        margin: var(--gw-space-4) 0 0;
        font-size: var(--gw-font-size-s);
      }

      dl > div {
        display: flex;
        flex-direction: column;
        gap: var(--gw-space-0-5);
        min-block-size: 2.75rem;
      }

      dt {
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      dd {
        margin: 0;
        font-family: var(--gw-font-mono);
        font-size: var(--gw-font-size-xs);
        color: var(--gw-color-text-primary);
      }
    `,
  ];

  declare target: string | undefined;
  declare scale: number;

  constructor() {
    super();
    this.scale = 2;
  }

  readonly #svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  readonly #stage = h("div", { class: "stage" }, h("slot"), this.#svg);

  readonly #facts = h("dl");

  readonly #resize = new ResizeObserver(() => this.draw());

  readonly #themes = new MutationObserver(() => requestAnimationFrame(() => this.draw()));

  protected override create(root: ShadowRoot) {
    this.#svg.setAttribute("aria-hidden", "true");
    root.append(this.#stage, this.#facts);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#resize.observe(this);

    // Zoom draws the component large, but its popovers open in the top layer
    // at their real size and position, away from it, so it's for looking at
    // only; the demo above it is the one to use
    this.specimen?.setAttribute("inert", "");

    if (this.specimen !== null) this.#resize.observe(this.specimen);

    void document.fonts.ready.then(() => requestAnimationFrame(() => this.draw()));

    const frame = this.closest("[data-gw-theme]");

    if (frame !== null) {
      this.#themes.observe(frame, { attributes: true, attributeFilter: ["data-gw-theme", "data-gw-mode"] });
    }

    void customElements.whenDefined(this.specimen?.localName ?? "div").then(() =>
      requestAnimationFrame(() => this.draw()),
    );
  }

  override disconnectedCallback() {
    this.#resize.disconnect();
    this.#themes.disconnect();
  }

  protected override update() {
    this.style.setProperty("--gw-anatomy-scale", String(this.scale));
    requestAnimationFrame(() => this.draw());
  }

  private get specimen() {
    return this.firstElementChild;
  }

  /** The part to measure: `target`, the first `[part]`, or the component. */
  private get measured() {
    const specimen = this.specimen;

    if (specimen === null) return null;

    const selector = this.target ?? "[part]";

    return (
      specimen.shadowRoot?.querySelector(selector) ?? specimen.querySelector(selector) ?? specimen
    );
  }

  /** The token on a scale whose value matches, such as `--gw-space-4`. */
  private token(scale: Scale, value: number) {
    if (value === 0) return "0";

    const style = getComputedStyle(this);
    const probe = h("div");

    this.#stage.append(probe);

    try {
      for (const step of scales[scale]) {
        const name = `--gw-${scale}-${step}`;

        if (style.getPropertyValue(name).trim() === "") continue;

        probe.style.width = `var(${name})`;

        if (Math.abs(px(getComputedStyle(probe).width) - value) < 0.6) return name;
      }
    } finally {
      probe.remove();
    }

    return undefined;
  }

  private describe(scale: Scale, value: number) {
    const token = this.token(scale, value);
    const size = `${round(value)}px`;

    return token === undefined || token === "0" ? size : `${size} · ${token}`;
  }

  private draw() {
    const part = this.measured;

    if (part === null || !this.isConnected) return;

    const origin = this.#stage.getBoundingClientRect();
    const rect = part.getBoundingClientRect();

    if (rect.width === 0) return;

    const style = getComputedStyle(part);
    const box: Box = {
      x: rect.x - origin.x,
      y: rect.y - origin.y,
      width: rect.width,
      height: rect.height,
    };

    const padding = {
      top: px(style.paddingTop),
      right: px(style.paddingRight),
      bottom: px(style.paddingBottom),
      left: px(style.paddingLeft),
    };

    // Gaps between the part's laid-out children, in its own direction
    const children = [...(part.children.length > 0 ? part.children : [])]
      .map((child) => child.getBoundingClientRect())
      .filter((child) => child.width > 0 && child.height > 0);
    const gap = px(style.columnGap) || px(style.rowGap);
    const column = style.flexDirection.startsWith("column");

    const shapes: string[] = [];
    const rectangle = (cls: string, x: number, y: number, width: number, height: number) =>
      width > 0 && height > 0
        ? shapes.push(`<rect class="${cls}" x="${x}" y="${y}" width="${width}" height="${height}"/>`)
        : 0;
    const line = (x1: number, y1: number, x2: number, y2: number) =>
      shapes.push(`<line class="line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
    const label = (x: number, y: number, text: string, anchor = "middle", cls = "") =>
      shapes.push(
        `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${text}</text>`,
      );

    // The box is measured as drawn, at the zoom; padding, gap and radius come
    // from computed styles at their real size, so they're scaled to draw
    const { x, y, width, height } = box;
    const zoom = this.scale;
    const drawn = {
      top: padding.top * zoom,
      right: padding.right * zoom,
      bottom: padding.bottom * zoom,
      left: padding.left * zoom,
    };

    rectangle("pad", x, y, width, drawn.top);
    rectangle("pad", x, y + height - drawn.bottom, width, drawn.bottom);
    rectangle("pad", x, y + drawn.top, drawn.left, height - drawn.top - drawn.bottom);
    rectangle(
      "pad",
      x + width - drawn.right,
      y + drawn.top,
      drawn.right,
      height - drawn.top - drawn.bottom,
    );

    if (gap > 0) {
      for (const [index, child] of children.entries()) {
        const next = children[index + 1];

        if (next === undefined) break;

        if (column) {
          rectangle("gap", x + drawn.left, child.bottom - origin.y, width - drawn.left - drawn.right, next.top - child.bottom);
        } else {
          rectangle("gap", child.right - origin.x, y + drawn.top, next.left - child.right, height - drawn.top - drawn.bottom);
        }
      }
    }

    const radius = px(style.borderTopLeftRadius);
    const real = { width: width / zoom, height: height / zoom };

    shapes.push(
      `<rect class="outline" x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(radius * zoom, height / 2)}"/>`,
    );

    // Height on the left, width above
    const left = x - 12;
    line(left, y, left, y + height);
    line(left - 4, y, left + 4, y);
    line(left - 4, y + height, left + 4, y + height);
    label(left - 6, y + height / 2, `${round(real.height)}`, "end");

    // Width sits below, clear of a field's own label above
    const bottom = y + height + 12;
    line(x, bottom, x + width, bottom);
    line(x, bottom - 4, x, bottom + 4);
    line(x + width, bottom - 4, x + width, bottom + 4);
    label(x + width / 2, bottom + 11, `${round(real.width)}`);

    // Padding and gap values sit inside their own shaded areas
    if (padding.left > 0) label(x + drawn.left / 2, y + height / 2, `${round(padding.left)}`);

    if (gap > 0 && children.length > 1) {
      const first = children[0];
      const gx = column ? x + width + 8 : (first?.right ?? 0) - origin.x + (gap * zoom) / 2;
      const gy = column ? (first?.bottom ?? 0) - origin.y + (gap * zoom) / 2 : y + height / 2;

      label(gx, gy, `${round(gap)}`, column ? "start" : "middle", "info");
    }

    this.#svg.innerHTML = shapes.join("");

    const facts: [string, string][] = [
      ["Height", this.describe("space", real.height)],
      ["Width", `${round(real.width)}px`],
      [
        "Padding",
        padding.top === padding.bottom && padding.left === padding.right
          ? padding.top === padding.left
            ? this.describe("space", padding.top)
            : `${this.describe("space", padding.top)} / ${this.describe("space", padding.left)}`
          : [padding.top, padding.right, padding.bottom, padding.left].map((side) => round(side)).join(" ") + "px",
      ],
      ["Gap", gap > 0 ? this.describe("space", gap) : "none"],
      ["Radius", radius >= real.height / 2 && radius > 0 ? "pill · --gw-radius-pill" : this.describe("radius", radius)],
      ["Type", `${this.describe("font-size", px(style.fontSize))} · ${style.fontWeight}`],
    ];

    this.#facts.replaceChildren(
      ...facts.map(([term, value]) => h("div", {}, h("dt", {}, term), h("dd", {}, value))),
    );
  }
}

GwAnatomy.define("gw-anatomy");

declare global {
  interface HTMLElementTagNameMap {
    "gw-anatomy": GwAnatomy;
  }
}
