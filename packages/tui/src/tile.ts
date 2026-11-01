/**
 * The tile: a compact rounded card with a title, an optional icon, and a
 * secondary line whose parts are joined with dots. Selection fills it.
 *
 * @module
 */
import {
  BoxRenderable,
  StyledText,
  TextRenderable,
  fg,
  t,
} from "@opentui/core";
import type { CliRenderer, TextChunk } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface TileOptions {
  readonly id: string;
  /** Primary text */
  readonly primary: string;
  /** Secondary text, or parts joined with ` • ` */
  readonly secondary?: string | readonly string[] | undefined;
  /** Nerd Font icon shown before the primary text */
  readonly icon?: string | undefined;
  /** 28 columns by default */
  readonly width?: number;
  readonly height?: number;
}

/** A compact rounded card; add `box` to the parent. */
export class Tile {
  /** The tile's card */
  readonly box: BoxRenderable;
  private readonly theme: Theme;
  private readonly primaryText: TextRenderable;
  private readonly secondaryText: TextRenderable | undefined;
  private readonly icon: string | undefined;
  private primary: string;
  private secondary: string | readonly string[] | undefined;
  private selected = false;

  constructor(renderer: CliRenderer, theme: Theme, options: TileOptions) {
    this.theme = theme;
    this.primary = options.primary;
    this.secondary = options.secondary;
    this.icon = options.icon;

    this.box = new BoxRenderable(renderer, {
      id: options.id,
      flexDirection: "column",
      flexShrink: 0,
      width: options.width ?? 28,
      paddingX: 1,
      borderStyle: "rounded",
      borderColor: theme.accent,
      shouldFill: false,
    });

    if (options.height !== undefined) this.box.height = options.height;

    this.primaryText = new TextRenderable(renderer, {
      id: `${options.id}-primary`,
      content: "",
      flexGrow: 1,
    });

    if (options.secondary === undefined) {
      this.primaryText.marginTop = 1;
      this.primaryText.marginBottom = 1;
    }

    this.box.add(this.primaryText);

    if (options.secondary !== undefined) {
      this.secondaryText = new TextRenderable(renderer, {
        id: `${options.id}-secondary`,
        content: "",
        marginTop: 1,
      });

      this.box.add(this.secondaryText);
    }

    this.paint();
  }

  setPrimary(primary: string): void {
    this.primary = primary;
    this.paint();
  }

  /** Changes the secondary line, when the tile was made with one. */
  setSecondary(secondary: string | readonly string[]): void {
    this.secondary = secondary;
    this.paint();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.box.shouldFill = selected;
    this.box.backgroundColor = selected ? this.theme.bgSelected : "transparent";
    this.paint();
  }

  private paint(): void {
    const theme = this.theme;
    const color = this.selected ? theme.accent : theme.fg;

    this.primaryText.content = this.icon
      ? t`${fg(color)(this.icon)} ${fg(color)(this.primary)}`
      : t`${fg(color)(this.primary)}`;

    if (this.secondaryText === undefined || this.secondary === undefined)
      return;

    const chunks: TextChunk[] = [this.secondary]
      .flat()
      .flatMap((part, index) =>
        index === 0
          ? [fg(theme.fgMuted)(part)]
          : [fg(theme.fgSubtle)(" • "), fg(theme.fgMuted)(part)],
      );

    this.secondaryText.content = new StyledText(chunks);
  }
}
