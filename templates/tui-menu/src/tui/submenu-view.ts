/**
 * The submenu view: a nested menu with its breadcrumb trail and back
 * navigation.
 *
 * @module
 */
import {
  type CliRenderer,
  BoxRenderable,
  TextRenderable,
  t,
} from "@opentui/core";
import type { MenuItem } from "../types.js";
import {
  formatBreadcrumb,
  formatFilterBar,
  formatHelpBar,
  GLOBAL_HELP,
  MenuList,
  type HelpEntry,
  type Theme,
} from "@timmo001/groundwork-tui";
import { submenus, submenuTitles } from "../menu.js";

/** Help entries for submenu views */
const HELP: readonly HelpEntry[] = [
  { key: "↑↓", action: "navigate" },
  { key: "Enter", action: "select" },
  { key: "type", action: "filter" },
  { key: "Esc", action: "back" },
  { key: "Backspace", action: "back" },
  ...GLOBAL_HELP,
];

/** Configuration callbacks for the submenu view */
export interface SubmenuViewOptions {
  /** Called when the user selects a non-submenu action item */
  readonly onAction: (item: MenuItem) => void;
  /** Called when the user navigates back from the root submenu level */
  readonly onBack: () => void;
  /** Root title for the breadcrumb trail (e.g. the app name) */
  readonly rootTitle?: string;
  /** Called when the submenu changes so the terminal title can be updated */
  readonly onTitleChange?: (titleParts: readonly string[]) => void;
}

/**
 * Generic submenu view with breadcrumb navigation, nested levels, and type-to-filter.
 *
 * Supports arbitrarily deep submenu nesting by looking up menu IDs in the
 * global {@link submenus} registry. Escape/Backspace with an empty filter
 * pops up one level; at the root it calls `onBack`.
 */
export class SubmenuView {
  private renderer: CliRenderer;
  private theme: Theme;
  private callbacks: SubmenuViewOptions;

  private root: BoxRenderable;
  private titleText: TextRenderable;
  private filterBar: TextRenderable;
  private menuList: MenuList<MenuItem>;
  private helpBar: TextRenderable;

  /** Stack of submenu IDs for nested navigation */
  private menuStack: string[] = [];
  private currentMenuId = "";
  private rootTitle: string;

  constructor(
    renderer: CliRenderer,
    theme: Theme,
    options: SubmenuViewOptions,
  ) {
    this.renderer = renderer;
    this.theme = theme;
    this.callbacks = options;
    this.rootTitle = options.rootTitle ?? "Menu";

    this.root = new BoxRenderable(renderer, {
      id: "submenu-root",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: 1,
    });

    this.titleText = new TextRenderable(renderer, {
      id: "submenu-title",
      content: t``,
      marginBottom: 1,
    });
    this.root.add(this.titleText);

    // Always shown, even empty, so the list doesn't jump as a filter starts
    this.filterBar = new TextRenderable(renderer, {
      id: "submenu-filter",
      content: formatFilterBar(theme, ""),
      marginBottom: 1,
    });
    this.root.add(this.filterBar);

    // Replaced with a new list each time a menu loads
    this.menuList = this.createMenuList([]);
    this.root.add(this.menuList);

    this.helpBar = new TextRenderable(renderer, {
      id: "submenu-help",
      content: formatHelpBar(theme, HELP),
      marginTop: 1,
    });
    this.root.add(this.helpBar);

    renderer.root.add(this.root);

    renderer.on("resize", () => {
      this.helpBar.content = formatHelpBar(this.theme, HELP);
    });
  }

  /** Open a submenu as the root level (resets the navigation stack) */
  openSubmenu(menuId: string): void {
    this.menuStack = [];
    this.loadMenu(menuId);
  }

  /** Navigate into a nested submenu, pushing the current level onto the stack */
  pushSubmenu(menuId: string): void {
    this.menuStack.push(this.currentMenuId);
    this.loadMenu(menuId);
  }

  /** Show or hide the submenu view */
  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  /** Reload the current menu's items in place, keeping the selected row */
  refresh(): void {
    const items = submenus.get(this.currentMenuId);

    if (!items) return;

    const selectedId = this.menuList.getSelectedItem()?.id;

    this.menuList.setItems(items);
    this.menuList.setSelectedIndex(
      items.findIndex((entry) => entry.id === selectedId),
    );
  }

  /** Reset filter state and give keyboard focus to the menu list */
  resetAndFocus(): void {
    this.menuList.resetFilter();
    this.menuList.focus();
  }

  private handleBack(): void {
    const prev = this.menuStack.pop();

    if (prev) {
      this.loadMenu(prev);
    } else {
      this.callbacks.onBack();
    }
  }

  private loadMenu(menuId: string): void {
    const items = submenus.get(menuId);

    if (!items) return;

    this.currentMenuId = menuId;
    this.titleText.content = this.formatTitle();
    this.callbacks.onTitleChange?.(this.getTitleParts());
    this.filterBar.content = formatFilterBar(this.theme, "");

    this.root.remove(this.menuList);
    this.menuList = this.createMenuList(items);
    this.root.insertBefore(this.menuList, this.helpBar);
    this.menuList.focus();
  }

  private createMenuList(items: readonly MenuItem[]): MenuList<MenuItem> {
    return new MenuList(this.renderer, {
      id: "submenu-list",
      items,
      theme: this.theme,
      onSelect: (item) => {
        if (
          item.action.type === "submenu" &&
          submenus.has(item.action.menuId)
        ) {
          this.pushSubmenu(item.action.menuId);
        } else {
          this.callbacks.onAction(item);
        }
      },
      onFilterChange: (filter) => {
        this.filterBar.content = formatFilterBar(this.theme, filter);
      },
      onEscape: () => this.handleBack(),
      onBack: () => this.handleBack(),
      wrapSelection: true,
    });
  }

  private formatTitle() {
    return formatBreadcrumb(this.theme, this.getTitleParts());
  }

  /** Build the plain-text breadcrumb segments for the current submenu depth */
  private getTitleParts(): string[] {
    const parts = [this.rootTitle];

    for (const menuId of this.menuStack) {
      const title = submenuTitles.get(menuId) ?? menuId;
      parts.push(title);
    }

    if (this.currentMenuId) {
      const title = submenuTitles.get(this.currentMenuId) ?? this.currentMenuId;

      if (parts[parts.length - 1] !== title) {
        parts.push(title);
      }
    }

    return parts;
  }
}
