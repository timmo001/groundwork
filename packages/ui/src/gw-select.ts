/**
 * `gw-select`: a labeled picker with search, a bottom sheet on phones.
 * Docs: https://groundwork.timmo.dev/components/inputs/#select
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { FieldInfo } from "./field-info.js";
import { LightElement, fieldId } from "./fields.js";
import "./gw-option-list.js";
import type { OptionItem } from "./gw-option-list.js";
import { createIcon, setIconPath } from "./styles.js";

/** @deprecated Use `OptionItem`, which also takes an icon, description and group. */
export type SelectOption = OptionItem;

/** An option being read from markup, filled in field by field. */
type DraftOption = { -readonly [Key in keyof OptionItem]: OptionItem[Key] };

const gap = 6;

/** Below this width the list is a bottom sheet. */
const sheetBelow = 600;

/** From this many options a search field shows by default. */
const searchFrom = 7;

// MDI's chevron-down
const chevronIcon =
  "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";

/**
 * A labeled select whose list opens under it, after Home Assistant's
 * pickers. Long lists get a search field, focused as the list opens, and
 * only the options in view are rendered. Move with the arrow keys and pick
 * with Enter. Below 600px wide the list is a bottom sheet.
 *
 * Pass `options`, or write `<option>` children (in `<optgroup>`s for
 * groups, with `data-icon`, `data-swatch` and `data-description`), which it
 * reads once when it first connects. A hidden input carries the value in
 * forms, and it fires `change` when the value changes.
 *
 * With `multiple` it picks several: each pick toggles an option in `values`
 * and the list stays open, the trigger shows the first choice and how many
 * more, and a Clear button under the list empties it. A hidden input per
 * value carries them in forms.
 *
 * @element gw-select
 * @summary A labeled picker with search, a bottom sheet on phones.
 *
 * @attr {string} label - The field's label.
 * @attr {string} name - The form field name.
 * @attr {string} value - The chosen option's value.
 * @attr {boolean} multiple - Picks several options, kept in `values`.
 * @attr {string[]} values - The chosen options' values with `multiple`, as JSON.
 * @attr {string} hint - One line of help under the field.
 * @attr {string} info - Longer help, opened from an (i) button by the label.
 * @attr {string} placeholder - What the trigger shows with nothing chosen. Defaults to `Choose`.
 * @attr {"auto"|"always"|"never"} search - Whether the list has a search field; `auto` adds one from 7 options. Defaults to `auto`.
 * @attr {boolean} disabled - Disables the field.
 * @attr {boolean} open - Whether the list shows.
 * @attr {OptionItem[]} options - The options, as JSON.
 * @attr {boolean} label-hidden - Hides the label but keeps it for assistive technology.
 * @attr {boolean} inline-label - Shows the label inside the trigger, before the value, for toolbars and filters.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The field's size, 40px tall at medium. Defaults to `medium`.
 *
 * @cssprop --gw-field-scale - Scales the field, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height with the theme's density. The theme sets it.
 *
 * @fires {Event} change - When the value, or `values` with `multiple`, changes.
 */
export class GwSelect extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    multiple: { type: "boolean", reflect: true },
    values: { type: "json" },
    hint: {},
    info: {},
    placeholder: {},
    search: {},
    disabled: { type: "boolean" },
    open: { type: "boolean", reflect: true },
    options: { type: "json" },
    labelHidden: { type: "boolean", attribute: "label-hidden" },
    inlineLabel: { type: "boolean", attribute: "inline-label", reflect: true },
    size: { reflect: true },
  } as const;

  declare label: string;
  declare name: string;
  declare value: string;
  declare multiple: boolean;
  declare values: readonly string[];
  declare hint: string;
  /** Longer help, opened from an (i) button by the label. */
  declare info: string;
  declare placeholder: string;
  /** `auto` shows a search field from seven options; `always` or `never` overrides that. */
  declare search: "auto" | "always" | "never";
  declare disabled: boolean;
  declare open: boolean;
  declare options: readonly OptionItem[];
  declare labelHidden: boolean;
  declare inlineLabel: boolean;
  declare size: "xs" | "small" | "medium" | "large" | "xl";

  readonly #id = fieldId();

  readonly #label = h("label", { id: `${this.#id}-label` });

  readonly #info = new FieldInfo(this.#label);

  readonly #icon = createIcon("");

  // The trigger is already labelled by the real label, so this copy is hidden
  // from assistive technology
  readonly #inline = h("span", {
    class: "gw-select-inline-label",
    "aria-hidden": "true",
  });

  readonly #text = h("span", { class: "gw-select-value" });

  readonly #trigger = h(
    "button",
    {
      type: "button",
      class: "gw-select-trigger",
      id: this.#id,
      "aria-haspopup": "listbox",
      "aria-labelledby": `${this.#id}-label ${this.#id}`,
    },
    this.#icon,
    this.#inline,
    // Keeps the visible text "Theme Base" rather than "ThemeBase", matching
    // the accessible name
    " ",
    this.#text,
    createIcon(chevronIcon),
  );

  readonly #input = h("input", { type: "hidden" });

  readonly #inputs = h("span", { hidden: true });

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  readonly #list = h("gw-option-list");

  readonly #clear = h(
    "button",
    { type: "button", class: "gw-select-clear" },
    "Clear",
  );

  readonly #popup = h(
    "div",
    { class: "gw-select-popup", popover: "manual" },
    this.#list,
    this.#clear,
  );

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "";
    this.multiple = false;
    this.values = [];
    this.hint = "";
    this.info = "";
    this.placeholder = "Choose";
    this.search = "auto";
    this.disabled = false;
    this.open = false;
    this.options = [];
    this.labelHidden = false;
    this.inlineLabel = false;
    this.size = "medium";
  }

  /** Opens the list, such as from a keyboard shortcut. */
  show() {
    if (this.disabled || this.#popup.matches(":popover-open")) return;

    this.#popup.dataset.placement =
      window.innerWidth < sheetBelow ? "sheet" : "below";
    this.#popup.showPopover();
  }

  close() {
    if (this.#popup.matches(":popover-open")) this.#popup.hidePopover();
  }

  #readChildren() {
    const children = [...this.querySelectorAll("option")];

    if (this.options.length === 0 && children.length > 0) {
      this.options = children.map((option) => {
        const group = option.parentElement;

        const item: DraftOption = {
          value: option.value,
          label: option.textContent.trim(),
        };

        if (option.dataset.icon !== undefined) item.icon = option.dataset.icon;

        if (option.dataset.swatch !== undefined) {
          item.swatch = option.dataset.swatch;
        }

        if (option.dataset.description !== undefined) {
          item.description = option.dataset.description;
        }

        if (group instanceof HTMLOptGroupElement) item.group = group.label;

        return item;
      });

      const picked = children.filter((option) => option.selected);

      if (this.multiple) {
        if (this.values.length === 0 && picked.length > 0) {
          this.values = picked.map((option) => option.value);
        }
      } else if (this.value === "" && picked[0] !== undefined) {
        this.value = picked[0].value;
      }
    }

    for (const element of this.querySelectorAll("option, optgroup")) {
      element.remove();
    }
  }

  readonly #position = () => {
    const popup = this.#popup;

    if (popup.dataset.placement === "sheet") {
      popup.style.top = "";
      popup.style.left = "";
      popup.style.width = "";

      return;
    }

    const rect = this.#trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 224);

    popup.style.width = `${Math.min(width, window.innerWidth - 2 * gap)}px`;

    const below = window.innerHeight - rect.bottom - gap;
    const fitsBelow = below >= popup.offsetHeight || below >= rect.top;

    popup.dataset.placement = fitsBelow ? "below" : "above";
    popup.style.top = `${fitsBelow ? rect.bottom + gap : Math.max(gap, rect.top - gap - popup.offsetHeight)}px`;
    popup.style.left = `${Math.min(Math.max(gap, rect.left), window.innerWidth - popup.offsetWidth - gap)}px`;
  };

  readonly #onOutside = (event: PointerEvent) => {
    if (!event.composedPath().includes(this)) this.close();
  };

  readonly #onToggle = (event: ToggleEvent) => {
    this.open = event.newState === "open";

    if (this.open) {
      this.#position();
      this.#list.reset();
      window.addEventListener("resize", this.#position);
      window.addEventListener("scroll", this.#position, true);
      document.addEventListener("pointerdown", this.#onOutside, true);

      return;
    }

    this.#stopListening();
  };

  #stopListening() {
    window.removeEventListener("resize", this.#position);
    window.removeEventListener("scroll", this.#position, true);
    document.removeEventListener("pointerdown", this.#onOutside, true);
  }

  override disconnectedCallback() {
    this.#stopListening();
    super.disconnectedCallback();
  }

  protected override create(root: HTMLElement) {
    this.#readChildren();

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
      } else if (event.key === "Tab") {
        this.close();
        this.#trigger.focus();
      }
    });
    this.#list.addEventListener("pick", (event) => {
      event.stopPropagation();

      const value =
        event instanceof CustomEvent &&
        event.detail !== null &&
        "value" in event.detail
          ? String(event.detail.value)
          : "";

      if (this.multiple) {
        const chosen = Array.isArray(this.values) ? this.values : [];

        this.values = chosen.includes(value)
          ? chosen.filter((item) => item !== value)
          : [...chosen, value];
        this.dispatchEvent(new Event("change", { bubbles: true }));

        return;
      }

      this.close();
      this.#trigger.focus();

      if (value !== this.value) {
        this.value = value;
        this.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    this.#clear.addEventListener("click", () => {
      this.values = [];
      this.close();
      this.#trigger.focus();
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });

    root.append(
      this.#info.heading,
      this.#trigger,
      this.#input,
      this.#inputs,
      this.#hint,
      this.#popup,
    );
  }

  /** What the trigger says: the choice, or with `multiple` the first and how many more. */
  #summary(options: readonly OptionItem[]) {
    if (!this.multiple) {
      return options.find((option) => option.value === this.value);
    }

    const values = Array.isArray(this.values) ? this.values : [];
    const chosen = options.filter((option) => values.includes(option.value));
    const [first] = chosen;

    if (first === undefined) return undefined;

    return chosen.length === 1
      ? first
      : { ...first, label: `${first.label} +${chosen.length - 1}` };
  }

  protected override update() {
    const options = Array.isArray(this.options) ? this.options : [];
    const selected = this.#summary(options);
    const values = Array.isArray(this.values) ? this.values : [];

    this.#label.textContent = this.label;
    this.#info.update(this.label, this.info);
    this.#info.heading.classList.toggle(
      "gw-visually-hidden",
      this.labelHidden || this.inlineLabel,
    );
    this.#inline.textContent = this.label;
    this.#inline.hidden = !this.inlineLabel;
    this.#text.textContent = selected?.label ?? this.placeholder;
    this.#text.toggleAttribute("data-placeholder", selected === undefined);
    setIconPath(this.#icon, selected?.icon ?? "");
    this.#icon.toggleAttribute("hidden", selected?.icon === undefined);

    const trigger = this.#trigger;

    trigger.disabled = this.disabled;
    setAttribute(trigger, "aria-expanded", this.open ? "true" : "false");
    setAttribute(trigger, "aria-describedby", this.hint ? this.#hint.id : null);

    setAttribute(this.#input, "name", this.multiple ? null : this.name || null);
    this.#input.value = this.multiple ? "" : this.value;
    this.#inputs.replaceChildren(
      ...(this.multiple && this.name
        ? values.map((value) =>
            h("input", { type: "hidden", name: this.name, value }),
          )
        : []),
    );
    this.#clear.hidden = !this.multiple || values.length === 0;

    const list = this.#list;

    list.options = options;
    list.value = this.value;
    list.multiple = this.multiple;
    list.values = values;
    list.label = this.label;
    list.search =
      this.search === "always" ||
      (this.search !== "never" && options.length >= searchFrom);

    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;
  }
}

GwSelect.define("gw-select");

declare global {
  interface HTMLElementTagNameMap {
    "gw-select": GwSelect;
  }
}
