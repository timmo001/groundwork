/**
 * The collapsible: a one-row trigger with a ▸ or ▾ marker over a panel that
 * shows only while open. Enter, Space or a click on the trigger toggles it.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface CollapsibleOptions {
  readonly id: string;
  readonly theme: Theme;
  readonly label: string;
  readonly open: boolean;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

/** A focusable trigger over a panel; add the panel's content to `panel`. */
export class Collapsible extends BoxRenderable {
  /** Holds the content shown while open */
  readonly panel: BoxRenderable;
  private readonly theme: Theme;
  private readonly trigger: TextRenderable;
  private readonly onOpenChange: ((open: boolean) => void) | undefined;
  private label: string;
  private isOpen: boolean;

  constructor(renderer: CliRenderer, options: CollapsibleOptions) {
    super(renderer, {
      id: options.id,
      flexDirection: "column",
      width: "100%",
      flexShrink: 0,
      focusable: true,
    });

    this.theme = options.theme;
    this.onOpenChange = options.onOpenChange;
    this.label = options.label;
    this.isOpen = options.open;

    this.trigger = new TextRenderable(renderer, {
      id: `${options.id}-trigger`,
      content: "",
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
      onMouseDown: (event) => {
        if (event.button !== 0) return;

        this.focus();
        this.toggle();
      },
    });

    this.panel = new BoxRenderable(renderer, {
      id: `${options.id}-panel`,
      flexDirection: "column",
      width: "100%",
      flexShrink: 0,
      paddingLeft: 2,
    });

    this.add(this.trigger);
    this.add(this.panel);
    this.refresh();
  }

  /** Whether the panel shows. */
  get open(): boolean {
    return this.isOpen;
  }

  /** Opens or closes the panel without calling `onOpenChange`. */
  set open(open: boolean) {
    this.isOpen = open;
    this.refresh();
  }

  /** Changes the trigger's label. */
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

    this.toggle();

    return true;
  }

  private toggle(): void {
    this.open = !this.isOpen;
    this.onOpenChange?.(this.isOpen);
  }

  private refresh(): void {
    const color = this.focused ? this.theme.accent : this.theme.fgMuted;

    this.trigger.content = t`${fg(color)(`${this.isOpen ? "▾" : "▸"} ${this.label}`)}`;
    this.panel.visible = this.isOpen;
  }
}
