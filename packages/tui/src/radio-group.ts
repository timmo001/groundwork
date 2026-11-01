/**
 * The radio group: a focusable list of two-line choices, the label and a
 * description, where one is always picked. Arrow keys move the pick, Enter or
 * Space activates it, and a click picks a choice.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface RadioChoice<Value extends string> {
  readonly value: Value;
  readonly label: string;
  readonly description?: string | undefined;
  /** The picked label's color; the accent by default */
  readonly color?: string | undefined;
}

export interface RadioGroupOptions<Value extends string> {
  readonly id: string;
  readonly theme: Theme;
  /** At least one */
  readonly choices: readonly [RadioChoice<Value>, ...RadioChoice<Value>[]];
  readonly value: Value;
  /** Called when the pick moves */
  readonly onValueChange?: ((value: Value) => void) | undefined;
  /** Called on Enter or Space */
  readonly onActivate?: ((value: Value) => void) | undefined;
}

/** A focusable group of choices with one always picked. */
export class RadioGroup<Value extends string> extends BoxRenderable {
  private readonly theme: Theme;
  private readonly choices: readonly [
    RadioChoice<Value>,
    ...RadioChoice<Value>[],
  ];
  private readonly rows: readonly TextRenderable[];
  private readonly onValueChange: ((value: Value) => void) | undefined;
  private readonly onActivate: ((value: Value) => void) | undefined;
  private selectedIndex: number;

  constructor(renderer: CliRenderer, options: RadioGroupOptions<Value>) {
    super(renderer, {
      id: options.id,
      flexDirection: "column",
      width: "100%",
      height: options.choices.length * 2,
      flexShrink: 0,
      focusable: true,
    });

    this.theme = options.theme;
    this.choices = options.choices;
    this.onValueChange = options.onValueChange;
    this.onActivate = options.onActivate;

    this.selectedIndex = Math.max(
      0,
      options.choices.findIndex((choice) => choice.value === options.value),
    );

    this.rows = options.choices.map((choice, index) => {
      const row = new TextRenderable(renderer, {
        id: `${options.id}-${choice.value}`,
        content: "",
        height: 2,
        flexShrink: 0,
        wrapMode: "none",
        truncate: true,
        onMouseDown: (event) => {
          if (event.button !== 0) return;

          this.focus();
          this.select(index);
        },
      });

      this.add(row);

      return row;
    });

    this.refresh();
  }

  /** The picked choice's value. */
  get value(): Value {
    return (this.choices[this.selectedIndex] ?? this.choices[0]).value;
  }

  /** Picks a choice without calling `onValueChange`. */
  set value(value: Value) {
    const index = this.choices.findIndex((choice) => choice.value === value);

    if (index >= 0) this.select(index, false);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    const count = this.choices.length;

    switch (key.name) {
      case "up":
      case "left":
        this.select((this.selectedIndex - 1 + count) % count);

        return true;
      case "down":
      case "right":
        this.select((this.selectedIndex + 1) % count);

        return true;
      case "return":
      case "space":
        this.onActivate?.(this.value);

        return true;
      default:
        return false;
    }
  }

  private select(index: number, emit = true): void {
    this.selectedIndex = index;
    this.refresh();

    if (emit) this.onValueChange?.(this.value);
  }

  private refresh(): void {
    for (const [index, row] of this.rows.entries()) {
      const choice = this.choices[index] ?? this.choices[0];
      const picked = index === this.selectedIndex;

      const color = picked
        ? (choice.color ?? this.theme.accent)
        : this.theme.fgMuted;

      const label = `${picked ? "●" : "○"} ${choice.label}`;
      const description = `  ${choice.description ?? ""}`;

      row.content = t`${picked ? bold(fg(color)(label)) : fg(color)(label)}\n${fg(this.theme.fgSubtle)(description)}`;
    }
  }
}
