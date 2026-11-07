/**
 * `gw-code`: a block of code or a diff in its own scrolling frame, with a
 * diff's added and removed lines tinted.
 * Docs: https://groundwork.timmo.dev/components/display/#code
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base } from "./styles.js";

/** How a diff line reads, from its first character. */
const kindOf = (line: string) => {
  if (line.startsWith("+++") || line.startsWith("---")) return "file";

  if (line.startsWith("+")) return "add";

  if (line.startsWith("-")) return "remove";

  if (line.startsWith("@@")) return "hunk";

  return "";
};

/**
 * A block of code or a diff, such as a patch waiting on review, in its own
 * frame that scrolls both ways up to `--gw-code-max-height`, so a long one
 * never stretches the page. With `diff`, added and removed lines are tinted
 * and hunk headers are quiet. Put it in a `gw-expansion`'s `draw`, so a
 * folded diff isn't built until it's opened.
 *
 * @element gw-code
 * @summary Code or a diff in its own scrolling frame.
 *
 * @attr {string} content - The code.
 * @attr {boolean} diff - Reads it as a unified diff and tints its lines.
 * @attr {string} label - The frame's accessible name, such as the file's name.
 *
 * @csspart code - The scrolling frame.
 *
 * @cssprop --gw-code-max-height - How tall it grows before it scrolls. Defaults to `32rem`.
 */
export class GwCode extends GwElement {
  static override properties = {
    content: {},
    diff: { type: "boolean", reflect: true },
    label: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      pre {
        max-height: var(--gw-code-max-height, 32rem);
        margin: 0;
        padding: var(--gw-space-3) 0;
        overflow: auto;
        overscroll-behavior: contain;
        font-family: var(--gw-font-mono);
        font-size: var(--gw-font-size-s);
        line-height: 1.5;
        background: var(
          --gw-color-surface-lower,
          var(--gw-color-surface-default)
        );
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-control);
      }

      code {
        display: block;
        width: max-content;
        min-width: 100%;
        font: inherit;
      }

      span {
        display: block;
        padding-inline: var(--gw-space-3);
        white-space: pre;
      }

      .add {
        color: var(--gw-color-success);
        background: var(--gw-color-fill-success-quiet);
      }

      .remove {
        color: var(--gw-color-danger);
        background: var(--gw-color-fill-danger-quiet);
      }

      .hunk,
      .file {
        color: var(--gw-color-text-secondary);
      }
    `,
  ];

  declare content: string;
  declare diff: boolean;
  declare label: string;

  readonly #code = h("code");

  readonly #pre = h("pre", { part: "code", tabindex: 0 }, this.#code);

  constructor() {
    super();
    this.content = "";
    this.diff = false;
    this.label = "";
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#pre);
  }

  protected override update(changed: ReadonlySet<string>) {
    setAttribute(this.#pre, "aria-label", this.label || null);

    if (!changed.has("content") && !changed.has("diff")) return;

    // One block per line, so a tint spans the frame's width
    this.#code.replaceChildren(
      ...this.content
        .replace(/\n$/, "")
        .split("\n")
        .map((line) =>
          h(
            "span",
            { class: this.diff ? kindOf(line) || null : null },
            line === "" ? " " : line,
          ),
        ),
    );
  }
}

GwCode.define("gw-code");

declare global {
  interface HTMLElementTagNameMap {
    "gw-code": GwCode;
  }
}
