/**
 * Typechecks each element on its own, the way an app that imports only some
 * of them does, with the compiler defaults apps get from an ESNext target
 * (`useDefineForClassFields` on). A field built from other fields can then
 * be read as referring to itself and fail with TS7022, which the package's
 * own whole-program check never shows.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const src = join(import.meta.dir, "..", "src");

const files = (await readdir(src))
  .filter((name) => name.startsWith("gw-") && name.endsWith(".ts"))
  .toSorted();

const check = async (name: string) => {
  const child = Bun.spawn(
    [
      "tsc",
      "--ignoreConfig",
      "--noEmit",
      "--strict",
      "--target",
      "ESNext",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      "--lib",
      "ESNext,DOM,DOM.Iterable",
      "--skipLibCheck",
      "--allowImportingTsExtensions",
      "--types",
      "",
      join(src, name),
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  const output = await new Response(child.stdout).text();

  return { name, failed: (await child.exited) !== 0, output };
};

const results = await Promise.all(files.map(check));
const failures = results.filter((result) => result.failed);

for (const { name, output } of failures) {
  console.error(`${name}, checked on its own:\n${output}`);
}

console.log(
  `${files.length - failures.length} of ${files.length} elements typecheck on their own`,
);

process.exitCode = failures.length === 0 ? 0 : 1;
