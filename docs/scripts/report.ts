/**
 * Writes the report template's sample report to `public/embeds/report.html`,
 * for the Report template page to embed. The report's assets need Bun, which
 * the docs build doesn't run under, so the dev, build and test scripts run
 * this first. It leaves out the desktop's themes, which would carry the
 * building machine's own into the public site.
 *
 * @module
 */
import { reportAssets } from "@timmo001/groundwork-report/assets";

import { sampleReport } from "../../templates/report/src/sample.ts";

const path = new URL("../public/embeds/report.html", import.meta.url);

await Bun.write(path, sampleReport(await reportAssets()));

console.log(`Wrote ${path.pathname}`);
