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
import { Result } from "effect";

import { readDesktopThemes } from "@timmo001/groundwork-tokens/desktop-themes";
import { readOmarchyTheme } from "@timmo001/groundwork-tokens/omarchy-current";
import { optionalThemeChoices } from "@timmo001/groundwork-tokens/page";
import {
  omarchyTheme,
  parseTheme,
  type OmarchyCurrentTheme,
} from "@timmo001/groundwork-tokens/runtime";
import type { MappedTheme } from "@timmo001/groundwork-tokens";

/** What `readReportThemes` found, to spread into `reportPage`'s options. */
export interface ReportThemes {
  readonly omarchy: OmarchyCurrentTheme | null;
  readonly desktop: readonly MappedTheme[];
}

/** The optional themes' documents, to drop desktop themes that match them. */
const optionalThemes = async () => {
  const documents: MappedTheme[] = [];

  for (const { id } of optionalThemeChoices) {
    const file = await Bun.file(
      Bun.fileURLToPath(
        import.meta.resolve(`@timmo001/groundwork-tokens/themes/${id}.json`),
      ),
    ).text();

    const parsed = parseTheme(file);

    if (Result.isSuccess(parsed) && parsed.success.kind === "mapped") {
      documents.push(parsed.success);
    }
  }

  return documents;
};

/**
 * Reads the Omarchy theme in use and every other theme on the machine, the
 * latter without the optional themes or the Omarchy theme itself, so a
 * terminal following Omarchy doesn't show twice.
 */
export const readReportThemes = async (): Promise<ReportThemes> => {
  const [omarchy, optional] = await Promise.all([
    readOmarchyTheme(),
    optionalThemes(),
  ]);

  const current =
    omarchy === null ? undefined : omarchyTheme(omarchy.colors, omarchy.name);

  const existing =
    current !== undefined && Result.isSuccess(current)
      ? [...optional, current.success]
      : optional;

  return {
    omarchy,
    desktop: await readDesktopThemes(existing),
  };
};
