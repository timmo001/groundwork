/**
 * The text input: OpenTUI's one-line input in the theme's input colors, with
 * the accent cursor and a lighter background while focused.
 *
 * @module
 */
import { InputRenderable } from "@opentui/core";
import type { CliRenderer, InputRenderableOptions } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface InputOptions extends InputRenderableOptions {
  readonly id: string;
  readonly theme: Theme;
}

/** A one-line text input in the theme's colors; full width by default. */
export class Input extends InputRenderable {
  constructor(renderer: CliRenderer, { theme, ...options }: InputOptions) {
    super(renderer, {
      width: "100%",
      backgroundColor: theme.bgInput,
      focusedBackgroundColor: theme.bgSelected,
      textColor: theme.fg,
      focusedTextColor: theme.fg,
      placeholderColor: theme.fgSubtle,
      cursorColor: theme.accent,
      ...options,
    });
  }
}
