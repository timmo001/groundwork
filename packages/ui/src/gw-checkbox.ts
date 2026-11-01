/**
 * `gw-checkbox` and `gw-switch`: labeled native checkboxes in light DOM.
 * Docs: https://groundwork.timmo.dev/components/inputs/#checkbox-and-switch
 *
 * @module
 */
import { h, setAttribute } from "./element.js";
import { LightElement, fieldId } from "./fields.js";

/** A labeled native checkbox. `gw-switch` draws the same control as a switch. */
export class GwCheckbox extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    hint: {},
    checked: { type: "boolean" },
    disabled: { type: "boolean" },
    labelHidden: { type: "boolean", attribute: "label-hidden" },
  } as const;

  declare label: string;
  /** Keeps the label for assistive technology but hides it, such as in a setting row. */
  declare labelHidden: boolean;
  declare name: string;
  declare value: string;
  declare hint: string;
  declare checked: boolean;
  declare disabled: boolean;

  readonly #id = fieldId();

  readonly #input = h("input", { type: "checkbox" });

  readonly #text = h("span");

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  /** `switch` for `gw-switch`, so assistive technology announces it as one. */
  protected get controlRole(): string | undefined {
    return undefined;
  }

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "on";
    this.hint = "";
    this.checked = false;
    this.disabled = false;
    this.labelHidden = false;
  }

  protected override create(root: HTMLElement) {
    setAttribute(this.#input, "role", this.controlRole);
    this.#input.addEventListener("change", () => {
      this.checked = this.#input.checked;
    });
    root.append(h("label", {}, this.#input, this.#text), this.#hint);
  }

  protected override update() {
    const input = this.#input;

    setAttribute(input, "name", this.name || null);
    input.value = this.value;
    setAttribute(input, "aria-describedby", this.hint ? this.#hint.id : null);
    input.disabled = this.disabled;
    input.checked = this.checked;
    this.#text.textContent = this.label;
    this.#text.className = this.labelHidden ? "gw-visually-hidden" : "";
    this.#hint.textContent = this.hint;
    this.#hint.hidden = !this.hint;
  }
}

/** A checkbox drawn as a switch, announced as a switch. */
export class GwSwitch extends GwCheckbox {
  protected override get controlRole() {
    return "switch";
  }
}

GwCheckbox.define("gw-checkbox");

GwSwitch.define("gw-switch");

declare global {
  interface HTMLElementTagNameMap {
    "gw-checkbox": GwCheckbox;
    "gw-switch": GwSwitch;
  }
}
