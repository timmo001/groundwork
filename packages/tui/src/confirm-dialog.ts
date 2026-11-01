/**
 * The confirm dialog: a question with Cancel and Confirm buttons. Y or the
 * Confirm button confirms; Escape, a click outside or Cancel closes it.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import { Button } from "./button.ts";
import { Dialog } from "./dialog.ts";
import type { Theme } from "./theme.ts";

export interface ConfirmDialogOptions {
  readonly id: string;
  readonly theme: Theme;
  /** For a destructive action: the red border and Confirm button */
  readonly destructive?: boolean | undefined;
  /** "Confirm" by default */
  readonly confirmLabel?: string | undefined;
  readonly onConfirm: () => void;
  /** Runs when it closes without confirming */
  readonly onCancel?: (() => void) | undefined;
}

/** A yes or no question in a dialog. */
export class ConfirmDialog {
  private readonly renderer: CliRenderer;
  private readonly dialog: Dialog;
  private readonly theme: Theme;
  private readonly message: TextRenderable;
  private readonly onConfirm: () => void;

  constructor(renderer: CliRenderer, options: ConfirmDialogOptions) {
    this.renderer = renderer;
    this.theme = options.theme;
    this.onConfirm = options.onConfirm;

    this.dialog = new Dialog(renderer, {
      id: options.id,
      theme: options.theme,
      title: "",
      color: options.destructive === true ? options.theme.red : undefined,
      height: 8,
      help: [
        { key: "y", action: "confirm" },
        { key: "Tab", action: "move" },
        { key: "Esc", action: "cancel" },
      ],
      onClose: options.onCancel,
    });

    this.message = new TextRenderable(renderer, {
      id: `${options.id}-message`,
      content: "",
      flexGrow: 1,
    });

    const buttons = new BoxRenderable(renderer, {
      id: `${options.id}-buttons`,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 2,
      flexShrink: 0,
    });

    const cancel = new Button(renderer, {
      id: `${options.id}-cancel`,
      theme: options.theme,
      label: "Cancel",
      onPress: () => this.dialog.close(),
    });

    const confirm = new Button(renderer, {
      id: `${options.id}-confirm`,
      theme: options.theme,
      label: options.confirmLabel ?? "Confirm",
      variant: options.destructive === true ? "destructive" : "primary",
      onPress: () => this.confirm(),
    });

    buttons.add(cancel);
    buttons.add(confirm);
    this.dialog.body.add(this.message);
    this.dialog.body.add(buttons);
    this.dialog.setFocusables([cancel, confirm]);

    renderer.keyInput.prependListener("keypress", this.onKey);
  }

  /** Whether it's open. */
  get visible(): boolean {
    return this.dialog.visible;
  }

  /** Asks the question; Cancel has focus, so Enter alone never confirms. */
  show(title: string, message: string): void {
    this.dialog.setTitle(title);
    this.message.content = t`${fg(this.theme.fg)(message)}`;
    this.dialog.show();
  }

  /** Removes the dialog. */
  destroy(): void {
    this.renderer.keyInput.off("keypress", this.onKey);
    this.dialog.destroy();
  }

  private confirm(): void {
    this.dialog.hide();
    this.onConfirm();
  }

  private readonly onKey = (key: KeyEvent): void => {
    if (!this.dialog.visible || key.name !== "y" || key.ctrl || key.meta)
      return;

    key.preventDefault();
    key.stopPropagation();
    this.confirm();
  };
}
