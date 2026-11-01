/**
 * The choice dialog: a list of choices, each with a description, such as the
 * ways to run an action. Up and Down move, Enter picks; Escape or a click
 * outside closes it.
 *
 * @module
 */
import { SelectRenderable, SelectRenderableEvents } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import { Dialog } from "./dialog.ts";
import type { Theme } from "./theme.ts";

export interface Choice<Value> {
  readonly label: string;
  readonly description?: string | undefined;
  readonly value: Value;
}

export interface ChoiceDialogOptions<Value> {
  readonly id: string;
  readonly theme: Theme;
  /** 50 by default */
  readonly width?: number | undefined;
  readonly onChoose: (value: Value) => void;
  /** Runs when it closes without a choice */
  readonly onCancel?: (() => void) | undefined;
}

/** Picks one of a list of choices in a dialog. */
export class ChoiceDialog<Value> {
  private readonly dialog: Dialog;
  private readonly select: SelectRenderable;
  private readonly onChoose: (value: Value) => void;
  private choices: readonly Choice<Value>[] = [];

  constructor(renderer: CliRenderer, options: ChoiceDialogOptions<Value>) {
    const { theme } = options;

    this.onChoose = options.onChoose;

    this.dialog = new Dialog(renderer, {
      id: options.id,
      theme,
      title: "",
      width: options.width ?? 50,
      help: [
        { key: "↑↓", action: "move" },
        { key: "Enter", action: "choose" },
        { key: "Esc", action: "cancel" },
      ],
      onClose: options.onCancel,
    });

    this.select = new SelectRenderable(renderer, {
      id: `${options.id}-select`,
      options: [],
      wrapSelection: true,
      showDescription: true,
      showScrollIndicator: true,
      width: "100%",
      flexGrow: 1,
      backgroundColor: theme.bgElevated,
      textColor: theme.fg,
      descriptionColor: theme.fgMuted,
      selectedBackgroundColor: theme.accent,
      selectedTextColor: theme.accentFg,
      selectedDescriptionColor: theme.accentFg,
      focusedBackgroundColor: theme.bgElevated,
      focusedTextColor: theme.fg,
    });

    this.select.on(SelectRenderableEvents.ITEM_SELECTED, () => {
      const choice = this.choices[this.select.getSelectedIndex()];

      if (choice === undefined) return;

      this.dialog.hide();
      this.onChoose(choice.value);
    });

    this.dialog.body.add(this.select);
    this.dialog.setFocusables([this.select]);
  }

  /** Whether it's open. */
  get visible(): boolean {
    return this.dialog.visible;
  }

  /** Opens it with these choices, the first picked. */
  show(title: string, choices: readonly Choice<Value>[]): void {
    this.choices = choices;
    this.dialog.setTitle(title);

    this.select.options = choices.map((choice) => ({
      name: choice.label,
      description: choice.description ?? "",
    }));

    this.select.selectedIndex = 0;
    this.dialog.setHeight(choices.length * 2 + 6);
    this.dialog.show();
  }

  /** Removes the dialog. */
  destroy(): void {
    this.dialog.destroy();
  }
}
