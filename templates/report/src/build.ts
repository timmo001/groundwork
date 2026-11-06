/**
 * Writes the sample report to `dist/report.html`, one file that opens
 * anywhere, with the machine's Omarchy theme and other themes when it has them.
 */
import { reportAssets } from "@timmo001/groundwork-report/assets";
import { readReportThemes } from "@timmo001/groundwork-report/desktop";

import { sampleReport } from "./sample.ts";

const path = new URL("../dist/report.html", import.meta.url);

await Bun.write(
  path,
  sampleReport(await reportAssets(), await readReportThemes()),
);

console.log(`Wrote ${path.pathname}`);
