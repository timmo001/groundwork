/**
 * The app header: one fixed row with the app's title in the accent and its
 * scope after it, such as the repository or the connected host.
 *
 * @module
 */
import { TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface AppHeaderOptions {
  readonly id: string;
  readonly theme: Theme;
  readonly title: string;
  /** Shown dimmed after the title. */
  readonly scope?: string;
}

/** One fixed row with the app's title and scope. */
export class AppHeader extends TextRenderable {
  private readonly theme: Theme;

  constructor(renderer: CliRenderer, options: AppHeaderOptions) {
    super(renderer, {
      id: options.id,
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
      content: "",
    });
    this.theme = options.theme;
    this.update(options.title, options.scope ?? "");
  }

  /** Changes the title and scope. */
  update(title: string, scope = ""): void {
    this.content = t`${bold(fg(this.theme.accent)(title))}  ${fg(this.theme.fgSubtle)(scope)}`;
  }
}
