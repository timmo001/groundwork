/**
 * The pane header: one fixed row naming a pane, marked when the pane has
 * focus. Focus changes only the colors, never the row's size.
 *
 * @module
 */
import { TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { Theme } from "./theme.ts";

/** One fixed row naming a pane, with a detail and a focus marker. */
export class PaneHeader extends TextRenderable {
  private readonly theme: Theme;

  constructor(renderer: CliRenderer, id: string, theme: Theme) {
    super(renderer, {
      id,
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
      bg: "transparent",
      content: "",
    });
    this.theme = theme;
  }

  /** Shows the label and detail, marked as focused when `active`. */
  update(label: string, detail: string, active: boolean): void {
    const theme = this.theme;
    this.bg = active ? theme.bgSelected : "transparent";
    this.content = t`${fg(active ? theme.accent : theme.fgSubtle)(active ? "▶" : "·")} ${bold(fg(active ? theme.fg : theme.fgMuted)(label))} ${fg(active ? theme.fgMuted : theme.fgSubtle)(detail)}`;
  }
}
