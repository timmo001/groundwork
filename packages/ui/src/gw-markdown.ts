/**
 * `gw-markdown`: written text, such as a description or an agent's summary,
 * rendered from markdown with GitHub's extensions, safely and in the
 * theme's type. Parsed with micromark, which escapes HTML and drops unsafe
 * links by default.
 * Docs: https://groundwork.timmo.dev/components/display/#markdown
 *
 * @module
 */
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { GwElement, css, h } from "./element.js";
import "./gw-skeleton.js";
import { base } from "./styles.js";

/** Up to this many characters render at once; longer text waits for idle time. */
const renderNow = 2000;

/** How many blocks a long text adds per frame. */
const blocksPerFrame = 20;

/** Runs `work` when the page is idle, or soon where there's no idle callback. */
const whenIdle = (work: () => void) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(work, { timeout: 200 });
  } else {
    setTimeout(work);
  }
};

const toBlocks = (markdown: string) => {
  const template = h("template");

  template.innerHTML = micromark(markdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });

  // Links leave for another tab, without handing it this page
  for (const link of template.content.querySelectorAll("a[href]")) {
    if (!link.getAttribute("href")?.startsWith("#")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  }

  return [...template.content.childNodes];
};

/**
 * Written text, such as a description, a reason or an agent's summary,
 * rendered from markdown with GitHub's extensions: tables, task lists,
 * strikethrough and bare links. HTML in the text shows as text, and links
 * with unsafe protocols are dropped, so text from anyone is safe to show.
 * Links open in another tab.
 *
 * Short text renders at once. Long text is parsed when the page is idle,
 * behind skeleton lines, and added a few blocks a frame, so it never holds
 * up a click or a scroll. Headings are sized for text inside a page, not as
 * the page's own headings. Code blocks scroll sideways in their own frame.
 *
 * @element gw-markdown
 * @summary Written text rendered from markdown, safely.
 *
 * @attr {string} content - The markdown.
 *
 * @csspart content - The rendered text.
 */
export class GwMarkdown extends GwElement {
  static override properties = {
    content: {},
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: block;
        min-width: 0;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .content > :first-child {
        margin-block-start: 0;
      }

      .content > :last-child {
        margin-block-end: 0;
      }

      p,
      ul,
      ol,
      pre,
      blockquote,
      table {
        margin-block: 0 var(--gw-space-3);
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin-block: var(--gw-space-4) var(--gw-space-2);
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        line-height: 1.3;
        color: var(--gw-color-text-strong);
      }

      h1 {
        font-size: var(--gw-font-size-l);
      }

      ul,
      ol {
        padding-inline-start: var(--gw-space-5);
      }

      li + li {
        margin-block-start: var(--gw-space-1);
      }

      li:has(> input[type="checkbox"]) {
        list-style: none;
      }

      a {
        color: var(--gw-color-link);
      }

      code {
        padding: 0.1em 0.3em;
        font-family: var(--gw-font-mono);
        font-size: 0.9em;
        background: var(--gw-color-fill-neutral-resting);
        border-radius: var(--gw-radius-xs);
      }

      pre {
        max-height: var(--gw-markdown-code-max-height, 24rem);
        padding: var(--gw-space-3);
        overflow: auto;
        overscroll-behavior: contain;
        background: var(
          --gw-color-surface-lower,
          var(--gw-color-surface-default)
        );
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-control);
      }

      pre code {
        padding: 0;
        background: none;
        overflow-wrap: normal;
      }

      blockquote {
        padding-inline-start: var(--gw-space-3);
        margin-inline: 0;
        color: var(--gw-color-text-secondary);
        border-inline-start: 0.25rem solid var(--gw-color-border-normal);
      }

      table {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        border-collapse: collapse;
      }

      th,
      td {
        padding: var(--gw-space-1) var(--gw-space-2);
        text-align: start;
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
      }

      th {
        font-weight: var(--gw-font-weight-strong);
      }

      hr {
        margin-block: var(--gw-space-4);
        border: 0;
        border-block-start: var(--gw-border-width) solid
          var(--gw-color-border-quiet);
      }

      img {
        max-width: 100%;
      }
    `,
  ];

  declare content: string;

  readonly #content = h("div", { class: "content", part: "content" });

  readonly #placeholder = h("gw-skeleton-lines", { lines: 3, hidden: true });

  /** Counts renders, so a long one stops once newer text arrives. */
  #generation = 0;

  constructor() {
    super();
    this.content = "";
  }

  #renderLater(markdown: string, generation: number) {
    this.#placeholder.hidden = false;

    whenIdle(() => {
      if (generation !== this.#generation) return;

      const blocks = toBlocks(markdown);

      this.#content.replaceChildren();
      this.#placeholder.hidden = true;

      const next = () => {
        if (generation !== this.#generation) return;

        this.#content.append(...blocks.splice(0, blocksPerFrame));

        if (blocks.length > 0) requestAnimationFrame(next);
      };

      next();
    });
  }

  protected override create(root: ShadowRoot) {
    root.append(this.#placeholder, this.#content);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (!changed.has("content")) return;

    this.#generation += 1;

    const markdown = this.content;

    if (markdown.length <= renderNow) {
      this.#placeholder.hidden = true;
      this.#content.replaceChildren(...toBlocks(markdown));

      return;
    }

    this.#renderLater(markdown, this.#generation);
  }
}

GwMarkdown.define("gw-markdown");

declare global {
  interface HTMLElementTagNameMap {
    "gw-markdown": GwMarkdown;
  }
}
