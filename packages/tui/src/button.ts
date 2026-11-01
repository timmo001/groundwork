/**
 * The button: a one-row, focusable label that runs `onPress` on Enter, Space
 * or a click. Neutral, primary or destructive.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import type { Theme } from "./theme.ts";

export type ButtonVariant = "neutral" | "primary" | "destructive";

export interface ButtonOptions {
  readonly id: string;
  readonly theme: Theme;
  readonly label: string;
  /** Neutral by default */
  readonly variant?: ButtonVariant | undefined;
  readonly onPress: () => void;
}

const variantColor = (theme: Theme, variant: ButtonVariant): string => {
  switch (variant) {
    case "primary":
      return theme.accent;
    case "destructive":
      return theme.red;
    case "neutral":
      return theme.fg;
  }
};

/** A focusable one-row button. */
export class Button extends BoxRenderable {
  private readonly theme: Theme;
  private readonly color: string;
  private readonly text: TextRenderable;
  private readonly onPress: () => void;
  private label: string;

  constructor(renderer: CliRenderer, options: ButtonOptions) {
    super(renderer, {
      id: options.id,
      height: 1,
      flexShrink: 0,
      paddingLeft: 1,
      paddingRight: 1,
      focusable: true,
      backgroundColor: options.theme.bgInput,
      onMouseDown: (event) => {
        if (event.button !== 0) return;

        this.focus();
        this.onPress();
      },
    });

    this.theme = options.theme;
    this.color = variantColor(options.theme, options.variant ?? "neutral");
    this.onPress = options.onPress;
    this.label = options.label;

    this.text = new TextRenderable(renderer, {
      id: `${options.id}-label`,
      content: "",
      height: 1,
      wrapMode: "none",
    });

    this.add(this.text);
    this.refresh();
  }

  /** Changes the label. */
  setLabel(label: string): void {
    this.label = label;
    this.refresh();
  }

  override focus(): void {
    super.focus();
    this.refresh();
  }

  override blur(): void {
    super.blur();
    this.refresh();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name !== "return" && key.name !== "space") return false;

    this.onPress();

    return true;
  }

  private refresh(): void {
    this.backgroundColor = this.focused
      ? this.theme.bgSelected
      : this.theme.bgInput;

    this.text.content = this.focused
      ? t`${bold(fg(this.color)(this.label))}`
      : t`${fg(this.color)(this.label)}`;
  }
}
