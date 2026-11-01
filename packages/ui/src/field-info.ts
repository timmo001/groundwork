import { h, setAttribute } from "./element.js";
import "./gw-popover.js";
import { createIcon } from "./styles.js";

// MDI's information-outline
const infoIcon =
  "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z";

/**
 * A field's heading: its label, and an (i) button beside it when the field
 * has `info`, which opens the longer help in a popover anchored to it. The
 * one-line `hint` stays under the field.
 */
export class FieldInfo {
  readonly #button = h(
    "button",
    { type: "button", class: "gw-info", hidden: true },
    createIcon(infoIcon),
  );

  readonly #text = h("p");

  readonly #popover = h("gw-popover", {}, this.#text);

  readonly heading: HTMLElement;

  constructor(label: HTMLElement) {
    this.heading = h(
      "div",
      { class: "gw-field-heading" },
      label,
      this.#button,
      this.#popover,
    );
    this.#button.addEventListener("click", () => {
      this.#popover.show(this.#button);
    });
  }

  update(label: string, info: string) {
    this.#button.hidden = !info;
    setAttribute(
      this.#button,
      "aria-label",
      label ? `About ${label}` : "About",
    );
    this.#popover.heading = label;
    this.#text.textContent = info;
  }
}
