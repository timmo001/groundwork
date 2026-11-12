/**
 * `gw-calendar`: a month of days to pick one from, the grid inside the date
 * picker.
 * Docs: https://groundwork.timmo.dev/components/inputs/#calendar
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import { base } from "./styles.js";

// MDI's chevron-left and chevron-right
const previousIcon =
  "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z";

const nextIcon = "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const monthPattern = /^(\d{4})-(\d{2})$/u;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** A local date as `YYYY-MM-DD`. */
export const toDayString = (date: Date) =>
  `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** A `YYYY-MM-DD` string as a local date at midnight, or `undefined` when it isn't one. */
export const parseDay = (text: string) => {
  const match = dayPattern.exec(text);

  if (match === null) return undefined;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return toDayString(date) === text ? date : undefined;
};

const parseMonth = (text: string) => {
  const match = monthPattern.exec(text);

  if (match === null) return undefined;

  const month = Number(match[2]);

  return month >= 1 && month <= 12
    ? new Date(Number(match[1]), month - 1, 1)
    : undefined;
};

const toMonthString = (date: Date) => toDayString(date).slice(0, 7);

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Moves by whole months, keeping the day where the month has it and its last day otherwise. */
const addMonths = (date: Date, months: number) => {
  const last = new Date(
    date.getFullYear(),
    date.getMonth() + months + 1,
    0,
  ).getDate();

  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    Math.min(date.getDate(), last),
  );
};

/**
 * The day a key moves to from `from`: the arrows by a day or a week, Home
 * and End to the week's ends (`column` is `from`'s place in it), and Page Up
 * or Down by `months`. `undefined` for any other key.
 */
const dayMove = (
  key: string,
  from: Date,
  column: number,
  months: number,
  rtl: boolean,
) => {
  switch (key) {
    case "ArrowLeft":
      return addDays(from, rtl ? 1 : -1);
    case "ArrowRight":
      return addDays(from, rtl ? -1 : 1);
    case "ArrowUp":
      return addDays(from, -7);
    case "ArrowDown":
      return addDays(from, 7);
    case "Home":
      return addDays(from, -column);
    case "End":
      return addDays(from, 6 - column);
    case "PageUp":
      return addMonths(from, -months);
    case "PageDown":
      return addMonths(from, months);
    default:
      return undefined;
  }
};

/** The week facts a locale may give: `getWeekInfo()` in newer browsers, a `weekInfo` getter in older ones. */
interface WeekInfoLocale {
  readonly baseName: string;
  readonly getWeekInfo?: () => { readonly firstDay: number };
  readonly weekInfo?: { readonly firstDay: number };
}

/** The first day of the week where `locale` is, Monday when the browser can't say. */
const localeFirstDay = (tag: string) => {
  try {
    const locale: WeekInfoLocale = new Intl.Locale(tag);
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;

    if (info !== undefined) return info.firstDay % 7;
  } catch {
    // An unknown locale falls back below
  }

  return 1;
};

/**
 * A month of days, to pick one from, with the month's name above and buttons
 * to the months either side. Move with the arrow keys, Home and End to the
 * week's ends, Page Up and Page Down by a month (with Shift by a year), and
 * pick with Enter, Space or a click. It fires `change` when a day is picked,
 * and `month` when the month shown moves.
 *
 * `marked` days stand out with a dot, such as the days that have recordings,
 * and `unmarked` dims or disables the rest. Days before `min` or after `max`
 * can't be picked.
 *
 * @element gw-calendar
 * @summary A month of days to pick one from.
 *
 * @attr {string} value - The picked day, as `YYYY-MM-DD`.
 * @attr {string} month - The month shown, as `YYYY-MM`. Defaults to the value's month, or this month.
 * @attr {string} min - The first day that can be picked, as `YYYY-MM-DD`.
 * @attr {string} max - The last day that can be picked, as `YYYY-MM-DD`.
 * @attr {string[]} marked - Days that stand out, as a JSON array of `YYYY-MM-DD`.
 * @attr {"normal"|"dim"|"disabled"} unmarked - How days not in `marked` show once any are: as usual, dimmed, or dimmed and unpickable. Defaults to `normal`.
 * @attr {string} label - The calendar's accessible name. Defaults to `Calendar`.
 * @attr {string} locale - The language for month and weekday names. Defaults to the page's `lang`, then the browser's.
 * @attr {number} first-day - The first day of the week, 0 for Sunday to 6 for Saturday. Defaults to the locale's.
 * @attr {string} previous-label - The previous month button's name, for an app in another language. Defaults to `Previous month`.
 * @attr {string} next-label - The next month button's name, for an app in another language. Defaults to `Next month`.
 * @attr {string} marked-label - Added to a marked day's name for assistive technology. Defaults to `marked`.
 *
 * @slot header-actions - Controls of the app's own in the header, between the month's name and the buttons, such as a Today button.
 *
 * @csspart header - The row with the month's name and buttons.
 * @csspart title - The month's name.
 * @csspart previous - The previous month button, a `gw-button`.
 * @csspart next - The next month button, a `gw-button`.
 * @csspart grid - The table of days.
 * @csspart weekday - Each weekday's heading.
 * @csspart day - Each day's button, also `today`, `selected`, `marked`, `unmarked` and `outside` (in the months either side) where they apply.
 *
 * @cssprop --gw-calendar-day-size - Each day's width and height. Defaults to `2.5rem`, smaller on a phone so seven fit across.
 * @cssprop --gw-calendar-mark - The marked days' dot color. Defaults to `--gw-color-accent`.
 * @cssprop --gw-calendar-dim-opacity - How faded `unmarked="dim"` days are. Defaults to `0.45`.
 *
 * @fires {Event} change - When a day is picked, with it in `value`.
 * @fires {CustomEvent<{ month: string }>} month - When the month shown moves, with it as `YYYY-MM` in `detail`, also in `month`.
 */
export class GwCalendar extends GwElement {
  static override properties = {
    value: {},
    month: {},
    min: {},
    max: {},
    marked: { type: "json" },
    unmarked: { reflect: true },
    label: {},
    locale: {},
    firstDay: { type: "number", attribute: "first-day" },
    previousLabel: { attribute: "previous-label" },
    nextLabel: { attribute: "next-label" },
    markedLabel: { attribute: "marked-label" },
  } as const;

  static override styles = [
    base,
    css`
      /* On a narrow phone the days shrink so seven fit across, with room
         for a popup's padding */
      :host {
        --gw-calendar-cell: var(
          --gw-calendar-day-size,
          min(2.5rem, calc((100vw - 3rem) / 7))
        );

        display: inline-flex;
        flex-direction: column;
        gap: var(--gw-space-2);
        font-size: var(--gw-font-size-s);
      }

      .header {
        display: flex;
        gap: var(--gw-space-1);
        align-items: center;
      }

      .title {
        flex: 1;
        min-width: 0;
        padding-inline-start: var(--gw-space-2);
        margin: 0;
        font-size: var(--gw-font-size-m);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-strong);
      }

      table {
        border-spacing: 0;
        border-collapse: collapse;
      }

      th {
        width: var(--gw-calendar-cell);
        height: calc(var(--gw-calendar-cell) * 0.75);
        padding: 0;
        font-size: var(--gw-font-size-xs);
        font-weight: var(--gw-font-weight-strong);
        color: var(--gw-color-text-secondary);
        text-align: center;
      }

      td {
        padding: 0;
        text-align: center;
      }

      .day {
        position: relative;
        display: inline-grid;
        place-items: center;
        width: var(--gw-calendar-cell);
        height: var(--gw-calendar-cell);
        padding: 0;
        font: inherit;
        font-variant-numeric: tabular-nums;
        color: var(--gw-color-text-strong);
        cursor: pointer;
        background: none;
        border: var(--gw-border-width) solid transparent;
        border-radius: var(--gw-radius-control);
        transition:
          color var(--gw-motion-fast) var(--gw-motion-easing),
          background-color var(--gw-motion-fast) var(--gw-motion-easing);
      }

      .day:hover:not([aria-disabled="true"]) {
        background: var(--gw-color-fill-neutral-hovered);
      }

      .day:focus-visible {
        outline-offset: calc(var(--gw-focus-width) * -1);
      }

      .day[data-outside] {
        color: var(--gw-color-text-secondary);
      }

      .day[data-today] {
        font-weight: var(--gw-font-weight-strong);
        border-color: var(--gw-color-border-loud);
      }

      .day[data-marked]::after {
        position: absolute;
        inset-block-end: calc(var(--gw-calendar-cell) * 0.12);
        inset-inline-start: 50%;
        width: 0.3125rem;
        height: 0.3125rem;
        content: "";
        background: var(--gw-calendar-mark, var(--gw-color-accent));
        border-radius: 50%;
        translate: -50% 0;
      }

      .day[data-dim] {
        opacity: var(--gw-calendar-dim-opacity, 0.45);
      }

      .day[aria-disabled="true"] {
        color: var(--gw-color-text-disabled);
        cursor: not-allowed;
      }

      .day[aria-disabled="true"][data-marked]::after {
        background: var(--gw-color-text-disabled);
      }

      .day[data-selected] {
        color: var(--gw-color-on-accent);
        background: var(--gw-color-fill-accent-resting);
        opacity: 1;
      }

      .day[data-selected]:hover {
        background: var(--gw-color-fill-accent-hovered);
      }

      .day[data-selected][data-marked]::after {
        background: currentColor;
      }

      /* Forced colors drop the fills, so the picked day takes the system's
         selection colors and the dot and today's ring draw in text colors */
      @media (forced-colors: active) {
        .day {
          forced-color-adjust: none;
          color: CanvasText;
          background: Canvas;
        }

        .day[data-today] {
          border-color: CanvasText;
        }

        .day[data-marked]::after {
          background: CanvasText;
        }

        .day[aria-disabled="true"],
        .day[data-outside] {
          color: GrayText;
        }

        .day[aria-disabled="true"][data-marked]::after {
          background: GrayText;
        }

        .day[data-selected],
        .day[data-selected]:hover {
          color: HighlightText;
          background: Highlight;
        }

        .day[data-selected][data-marked]::after {
          background: HighlightText;
        }

        .day:focus-visible {
          outline-color: Highlight;
        }
      }
    `,
  ];

  declare value: string;
  declare month: string;
  declare min: string;
  declare max: string;
  declare marked: readonly string[];
  declare unmarked: "normal" | "dim" | "disabled";
  declare label: string;
  declare locale: string;
  /** The first day of the week, 0 for Sunday; `undefined` for the locale's. */
  declare firstDay: number | undefined;
  declare previousLabel: string;
  declare nextLabel: string;
  declare markedLabel: string;

  readonly #title = h("h2", {
    class: "title",
    part: "title",
    "aria-live": "polite",
  });

  readonly #previous = h("gw-button", {
    part: "previous",
    variant: "neutral",
    appearance: "plain",
    labels: "hide",
    icon: previousIcon,
  });

  readonly #next = h("gw-button", {
    part: "next",
    variant: "neutral",
    appearance: "plain",
    labels: "hide",
    icon: nextIcon,
  });

  readonly #head = h("tr");

  readonly #body = h("tbody");

  readonly #grid = h(
    "table",
    { role: "grid", part: "grid" },
    h("thead", {}, this.#head),
    this.#body,
  );

  /** The day keyboard focus sits on, in the month shown. */
  #focus: Date | undefined;

  /** The day button that takes keyboard focus, the only one in the tab order. */
  #focusButton: HTMLButtonElement | undefined;

  constructor() {
    super();
    this.value = "";
    this.month = "";
    this.min = "";
    this.max = "";
    this.marked = [];
    this.unmarked = "normal";
    this.label = "Calendar";
    this.locale = "";
    this.firstDay = undefined;
    this.previousLabel = "Previous month";
    this.nextLabel = "Next month";
    this.markedLabel = "marked";
  }

  /** Moves keyboard focus to the picked day, or the nearest one that can be picked. */
  override focus(options?: FocusOptions) {
    this.#focus = undefined;
    this.#focus = this.#clamp(this.#shownFocus());
    this.#showMonth(this.#focus, false);
    this.#render();
    this.#focusButton?.focus(options);
  }

  get #locale() {
    return (
      this.locale ||
      this.closest("[lang]")?.getAttribute("lang") ||
      navigator.language
    );
  }

  get #shown() {
    const month = parseMonth(this.month);

    if (month !== undefined) return month;

    const day = parseDay(this.value) ?? new Date();

    return new Date(day.getFullYear(), day.getMonth(), 1);
  }

  /** The focused day if it's in the month shown, else the value's, today's or the month's first. */
  #shownFocus() {
    const shown = this.#shown;

    const inShown = (date: Date | undefined) =>
      date !== undefined &&
      date.getFullYear() === shown.getFullYear() &&
      date.getMonth() === shown.getMonth();

    const value = parseDay(this.value);
    const today = new Date();

    if (inShown(this.#focus) && this.#focus !== undefined) return this.#focus;

    if (inShown(value) && value !== undefined) return value;

    if (inShown(today)) {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    return shown;
  }

  #clamp(date: Date) {
    const min = parseDay(this.min);
    const max = parseDay(this.max);

    if (min !== undefined && date < min) return min;

    if (max !== undefined && date > max) return max;

    return date;
  }

  #isMarked(day: string) {
    return Array.isArray(this.marked) && this.marked.includes(day);
  }

  #isDisabled(date: Date) {
    const min = parseDay(this.min);
    const max = parseDay(this.max);

    if (
      (min !== undefined && date < min) ||
      (max !== undefined && date > max)
    ) {
      return true;
    }

    return (
      this.unmarked === "disabled" &&
      Array.isArray(this.marked) &&
      this.marked.length > 0 &&
      !this.#isMarked(toDayString(date))
    );
  }

  /** Shows the month `date` is in, firing `month` when it moved and `notify` is set. */
  #showMonth(date: Date, notify: boolean) {
    const month = toMonthString(date);

    if (month === toMonthString(this.#shown)) return;

    this.month = month;

    if (notify) {
      this.dispatchEvent(
        new CustomEvent("month", {
          detail: { month },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  #moveFocus(date: Date) {
    this.#focus = this.#clamp(date);
    this.#showMonth(this.#focus, true);
    this.#render();
    this.#focusButton?.focus();
  }

  #pick(date: Date) {
    if (this.#isDisabled(date)) return;

    const day = toDayString(date);

    this.#focus = date;
    this.#showMonth(date, true);

    if (day !== this.value) {
      this.value = day;
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
  }

  #dayAt(event: Event) {
    const button = event
      .composedPath()
      .find(
        (node) => node instanceof HTMLElement && node.dataset.day !== undefined,
      );

    return button instanceof HTMLElement
      ? parseDay(button.dataset.day ?? "")
      : undefined;
  }

  readonly #onKeydown = (event: KeyboardEvent) => {
    const from = this.#shownFocus();
    const first = this.firstDay ?? localeFirstDay(this.#locale);

    const move = dayMove(
      event.key,
      from,
      (from.getDay() - first + 7) % 7,
      event.shiftKey ? 12 : 1,
      this.#rtl,
    );

    if (move !== undefined) {
      event.preventDefault();
      this.#moveFocus(move);

      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const day = this.#dayAt(event);

      if (day !== undefined) this.#pick(day);
    }
  };

  get #rtl() {
    return getComputedStyle(this).direction === "rtl";
  }

  protected override create(root: ShadowRoot) {
    this.#previous.addEventListener("click", () => {
      this.#focus = addMonths(this.#shownFocus(), -1);
      this.#showMonth(this.#focus, true);
    });
    this.#next.addEventListener("click", () => {
      this.#focus = addMonths(this.#shownFocus(), 1);
      this.#showMonth(this.#focus, true);
    });
    this.#body.addEventListener("click", (event) => {
      const day = this.#dayAt(event);

      if (day !== undefined) this.#pick(day);
    });
    this.#body.addEventListener("keydown", this.#onKeydown);

    root.append(
      h(
        "div",
        { class: "header", part: "header" },
        this.#title,
        h("slot", { name: "header-actions" }),
        this.#previous,
        this.#next,
      ),
      this.#grid,
    );
  }

  protected override update() {
    setAttribute(this.#grid, "aria-label", this.label || null);
    setAttribute(this.#previous, "label", this.previousLabel);
    this.#previous.textContent = this.previousLabel;
    setAttribute(this.#next, "label", this.nextLabel);
    this.#next.textContent = this.nextLabel;
    this.#render();
  }

  #render() {
    const locale = this.#locale;
    const shown = this.#shown;
    const first = this.firstDay ?? localeFirstDay(locale);
    const focusDay = toDayString(this.#shownFocus());
    const today = toDayString(new Date());
    const value = this.value;
    const min = parseDay(this.min);
    const max = parseDay(this.max);

    const anyMarked = Array.isArray(this.marked) && this.marked.length > 0;

    this.#title.textContent = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(shown);

    const lastOfPrevious = new Date(shown.getFullYear(), shown.getMonth(), 0);
    const firstOfNext = new Date(shown.getFullYear(), shown.getMonth() + 1, 1);

    this.#previous.disabled = min !== undefined && lastOfPrevious < min;
    this.#next.disabled = max !== undefined && firstOfNext > max;

    const short = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "long" });
    const full = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
    const start = addDays(shown, -((shown.getDay() - first + 7) % 7));

    this.#head.replaceChildren(
      ...Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index);

        return h(
          "th",
          { scope: "col", part: "weekday", abbr: long.format(date) },
          short.format(date),
        );
      }),
    );

    const rows: HTMLTableRowElement[] = [];

    for (let week = 0; week < 6; week += 1) {
      const cells = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, week * 7 + index);
        const day = toDayString(date);
        const outside = date.getMonth() !== shown.getMonth();
        const isMarked = this.#isMarked(day);
        const disabled = this.#isDisabled(date);
        const selected = day === value;
        const isToday = day === today;
        const dim = anyMarked && !isMarked && this.unmarked !== "normal";

        const parts = ["day"];

        if (isToday) parts.push("today");

        if (selected) parts.push("selected");

        if (isMarked) parts.push("marked");
        else if (anyMarked) parts.push("unmarked");

        if (outside) parts.push("outside");

        const button = h(
          "button",
          {
            type: "button",
            class: "day",
            part: parts.join(" "),
            tabindex: day === focusDay ? "0" : "-1",
            "data-day": day,
            "data-outside": outside,
            "data-today": isToday,
            "data-marked": isMarked,
            "data-dim": dim,
            "data-selected": selected,
            "aria-disabled": disabled ? "true" : null,
            "aria-current": isToday ? "date" : null,
            "aria-label": isMarked
              ? `${full.format(date)}, ${this.markedLabel}`
              : full.format(date),
          },
          String(date.getDate()),
        );

        if (day === focusDay) this.#focusButton = button;

        return h(
          "td",
          { role: "gridcell", "aria-selected": selected ? "true" : "false" },
          button,
        );
      });

      rows.push(h("tr", {}, ...cells));
    }

    const focused = this.shadowRoot?.activeElement;

    const hadFocus =
      focused instanceof HTMLElement && this.#body.contains(focused);

    this.#body.replaceChildren(...rows);

    if (hadFocus) this.#focusButton?.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-calendar": GwCalendar;
  }
}
