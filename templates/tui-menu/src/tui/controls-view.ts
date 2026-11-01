/**
 * The controls view: each Groundwork control in a small form, with Tab and
 * Shift+Tab moving focus between them and a status line showing what they
 * report.
 *
 * @module
 */
import { BoxRenderable, TextRenderable, fg, t } from "@opentui/core";
import type { CliRenderer, KeyEvent, Renderable } from "@opentui/core";
import {
  Button,
  Collapsible,
  ConfirmDialog,
  GLOBAL_HELP,
  HeaderBlock,
  Input,
  RadioGroup,
  formatHelpBar,
  type HelpEntry,
  type Theme,
} from "@timmo001/groundwork-tui";

const HELP: readonly HelpEntry[] = [
  { key: "Tab", action: "next" },
  { key: "Shift+Tab", action: "previous" },
  { key: "Enter", action: "press" },
  { key: "Esc", action: "back" },
  ...GLOBAL_HELP,
];

export interface ControlsViewOptions {
  readonly title: string;
  readonly onBack: () => void;
}

/** A form with one of each control. */
export class ControlsView {
  private readonly theme: Theme;
  private readonly root: BoxRenderable;
  private readonly status: TextRenderable;
  private readonly controls: readonly Renderable[];
  private readonly onBack: () => void;
  private focusIndex = 0;

  constructor(
    renderer: CliRenderer,
    theme: Theme,
    options: ControlsViewOptions,
  ) {
    this.theme = theme;
    this.onBack = options.onBack;

    this.root = new BoxRenderable(renderer, {
      id: "controls-root",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: 1,
    });

    new HeaderBlock(renderer, theme, this.root, {
      id: "controls-header",
      name: options.title,
      titleParts: [options.title, "Controls"],
      status: { tone: "ok", label: "Ready" },
    });

    const form = new BoxRenderable(renderer, {
      id: "controls-form",
      flexDirection: "column",
      flexGrow: 1,
      gap: 1,
    });

    const name = new Input(renderer, {
      id: "controls-name",
      theme,
      placeholder: "Your name",
      onSubmit: () => this.report(`Submitted "${name.value}"`),
    });

    const mode = new RadioGroup(renderer, {
      id: "controls-mode",
      theme,
      value: "dark",
      choices: [
        { value: "light", label: "Light", description: "Bright surfaces" },
        { value: "dark", label: "Dark", description: "Dim surfaces" },
        { value: "darker", label: "Darker", description: "Near black" },
      ],
      onValueChange: (value) => this.report(`Mode: ${value}`),
    });

    const details = new Collapsible(renderer, {
      id: "controls-details",
      theme,
      label: "Details",
      open: false,
      onOpenChange: (open) => this.report(open ? "Opened" : "Closed"),
    });

    details.panel.add(
      new TextRenderable(renderer, {
        id: "controls-details-text",
        content: t`${fg(theme.fgMuted)("Shown while the collapsible is open.")}`,
      }),
    );

    const buttons = new BoxRenderable(renderer, {
      id: "controls-buttons",
      flexDirection: "row",
      gap: 2,
      flexShrink: 0,
    });

    const save = new Button(renderer, {
      id: "controls-save",
      theme,
      label: "Save",
      variant: "primary",
      onPress: () => this.report(`Saved ${mode.value}`),
    });

    const confirmReset = new ConfirmDialog(renderer, {
      id: "controls-confirm-reset",
      theme,
      destructive: true,
      confirmLabel: "Reset",
      onConfirm: () => {
        name.value = "";
        mode.value = "dark";
        this.report("Reset");
      },
      onCancel: () => this.report("Kept"),
    });

    const reset = new Button(renderer, {
      id: "controls-reset",
      theme,
      label: "Reset",
      variant: "destructive",
      onPress: () =>
        confirmReset.show("Reset the form?", "This clears the name and mode."),
    });

    buttons.add(save);
    buttons.add(reset);

    form.add(name);
    form.add(mode);
    form.add(details);
    form.add(buttons);
    this.root.add(form);

    this.status = new TextRenderable(renderer, {
      id: "controls-status",
      content: "",
      height: 1,
      flexShrink: 0,
    });

    this.root.add(this.status);

    this.root.add(
      new TextRenderable(renderer, {
        id: "controls-help",
        content: formatHelpBar(theme, HELP),
        marginTop: 1,
      }),
    );

    this.controls = [name, mode, details, save, reset];

    renderer.keyInput.on("keypress", (key) => this.handleKey(key));
    renderer.root.add(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  /** Focuses the first control and clears the status line. */
  resetAndFocus(): void {
    this.focusIndex = 0;
    this.report("");
    this.focus();
  }

  focus(): void {
    this.controls[this.focusIndex]?.focus();
  }

  blur(): void {
    for (const control of this.controls) control.blur();
  }

  private handleKey(key: KeyEvent): void {
    if (!this.root.visible) return;

    if (key.name === "escape") {
      this.blur();
      this.onBack();

      return;
    }

    if (key.name !== "tab") return;

    key.preventDefault();

    const count = this.controls.length;

    this.controls[this.focusIndex]?.blur();
    this.focusIndex = (this.focusIndex + (key.shift ? count - 1 : 1)) % count;
    this.focus();
  }

  private report(message: string): void {
    this.status.content = t`${fg(this.theme.fgMuted)(message)}`;
  }
}
