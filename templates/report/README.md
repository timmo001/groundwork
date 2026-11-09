# report template

A sample report, a weekly migration report on made-up data, built with [`@timmo001/groundwork-report`](https://groundwork.timmo.dev/reports). The docs site runs it as the [Report template](https://groundwork.timmo.dev/templates/report).

```sh
mise run report:dev     # serve it, reloading on a change
mise run report:build   # write it to dist/report.html
```

What it shows:

- One HTML file with its CSS and script inline, so it opens from disk with no server.
- The standard header, sections, tables with sort, search, grouping and filters, and every theme, plus the desktop's Omarchy themes when built on a machine that has them.

Copy the folder into the tool that writes the report, swap the `workspace:*` dependencies for published versions, and replace the data in `src/sample.ts` with your own. `src/build.ts` writes the page and `src/serve.ts` serves it while you work on it.
