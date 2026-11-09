/**
 * Sample rows for the table demos, so they show what a long table does:
 * windowing, pinned group headings and loading more as it scrolls. A
 * `gw-table` with `data-sample` gets that sample's columns and first rows,
 * and with `data-pages` the demo frame stands in for a server, answering each
 * `more` with the next page after a moment.
 *
 * @module
 */
import type { GwTable, TableColumn, TableRow } from "@timmo001/groundwork-ui";
import { Match } from "effect";

/** How long a page takes to "load", so its skeleton rows show. */
const loadTime = 1200;

const names = [
  "firefox",
  "Hyprland",
  "opencode",
  "pipewire",
  "bun",
  "waybar",
  "ghostty",
  "node",
  "systemd",
  "dbus-broker",
  "wireplumber",
  "mako",
  "nvim",
  "ssh-agent",
  "docker",
  "postgres",
];

const jobs = ["CI", "Watch", "Sync", "Bump", "Heal", "Dotfiles", "Releases"];

const states = ["Succeeded", "Succeeded", "Succeeded", "Failed", "Skipped"];

const summaries = [
  "All repositories are green",
  "Added commits to the inbox",
  "Every copy is current",
  "Bumped a dependency and opened a pull request",
  "Fixed a failing check after a dependency update, with the fix pushed to its own branch for review",
  "Nothing to do",
];

/** A process list: one long, flat page. */
const processes = {
  columns: [
    { id: "name", header: "Name", wide: true },
    { id: "pid", header: "PID", numeric: true },
    { id: "cpu", header: "CPU %", numeric: true },
    { id: "memory", header: "Memory MB", numeric: true },
  ] satisfies TableColumn[],
  page: (index: number): TableRow[] =>
    index > 0
      ? []
      : Array.from({ length: 60 }, (_, at) => ({
          pid: 900 + at * 37,
          name: `${names[at % names.length]}${at < names.length ? "" : ` (${Math.floor(at / names.length) + 1})`}`,
          cpu: Math.round(((at * 7919) % 2500) / 10) / 10,
          memory: 20 + ((at * 104_729) % 1900),
        })),
};

const dayLabel = (day: number) =>
  Match.value(day).pipe(
    Match.when(0, () => "Today"),
    Match.when(1, () => "Yesterday"),
    Match.orElse(() => `${day} days ago`),
  );

/** A job's runs, newest first, grouped by day and paged as a server would. */
const runs = {
  columns: [
    { id: "state", header: "State" },
    { id: "job", header: "Job" },
    { id: "summary", header: "What it did", wide: true },
    { id: "took", header: "Took (s)", numeric: true },
    {
      id: "day",
      header: "Day",
      groupLabel: (value) => dayLabel(Number(value)),
    },
  ] satisfies TableColumn[],
  page: (index: number): TableRow[] =>
    Array.from({ length: 30 }, (_, at) => {
      const run = index * 30 + at;

      return {
        id: run,
        state: states[run % states.length] ?? "",
        job: jobs[(run * 3) % jobs.length] ?? "",
        summary: summaries[(run * 5) % summaries.length] ?? "",
        took: 4 + ((run * 13) % 90),
        day: Math.floor(run / 22),
      };
    }),
};

const samples = { processes, runs } as const;

const isSample = (name: string): name is keyof typeof samples =>
  Object.hasOwn(samples, name);

/**
 * Fills each sample table in `root` with its first page and, with
 * `data-pages`, loads the next on each `more` until there are that many.
 * `loaded` reports each page as it comes in.
 */
export const fillSampleTables = (
  root: HTMLElement,
  loaded: (table: GwTable, page: number) => void,
) => {
  for (const table of root.querySelectorAll("gw-table")) {
    const name = table.dataset.sample ?? "";

    if (!isSample(name)) continue;

    const sample = samples[name];
    const pages = Number(table.dataset.pages ?? "1");
    let page = 0;

    table.columns = sample.columns;
    table.rows = sample.page(page);
    table.more = page + 1 < pages;

    table.addEventListener("more", () => {
      setTimeout(() => {
        page += 1;
        table.rows = [...table.rows, ...sample.page(page)];
        table.more = page + 1 < pages;
        loaded(table, page + 1);
      }, loadTime);
    });
  }
};
