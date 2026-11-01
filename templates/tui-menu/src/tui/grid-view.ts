/**
 * The grid view: the demo's items as tiles, in Pending and Up to date
 * sections. The arrow keys move between tiles and Enter or a click applies one.
 *
 * @module
 */
import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";
import type { Item } from "@timmo001/groundwork-demo";
import {
  GLOBAL_HELP,
  HeaderBlock,
  MenuGrid,
  formatHelpBar,
  type HelpEntry,
  type Theme,
} from "@timmo001/groundwork-tui";

const HELP: readonly HelpEntry[] = [
  { key: "←↑↓→", action: "move" },
  { key: "Enter", action: "apply" },
  { key: "Esc", action: "back" },
  ...GLOBAL_HELP,
];

export interface GridViewOptions {
  readonly title: string;
  readonly list: () => Promise<readonly Item[]>;
  readonly onApply: (id: string) => Promise<void>;
  readonly onBack: () => void;
}

/** The items as a grid of tiles. */
export class GridView {
  private readonly root: BoxRenderable;
  private readonly grid: MenuGrid;
  private readonly options: GridViewOptions;

  constructor(renderer: CliRenderer, theme: Theme, options: GridViewOptions) {
    this.options = options;

    this.root = new BoxRenderable(renderer, {
      id: "grid-root",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: 1,
    });

    new HeaderBlock(renderer, theme, this.root, {
      id: "grid-header",
      name: options.title,
      titleParts: [options.title, "Grid"],
      status: { tone: "ok", label: "Ready" },
    });

    const scroll = new ScrollBoxRenderable(renderer, {
      id: "grid-scroll",
      flexGrow: 1,
      contentOptions: { flexDirection: "row", flexWrap: "wrap" },
    });

    this.grid = new MenuGrid(renderer, theme, {
      scroll,
      onActivate: (id) => this.apply(id),
    });
    this.root.add(scroll);

    this.root.add(
      new TextRenderable(renderer, {
        id: "grid-help",
        content: formatHelpBar(theme, HELP),
        marginTop: 1,
      }),
    );

    renderer.keyInput.on("keypress", (key) => this.handleKey(key));
    renderer.root.add(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  /** Loads the items and highlights the first tile. */
  async resetAndFocus(): Promise<void> {
    await this.refresh();
    this.grid.resetSelection();
    this.grid.focus();
  }

  focus(): void {
    this.grid.focus();
  }

  blur(): void {
    this.grid.blur();
  }

  private async refresh(): Promise<void> {
    const items = await this.options.list();

    const tile = (item: Item) => ({
      id: item.id,
      icon: item.pending ? "󰚰" : "󰄬",
      primary: item.name,
      secondary: item.pending
        ? `${item.current} → ${item.available}`
        : item.current,
    });

    this.grid.setSections([
      {
        id: "pending",
        title: "Pending",
        icon: "󰚰",
        items: items.filter((item) => item.pending).map(tile),
      },
      {
        id: "current",
        title: "Up to date",
        icon: "󰄬",
        items: items.filter((item) => !item.pending).map(tile),
      },
    ]);

    if (this.root.visible) this.grid.focus();
  }

  private handleKey(key: KeyEvent): void {
    if (!this.root.visible) return;

    if (key.name === "escape") {
      this.blur();
      this.options.onBack();

      return;
    }

    if (key.name === "return") {
      const id = this.grid.getSelectedId();

      if (id !== undefined) this.apply(id);

      return;
    }

    this.grid.handleKeyPress(key);
  }

  private apply(id: string): void {
    void this.options.onApply(id).then(() => this.refresh());
  }
}
