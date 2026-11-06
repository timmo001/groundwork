/**
 * A sample report on made-up data: a weekly migration report with a summary,
 * headline numbers, a breakdown by area, pull requests, checks and next
 * steps. Swap it for your own data and arrange the blocks as you like.
 */
import {
  alert,
  badge,
  breakdown,
  cards,
  chip,
  chips,
  delta,
  expansion,
  heading,
  html,
  link,
  list,
  note,
  plural,
  prose,
  section,
  signed,
  stats,
  table,
  type Content,
  type ReportAssets,
  reportPage,
  type Tone,
} from "@timmo001/groundwork-report";
import type { ReportThemes } from "@timmo001/groundwork-report/desktop";

const repository = "https://github.com/example/app/blob/main/";

const buckets = [
  { id: "done", label: "Migrated", tone: "success" },
  { id: "partial", label: "Partly migrated", tone: "warning" },
  { id: "todo", label: "Not started", tone: "danger" },
] as const satisfies readonly { id: string; label: string; tone: Tone }[];

type Bucket = (typeof buckets)[number]["id"];

const areas: readonly [string, ...string[]] = [
  "Settings",
  "Dashboards",
  "Dialogs",
  "Integrations",
  "Shared components",
  "Automations",
];

const pick = <T>(items: readonly [T, ...T[]], seed: number) =>
  items[seed % items.length] ?? items[0];

// Deterministic made-up files, so the page looks the same on every reload
const files = Array.from({ length: 140 }, (_, index) => {
  const area = pick(areas, index * 7 + 3);
  const bucket: Bucket = pick(["done", "done", "partial", "todo"], index * 5);
  const slug = area.toLowerCase().replaceAll(" ", "-");

  return {
    path: `src/${slug}/${slug}-${String(index).padStart(3, "0")}.ts`,
    area,
    bucket,
    pr: index % 17 === 0 ? [4100 + index] : [],
    allowed: index % 23 === 0,
  };
});

const count = (bucket: Bucket, within = files) =>
  within.filter((file) => file.bucket === bucket).length;

const moved: Readonly<Record<Bucket, number>> = {
  done: 9,
  partial: -3,
  todo: -6,
};

const migration = () => {
  const rows = areas
    .map((area) => {
      const inArea = files.filter((file) => file.area === area);

      return { area, inArea };
    })
    .sort(
      (a, b) =>
        count("todo", b.inArea) +
        count("partial", b.inArea) -
        (count("todo", a.inArea) + count("partial", a.inArea)),
    );

  const segments = (within: typeof files) =>
    buckets.map((bucket) => ({
      label: bucket.label,
      value: count(bucket.id, within),
      tone: bucket.tone,
    }));

  const done = Math.round((count("done") / files.length) * 100);

  return section(
    {
      id: "migration",
      title: "Migration",
      description:
        "Files moved to the new data layer, by how far along each is.",
    },
    breakdown(segments(files)),
    stats(
      buckets.map((bucket) => ({
        label: bucket.label,
        value: count(bucket.id),
        tone: bucket.tone,
        delta: signed(moved[bucket.id]),
      })),
    ),
    heading("Since last week"),
    list([
      buckets
        .map(
          (bucket) =>
            `${bucket.label} ${count(bucket.id) - moved[bucket.id]} → ${count(bucket.id)} (${signed(moved[bucket.id])})`,
        )
        .join(", "),
      {
        content: "9 files moved Not started → Migrated",
        items: files
          .filter((file) => file.bucket === "done")
          .slice(0, 4)
          .map((file) =>
            link(file.path, repository + file.path, { mono: true }),
          ),
      },
    ]),
    heading("By area", delta(`${done}% done overall`)),
    table({
      label: "By area",
      columns: [
        { id: "area", header: "Area", wide: true },
        ...buckets.map((bucket) => ({
          id: bucket.id,
          header: bucket.label,
          numeric: true,
        })),
        { id: "progress", header: "Progress", sortable: false },
      ],
      rows: rows.map(({ area, inArea }) => ({
        area,
        ...Object.fromEntries(
          buckets.map((bucket) => [bucket.id, count(bucket.id, inArea)]),
        ),
        progress: { segments: segments(inArea) },
      })),
    }),
    expansion(
      {
        heading: "Largest files left",
        aside: chip(plural(5, "file")),
      },
      list(
        files
          .filter((file) => file.bucket === "todo")
          .slice(0, 5)
          .map((file, index) =>
            chips(
              link(file.path, repository + file.path, { mono: true }),
              delta(`reads ${40 - index * 6}`),
            ),
          ),
      ),
    ),
    heading("All files"),
    table({
      label: "All files",
      group: "area",
      groupsCollapsed: true,
      sort: "path",
      search: "always",
      searchLabel: "Filter by path",
      columns: [
        { id: "path", header: "File", wide: true },
        { id: "area", header: "Area" },
        { id: "state", header: "State" },
        { id: "notes", header: "", sortable: false, searchable: false },
      ],
      filters: [
        {
          id: "bucket",
          label: "State",
          options: buckets.map((bucket) => ({
            value: bucket.id,
            label: bucket.label,
          })),
        },
        {
          id: "pr",
          label: "Pull request",
          options: [
            { value: "yes", label: "In a PR" },
            { value: "no", label: "Not in a PR" },
          ],
        },
        {
          id: "allowed",
          label: "Allowed",
          options: [
            { value: "yes", label: "Allowed" },
            { value: "no", label: "Not allowed" },
          ],
        },
      ],
      rows: files.map((file) => {
        const bucket = buckets.find((entry) => entry.id === file.bucket);

        return {
          path: { text: file.path, href: repository + file.path, mono: true },
          area: file.area,
          state: {
            value: bucket?.label ?? file.bucket,
            badges: [
              { text: bucket?.label ?? file.bucket, tone: bucket?.tone },
            ],
          },
          notes: {
            value: "",
            chips: [
              ...file.pr.map((number) => ({
                text: `#${number}`,
                tone: "accent" as const,
                href: `https://github.com/example/app/pull/${number}`,
              })),
              ...(file.allowed ? [{ text: "Allowed" }] : []),
            ],
          },
          bucket: [file.bucket],
          pr: [file.pr.length > 0 ? "yes" : "no"],
          allowed: [file.allowed ? "yes" : "no"],
        };
      }),
    }),
  );
};

const pullRequests = () => {
  const items = [
    {
      number: 4185,
      title: "Move the energy dashboard to the new data layer",
      author: "octocat",
      draft: false,
      fresh: true,
      lines: "+412 / −388",
      date: "2026-11-04",
    },
    {
      number: 4171,
      title: "Narrow the dialog helpers' types",
      author: "hubot",
      draft: true,
      fresh: false,
      lines: "+96 / −120",
      date: "2026-11-02",
    },
    {
      number: 4166,
      title: "Drop the legacy store from the settings pages",
      author: "monalisa",
      draft: false,
      fresh: false,
      lines: "+58 / −301",
      date: "2026-10-31",
    },
  ];

  return section(
    {
      id: "pull-requests",
      title: "Pull requests",
      description: "Open pull requests that touch the migration.",
      actions: chip(plural(items.length, "open", "open")),
    },
    cards(
      items.map((item) => ({
        heading: `#${item.number} ${item.title}`,
        href: `https://github.com/example/app/pull/${item.number}`,
        content: chips(
          item.fresh ? chip("New", { tone: "accent" }) : null,
          item.draft ? badge("Draft", { tone: "warning" }) : null,
          chip(item.author),
          chip(item.lines),
          chip(item.date),
        ),
      })),
    ),
    note("1 result left out as not relevant by the decision model."),
  );
};

const checks = () => {
  const states: Readonly<
    Record<"active" | "resolved" | "missing", { label: string; tone: Tone }>
  > = {
    active: { label: "Active", tone: "danger" },
    resolved: { label: "Resolved", tone: "success" },
    missing: { label: "File missing", tone: "warning" },
  };

  const rows: readonly {
    title: string;
    file: string;
    state: keyof typeof states;
    finding: string;
    verdict?: { text: string; tone: Tone };
  }[] = [
    {
      title: "Legacy store import",
      file: "src/data/store.ts",
      state: "active",
      finding: "Still exports the legacy store for 12 callers.",
      verdict: { text: "Blocking", tone: "danger" },
    },
    {
      title: "Polling in the history panel",
      file: "src/panels/history/history-panel.ts",
      state: "resolved",
      finding: "Switched to subscriptions.",
    },
    {
      title: "Unused compatibility shim",
      file: "src/compat/shim.ts",
      state: "missing",
      finding: "The file was removed.",
    },
  ];

  return section(
    { id: "checks", title: "Checks" },
    table({
      label: "Checks",
      columns: [
        { id: "check", header: "Check" },
        { id: "state", header: "State" },
        { id: "finding", header: "Finding", wide: true },
        { id: "verdict", header: "Verdict" },
      ],
      rows: rows.map((row) => ({
        check: {
          text: row.title,
          detail: { text: row.file, href: repository + row.file, mono: true },
        },
        state: {
          value: states[row.state].label,
          badges: [
            { text: states[row.state].label, tone: states[row.state].tone },
          ],
        },
        finding: { text: row.finding, muted: true },
        verdict:
          row.verdict === undefined
            ? null
            : { value: row.verdict.text, badges: [row.verdict] },
      })),
    }),
  );
};

const nextSteps = () =>
  section(
    {
      id: "next-steps",
      title: "Next steps",
      description: "What unblocks the most files, in order.",
    },
    list(
      [
        {
          content: [
            html`<strong>Narrow the dialog helpers</strong> `,
            prose("to take `DialogContext`"),
            " ",
            chips(
              chip("14 files unblocked", { tone: "success" }),
              chip("9 of 22 dialogs", { tone: "success" }),
              chip("31 blocked in all"),
            ),
          ],
        },
        {
          content: [
            "Remove the legacy store bindings ",
            chips(
              chip("27 bindings to remove", { tone: "success" }),
              chip("18 hass, 9 store"),
            ),
          ],
        },
      ] satisfies { content: Content }[],
      { ordered: true },
    ),
  );

/** The sample report as a page. */
export const sampleReport = (assets: ReportAssets, themes?: ReportThemes) =>
  reportPage({
    ...themes,
    title: "Weekly migration report",
    description:
      "Where the move to the new data layer stands, and what changed this week.",
    brand: "Groundwork reports",
    meta: [
      chip("2026-11-04"),
      chip("example/app@main 3f9c2ab", {
        href: "https://github.com/example/app/commit/3f9c2ab",
      }),
    ],
    assets,
    body: [
      alert(
        { tone: "info", heading: "This week" },
        "Nine more files moved to the new data layer, mostly in Settings. The dialog helpers are now the biggest blocker: narrowing them frees 14 files.",
      ),
      migration(),
      pullRequests(),
      checks(),
      nextSteps(),
    ],
  });
