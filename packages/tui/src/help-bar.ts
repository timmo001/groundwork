/**
 * The help bar along the bottom of each view: key and action pairs, wrapped
 * to the terminal's width.
 *
 * @module
 */
import { StyledText, fg } from "@opentui/core";
import type { TextChunk } from "@opentui/core";
import type { Theme } from "./theme.ts";

/** A key-action pair displayed in a help bar */
export interface HelpEntry {
  /** Key or key combination (e.g. "↑↓", "Enter", "Esc/Backspace") */
  readonly key: string;
  /** Action description (e.g. "navigate", "quit") */
  readonly action: string;
}

/** Global help entries appended to every view's help bar */
export const GLOBAL_HELP: readonly HelpEntry[] = [
  { key: "Ctrl+c", action: "quit" },
];

/** Separator between key-action pairs (visible width) */
const SEPARATOR = "   ";

/**
 * Format help bar entries into styled text with automatic row wrapping.
 *
 * Keys are rendered in muted text and actions in subtle text so keyboard
 * shortcuts stand out. When the total width exceeds terminal columns,
 * entries wrap onto multiple rows.
 *
 * @param theme - Active color theme
 * @param entries - Key-action pairs to display
 * @param suffix - Optional styled suffix appended after the last row (e.g. model ID badge)
 * @param columns - Width to wrap at, the terminal's by default
 */
export function formatHelpBar(
  theme: Theme,
  entries: readonly HelpEntry[],
  suffix?: TextChunk,
  columns: number = process.stdout.columns || 80,
): StyledText {
  // Wrap into rows that fit within terminal width using plain-text widths
  const rows: HelpEntry[][] = [];
  let currentWidth = 0;
  let currentRow: HelpEntry[] = [];

  for (const entry of entries) {
    const partWidth = `${entry.key} ${entry.action}`.length;

    const candidateWidth =
      currentRow.length > 0
        ? currentWidth + SEPARATOR.length + partWidth
        : partWidth;

    if (currentRow.length > 0 && candidateWidth > columns) {
      rows.push(currentRow);
      currentRow = [entry];
      currentWidth = partWidth;
    } else {
      currentRow.push(entry);
      currentWidth = candidateWidth;
    }
  }

  if (currentRow.length > 0) rows.push(currentRow);

  // Build styled chunks with color-coded keys and actions
  const chunks: TextChunk[] = [];

  for (const [r, row] of rows.entries()) {
    if (r > 0) chunks.push(fg(theme.fgSubtle)("\n"));

    for (const [j, entry] of row.entries()) {
      if (j > 0) chunks.push(fg(theme.fgSubtle)(SEPARATOR));

      chunks.push(fg(theme.fgMuted)(entry.key));
      chunks.push(fg(theme.fgSubtle)(` ${entry.action}`));
    }
  }

  if (suffix) {
    chunks.push(fg(theme.fgSubtle)("  "));
    chunks.push(suffix);
  }

  return new StyledText(chunks);
}
