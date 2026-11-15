/**
 * The checks behind `conventions setup`: what a repository checkout is
 * missing from the Setup page, read from its files, each finding linked to
 * the step that covers it.
 *
 * @module
 */
import { Effect, FileSystem, Path } from "effect";
import type { Manifest } from "./resolve.ts";

const setupPage = "https://groundwork.timmo.dev/setup";

/** One thing a repository is missing, and the Setup step that covers it. */
export interface Finding {
  readonly check: string;
  readonly missing: string;
  readonly step: string;
}

/** A repository checkout and what it's missing. */
export interface SetupReport {
  readonly directory: string;
  readonly repo: string;
  readonly findings: readonly Finding[];
}

const finding = (check: string, missing: string, anchor: string): Finding => ({
  check,
  missing,
  step: `${setupPage}#${anchor}`,
});

/** The `owner/name` the checkout's origin points at, or `undefined`. */
const originOf = (gitConfig: string) => {
  const section = gitConfig
    .split(/^\[/m)
    .find((part) => part.startsWith('remote "origin"'));

  const match = section?.match(
    /url\s*=\s*\S*github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\s*$/m,
  );

  return match?.[1];
};

const renovateFiles = [
  "renovate.json",
  "renovate.json5",
  ".github/renovate.json",
  ".github/renovate.json5",
  ".renovaterc",
  ".renovaterc.json",
];

const prettierFiles = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  "prettier.config.js",
  "prettier.config.mjs",
  "prettier.config.ts",
];

/** Checks one checkout against the Setup page. */
export const checkSetup = Effect.fn("checkSetup")(function* (
  manifest: Manifest,
  directory: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const at = (...parts: string[]) => path.join(directory, ...parts);
  const exists = (...parts: string[]) => fs.exists(at(...parts));

  const anyExists = (files: readonly string[]) =>
    Effect.map(
      Effect.forEach(files, (file) => exists(file)),
      (found) => found.some(Boolean),
    );

  const read = (...parts: string[]) =>
    fs.readFileString(at(...parts)).pipe(Effect.orElseSucceed(() => ""));

  const gitConfig = yield* read(".git", "config");
  const repo = originOf(gitConfig) ?? path.basename(directory);

  const entry = manifest.repos.find(
    (item) => item.repo.toLowerCase() === repo.toLowerCase(),
  );

  const findings: Finding[] = [];

  if (entry === undefined)
    findings.push(
      finding(
        "kind",
        "No kind file in conventions/repos",
        "1-create-the-repository",
      ),
    );

  if (!(yield* exists("mise.lock")))
    findings.push(
      finding("mise-lock", "No mise.lock", "2-tools-and-workspace"),
    );

  const rootPackage = yield* read("package.json");

  if (
    !(yield* anyExists(prettierFiles)) &&
    !rootPackage.includes('"prettier":')
  )
    findings.push(
      finding("prettier", "No Prettier config", "2-tools-and-workspace"),
    );

  if (!(yield* exists("hk.pkl")))
    findings.push(
      finding("hk", "No hk hooks (hk.pkl)", "2-tools-and-workspace"),
    );

  if (!(yield* exists("AGENTS.md")))
    findings.push(finding("agents-md", "No AGENTS.md", "3-agent-files"));

  if (!(yield* exists("opencode.json")))
    findings.push(
      finding(
        "opencode-permissions",
        "No opencode.json with the agent permissions",
        "agent-permissions",
      ),
    );

  if (!(yield* exists(".claude", "settings.json")))
    findings.push(
      finding(
        "claude-permissions",
        "No .claude/settings.json with the agent permissions",
        "agent-permissions",
      ),
    );

  const workflows = yield* fs
    .readDirectory(at(".github", "workflows"))
    .pipe(Effect.orElseSucceed((): string[] => []));

  const workflowTexts = yield* Effect.forEach(workflows, (file) =>
    read(".github", "workflows", file),
  );

  if (!workflowTexts.some((text) => text.includes("timmo001/workflows/")))
    findings.push(finding("ci", "No CI from the shared workflows", "4-ci"));

  if (!(yield* anyExists(renovateFiles)))
    findings.push(finding("renovate", "No Renovate config", "4-ci"));

  const docsPackage = yield* read("docs", "package.json");
  const hasDocsSite = docsPackage.includes('"@timmo001/docs-kit"');

  if (!hasDocsSite)
    findings.push(
      finding("docs-site", "No docs-kit site in docs/", "5-docs-site"),
    );

  // A library follows the apps that use it, so it has no agent surface or
  // theme of its own
  if (entry?.kind !== "library") {
    const skills = yield* fs
      .readDirectory(at("skills"))
      .pipe(Effect.orElseSucceed((): string[] => []));

    const owned = yield* Effect.forEach(skills, (skill) =>
      exists("skills", skill, "SKILL.md"),
    );

    if (!owned.some(Boolean))
      findings.push(
        finding(
          "agent-surface",
          "No tool-owned skill in skills/<tool>/SKILL.md",
          "7-agent-surface",
        ),
      );

    const themeCss = yield* read("docs", "theme.css");

    const onBase =
      themeCss.includes("blume/themes/base.css") &&
      !/blume\/themes\/(?!(?:base|all)\.css)[\w-]+\.css|blumeThemeCss|theme\.json/.test(
        themeCss,
      );

    if (hasDocsSite && onBase && entry?.theme === undefined)
      findings.push(
        finding(
          "theme",
          "No theme picked, and the docs site is still on Base",
          "9-theme",
        ),
      );
  }

  const report: SetupReport = { directory, repo, findings };

  return report;
});
