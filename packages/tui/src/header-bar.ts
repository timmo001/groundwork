/**
 * The header bar: one line with the breadcrumb title, a status dot and label,
 * and details on the right that drop off when the terminal is too narrow.
 *
 * @module
 */
import { StyledText, bold, fg } from "@opentui/core";
import type { TextChunk } from "@opentui/core";
import type { Theme } from "./theme.ts";

/** How the status reads: working, waiting, failed or off. */
export type HeaderTone = "ok" | "pending" | "error" | "off";

/** What the header bar shows after the title. */
export interface HeaderStatus {
  readonly tone: HeaderTone;
  /** Such as "Connected" or "Syncing" */
  readonly label: string;
  /**
   * Shown dimmed after the label, in order, until the line runs out of
   * room, such as the host or the signed-in user.
   */
  readonly details?: readonly string[] | undefined;
}

const SEPARATOR = " › ";

const GAP = "   ";

const STATUS_DOT: Readonly<Record<HeaderTone, string>> = {
  ok: "●",
  pending: "◌",
  error: "✗",
  off: "○",
};

const toneColor = (theme: Theme, tone: HeaderTone): string => {
  switch (tone) {
    case "ok":
      return theme.green;
    case "pending":
      return theme.yellow;
    case "error":
      return theme.red;
    case "off":
      return theme.fgSubtle;
  }
};

/**
 * Formats the header bar to fit `width` columns: the title parts as a
 * breadcrumb (earlier parts dimmed, the last bold in the accent), the status,
 * then as many details as fit.
 */
export const formatHeaderBar = (
  theme: Theme,
  titleParts: readonly string[],
  status: HeaderStatus,
  width: number,
): StyledText => {
  const last = titleParts.at(-1) ?? "";
  const prefix = titleParts.slice(0, -1).join(SEPARATOR);

  const title: TextChunk[] =
    prefix.length === 0
      ? [bold(fg(theme.accent)(last))]
      : [
          fg(theme.fgMuted)(prefix),
          fg(theme.fgSubtle)(SEPARATOR),
          bold(fg(theme.accent)(last)),
        ];

  const color = toneColor(theme, status.tone);
  const dot = STATUS_DOT[status.tone];

  const chunks: TextChunk[] = [
    ...title,
    fg(theme.fgSubtle)(GAP),
    fg(color)(`${dot} ${status.label}`),
  ];

  let used = chunks.reduce((total, chunk) => total + chunk.text.length, 0);

  for (const detail of status.details ?? []) {
    used += GAP.length + detail.length;

    if (used > width - 1) break;

    chunks.push(fg(theme.fgSubtle)(GAP), fg(theme.fgMuted)(detail));
  }

  return new StyledText(chunks);
};
