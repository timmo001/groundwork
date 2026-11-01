/**
 * `gw-input`: a labeled native input in light DOM.
 * Docs: https://groundwork.timmo.dev/components/inputs/#input
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { createIcon, setIconPath } from "./styles.js";
import { FieldInfo } from "./field-info.js";
import { LightElement, fieldId } from "./fields.js";

// MDI's eye-outline and eye-off-outline
const showIcon =
  "M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z";

const hideIcon =
  "M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z";

/**
 * A labeled native `<input>`, or a `<textarea>` with `multiline`, with an
 * optional hint and error. Enter submits its form when the form's submit
 * button is a `gw-button`, as it would with a native one.
 *
 * @element gw-input
 * @summary A labeled text field in light DOM, so forms and autofill see it.
 *
 * @attr {string} label - The field's label.
 * @attr {string} name - The form field name.
 * @attr {string} type - The native input type. Defaults to `text`.
 * @attr {string} value - The value.
 * @attr {string} placeholder - Placeholder text.
 * @attr {string} autocomplete - The native autocomplete hint.
 * @attr {string} inputmode - The native inputmode hint, such as `numeric` for a port, which picks the on-screen keyboard.
 * @attr {string} min - The lowest value of a `number`, date or time field.
 * @attr {string} max - The highest value of a `number`, date or time field.
 * @attr {string} step - The step between values of a `number`, date or time field, or `any`.
 * @attr {number} maxlength - The most characters it takes.
 * @attr {string} hint - One line of help under the field.
 * @attr {string} info - Longer help, opened from an (i) button by the label.
 * @attr {string} error - An error under the field, which marks it invalid and is announced.
 * @attr {boolean} required - Requires a value.
 * @attr {boolean} optional - Adds "(optional)" after the label, for the few optional fields in a form that mostly requires them.
 * @attr {boolean} disabled - Disables the field.
 * @attr {boolean} multiline - Uses a `<textarea>` that grows by dragging its corner, for text that runs over lines.
 * @attr {number} rows - The textarea's starting height in lines. Defaults to 3.
 * @attr {boolean} monospace - Sets the text in the monospace font, for paths, commands, tokens and other machine text. It also turns off spellcheck.
 * @attr {boolean} reveal - On a password field, adds a button at the end to show and hide what's typed.
 * @attr {"xs"|"small"|"medium"|"large"|"xl"} size - The field's size, 40px tall at medium. Defaults to `medium`.
 * @attr {string} icon - SVG path data for an icon inside the field, before the text, such as a magnifier on a search.
 * @attr {boolean} label-hidden - Keeps the label as the field's accessible name but doesn't show it, for a field in a toolbar whose icon and placeholder say what it's for.
 *
 * @cssprop --gw-field-scale - Scales the field, around 1 for medium.
 * @cssprop --gw-control-scale - Scales its height with the theme's density. The theme sets it.
 */
export class GwInput extends LightElement {
  static override properties = {
    label: {},
    name: {},
    type: {},
    value: {},
    placeholder: {},
    autocomplete: {},
    inputmode: {},
    min: {},
    max: {},
    step: {},
    maxlength: { type: "number" },
    hint: {},
    info: {},
    error: {},
    required: { type: "boolean" },
    optional: { type: "boolean" },
    disabled: { type: "boolean" },
    multiline: { type: "boolean", reflect: true },
    rows: { type: "number" },
    monospace: { type: "boolean", reflect: true },
    reveal: { type: "boolean" },
    size: { reflect: true },
    icon: {},
    labelHidden: { type: "boolean", attribute: "label-hidden", reflect: true },
  } as const;

  declare label: string;
  declare name: string;
  declare type: string;
  declare value: string;
  declare placeholder: string;
  declare autocomplete: string;
  /** The native inputmode hint, which picks the on-screen keyboard. */
  declare inputmode: string;
  /** The lowest value of a number, date or time field. */
  declare min: string;
  /** The highest value of a number, date or time field. */
  declare max: string;
  /** The step between values of a number, date or time field. */
  declare step: string;
  /** The most characters it takes, or 0 for no limit. */
  declare maxlength: number;
  declare hint: string;
  /** Longer help, opened from an (i) button by the label. */
  declare info: string;
  declare error: string;
  declare required: boolean;
  /** Adds "(optional)" after the label. */
  declare optional: boolean;
  declare disabled: boolean;
  /** Uses a `<textarea>` instead of an `<input>`. */
  declare multiline: boolean;
  /** The textarea's starting height in lines. */
  declare rows: number;
  /** Sets the text in the monospace font and turns off spellcheck. */
  declare monospace: boolean;
  /** On a password field, adds a button to show and hide what's typed. */
  declare reveal: boolean;
  declare size: "xs" | "small" | "medium" | "large" | "xl";
  /** SVG path data for an icon inside the field, before the text. */
  declare icon: string;
  /** Keeps the label as the accessible name without showing it. */
  declare labelHidden: boolean;

  readonly #id = fieldId();

  readonly #icon = createIcon("");

  readonly #label = h("label", { for: this.#id });

  readonly #info = new FieldInfo(this.#label);

  readonly #input = h("input", { id: this.#id });

  readonly #textarea = h("textarea", { id: this.#id });

  readonly #optional = h(
    "span",
    { class: "gw-optional", hidden: true },
    " (optional)",
  );

  readonly #revealIcon = createIcon(showIcon);

  readonly #reveal = h(
    "button",
    {
      type: "button",
      class: "gw-reveal",
      hidden: true,
      "aria-pressed": "false",
    },
    this.#revealIcon,
  );

  #revealed = false;

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  readonly #error = h("p", {
    class: "gw-error",
    id: `${this.#id}-error`,
    role: "alert",
  });

  /** The native control in use: the textarea when multiline, else the input. */
  get #control() {
    return this.multiline ? this.#textarea : this.#input;
  }

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.type = "text";
    this.value = "";
    this.placeholder = "";
    this.autocomplete = "";
    this.inputmode = "";
    this.min = "";
    this.max = "";
    this.step = "";
    this.maxlength = 0;
    this.hint = "";
    this.info = "";
    this.error = "";
    this.required = false;
    this.optional = false;
    this.disabled = false;
    this.multiline = false;
    this.rows = 3;
    this.monospace = false;
    this.reveal = false;
    this.size = "medium";
    this.icon = "";
    this.labelHidden = false;
  }

  protected override create(root: HTMLElement) {
    for (const control of [this.#input, this.#textarea]) {
      control.addEventListener("input", () => {
        this.value = control.value;
      });
    }

    // A gw-button's native button is in its shadow root, out of the form's
    // reach, so Enter only submits on its own with a single field. Submit
    // here instead, as a native submit button would
    this.#input.addEventListener("keydown", (event) => {
      const form = this.#input.form;

      if (
        event.key !== "Enter" ||
        event.isComposing ||
        event.defaultPrevented ||
        form === null ||
        form.querySelector(
          'button:not([type]), button[type="submit"], input[type="submit"]',
        ) !== null ||
        form.querySelector(
          'gw-button[type="submit"]:not([disabled], [loading])',
        ) === null
      ) {
        return;
      }

      event.preventDefault();
      form.requestSubmit();
    });
    this.#reveal.addEventListener("click", () => {
      this.#revealed = !this.#revealed;
      this.requestUpdate("reveal");
    });
    root.append(
      this.#info.heading,
      h(
        "span",
        { class: "gw-input-control" },
        this.#icon,
        this.#control,
        this.#reveal,
      ),
      this.#hint,
      this.#error,
    );
  }

  protected override update() {
    const control = this.#control;
    const other = this.multiline ? this.#input : this.#textarea;

    // Only the control in use is in the field, so the label and the form
    // see just the one
    if (!control.isConnected && other.isConnected) other.replaceWith(control);

    const described = [
      this.hint ? this.#hint.id : "",
      this.error ? this.#error.id : "",
    ]
      .join(" ")
      .trim();

    const password = this.type === "password" && !this.multiline;
    const reveal = password && this.reveal;

    if (!reveal) this.#revealed = false;

    this.#label.replaceChildren(this.label, this.#optional);
    this.#optional.hidden = !this.optional;
    this.#info.update(this.label, this.info);
    this.#info.heading.classList.toggle("gw-visually-hidden", this.labelHidden);
    setIconPath(this.#icon, this.icon);
    this.#icon.toggleAttribute("hidden", !this.icon);
    this.#input.type = reveal && this.#revealed ? "text" : this.type;
    this.#textarea.rows = this.rows;
    setAttribute(control, "name", this.name || null);
    setAttribute(control, "placeholder", this.placeholder || null);
    setAttribute(control, "autocomplete", this.autocomplete || null);
    setAttribute(control, "inputmode", this.inputmode || null);
    setAttribute(this.#input, "min", this.min || null);
    setAttribute(this.#input, "max", this.max || null);
    setAttribute(this.#input, "step", this.step || null);
    setAttribute(
      control,
      "maxlength",
      this.maxlength > 0 ? String(this.maxlength) : null,
    );
    setAttribute(control, "spellcheck", this.monospace ? "false" : null);
    setAttribute(control, "aria-invalid", this.error ? "true" : null);
    setAttribute(control, "aria-describedby", described || null);
    control.required = this.required;
    control.disabled = this.disabled;

    if (control.value !== this.value) control.value = this.value;

    this.#reveal.hidden = !reveal;
    this.#reveal.disabled = this.disabled;
    setAttribute(
      this.#reveal,
      "aria-label",
      this.#revealed ? `Hide ${this.label}` : `Show ${this.label}`,
    );
    setAttribute(this.#reveal, "aria-pressed", String(this.#revealed));
    setIconPath(this.#revealIcon, this.#revealed ? hideIcon : showIcon);
    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;
    this.#error.textContent = this.error;
    this.#error.hidden = !this.error;
  }
}

GwInput.define("gw-input");

declare global {
  interface HTMLElementTagNameMap {
    "gw-input": GwInput;
  }
}
