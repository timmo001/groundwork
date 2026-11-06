/**
 * The machine's themes for a report page: the Omarchy theme in use, and every
 * other theme on the machine translated, without the ones the page already
 * offers. It reads the file system, so call it where the page is made and
 * pass the result to `reportPage`:
 *
 * ```ts
 * reportPage({ ...(await readReportThemes()), title, assets, body });
 * ```
 *
 * @module
 */
import { Result, Schema } from "effect";

import { readDesktopThemes } from "@timmo001/groundwork-tokens/desktop-themes";
import { readOmarchyTheme } from "@timmo001/groundwork-tokens/omarchy-current";
import { optionalThemeDocuments } from "@timmo001/groundwork-tokens/page";
import {
  omarchyTheme,
  type OmarchyCurrentTheme,
} from "@timmo001/groundwork-tokens/runtime";
import { MappedTheme } from "@timmo001/groundwork-tokens";

/** What `readReportThemes` found, to spread into `reportPage`'s options. */
export interface ReportThemes {
  readonly omarchy: OmarchyCurrentTheme | null;
  readonly desktop: readonly MappedTheme[];
}

const decodeMapped = Schema.decodeUnknownResult(MappedTheme);

/**
 * The optional themes' documents, to drop desktop themes that match them.
 * They come bundled rather than read from disk, so this works in an app
 * compiled to one binary.
 */
const optionalThemes = optionalThemeDocuments.flatMap((document) => {
  const decoded = decodeMapped(document);

  return Result.isSuccess(decoded) ? [decoded.success] : [];
});

/**
 * Reads the Omarchy theme in use and every other theme on the machine, the
 * latter without the optional themes or the Omarchy theme itself, so a
 * terminal following Omarchy doesn't show twice.
 */
export const readReportThemes = async (): Promise<ReportThemes> => {
  const omarchy = await readOmarchyTheme();

  const current =
    omarchy === null ? undefined : omarchyTheme(omarchy.colors, omarchy.name);

  const existing =
    current !== undefined && Result.isSuccess(current)
      ? [...optionalThemes, current.success]
      : optionalThemes;

  return {
    omarchy,
    desktop: await readDesktopThemes(existing),
  };
};
