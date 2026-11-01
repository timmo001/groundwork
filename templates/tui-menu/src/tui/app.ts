/**
 * The app shell: the view stack, global keys and action dispatch.
 *
 * @module
 */
import type { CliRenderer } from "@opentui/core";
import type { ViewId, MenuItem, MenuAction } from "../types.js";
import {
  ChoiceDialog,
  themeOptions,
  type Theme,
  type ThemeOption,
  type ThemePick,
} from "@timmo001/groundwork-tui";
import { Effect } from "effect";
import { menuItemsById, registerUpdates } from "../menu.js";
import type { CommandRunnerService } from "../services/command-runner.js";
import type { ItemsRunnerService } from "../services/items.js";
import { ControlsView } from "./controls-view.js";
import { GridView } from "./grid-view.js";
import { MainMenu } from "./main-menu.js";
import { SubmenuView } from "./submenu-view.js";

const log = (msg: string) => console.error(`[tui-menu:App] ${msg}`);

/** Set the terminal tab/window title via an OSC escape sequence */
const setTerminalTitle = (title: string): void => {
  process.stdout.write(`\x1b]0;${title}\x07`);
};

export interface AppOptions {
  /** Which view to start on (default: "main") */
  readonly initialView?: ViewId | undefined;
  /** If set, execute this menu item immediately on startup and pre-select it */
  readonly executeItemId?: string | undefined;
  /** Title displayed at the top of the main menu */
  readonly title?: string | undefined;
  /** Subtitle displayed after the title in muted text */
  readonly subtitle?: string | undefined;
}

/** Dependencies injected into the App at construction time */
export interface AppDeps {
  /** The OpenTUI CLI renderer instance */
  readonly renderer: CliRenderer;
  /** Active color theme */
  readonly theme: Theme;
  /** Service for running shell commands with suspend/resume */
  readonly commandRunner: CommandRunnerService;
  /** Service for the demo's `Items` operations */
  readonly itemsRunner: ItemsRunnerService;
  /** The theme and mode in use, as picked */
  readonly themePick: ThemePick;
  /** Called with a new theme and mode from the picker */
  readonly onThemePick: (pick: ThemePick) => void;
}

const modeNames = new Map([
  ["light", "Light"],
  ["dark", "Dark"],
  ["darker", "Darker"],
]);

/** Top-level TUI application shell managing a view stack and global keyboard */
export class App {
  private renderer: CliRenderer;
  private commandRunner: CommandRunnerService;
  private itemsRunner: ItemsRunnerService;
  private mainMenu: MainMenu;
  private submenuView: SubmenuView;
  private controlsView: ControlsView;
  private gridView: GridView;
  private variants: ChoiceDialog<MenuAction>;
  private themeDialog: ChoiceDialog<ThemeOption>;
  private modeDialog: ChoiceDialog<ThemePick>;
  private themePick: ThemePick;
  private onThemePick: (pick: ThemePick) => void;
  private activeView: ViewId = "main";
  private viewStack: ViewId[] = [];
  private appTitle: string;

  constructor(deps: AppDeps, options: AppOptions = {}) {
    this.renderer = deps.renderer;
    this.commandRunner = deps.commandRunner;
    this.itemsRunner = deps.itemsRunner;
    this.themePick = deps.themePick;
    this.onThemePick = deps.onThemePick;
    this.appTitle = options.title ?? "TUI menu";

    // --- Create views ---

    this.mainMenu = new MainMenu(deps.renderer, deps.theme, {
      onSelect: (item) => this.handleMenuAction(item),
      initialSelectedId: options.executeItemId,
      title: options.title,
      subtitle: options.subtitle,
    });

    this.submenuView = new SubmenuView(deps.renderer, deps.theme, {
      onAction: (item) => this.handleMenuAction(item),
      onBack: () => this.popView(),
      rootTitle: options.title ?? "Menu",
      onTitleChange: (parts) => {
        const suffix = parts.slice(1).join(" \u203A ");
        setTerminalTitle(`${this.appTitle} \u203A ${suffix}`);
      },
    });

    this.controlsView = new ControlsView(deps.renderer, deps.theme, {
      title: this.appTitle,
      onBack: () => this.popView(),
    });

    this.gridView = new GridView(deps.renderer, deps.theme, {
      title: this.appTitle,
      list: () => this.itemsRunner.list(),
      onApply: (id) =>
        this.itemsRunner.apply(id).then(() => this.refreshUpdates()),
      onBack: () => this.popView(),
    });

    this.variants = new ChoiceDialog<MenuAction>(deps.renderer, {
      id: "variants",
      theme: deps.theme,
      onChoose: (action) => this.dispatchAction(action),
    });

    // The theme picker: a theme, then its mode when it has more than one
    this.modeDialog = new ChoiceDialog<ThemePick>(deps.renderer, {
      id: "theme-mode",
      theme: deps.theme,
      width: 40,
      onChoose: (pick) => this.onThemePick(pick),
    });

    this.themeDialog = new ChoiceDialog<ThemeOption>(deps.renderer, {
      id: "theme",
      theme: deps.theme,
      onChoose: (option) => this.pickMode(option),
    });

    // --- Hide all views initially ---
    this.mainMenu.setVisible(false);
    this.submenuView.setVisible(false);
    this.controlsView.setVisible(false);
    this.gridView.setVisible(false);

    // --- Determine initial view ---
    const startView = options.initialView ?? "main";

    // Ensure back navigation works when starting on a non-main view
    if (startView !== "main") {
      this.viewStack.push("main");
    }

    // If an item should be executed immediately (subcommand mode):
    // always suspend, run with visible output, wait for keypress, then exit.
    if (options.executeItemId) {
      const item = menuItemsById.get(options.executeItemId);

      if (item) {
        this.showView("main");
        const { action } = item;

        if (
          action.type === "command" ||
          action.type === "silent" ||
          action.type === "notify"
        ) {
          setTimeout(() => {
            this.commandRunner
              .runSuspended(action.cmd, true)
              .then(() => deps.renderer.destroy())
              .catch((err) => {
                log(`Execute error: ${err}`);
                deps.renderer.destroy();
              });
          }, 50);
        } else {
          setTimeout(() => this.handleMenuAction(item), 50);
        }

        return;
      }
    }

    this.showView(startView);
  }

  /** Navigate to a view, pushing the current one onto the stack */
  pushView(viewId: ViewId): void {
    if (this.activeView !== viewId) {
      this.viewStack.push(this.activeView);
    }

    this.showView(viewId);
  }

  /** Return to the previous view on the stack */
  popView(): void {
    const prev = this.viewStack.pop();

    if (prev) {
      this.showView(prev);
    }
    // If stack is empty we're at main: stay there
  }

  private showView(viewId: ViewId): void {
    log(`Switching to view: ${viewId}`);

    // Hide all
    this.mainMenu.setVisible(false);
    this.submenuView.setVisible(false);
    this.controlsView.setVisible(false);
    this.gridView.setVisible(false);

    this.activeView = viewId;

    // Show the target and reset filter state (fresh view entry)
    switch (viewId) {
      case "main":
        setTerminalTitle(this.appTitle);
        this.mainMenu.setVisible(true);
        this.mainMenu.resetAndFocus();
        break;
      case "submenu":
        this.submenuView.setVisible(true);
        this.submenuView.resetAndFocus();
        // SubmenuView updates the terminal title itself via onTitleChange
        break;
      case "controls":
        setTerminalTitle(`${this.appTitle} \u203A Controls`);
        this.controlsView.setVisible(true);
        this.controlsView.resetAndFocus();
        break;
      case "grid":
        setTerminalTitle(`${this.appTitle} \u203A Grid`);
        this.gridView.setVisible(true);
        void this.gridView.resetAndFocus();
        break;
    }
  }

  private handleMenuAction(item: MenuItem): void {
    // If the item has variants, ask which one instead of dispatching directly
    if (item.variants && item.variants.length > 0) {
      log(`Opening variants for item ${item.id}`);
      this.variants.show(
        item.title,
        item.variants.map((variant) => ({
          label: variant.label,
          description: variant.description,
          value: variant.action,
        })),
      );

      return;
    }

    this.dispatchAction(item.action);
  }

  /** Dispatch a menu action (command, silent, notify, view, or submenu) */
  private dispatchAction(action: MenuAction): void {
    log(`Dispatching action: ${action.type}`);

    switch (action.type) {
      case "command":
        this.commandRunner
          .runSuspended(action.cmd, action.wait)
          .catch((err) => {
            log(`Command error: ${err}`);
          });
        break;

      case "silent":
        this.commandRunner.runSilent(action.cmd).catch((err) => {
          log(`Silent command error: ${err}`);
        });
        break;

      case "notify":
        this.commandRunner.runNotify(action.cmd, action.notify).catch((err) => {
          log(`Notify command error: ${err}`);
        });
        break;

      case "view":
        this.pushView(action.viewId);
        break;

      case "submenu": {
        if (this.activeView === "submenu") {
          // Already in submenu view: navigate deeper
          this.submenuView.pushSubmenu(action.menuId);
        } else {
          // Open the submenu view at the target menu
          this.submenuView.openSubmenu(action.menuId);
          this.pushView("submenu");
        }

        break;
      }

      case "quit":
        this.renderer.destroy();
        break;

      case "apply":
        void this.itemsRunner
          .apply(action.itemId)
          .then(() => this.refreshUpdates());
        break;

      case "restart":
        void this.itemsRunner.restart();
        break;

      case "theme":
        void this.pickTheme();
        break;
    }
  }

  /** Opens the theme picker, the theme in use first. */
  private async pickTheme(): Promise<void> {
    const options = await Effect.runPromise(themeOptions);
    const current = this.themePick.theme ?? options[0]?.id;

    const ordered = [
      ...options.filter((option) => option.id === current),
      ...options.filter((option) => option.id !== current),
    ];

    this.themeDialog.show(
      "Theme",
      ordered.map((option) => ({
        label: option.name,
        description:
          option.id === current
            ? "In use"
            : option.id === "omarchy"
              ? "The desktop's theme"
              : undefined,
        value: option,
      })),
    );
  }

  /** Asks for the mode, unless the theme only has one. */
  private pickMode(option: ThemeOption): void {
    const [only, ...others] = option.modes;

    if (only === undefined || others.length === 0) {
      this.onThemePick({ theme: option.id, mode: only });

      return;
    }

    this.modeDialog.show(
      option.name,
      option.modes.map((mode) => ({
        label: modeNames.get(mode) ?? mode,
        description:
          option.id === this.themePick.theme && mode === this.themePick.mode
            ? "In use"
            : undefined,
        value: { theme: option.id, mode },
      })),
    );
  }

  /** Rebuild the Updates submenu from the latest list */
  private async refreshUpdates(): Promise<void> {
    registerUpdates(await this.itemsRunner.list());

    if (this.activeView === "submenu") this.submenuView.refresh();
  }

  /** Restore keyboard focus to the currently active view */
  private focusActiveView(): void {
    switch (this.activeView) {
      case "main":
        this.mainMenu.focus();
        break;
      case "submenu":
        this.submenuView.focus();
        break;
      case "controls":
        this.controlsView.focus();
        break;
      case "grid":
        this.gridView.focus();
        break;
    }
  }

  /** Remove keyboard focus from the currently active view */
  private blurActiveView(): void {
    switch (this.activeView) {
      case "main":
        this.mainMenu.blur();
        break;
      case "submenu":
        this.submenuView.blur();
        break;
      case "controls":
        this.controlsView.blur();
        break;
      case "grid":
        this.gridView.blur();
        break;
    }
  }
}
