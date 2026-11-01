/**
 * The section heading: a full-width row with a dimmed bold title and an
 * optional icon, which starts a new row in a wrapping tile grid.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { Theme } from "./theme.ts";

/** Width of the optional left icon column in characters */
const ICON_COLUMN_WIDTH = 4;

export interface SectionHeadingOptions {
  readonly id: string;
  readonly title: string;
  /** Nerd Font icon shown before the title */
  readonly icon?: string | undefined;
  readonly marginTop?: number;
  /** 1 by default */
  readonly marginBottom?: number;
}

/** A full-width heading row; add `box` to the parent. */
export class SectionHeading {
  /** The heading's row */
  readonly box: BoxRenderable;
  private readonly theme: Theme;
  private readonly titleText: TextRenderable;

  constructor(
    renderer: CliRenderer,
    theme: Theme,
    options: SectionHeadingOptions,
  ) {
    this.theme = theme;

    this.box = new BoxRenderable(renderer, {
      id: options.id,
      flexDirection: "row",
      width: "100%",
      flexShrink: 0,
      alignItems: "center",
      shouldFill: false,
      marginTop: options.marginTop ?? 0,
      marginBottom: options.marginBottom ?? 1,
    });

    if (options.icon) {
      const iconCol = new BoxRenderable(renderer, {
        id: `${options.id}-icol`,
        width: ICON_COLUMN_WIDTH,
        paddingLeft: 1,
        alignItems: "center",
      });

      iconCol.add(
        new TextRenderable(renderer, {
          id: `${options.id}-icon`,
          content: t`${fg(theme.fgSubtle)(options.icon)}`,
        }),
      );

      this.box.add(iconCol);
    }

    this.titleText = new TextRenderable(renderer, {
      id: `${options.id}-title`,
      content: "",
    });

    this.box.add(this.titleText);
    this.setTitle(options.title);
  }

  setTitle(title: string): void {
    this.titleText.content = t`${bold(fg(this.theme.fgSubtle)(title))}`;
  }

  setVisible(visible: boolean): void {
    this.box.visible = visible;
  }
}
