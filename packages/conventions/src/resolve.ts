/**
 * Works out the labels a repository should have from the manifest, and checks
 * that no two of its colors are too close to tell apart.
 *
 * @module
 */
import { distance } from "@groundwork/tokens";
import type { Kind, Label, LabelSet, Repo } from "./schema.ts";

export interface Manifest {
  readonly kinds: readonly Kind[];
  readonly sets: readonly LabelSet[];
  readonly repos: readonly Repo[];
}

/** The closest two label colors in a repository may be, in OKLab. */
export const minimumDistance = 0.04;

const key = (name: string) => name.toLowerCase();

/** The sets a repository takes: every-repo sets, its kind's, then its opt-ins. */
export const setsFor = (manifest: Manifest, repo: Repo) => {
  const kind = manifest.kinds.find((item) => item.id === repo.kind);
  const wanted = new Set([...(kind?.labels ?? []), ...(repo.sets ?? [])]);

  return manifest.sets.filter(
    (set) => set.scope === "every" || wanted.has(set.id),
  );
};

/** Every label a repository should have, in manifest order, without repeats. */
export const labelsFor = (manifest: Manifest, repo: Repo): readonly Label[] => {
  const renovate = new Set(repo.renovate ?? []);

  const fromSets = setsFor(manifest, repo).flatMap((set) => set.labels);

  const fromRenovate =
    manifest.sets
      .find((set) => set.id === "renovate")
      ?.labels.filter((label) => renovate.has(label.name)) ?? [];

  const seen = new Set<string>();

  return [...fromSets, ...fromRenovate, ...(repo.areas ?? [])].filter(
    (label) => {
      if (seen.has(key(label.name))) return false;

      seen.add(key(label.name));

      return true;
    },
  );
};

export interface Problem {
  readonly where: string;
  readonly message: string;
}

const problem = (where: string, message: string): Problem => ({
  where,
  message,
});

/** Labels defined twice across sets must match, so a repository gets one meaning. */
const checkDefinitions = (manifest: Manifest): readonly Problem[] => {
  const byName = new Map<string, Label>();
  const problems: Problem[] = [];

  for (const set of manifest.sets) {
    for (const label of set.labels) {
      const existing = byName.get(key(label.name));

      if (
        existing !== undefined &&
        (existing.color !== label.color ||
          existing.description !== label.description)
      ) {
        problems.push(
          problem(
            `labels.yml ${set.id}`,
            `${label.name} differs from its other definition`,
          ),
        );
      }

      byName.set(key(label.name), label);
    }
  }

  return problems;
};

const checkRepo = (manifest: Manifest, repo: Repo): readonly Problem[] => {
  const where = repo.repo;
  const problems: Problem[] = [];

  const optIn = new Set(
    manifest.sets.filter((set) => set.scope === "opt-in").map((set) => set.id),
  );

  for (const set of repo.sets ?? []) {
    if (!optIn.has(set)) {
      problems.push(problem(where, `${set} isn't an opt-in label set`));
    }
  }

  const renovate = new Set(
    manifest.sets
      .find((set) => set.id === "renovate")
      ?.labels.map((label) => label.name) ?? [],
  );

  for (const name of repo.renovate ?? []) {
    if (!renovate.has(name)) {
      problems.push(problem(where, `${name} isn't a Renovate label`));
    }
  }

  for (const area of repo.areas ?? []) {
    if (!area.description.startsWith("Related to ")) {
      problems.push(
        problem(where, `${area.name}'s description should start "Related to"`),
      );
    }
  }

  const labels = labelsFor(manifest, repo);
  const names = new Set(labels.map((label) => key(label.name)));

  for (const label of labels) {
    if (label.description.endsWith(".")) {
      problems.push(problem(where, `${label.name}'s description ends in "."`));
    }

    for (const alias of label.aliases ?? []) {
      if (names.has(key(alias))) {
        problems.push(
          problem(where, `${label.name}'s alias ${alias} is another label`),
        );
      }
    }
  }

  for (const [index, a] of labels.entries()) {
    for (const b of labels.slice(index + 1)) {
      const apart = distance(`#${a.color}`, `#${b.color}`);

      if (apart < minimumDistance) {
        problems.push(
          problem(
            where,
            `${a.name} (#${a.color}) and ${b.name} (#${b.color}) are too close (${apart.toFixed(3)})`,
          ),
        );
      }
    }
  }

  return problems;
};

/** Everything wrong with the manifest, or nothing when it's sound. */
export const check = (manifest: Manifest): readonly Problem[] => {
  const repos = new Set<string>();

  const duplicates = manifest.repos.flatMap((repo) => {
    const seen = repos.has(repo.repo);

    repos.add(repo.repo);

    return seen ? [problem(repo.repo, "has more than one file")] : [];
  });

  return [
    ...checkDefinitions(manifest),
    ...duplicates,
    ...manifest.repos.flatMap((repo) => checkRepo(manifest, repo)),
  ];
};
