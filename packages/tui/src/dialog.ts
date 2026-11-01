/**
 * The dialog: a centered, bordered panel over the current view, with a
 * title, an optional description, a body and a key hint line. Only one is
 * open at a time: opening another closes the first. Escape or a click outside
 * closes it, and `onClose` runs once per close.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent, Renderable } from "@opentui/core";
import { formatHelpBar } from "./help-bar.ts";
import type { HelpEntry } from "./help-bar.ts";
import type { Theme } from "./theme.ts";

export interface DialogOptions {
  readonly id: string;
  readonly theme: Theme;
  readonly title: string;
  readonly description?: string | undefined;
  /** The border and title color; the accent by default */
  readonly color?: string | undefined;
  /** 58 by default, and never wider than the terminal */
  readonly width?: number | undefined;
  /** 14 by default, and never taller than the terminal */
  readonly height?: number | undefined;
  /** The key hints along the bottom; Escape to close by default */
  readonly help?: readonly HelpEntry[] | undefined;
  /** Runs once each time the dialog closes, however it closed */
  readonly onClose?: (() => void) | undefined;
}

const CLOSE_HELP: readonly HelpEntry[] = [{ key: "Esc", action: "close" }];

/** One dialog at a time; add its content to `body`. */
export class Dialog {
  private static open: Dialog | undefined;
  /** Holds the dialog's content */
  readonly body: BoxRenderable;
  private readonly renderer: CliRenderer;
  private readonly options: DialogOptions;
  private readonly overlay: BoxRenderable;
  private readonly panel: BoxRenderable;
  private readonly titleText: TextRenderable;
  private readonly helpText: TextRenderable;
  private focusables: readonly Renderable[] = [];
  private previousFocus: Renderable | undefined;
  private height: number;

  constructor(renderer: CliRenderer, options: DialogOptions) {
    this.renderer = renderer;
    this.options = options;
    this.height = options.height ?? 14;

    const color = options.color ?? options.theme.accent;

    this.overlay = new BoxRenderable(renderer, {
      id: options.id,
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: 160,
      visible: false,
      onMouseDown: (event) => {
        if (event.target === this.overlay) this.close();
      },
    });

    this.panel = new BoxRenderable(renderer, {
      id: `${options.id}-panel`,
      position: "absolute",
      flexDirection: "column",
      borderStyle: "rounded",
      borderColor: color,
      backgroundColor: options.theme.bgElevated,
      paddingLeft: 1,
      paddingRight: 1,
    });

    this.titleText = new TextRenderable(renderer, {
      id: `${options.id}-title`,
      content: t`${bold(fg(color)(options.title))}`,
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
    });

    this.panel.add(this.titleText);

    if (options.description !== undefined) {
      this.panel.add(
        new TextRenderable(renderer, {
          id: `${options.id}-description`,
          content: t`${fg(options.theme.fgMuted)(options.description)}`,
          flexShrink: 0,
        }),
      );
    }

    this.body = new BoxRenderable(renderer, {
      id: `${options.id}-body`,
      flexDirection: "column",
      width: "100%",
      flexGrow: 1,
      minHeight: 0,
      marginTop: 1,
    });

    this.helpText = new TextRenderable(renderer, {
      id: `${options.id}-help`,
      content: formatHelpBar(options.theme, options.help ?? CLOSE_HELP),
      height: 1,
      flexShrink: 0,
      wrapMode: "none",
      truncate: true,
    });

    this.panel.add(this.body);
    this.panel.add(this.helpText);
    this.overlay.add(this.panel);
    renderer.root.add(this.overlay);

    renderer.keyInput.prependListener("keypress", this.onKey);
    renderer.on("resize", this.onResize);
  }

  /** Whether this dialog is open. */
  get visible(): boolean {
    return this.overlay.visible;
  }

  /** Changes the title. */
  setTitle(title: string): void {
    const color = this.options.color ?? this.options.theme.accent;

    this.titleText.content = t`${bold(fg(color)(title))}`;
  }

  /** Changes the height, such as to fit a new list. */
  setHeight(height: number): void {
    this.height = height;

    if (this.visible) this.measure();
  }

  /**
   * Sets what Tab and Shift+Tab move between, in order. The first gets focus
   * when the dialog opens.
   */
  setFocusables(focusables: readonly Renderable[]): void {
    this.focusables = focusables;

    if (this.visible) this.focusables[0]?.focus();
  }

  /** Opens the dialog, closing any other that's open. */
  show(): void {
    if (this.visible) return;

    Dialog.open?.close();
    Dialog.open = this;

    this.previousFocus = this.renderer.currentFocusedRenderable ?? undefined;
    this.previousFocus?.blur();
    this.measure();
    this.overlay.visible = true;
    this.focusables[0]?.focus();
  }

  /** Closes the dialog, gives focus back and runs `onClose`. */
  close(): void {
    if (!this.visible) return;

    this.hide();
    this.options.onClose?.();
  }

  /** Closes the dialog without running `onClose`, such as after a choice. */
  hide(): void {
    if (!this.visible) return;

    this.overlay.visible = false;

    for (const focusable of this.focusables) focusable.blur();

    if (Dialog.open === this) Dialog.open = undefined;

    this.previousFocus?.focus();
    this.previousFocus = undefined;
  }

  /** Removes the dialog and stops listening for keys. */
  destroy(): void {
    this.hide();
    this.renderer.keyInput.off("keypress", this.onKey);
    this.renderer.off("resize", this.onResize);
    this.renderer.root.remove(this.overlay);
  }

  private readonly onKey = (key: KeyEvent): void => {
    if (!this.visible) return;

    if (key.name === "escape") {
      key.preventDefault();
      key.stopPropagation();
      this.close();

      return;
    }

    if (key.name !== "tab" || this.focusables.length === 0) return;

    key.preventDefault();
    key.stopPropagation();

    const count = this.focusables.length;
    const current = this.renderer.currentFocusedRenderable;

    const index = Math.max(
      0,
      this.focusables.findIndex((focusable) => focusable === current),
    );

    this.focusables[index]?.blur();
    this.focusables[(index + (key.shift ? count - 1 : 1)) % count]?.focus();
  };

  private readonly onResize = (): void => {
    if (this.visible) this.measure();
  };

  private measure(): void {
    const width = Math.max(
      1,
      Math.min(this.options.width ?? 58, this.renderer.width - 4),
    );

    const height = Math.max(1, Math.min(this.height, this.renderer.height - 2));

    this.panel.width = width;
    this.panel.height = height;
    this.panel.left = Math.max(
      0,
      Math.floor((this.renderer.width - width) / 2),
    );
    this.panel.top = Math.max(
      0,
      Math.floor((this.renderer.height - height) / 2),
    );
  }
}
