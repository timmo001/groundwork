/**
 * Writes `custom-elements.json`, the Custom Elements Manifest, from the
 * elements' class docstrings. With `--check`, writes it to a temporary folder
 * instead and fails when the committed one is stale. Editors, `lit-analyzer`
 * and framework wrappers read the manifest.
 */
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

const check = process.argv.includes("--check");

// The analyzer resolves --outdir against the working directory, absolute or not
const outdir = check ? ".manifest-check" : ".";

if (check) await mkdir(outdir, { recursive: true });

const analyzer = Bun.spawn(
  ["cem", "analyze", "--quiet", "--globs", "src/**/*.ts", "--outdir", outdir],
  { stdout: "inherit", stderr: "inherit" },
);

if ((await analyzer.exited) !== 0) process.exit(1);

if (check) {
  const fresh = await readFile(join(outdir, "custom-elements.json"), "utf8");
  const committed = await readFile("custom-elements.json", "utf8");

  await rm(outdir, { recursive: true });

  if (fresh !== committed) {
    console.error(
      "custom-elements.json is stale; run `mise run gen` to update it",
    );
    process.exit(1);
  }

  console.log("Custom Elements Manifest is up to date");
}
