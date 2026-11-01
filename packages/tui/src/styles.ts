/**
 * Shared surface colors, so panes leave a transparent terminal see-through.
 *
 * @module
 */
import type { Theme } from "./theme.ts";

/** A pane's background, or none when the theme keeps the terminal's own. */
export const surfaceBackground = (theme: Theme): string =>
  theme.transparent ? "transparent" : theme.bgElevated;
