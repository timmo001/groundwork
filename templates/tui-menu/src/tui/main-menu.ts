/**
 * The main menu view: the title, filter bar, top-level items and help bar.
 *
 * @module
 */
import { type CliRenderer, BoxRenderable, TextRenderable } from "@opentui/core";
import type { MenuItem } from "../types.js";
import {
  formatFilterBar,
  formatHelpBar,
  GLOBAL_HELP,
  HeaderBlock,
  MenuList,
  type HelpEntry,
  type Theme,
} from "@timmo001/groundwork-tui";
import { mainMenuItems } from "../menu.js";

/** Help entries for the main menu */
const HELP: readonly HelpEntry[] = [
  { key: "↑↓", action: "navigate" },
  { key: "Enter", action: "select" },
  { key: "type", action: "filter" },
  ...GLOBAL_HELP,
];

/** Configuration callbacks for the main menu */
export interface MainMenuOptions {
  /** Called when the user selects a menu item */
  readonly onSelect: (item: MenuItem) => void;
  /** If set, pre-select the item with this ID on startup */
  readonly initialSelectedId?: string | undefined;
  /** Title displayed at the top of the menu */
  readonly title?: string | undefined;
  /** Subtitle displayed after the title in muted text */
  readonly subtitle?: string | undefined;
}

/** Top-level menu rendered as a {@link MenuList} with type-to-filter */
export class MainMenu {
  private theme: Theme;
  private root: BoxRenderable;
  private menuList: MenuList<MenuItem>;
  private filterBar: TextRenderable;
  private helpBar: TextRenderable;
  private callbacks: MainMenuOptions;

  constructor(renderer: CliRenderer, theme: Theme, options: MainMenuOptions) {
    this.theme = theme;
    this.callbacks = options;

    this.root = new BoxRenderable(renderer, {
      id: "main-menu-root",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: 1,
    });

    // The name as ASCII art when there's room, then the header bar
    const title = options.title ?? "Menu";

    new HeaderBlock(renderer, theme, this.root, {
      id: "main-menu-header",
      name: title,
      titleParts: [title],
      status: {
        tone: "ok",
        label: "Ready",
        details: options.subtitle === undefined ? [] : [options.subtitle],
      },
    });

    // Always shown, even empty, so the list doesn't jump as a filter starts
    this.filterBar = new TextRenderable(renderer, {
      id: "main-menu-filter",
      content: formatFilterBar(theme, ""),
      marginBottom: 1,
    });
    this.root.add(this.filterBar);

    const initialIdx = options.initialSelectedId
      ? Math.max(
          0,
          mainMenuItems.findIndex((m) => m.id === options.initialSelectedId),
        )
      : 0;

    // No onBack, and Esc does nothing: the main menu has nowhere to go back
    // to, and Ctrl+C quits
    this.menuList = new MenuList(renderer, {
      id: "main-menu-list",
      items: mainMenuItems,
      theme,
      onSelect: (item) => {
        this.callbacks.onSelect(item);
      },
      onFilterChange: (filter) => {
        this.filterBar.content = formatFilterBar(this.theme, filter);
      },
      onEscape: () => {},
      initialSelectedIndex: initialIdx,
      wrapSelection: true,
    });
    this.root.add(this.menuList);

    this.helpBar = new TextRenderable(renderer, {
      id: "main-menu-help",
      content: formatHelpBar(theme, HELP),
      marginTop: 1,
    });
    this.root.add(this.helpBar);

    renderer.root.add(this.root);

    renderer.on("resize", () => {
      this.helpBar.content = formatHelpBar(this.theme, HELP);
    });
  }

  /** Show or hide the main menu view */
  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  /** Reset filter state and give keyboard focus to the menu list */
  resetAndFocus(): void {
    this.menuList.resetFilter();
    this.menuList.focus();
  }
}
