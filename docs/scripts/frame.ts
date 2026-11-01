/**
 * Wraps app screenshots for the docs in a window frame: a title bar with the
 * title and three window controls, rounded corners and a transparent
 * outside, so desktop and terminal shots read as windows. Run it once on each
 * raw capture; framing a framed shot adds a second bar.
 *
 *   bun scripts/frame.ts <in.png> [out.png] --title Updates [--mode dark|light]
 *
 * Needs ImageMagick 7 (`magick`) and fontconfig.
 */
import { parseArgs } from "node:util";
import { $ } from "bun";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: "string", default: "" },
    mode: { type: "string", default: "dark" },
  },
});

const [input, output = input] = positionals;

if (input === undefined) {
  console.error("Usage: bun scripts/frame.ts <in.png> [out.png] --title <title> [--mode dark|light]");
  process.exit(1);
}

const colors =
  values.mode === "light"
    ? { bar: "#e4e8ee", title: "#1f2329", controls: "#b4bac3" }
    : { bar: "#0e1014", title: "#e3e6ea", controls: "#3a4048" };

const font = (await $`fc-match -f %{file} sans-serif:bold`.text()).trim();
const [rawWidth, rawHeight] = (await $`magick identify -format "%w %h" ${input}`.text()).split(" ").map(Number);

// A window manager's capture has its own border and rounded corners, with the
// wallpaper showing in the corners. Trim the border, then paint the corners
// in the window's own background so nothing shows where the bar joins.
const shave = 2;
const width = rawWidth - shave * 2;
const height = rawHeight - shave * 2;
const corner = 20;
const bar = 65;
const radius = 24;
const total = height + bar;

const background = (
  await $`magick ${input} -shave ${`${shave}x${shave}`} +repage -background black -flatten -format "%[pixel:p{${corner + 4},${corner + 4}}]" info:`.text()
).trim();

const corners = [
  `rectangle 0,0 ${corner},${corner}`,
  `rectangle ${width - 1 - corner},0 ${width - 1},${corner}`,
  `rectangle 0,${height - 1 - corner} ${corner},${height - 1}`,
  `rectangle ${width - 1 - corner},${height - 1 - corner} ${width - 1},${height - 1}`,
];

const controls = [44, 84, 124].map((offset) => `circle ${width - offset},${bar / 2} ${width - offset + 9},${bar / 2}`);

// Bun's shell reads parentheses as a subshell, so this one runs directly
const frame = Bun.spawn(
  [
    "magick",
    "(",
    "-size",
    `${width}x${bar}`,
    `xc:${colors.bar}`,
    "-font",
    font,
    "-pointsize",
    "26",
    "-fill",
    colors.title,
    "-gravity",
    "center",
    "-annotate",
    "+0+0",
    values.title,
    "-gravity",
    "northwest",
    "-fill",
    colors.controls,
    ...controls.flatMap((draw) => ["-draw", draw]),
    ")",
    "(",
    input,
    "-shave",
    `${shave}x${shave}`,
    "+repage",
    "-background",
    background,
    "-flatten",
    "-fill",
    background,
    ...corners.flatMap((draw) => ["-draw", draw]),
    ")",
    "-append",
    "(",
    "-size",
    `${width}x${total}`,
    "xc:none",
    "-fill",
    "white",
    "-draw",
    `roundrectangle 0,0 ${width - 1},${total - 1} ${radius},${radius}`,
    ")",
    "-alpha",
    "set",
    "-compose",
    "DstIn",
    "-composite",
    output,
  ],
  { stderr: "inherit" },
);

if ((await frame.exited) !== 0) process.exit(1);

console.log(`Framed ${input} as ${output}`);
