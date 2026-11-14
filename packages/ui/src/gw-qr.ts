/**
 * `gw-qr`: a QR code of a link or text, drawn as SVG, dark on light in every
 * theme so cameras can read it.
 * Docs: https://groundwork.timmo.dev/components/display/#qr-code
 *
 * @module
 */
import { encode } from "uqr";

import { GwElement, css, setAttribute } from "./element.js";
import { base } from "./styles.js";

const svgNamespace = "http://www.w3.org/2000/svg";

const levels = ["L", "M", "Q", "H"] as const;

type Level = (typeof levels)[number];

const isLevel = (value: string): value is Level =>
  levels.some((level) => level === value);

/** The dark modules as one path, a run of them in a row at a time. */
const pathOf = (modules: readonly (readonly boolean[])[]) => {
  const runs: string[] = [];

  for (const [y, row] of modules.entries()) {
    let start = -1;

    for (let x = 0; x <= row.length; x++) {
      const dark = row[x] === true;

      if (dark && start === -1) start = x;

      if (!dark && start !== -1) {
        runs.push(`M${start} ${y}h${x - start}v1h${start - x}z`);
        start = -1;
      }
    }
  }

  return runs.join("");
};

/**
 * A QR code of a link or text, such as a pairing link, drawn as SVG with
 * [uqr](https://github.com/unjs/uqr). Scanners look for dark modules on a
 * light quiet zone, and not every one reads the reverse, so it stays black
 * on white in every theme and mode, with a margin of four modules as
 * ISO/IEC 18004 asks. Forced colors leave it as it is.
 *
 * Keep it at least `10rem` across, so a phone held at arm's length still
 * reads each module, and give it a `label` naming what it opens, since a
 * screen reader can't read the code.
 *
 * @element gw-qr
 * @summary A QR code of a link or text, black on white in every theme.
 *
 * @attr {string} value - The text it encodes, such as a link. Empty draws nothing.
 * @attr {string} label - Its accessible name, saying what it opens. Defaults to `QR code`.
 * @attr {"L"|"M"|"Q"|"H"} level - How much of it can be covered or damaged and still read, from 7% to 30%. Higher makes it denser. Defaults to `M`.
 * @attr {number} margin - The light margin around it, in modules. Defaults to `4`.
 *
 * @csspart code - The SVG.
 *
 * @cssprop --gw-qr-size - Its width and height. Defaults to `12rem`.
 * @cssprop --gw-qr-dark - The dark modules' color. Defaults to `#000`.
 * @cssprop --gw-qr-light - The background and margin's color. Defaults to `#fff`.
 */
export class GwQr extends GwElement {
  static override properties = {
    value: {},
    label: {},
    level: {},
    margin: { type: "number" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: inline-block;
        width: var(--gw-qr-size, 12rem);
        max-width: 100%;
        aspect-ratio: 1;
        vertical-align: middle;
        forced-color-adjust: none;
        print-color-adjust: exact;
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
        shape-rendering: crispEdges;
      }

      .light {
        fill: var(--gw-qr-light, #fff);
      }

      .dark {
        fill: var(--gw-qr-dark, #000);
      }
    `,
  ];

  declare value: string;
  declare label: string;
  declare level: string;
  declare margin: number;

  readonly #svg = document.createElementNS(svgNamespace, "svg");

  readonly #light = document.createElementNS(svgNamespace, "rect");

  readonly #dark = document.createElementNS(svgNamespace, "path");

  constructor() {
    super();
    this.value = "";
    this.label = "QR code";
    this.level = "M";
    this.margin = 4;
  }

  protected override create(root: ShadowRoot) {
    this.#svg.setAttribute("part", "code");
    this.#svg.setAttribute("role", "img");
    this.#light.setAttribute("class", "light");
    this.#light.setAttribute("width", "100%");
    this.#light.setAttribute("height", "100%");
    this.#dark.setAttribute("class", "dark");
    this.#svg.append(this.#light, this.#dark);
    root.append(this.#svg);
  }

  protected override update(changed: ReadonlySet<string>) {
    setAttribute(this.#svg, "aria-label", this.label);

    if (
      !changed.has("value") &&
      !changed.has("level") &&
      !changed.has("margin")
    ) {
      return;
    }

    const margin = Number.isFinite(this.margin)
      ? Math.max(0, Math.round(this.margin))
      : 4;

    let modules: boolean[][] = [];

    try {
      modules =
        this.value === ""
          ? []
          : encode(this.value, {
              ecc: isLevel(this.level) ? this.level : "M",
              border: margin,
            }).data;
    } catch {
      // Too long for the largest QR code: draw nothing rather than a wrong one
      modules = [];
    }

    this.#svg.toggleAttribute("hidden", modules.length === 0);
    this.#svg.setAttribute(
      "viewBox",
      `0 0 ${modules.length} ${modules.length}`,
    );
    this.#dark.setAttribute("d", pathOf(modules));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-qr": GwQr;
  }
}
