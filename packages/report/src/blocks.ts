/**
 * The report's blocks: each returns markup on Groundwork's elements and
 * tokens, so a report arranges them in any order and nests them freely.
 *
 * @module
 */
import { Predicate } from "effect";

import { Html, html, json, raw, render, type Content } from "./html.ts";

/** A status color, from the theme's status roles. */
export type Tone =
  | "neutral"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "important";

/** `1` reads `+1`, `-1` stays `-1`, for a change since the last report. */
export const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

/** `1 file`, `2 files`. */
export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

/** A link, in the monospace font with `mono`, for paths and code. */
export const link = (
  text: Content,
  href: string,
  options: { readonly mono?: boolean } = {},
) =>
  html`<a
    href="${href}"
    ${options.mono === true ? raw(' class="gw-report-mono"') : ""}
    >${text}</a
  >`;

/** Inline code. */
export const code = (text: string) => html`<code>${text}</code>`;

/** Quieter text, such as a finding beside its title. */
export const muted = (content: Content) =>
  html`<span class="gw-report-muted">${content}</span>`;

/** A small change beside a value, such as `+3` or `82% done`. */
export const delta = (content: Content) =>
  html`<span class="gw-report-delta">${content}</span>`;

export interface ChipOptions {
  readonly tone?: Tone | undefined;
  readonly href?: string | undefined;
  readonly title?: string | undefined;
}

/**
 * A tinted label, linking to `href` when it has one. A status tone gets a
 * dot of its own color, as Groundwork's status chips have.
 */
export const chip = (text: Content, options: ChipOptions = {}) => {
  const tone = options.tone ?? "neutral";

  const element = html`<gw-chip
    size="small"
    tone="${tone}"
    ${options.title === undefined ? "" : html` title="${options.title}"`}
    >${
      tone === "neutral" || tone === "accent"
        ? ""
        : html`<gw-dot tone="${tone}" slot="icon"></gw-dot>`
    }${text}</gw-chip
  >`;

  return options.href === undefined
    ? element
    : html`<a class="gw-report-chip-link" href="${options.href}"
        >${element}</a
      >`;
};

/**
 * Each tone's icon on a state badge, as SVG path data from Material Design
 * Icons: a check, an alert, a cross, an info mark, a star or a ring.
 */
export const toneIcons: Readonly<Record<Tone, string>> = {
  success:
    "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  warning:
    "M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  danger:
    "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z",
  info: "M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  important:
    "M16.23,18L12,15.45L7.77,18L8.89,13.19L5.16,9.96L10.08,9.54L12,5L13.92,9.53L18.84,9.95L15.11,13.18L16.23,18M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  accent:
    "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  neutral:
    "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
};

export interface BadgeOptions {
  readonly tone?: Tone | undefined;
  /** SVG path data, in place of the tone's own icon. */
  readonly icon?: string | undefined;
  readonly title?: string | undefined;
}

/**
 * A state, such as `Migrated` or `Blocking`, on `gw-badge`: its tone's
 * icon before the text. Chips stay for counts, names and dates.
 */
export const badge = (text: Content, options: BadgeOptions = {}) => {
  const tone = options.tone ?? "neutral";

  return html`<gw-badge
    size="small"
    tone="${tone}"
    icon="${options.icon ?? toneIcons[tone]}"
    ${options.title === undefined ? "" : html` title="${options.title}"`}
    >${text}</gw-badge
  >`;
};

/** Chips in a wrapping row. */
export const chips = (...items: readonly Content[]) =>
  html`<span class="gw-report-chips">${items}</span>`;

export interface SectionOptions {
  /** The anchor, so the section can be linked to. */
  readonly id?: string | undefined;
  readonly title: string;
  readonly description?: Content;
  /** Content at the end of the title row, such as a chip. */
  readonly actions?: Content;
}

/** A titled part of the report, under a level 2 `gw-page-header`. */
export const section = (options: SectionOptions, ...content: Content[]) =>
  html`<section
    class="gw-report-section"
    ${options.id === undefined ? "" : html` id="${options.id}"`}
  >
    <gw-page-header level="2" heading="${options.title}"
      >${
        options.actions === undefined
          ? ""
          : html`<span slot="actions">${options.actions}</span>`
      }</gw-page-header
    >${
      options.description === undefined
        ? ""
        : html`<p class="gw-report-lede">${options.description}</p>`
    }${content}
  </section>`;

/** A heading inside a section, with an aside such as a count. */
export const heading = (text: Content, aside?: Content) =>
  html`<h3 class="gw-report-heading">
    ${text}${aside === undefined ? "" : html` ${delta(aside)}`}
  </h3>`;

/** A paragraph of prose. */
export const paragraph = (content: Content) =>
  html`<p class="gw-report-paragraph">${content}</p>`;

/** A quiet note, such as what a run left out. */
export const note = (content: Content) =>
  html`<p class="gw-report-note">${content}</p>`;

export interface AlertOptions {
  readonly tone?: Tone | undefined;
  readonly heading?: string | undefined;
}

/** A message in a tinted box, such as the run's summary. */
export const alert = (options: AlertOptions, content: Content) =>
  html`<gw-alert
    tone="${options.tone ?? "info"}"
    ${options.heading === undefined ? "" : html` heading="${options.heading}"`}
    >${content}</gw-alert
  >`;

export interface Stat {
  readonly label: string;
  readonly value: Content;
  readonly tone?: Tone | undefined;
  /** A change since the last report, such as `+3`. */
  readonly delta?: Content;
  /** What the number means, shown on hover. */
  readonly hint?: string | undefined;
}

/** The headline numbers, as tiles in a grid. */
export const stats = (items: readonly Stat[]) =>
  html`<div class="gw-report-stats">
    ${items.map(
      (item) =>
        html`<div
          class="gw-report-stat"
          ${item.hint === undefined ? "" : html` title="${item.hint}"`}
        >
          <strong>${item.value}</strong
          ><span
            >${
              item.tone === undefined
                ? ""
                : html`<gw-dot tone="${item.tone}"></gw-dot>`
            }${item.label}${item.delta === undefined ? "" : delta(item.delta)}</span
          >
        </div>`,
    )}
  </div>`;

// A type rather than an interface, so it fits `Json` for table cells
export type Segment = {
  readonly label: string;
  readonly value: number;
  readonly tone?: Tone | undefined;
};

/**
 * How a whole splits into parts, as one bar of tinted segments. `size`
 * `small` fits a table cell.
 */
export const breakdown = (
  segments: readonly Segment[],
  options: { readonly size?: "small" | "medium" } = {},
) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return html`<div
    class="gw-report-breakdown"
    data-size="${options.size ?? "medium"}"
    role="img"
    aria-label="${segments
      .map((segment) => `${segment.value} ${segment.label}`)
      .join(", ")}"
  >
    ${segments.map(
      (segment) =>
        html`<span
          data-tone="${segment.tone ?? "neutral"}"
          style="width: ${((segment.value / total) * 100).toFixed(2)}%"
        ></span>`,
    )}
  </div>`;
};

export interface ProgressOptions {
  readonly label: string;
  readonly value: number;
  readonly max?: number | undefined;
  /** The value as shown, such as `42 of 60`. Defaults to a percentage. */
  readonly display?: string | undefined;
  readonly caption?: string | undefined;
  readonly tone?: Tone | undefined;
}

/** One value against a range, on `gw-meter`. */
export const progress = (options: ProgressOptions) =>
  html`<gw-meter
    label="${options.label}"
    value="${options.value}"
    max="${options.max ?? 100}"
    ${
      options.display === undefined ? "" : html` display="${options.display}"`
    }${options.caption === undefined ? "" : html` caption="${options.caption}"`}${
      options.tone === undefined ? "" : html` tone="${options.tone}"`
    }
  ></gw-meter>`;

/** Label and value pairs, on `gw-facts`. */
export const facts = (
  items: readonly { readonly label: string; readonly value: string }[],
) => html`<gw-facts items="${json(items)}"></gw-facts>`;

export interface CardItem {
  readonly heading: string;
  readonly href?: string | undefined;
  readonly description?: string | undefined;
  readonly content?: Content;
}

/** Cards in a grid, each linked by its heading. */
export const cards = (
  items: readonly CardItem[],
  options: { readonly empty?: string } = {},
) =>
  items.length === 0
    ? paragraph(muted(options.empty ?? "None."))
    : html`<gw-grid class="gw-report-cards"
        >${items.map(
          (item) =>
            html`<gw-card
              level="3"
              heading="${item.heading}"
              ${
                item.href === undefined
                  ? ""
                  : html` href="${item.href}" title-link`
              }${
                item.description === undefined
                  ? ""
                  : html` description="${item.description}"`
              }
              >${item.content}</gw-card
            >`,
        )}</gw-grid
      >`;

export interface ExpansionOptions {
  readonly heading: string;
  readonly description?: string | undefined;
  /** Content in the summary row, such as a count. */
  readonly aside?: Content;
  readonly open?: boolean | undefined;
}

/** A collapsible part, closed until it's opened. */
export const expansion = (options: ExpansionOptions, ...content: Content[]) =>
  html`<gw-expansion
    class="gw-report-expansion"
    heading="${options.heading}"
    ${
      options.description === undefined
        ? ""
        : html` description="${options.description}"`
    }${options.open === true ? raw(" open") : ""}
    >${
      options.aside === undefined
        ? ""
        : html`<span slot="actions">${options.aside}</span>`
    }${content}</gw-expansion
  >`;

export interface ListItem {
  readonly content: Content;
  readonly items?: readonly Content[] | undefined;
}

/** A bulleted or numbered list, each item with an optional list under it. */
export const list = (
  items: readonly (Content | ListItem)[],
  options: { readonly ordered?: boolean } = {},
) => {
  const tag = raw(options.ordered === true ? "ol" : "ul");

  const isItem = (item: Content | ListItem): item is ListItem =>
    !(item instanceof Html) && Predicate.hasProperty(item, "content");

  return html`<${tag} class="gw-report-list">${items.map((item) =>
    isItem(item)
      ? html`<li>
          ${item.content}${
            item.items === undefined || item.items.length === 0
              ? ""
              : html`<ul>
                  ${item.items.map((child) => html`<li>${child}</li>`)}
                </ul>`
          }
        </li>`
      : html`<li>${item}</li>`,
  )}</${tag}>`;
};

/** Joins blocks into one, for building a report in pieces. */
export const join = (...content: Content[]): Html => raw(render(content));
