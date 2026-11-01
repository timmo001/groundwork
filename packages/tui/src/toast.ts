/**
 * The toast: one short message in the top-right corner that closes itself.
 * Showing another with the same id replaces it in place, and a new id
 * replaces the old toast, so toasts never stack. Use one only when nothing
 * on screen can show the result, such as a command run in the background.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, bold, fg, t } from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import type { Theme } from "./theme.ts";

export type ToastVariant = "info" | "success" | "error";

const DISMISS_MS: Readonly<Record<ToastVariant, number>> = {
  info: 5000,
  success: 3000,
  error: 8000,
};

const ICON: Readonly<Record<ToastVariant, string>> = {
  info: "󰋼",
  success: "󰄬",
  error: "󰅚",
};

const variantColor = (theme: Theme, variant: ToastVariant): string => {
  switch (variant) {
    case "info":
      return theme.accent;
    case "success":
      return theme.green;
    case "error":
      return theme.red;
  }
};

/** A single-slot toast. */
export class Toast {
  private readonly theme: Theme;
  private readonly root: BoxRenderable;
  private readonly text: TextRenderable;
  private currentId: string | undefined;
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(renderer: CliRenderer, theme: Theme, id = "toast") {
    this.theme = theme;

    this.root = new BoxRenderable(renderer, {
      id,
      position: "absolute",
      top: 1,
      right: 2,
      width: 50,
      height: 3,
      borderStyle: "rounded",
      borderColor: theme.accent,
      backgroundColor: theme.bgElevated,
      paddingLeft: 1,
      paddingRight: 1,
      alignItems: "center",
      zIndex: 200,
      visible: false,
    });

    this.text = new TextRenderable(renderer, {
      id: `${id}-text`,
      content: "",
      wrapMode: "none",
      truncate: true,
    });

    this.root.add(this.text);
    renderer.root.add(this.root);
  }

  /** The id of the toast showing, if any. */
  get id(): string | undefined {
    return this.currentId;
  }

  /** Shows a message, replacing whatever toast is showing. */
  show(id: string, message: string, variant: ToastVariant): void {
    clearTimeout(this.timeout);

    const color = variantColor(this.theme, variant);

    this.currentId = id;
    this.root.borderColor = color;
    this.text.content = t`${fg(color)(ICON[variant])}  ${bold(fg(this.theme.fg)(message))}`;
    this.root.visible = true;
    this.timeout = setTimeout(() => this.dismiss(), DISMISS_MS[variant]);
  }

  /** Hides the toast. */
  dismiss(): void {
    clearTimeout(this.timeout);
    this.timeout = undefined;
    this.currentId = undefined;
    this.root.visible = false;
  }
}
