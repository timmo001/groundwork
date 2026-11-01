/**
 * The header block: the app's name as large ASCII art when the terminal has
 * room, then the header bar. Shared by every view, so the top of the app
 * stays put as views change.
 *
 * @module
 */
import { ASCIIFontRenderable, TextRenderable } from "@opentui/core";
import type { BoxRenderable, CliRenderer } from "@opentui/core";
import { formatHeaderBar } from "./header-bar.ts";
import type { HeaderStatus } from "./header-bar.ts";
import type { Theme } from "./theme.ts";

/** The narrowest terminal that gets the large block font. */
const MIN_WIDTH_FOR_BLOCK = 160;

/** The shortest terminal that shows the ASCII art at all. */
const MIN_HEIGHT_FOR_ART = 24;

export interface HeaderBlockOptions {
  /** Prefix for the renderables' ids */
  readonly id: string;
  /** The app's name, drawn as ASCII art */
  readonly name: string;
  /** The breadcrumb, such as `["Settings", "Theme"]` */
  readonly titleParts: readonly string[];
  readonly status: HeaderStatus;
}

/**
 * The ASCII art name and the header bar. Both are added straight to `parent`,
 * with no wrapper box, so the ASCII art takes part in its flex layout.
 */
export class HeaderBlock {
  private readonly renderer: CliRenderer;
  private readonly theme: Theme;
  private readonly art: ASCIIFontRenderable;
  private readonly bar: TextRenderable;
  private titleParts: readonly string[];
  private status: HeaderStatus;

  constructor(
    renderer: CliRenderer,
    theme: Theme,
    parent: BoxRenderable,
    options: HeaderBlockOptions,
  ) {
    this.renderer = renderer;
    this.theme = theme;
    this.titleParts = options.titleParts;
    this.status = options.status;

    this.art = new ASCIIFontRenderable(renderer, {
      id: `${options.id}-art`,
      text: options.name,
      font: this.pickFont(),
      color: theme.accent,
      alignSelf: "center",
    });
    this.art.visible = this.hasRoom();
    parent.add(this.art);

    this.bar = new TextRenderable(renderer, {
      id: `${options.id}-bar`,
      content: "",
      wrapMode: "none",
      truncate: true,
      flexShrink: 0,
      marginTop: 1,
      marginBottom: 1,
    });
    parent.add(this.bar);
    this.render();

    renderer.on("resize", this.onResize);
  }

  /** Changes the status, and the breadcrumb when given. */
  update(status: HeaderStatus, titleParts?: readonly string[]): void {
    this.status = status;

    if (titleParts !== undefined) this.titleParts = titleParts;

    this.render();
  }

  /** Changes the breadcrumb. */
  setTitleParts(titleParts: readonly string[]): void {
    this.titleParts = titleParts;
    this.render();
  }

  /** Stops following terminal resizes. */
  destroy(): void {
    this.renderer.off("resize", this.onResize);
  }

  private readonly onResize = (): void => {
    this.art.visible = this.hasRoom();
    this.art.font = this.pickFont();
    this.render();
  };

  private render(): void {
    this.bar.content = formatHeaderBar(
      this.theme,
      this.titleParts,
      this.status,
      this.renderer.width,
    );
  }

  private hasRoom(): boolean {
    return this.renderer.height >= MIN_HEIGHT_FOR_ART;
  }

  private pickFont(): "block" | "tiny" {
    return this.renderer.width >= MIN_WIDTH_FOR_BLOCK ? "block" : "tiny";
  }
}
