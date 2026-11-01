import { h, setAttribute } from "./element.js";
import { LightElement, fieldId } from "./fields.js";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * A labeled native `<select>`. Pass `options`, or write `<option>` children,
 * which it reads once when it first connects.
 */
export class GwSelect extends LightElement {
  static override properties = {
    label: {},
    name: {},
    value: {},
    hint: {},
    disabled: { type: "boolean" },
    options: { type: "json" },
  } as const;

  declare label: string;
  declare name: string;
  declare value: string;
  declare hint: string;
  declare disabled: boolean;
  declare options: readonly SelectOption[];

  readonly #id = fieldId();

  readonly #label = h("label", { for: this.#id });

  readonly #select = h("select", { id: this.#id });

  readonly #hint = h("p", { class: "gw-hint", id: `${this.#id}-hint` });

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "";
    this.hint = "";
    this.disabled = false;
    this.options = [];
  }

  protected override create(root: HTMLElement) {
    const children = [...this.querySelectorAll("option")];

    if (this.options.length === 0 && children.length > 0) {
      this.options = children.map((option) => ({
        value: option.value,
        label: option.textContent.trim(),
      }));

      const picked = children.find((option) => option.selected);

      if (this.value === "" && picked !== undefined) this.value = picked.value;
    }

    for (const option of children) option.remove();

    this.#select.addEventListener("change", () => {
      this.value = this.#select.value;
    });
    root.append(
      this.#label,
      h("span", { class: "gw-select-control" }, this.#select),
      this.#hint,
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    const select = this.#select;

    this.#label.textContent = this.label;
    setAttribute(select, "name", this.name || null);
    setAttribute(select, "aria-describedby", this.hint ? this.#hint.id : null);
    select.disabled = this.disabled;

    if (changed.has("options")) {
      const options = Array.isArray(this.options) ? this.options : [];

      select.replaceChildren(
        ...options.map((option) => {
          const element = h("option", { value: option.value }, option.label);

          element.selected = option.value === this.value;

          return element;
        }),
      );
    }

    if (this.value !== "" && select.value !== this.value) {
      select.value = this.value;
    }

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
