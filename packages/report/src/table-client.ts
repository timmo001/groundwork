/**
 * The page script's side of the report table: draws the cells `table`
 * described as data, and narrows the rows from the Filters sheet. Cells sit
 * in `gw-table`'s shadow root, out of the page's CSS, so they're styled
 * inline, on the theme's tokens.
 *
 * @module
 */
import {
  GwSheet,
  type GwTable,
  type TableColumn as GwTableColumn,
  type TableRow,
} from "@timmo001/groundwork-ui";
import { Option, Schema } from "effect";

import { toneIcons, type Segment } from "./blocks.ts";
import {
  cellsKey,
  type CellBadge,
  type CellChip,
  type CellText,
  type TableCell,
} from "./table.ts";

// The cells `table` described travel inside each row, which `gw-table` types
// as plain values only, so they're decoded here rather than asserted
const Tone = Schema.Literals([
  "neutral",
  "accent",
  "info",
  "success",
  "warning",
  "danger",
  "important",
]);

const optionalString = Schema.optional(Schema.String);
const optionalBoolean = Schema.optional(Schema.Boolean);
const optionalTone = Schema.optional(Tone);

const Cell: Schema.Codec<TableCell, unknown> = Schema.Struct({
  value: Schema.optional(
    Schema.Union([Schema.String, Schema.Number, Schema.Boolean, Schema.Null]),
  ),
  text: optionalString,
  href: optionalString,
  mono: optionalBoolean,
  muted: optionalBoolean,
  detail: Schema.optional(
    Schema.Struct({
      text: Schema.String,
      href: optionalString,
      mono: optionalBoolean,
    }),
  ),
  badges: Schema.optional(
    Schema.Array(
      Schema.Struct({
        text: Schema.String,
        tone: optionalTone,
        icon: optionalString,
      }),
    ),
  ),
  chips: Schema.optional(
    Schema.Array(
      Schema.Struct({
        text: Schema.String,
        tone: optionalTone,
        href: optionalString,
      }),
    ),
  ),
  segments: Schema.optional(
    Schema.Array(
      Schema.Struct({
        label: Schema.String,
        value: Schema.Number,
        tone: optionalTone,
      }),
    ),
  ),
});

const decodeCells = Schema.decodeUnknownOption(
  Schema.Record(Schema.String, Cell),
);

const decodeValues = Schema.decodeUnknownOption(Schema.Array(Schema.String));

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Readonly<Record<string, string>> = {},
  ...children: (Node | string)[]
) => {
  const node = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }

  node.append(...children);

  return node;
};

const linkStyle =
  "color: var(--gw-color-link); text-decoration-color: color-mix(in oklch, currentColor 40%, transparent); text-underline-offset: 0.15em";

const monoStyle = "font-family: var(--gw-font-mono); font-size: 0.92em";

const text = (line: CellText, extra = "") => {
  const style = [line.mono === true ? monoStyle : "", extra]
    .filter((part) => part !== "")
    .join("; ");

  return line.href === undefined
    ? element("span", style === "" ? {} : { style }, line.text)
    : element(
        "a",
        { href: line.href, style: [linkStyle, style].join("; ") },
        line.text,
      );
};

/** A chip as the `chip` block draws it: small, with a dot for a status tone. */
const chip = ({ text: label, tone = "neutral", href }: CellChip) => {
  const node = element("gw-chip", { size: "small", tone });

  if (tone !== "neutral" && tone !== "accent") {
    node.append(element("gw-dot", { tone, slot: "icon" }));
  }

  node.append(label);

  return href === undefined
    ? node
    : element(
        "a",
        { href, style: "display: inline-flex; text-decoration: none" },
        node,
      );
};

/** A state as the `badge` block draws it: small, with its tone's icon. */
const badge = ({ text: label, tone = "neutral", icon }: CellBadge) =>
  element(
    "gw-badge",
    { size: "small", tone, icon: icon ?? toneIcons[tone] },
    label,
  );

/** The breakdown bar, as the `breakdown` block draws it at its small size. */
const bar = (segments: readonly Segment[]) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return element(
    "div",
    {
      role: "img",
      "aria-label": segments
        .map((segment) => `${segment.value} ${segment.label}`)
        .join(", "),
      style:
        "display: flex; overflow: hidden; min-width: 6rem; height: 0.5rem; border-radius: var(--gw-radius-pill); background: var(--gw-color-fill-neutral-resting)",
    },
    ...segments.map((segment, index) =>
      element("span", {
        style: [
          `width: ${((segment.value / total) * 100).toFixed(2)}%`,
          `background: ${
            segment.tone === undefined || segment.tone === "neutral"
              ? "var(--gw-color-border-loud)"
              : `var(--gw-color-${segment.tone})`
          }`,
          index === 0
            ? ""
            : "box-shadow: inset 2px 0 0 var(--gw-color-surface-raised)",
        ]
          .filter((part) => part !== "")
          .join("; "),
      }),
    ),
  );
};

const draw = (cell: TableCell): Node => {
  const parts: Node[] = [];

  if (cell.text !== undefined) {
    parts.push(
      text(
        { text: cell.text, href: cell.href, mono: cell.mono },
        cell.muted === true ? "color: var(--gw-color-text-secondary)" : "",
      ),
    );
  }

  if (cell.badges !== undefined) parts.push(...cell.badges.map(badge));

  if (cell.chips !== undefined && cell.chips.length > 0) {
    parts.push(
      element(
        "span",
        {
          style:
            "display: inline-flex; gap: var(--gw-space-1); align-items: center",
        },
        ...cell.chips.map(chip),
      ),
    );
  }

  if (cell.segments !== undefined) parts.push(bar(cell.segments));

  const line = element(
    "span",
    {
      style:
        "display: inline-flex; flex-wrap: wrap; gap: var(--gw-space-1) var(--gw-space-2); align-items: center",
    },
    ...parts,
  );

  if (cell.detail === undefined) return line;

  return element(
    "span",
    { style: "display: flex; flex-direction: column; gap: 0.1rem" },
    line,
    text(cell.detail, "font-size: var(--gw-font-size-xs)"),
  );
};

// Decoded once per row, since a row's cells draw again as it scrolls by
const decoded = new WeakMap<
  TableRow,
  Readonly<Record<string, TableCell>> | undefined
>();

const cellsOf = (row: TableRow) => {
  if (!decoded.has(row)) {
    decoded.set(row, Option.getOrUndefined(decodeCells(row[cellsKey])));
  }

  return decoded.get(row);
};

// A filter's values: one or several, as `table` put them
const valuesOf = (row: TableRow, id: string): readonly string[] => {
  const value = row[id];

  return Option.getOrElse(decodeValues(value), () =>
    value === null || value === undefined ? [] : [String(value)],
  );
};

/**
 * Gives a report table's columns cells that draw what `table` described,
 * and wires its Filters button and sheet, when it has them.
 */
export const hydrateTable = (table: GwTable) => {
  table.columns = table.columns.map((column): GwTableColumn => ({
    ...column,
    cell: (row) => {
      const cell = cellsOf(row)?.[column.id];

      return cell === undefined ? String(row[column.id] ?? "") : draw(cell);
    },
  }));

  const sheetId = table.dataset.filters;

  if (sheetId === undefined) return;

  const sheet = document.getElementById(sheetId);

  if (!(sheet instanceof GwSheet)) return;

  const all = table.rows;

  const filters = [...sheet.querySelectorAll("gw-filter")].filter((filter) =>
    filter.hasAttribute("data-filter"),
  );

  // Ticking nothing, the same as ticking everything, shows every row
  const apply = () => {
    table.rows = all.filter((row) =>
      filters.every((filter) => {
        const ticked = filter.value;

        return (
          ticked.length === 0 ||
          valuesOf(row, filter.dataset.filter ?? "").some((value) =>
            ticked.includes(value),
          )
        );
      }),
    );
  };

  for (const filter of filters) filter.addEventListener("change", apply);

  table
    .querySelector("[data-opens]")
    ?.addEventListener("click", () => sheet.toggle());

  apply();
};
