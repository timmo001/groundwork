/**
 * The filter bar: a dimmed `/` when there's no filter, or an accented `/`
 * and the filter text while filtering.
 *
 * @module
 */
import { fg, t } from "@opentui/core";
import type { StyledText } from "@opentui/core";
import type { Theme } from "./theme.ts";

/** Formats the filter bar for the current filter text. */
export const formatFilterBar = (theme: Theme, filter: string): StyledText =>
  filter.length === 0
    ? t`${fg(theme.fgSubtle)("/")}`
    : t`${fg(theme.accent)("/")} ${fg(theme.fg)(filter)}`;
