/**
 * `gw-date-picker`: a labeled field that shows a day and opens a calendar to
 * pick another.
 * Docs: https://groundwork.timmo.dev/components/inputs/#date-picker
 *
 * @module
 */
import {
  defaultSheetBelow,
  defaultSheetBelowHeight,
  opensAsSheet,
} from "./adaptive.js";
import { h, setAttribute } from "./element.js";
import { FieldInfo } from "./field-info.js";
import { LightElement, fieldId } from "./fields.js";
import type {} from "./gw-calendar.js";
import { parseDay, toDayString } from "./gw-calendar.js";
import type {} from "./gw-button.js";
import { placeBeside } from "./placement.js";
import { Scrim } from "./scrim.js";
import { createIcon } from "./styles.js";

/**
 * A shortcut under the calendar that picks a day relative to today, such as
 * Yesterday (`days: -1`) or In a week (`weeks: 1`), or a fixed `value`.
 */
export interface DatePreset {
  readonly label: string;
  /** Days from today, negative for the past. */
  readonly days?: number;
  /** Weeks from today, negative for the past. */
  readonly weeks?: number;
  /** Months from today, negative for the past, keeping the day where the month has it. */
  readonly months?: number;
  /** A fixed day as `YYYY-MM-DD`, instead of one relative to today. */
  readonly value?: string;
}

/** The presets `presets="default"` shows: Yesterday, Today and Tomorrow. */
export const defaultDatePresets: readonly DatePreset[] = [
  { label: "Yesterday", days: -1 },
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
];

/** The day a preset picks, as `YYYY-MM-DD`, from `today`. */
export const presetDay = (preset: DatePreset, today = new Date()) => {
  if (preset.value !== undefined) return preset.value;

  const months = preset.months ?? 0;

  const last = new Date(
    today.getFullYear(),
    today.getMonth() + months + 1,
    0,
  ).getDate();

  return toDayString(
    new Date(
      today.getFullYear(),
      today.getMonth() + months,
      Math.min(today.getDate(), last) +
        (preset.days ?? 0) +
        7 * (preset.weeks ?? 0),
    ),
  );
};

const gap = 6;

// MDI's calendar-blank-outline and chevron-down
const calendarIcon =
  "M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V9H19V19M19 7H5V5H19V7Z";

const chevronIcon =
  "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";

/** How the trigger writes the day when `format` isn't set: "Wed, 11 Nov 2026" in British English. */
const defaultFormat: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * A labeled field that shows the chosen day, such as "Wed, 11 Nov 2026", and
 * opens a `gw-calendar` under it to pick another. The calendar takes focus as
 * it opens; picking a day or pressing Esc closes it and returns focus to the
 * field. Arrow Down or Up on the field opens it too. On a narrow or short
 * screen, under 600px wide or 500px tall, the calendar is a bottom sheet.
 * While it's open, a clear scrim (`.gw-scrim`) covers the page, so a click
 * outside only closes it, and nothing beneath reacts.
 *
 * The value is a `YYYY-MM-DD` day, carried in forms by a hidden input, and
 * it fires `change` when it changes. `min` and `max` bound the days that can
 * be picked, `marked` makes days stand out, and `unmarked` dims or disables
 * the rest. It fires `month` as the calendar moves between months, so a
 * page can load that month's `marked` days.
 *
 * @element gw-date-picker
 * @summary A field that opens a calendar to pick a day.
 *
 * @attr {string} label - The field's label.
 * @attr {string} name - The form field name.
 * @attr {string} value - The chosen day, as `YYYY-MM-DD`.
 * @attr {string} min - The first day that can be picked, as `YYYY-MM-DD`.
 * @attr {string} max - The last day that can be picked, as `YYYY-MM-DD`.
 * @attr {string[]} marked - Days that stand out in the calendar, as a JSON array of `YYYY-MM-DD`.
 * @attr {"normal"|"dim"|"disabled"} unmarked - How days not in `marked` show once any are: as usual, dimmed, or dimmed and unpickable. Defaults to `normal`.
 * @attr {string} month - The month the calendar shows, as `YYYY-MM`. Follows the value as it changes.
 * @attr {string} hint - One line of help under the field.
 * @attr {string} info - Longer help, opened from an (i) button by the label.
 * @attr {string} info-label - The (i) button's name, for an app in another language. Defaults to `About` and the label.
 * @attr {string} placeholder - What the trigger shows with no day chosen. Defaults to `Choose a day`.
 * @attr {object} format - How the trigger writes the day, as JSON `Intl.DateTimeFormat` options. Defaults to the weekday, day, short month and year.
 * @attr {string} locale - The language for the day and the calendar's names. Defaults to the page's `lang`, then the browser's.
 * @attr {number} first-day - The calendar's first day of the week, 0 for Sunday to 6 for Saturday. Defaults to the locale's.
 * @attr {string} previous-label - The calendar's previous month button's name, for an app in another language. Defaults to `Previous month`.
 * @attr {string} next-label - The calendar's next month button's name, for an app in another language. Defaults to `Next month`.
 * @attr {string} marked-label - Added to a marked day's name for assistive technology. Defaults to `marked`.
 * @attr {boolean} disabled - Disables the field.
 * @attr {boolean} open - Whether the calendar shows.
 * @attr {boolean} label-hidden - Hides the label but keeps it for assistive technology.
 * @attr {boolean} inline-label - Shows the label inside the trigger, before the day, for toolbars and filters.
 * @attr {boolean} icon-hidden - Hides the calendar icon before the day.
 * @attr {boolean} presets - Shows shortcut buttons under the calendar, such as Today.
 * @attr {DatePreset[]} preset-options - The shortcuts, as a JSON array of `{ label, days?, weeks?, months?, value? }`, relative to today (negative for the past) or a fixed `value`. Defaults to Yesterday, Today and Tomorrow. Ones outside `min` and `max`, or on a disabled unmarked day, are disabled.
 * @attr {string} presets-label - The shortcut group's name for assistive technology. Defaults to `Shortcuts`.
 * @attr {number} sheet-below - Overrides the viewport width in pixels below which the calendar is a bottom sheet; `0` turns the width rule off. Defaults to `600`.
 * @attr {number} sheet-below-height - Overrides the viewport height in pixels below which the calendar is a bottom sheet, such as a phone on its side; `0` turns the height rule off. Defaults to `500`.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The field's size, 40px tall at medium. Defaults to `medium`.
 *
 * @cssprop --gw-field-scale - Scales the field, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height with the theme's density. The theme sets it.
 * @cssprop --gw-field-info-size - The (i) button by the label that opens `info`, with its icon two thirds of it. Defaults to `1.5rem`.
 * @cssprop --gw-calendar-day-size - Each day's width and height in the calendar. Defaults to `2.5rem`.
 * @cssprop --gw-date-picker-backdrop - The backdrop behind the calendar as a bottom sheet. Defaults to `rgb(0 0 0 / 40%)`.
 * @cssprop --gw-adaptive-sheet-width - The widest the sheet grows, centered. Defaults to `40rem`.
 * @cssprop --gw-adaptive-sheet-height - The tallest the sheet grows, the calendar scrolling within it. Defaults to `85dvh`.
 *
 * @fires {Event} change - When a day is picked, with it in `value`.
 * @fires {CustomEvent<{ month: string }>} month - When the calendar moves to another month, with it as `YYYY-MM` in `detail`, also in `month`.
 */
export class GwDatePicker extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    min: {},
    max: {},
    marked: { type: "json" },
    unmarked: {},
    month: {},
    hint: {},
    info: {},
    infoLabel: { attribute: "info-label" },
    placeholder: {},
    format: { type: "json" },
    locale: {},
    firstDay: { type: "number", attribute: "first-day" },
    previousLabel: { attribute: "previous-label" },
    nextLabel: { attribute: "next-label" },
    markedLabel: { attribute: "marked-label" },
    disabled: { type: "boolean" },
    open: { type: "boolean", reflect: true },
    labelHidden: { type: "boolean", attribute: "label-hidden" },
    inlineLabel: { type: "boolean", attribute: "inline-label", reflect: true },
    iconHidden: { type: "boolean", attribute: "icon-hidden" },
    presets: { type: "boolean" },
    presetOptions: { type: "json", attribute: "preset-options" },
    presetsLabel: { attribute: "presets-label" },
    sheetBelow: { type: "number", attribute: "sheet-below" },
    sheetBelowHeight: { type: "number", attribute: "sheet-below-height" },
    size: { reflect: true },
  } as const;

  declare label: string;
  declare name: string;
  declare value: string;
  declare min: string;
  declare max: string;
  declare marked: readonly string[];
  declare unmarked: "normal" | "dim" | "disabled";
  declare month: string;
  declare hint: string;
  declare info: string;
  declare infoLabel: string;
  declare placeholder: string;
  /** How the trigger writes the day, as `Intl.DateTimeFormat` options. */
  declare format: Intl.DateTimeFormatOptions;
  declare locale: string;
  declare firstDay: number | undefined;
  declare previousLabel: string;
  declare nextLabel: string;
  declare markedLabel: string;
  declare disabled: boolean;
  declare open: boolean;
  declare labelHidden: boolean;
  declare inlineLabel: boolean;
  declare iconHidden: boolean;
  declare presets: boolean;
  /** The shortcuts `presets` shows, Yesterday, Today and Tomorrow by default. */
  declare presetOptions: readonly DatePreset[];
  declare presetsLabel: string;
  /** The viewport width in pixels below which the calendar is a bottom sheet. */
  declare sheetBelow: number;
  /** The viewport height in pixels below which the calendar is a bottom sheet. */
  declare sheetBelowHeight: number;
  declare size: "xs" | "small" | "medium" | "large" | "xl";

  readonly #id = fieldId();

  readonly #label = h("label", { id: `${this.#id}-label` });

  readonly #info = new FieldInfo(this.#label);

  readonly #icon = createIcon(calendarIcon);

  // The trigger is already labeled by the real label, so this copy is hidden
  // from assistive technology
  readonly #inline = h("span", {
    class: "gw-date-picker-inline-label",
    "aria-hidden": "true",
  });

  readonly #text = h("span", { class: "gw-date-picker-value" });

  readonly #trigger = h(
    "button",
    {
      type: "button",
      class: "gw-date-picker-trigger",
      id: this.#id,
      "aria-haspopup": "dialog",
      "aria-labelledby": `${this.#id}-label ${this.#id}`,
    },
    this.#icon,
    this.#inline,
    " ",
    this.#text,
    createIcon(chevronIcon),
  );

  readonly #input = h("input", { type: "hidden" });

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  readonly #calendar = h("gw-calendar", { class: "gw-date-picker-calendar" });

  readonly #presets = h("div", {
    class: "gw-date-picker-presets",
    role: "group",
  });

  readonly #popup = h(
    "div",
    {
      class: "gw-date-picker-popup",
      popover: "manual",
      role: "dialog",
      "aria-labelledby": `${this.#id}-label`,
    },
    this.#calendar,
    this.#presets,
  );

  readonly #scrim = new Scrim(() => {
    this.close();
    this.#trigger.focus();
  });

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "";
    this.min = "";
    this.max = "";
    this.marked = [];
    this.unmarked = "normal";
    this.month = "";
    this.hint = "";
    this.info = "";
    this.infoLabel = "";
    this.placeholder = "Choose a day";
    this.format = defaultFormat;
    this.locale = "";
    this.firstDay = undefined;
    this.previousLabel = "Previous month";
    this.nextLabel = "Next month";
    this.markedLabel = "marked";
    this.disabled = false;
    this.open = false;
    this.labelHidden = false;
    this.inlineLabel = false;
    this.iconHidden = false;
    this.presets = false;
    this.presetOptions = defaultDatePresets;
    this.presetsLabel = "Shortcuts";
    this.sheetBelow = defaultSheetBelow;
    this.sheetBelowHeight = defaultSheetBelowHeight;
    this.size = "medium";
  }

  /** Opens the calendar on the chosen day's month, such as from a keyboard shortcut. */
  show() {
    if (this.disabled || this.#popup.matches(":popover-open")) return;

    if (parseDay(this.value) !== undefined) this.month = this.value.slice(0, 7);

    this.#popup.dataset.placement = this.#asSheet() ? "sheet" : "below";
    this.#scrim.show();
    this.#popup.showPopover();
  }

  close() {
    if (this.#popup.matches(":popover-open")) this.#popup.hidePopover();
  }

  #asSheet() {
    return opensAsSheet({
      below: this.sheetBelow,
      belowHeight: this.sheetBelowHeight,
    });
  }

  readonly #position = () => {
    const popup = this.#popup;

    popup.style.maxHeight = "";

    if (this.#asSheet()) {
      popup.dataset.placement = "sheet";
      popup.style.top = "";
      popup.style.left = "";

      return;
    }

    placeBeside(popup, this.#trigger, { gap });
  };

  readonly #onToggle = (event: ToggleEvent) => {
    this.open = event.newState === "open";

    if (this.open) {
      this.#position();
      window.addEventListener("resize", this.#position);
      window.addEventListener("scroll", this.#position, true);
      void this.#calendar.updateComplete.then(() => {
        this.#calendar.focus();
      });

      return;
    }

    this.#scrim.hide();
    this.#stopListening();
  };

  #stopListening() {
    window.removeEventListener("resize", this.#position);
    window.removeEventListener("scroll", this.#position, true);
  }

  override disconnectedCallback() {
    this.#stopListening();
    super.disconnectedCallback();
  }

  protected override create(root: HTMLElement) {
    this.#label.addEventListener("click", () => {
      this.#trigger.focus();
    });
    this.#trigger.addEventListener("click", () => {
      if (this.open) {
        this.close();
      } else {
        this.show();
      }
    });
    this.#trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        this.show();
      }
    });
    this.#popup.addEventListener("toggle", this.#onToggle);
    this.#popup.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        this.#trigger.focus();
      }
    });
    // Tabbing out of the calendar closes it, so it never stays open behind
    // the focus
    this.#popup.addEventListener("focusout", (event) => {
      if (
        event.relatedTarget instanceof Node &&
        !this.#popup.contains(event.relatedTarget)
      ) {
        this.close();
      }
    });
    this.#calendar.addEventListener("change", (event) => {
      event.stopPropagation();
      this.#pick(this.#calendar.value);
    });
    this.#presets.addEventListener("click", (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest("gw-button")
          : null;

      if (button instanceof HTMLElement && button.dataset.day !== undefined) {
        if (!button.hasAttribute("disabled")) this.#pick(button.dataset.day);
      }
    });
    this.#calendar.addEventListener("month", (event) => {
      event.stopPropagation();
      this.month = this.#calendar.month;
      this.dispatchEvent(
        new CustomEvent("month", {
          detail: { month: this.month },
          bubbles: true,
        }),
      );
    });

    root.append(
      this.#info.heading,
      this.#trigger,
      this.#input,
      this.#hint,
      this.#scrim.element,
      this.#popup,
    );
  }

  get #locale() {
    return (
      this.locale ||
      this.closest("[lang]")?.getAttribute("lang") ||
      navigator.language
    );
  }

  #formatted(day: Date) {
    try {
      return new Intl.DateTimeFormat(this.#locale, this.format).format(day);
    } catch {
      return new Intl.DateTimeFormat(this.#locale, defaultFormat).format(day);
    }
  }

  #pick(day: string) {
    this.value = day;
    this.close();
    this.#trigger.focus();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /** Whether `day` can be picked: inside `min` and `max`, and not an unpickable unmarked day. */
  #pickable(day: string) {
    if (parseDay(day) === undefined) return false;

    if (this.min && day < this.min) return false;

    if (this.max && day > this.max) return false;

    return !(
      this.unmarked === "disabled" &&
      this.marked.length > 0 &&
      !this.marked.includes(day)
    );
  }

  #renderPresets() {
    this.#presets.hidden = !this.presets;
    setAttribute(this.#presets, "aria-label", this.presetsLabel);

    if (!this.presets) {
      this.#presets.replaceChildren();

      return;
    }

    const options = Array.isArray(this.presetOptions)
      ? this.presetOptions
      : defaultDatePresets;

    this.#presets.replaceChildren(
      ...options.map((preset) => {
        const day = presetDay(preset);

        return h(
          "gw-button",
          {
            variant: "neutral",
            appearance: "plain",
            size: "small",
            "data-day": day,
            disabled: !this.#pickable(day),
          },
          preset.label,
        );
      }),
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    // A new value shows its month, unless the page set the month alongside
    if ((changed.has("value") && !changed.has("month")) || this.month === "") {
      if (parseDay(this.value) !== undefined) {
        this.month = this.value.slice(0, 7);
      }
    }

    const day = parseDay(this.value);

    this.#label.textContent = this.label;
    this.#info.update(this.label, this.info, this.infoLabel);
    this.#info.heading.classList.toggle(
      "gw-visually-hidden",
      this.labelHidden || this.inlineLabel,
    );
    this.#inline.textContent = this.label;
    this.#inline.hidden = !this.inlineLabel;
    this.#icon.toggleAttribute("hidden", this.iconHidden);
    this.#text.textContent =
      day === undefined ? this.placeholder : this.#formatted(day);
    this.#text.toggleAttribute("data-placeholder", day === undefined);

    const trigger = this.#trigger;

    trigger.disabled = this.disabled;
    setAttribute(trigger, "aria-expanded", this.open ? "true" : "false");
    setAttribute(trigger, "aria-describedby", this.hint ? this.#hint.id : null);

    setAttribute(this.#input, "name", this.name || null);
    this.#input.value = day === undefined ? "" : this.value;

    const calendar = this.#calendar;

    calendar.value = this.value;
    calendar.month = this.month;
    calendar.min = this.min;
    calendar.max = this.max;
    calendar.marked = this.marked;
    calendar.unmarked = this.unmarked;
    calendar.label = this.label || "Calendar";
    calendar.locale = this.locale;
    calendar.firstDay = this.firstDay;
    calendar.previousLabel = this.previousLabel;
    calendar.nextLabel = this.nextLabel;
    calendar.markedLabel = this.markedLabel;
    this.#renderPresets();

    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;

    if (this.open) this.#position();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-date-picker": GwDatePicker;
  }
}
