/**
 * The menu grid: sections of wrapping tiles, each under a section heading,
 * in a scroll box the app owns. The arrow keys move to the nearest tile in
 * that direction, across sections too.
 *
 * @module
 */
import type { CliRenderer, KeyEvent, ScrollBoxRenderable } from "@opentui/core";
import { SectionHeading } from "./section-heading.ts";
import type { Theme } from "./theme.ts";
import { Tile } from "./tile.ts";

export interface MenuGridItem {
  readonly id: string;
  readonly primary: string;
  readonly secondary?: string | readonly string[];
  readonly icon?: string;
}

export interface MenuGridSection {
  readonly id: string;
  /** No heading row when empty */
  readonly title: string;
  readonly icon?: string;
  readonly items: readonly MenuGridItem[];
}

export interface MenuGridOptions {
  /**
   * The view's scroll box, which should wrap its content in rows
   * (`contentOptions: { flexDirection: "row", flexWrap: "wrap" }`)
   */
  readonly scroll: ScrollBoxRenderable;
  /** 28 columns by default */
  readonly tileWidth?: number;
}

interface GridSection {
  readonly items: readonly MenuGridItem[];
  readonly heading: SectionHeading | undefined;
}

interface TilePosition {
  readonly id: string;
  readonly section: number;
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

type Direction = "left" | "right" | "up" | "down";

const DIRECTION_KEYS = new Map<string, Direction>([
  ["left", "left"],
  ["right", "right"],
  ["up", "up"],
  ["down", "down"],
]);

/** Tiles in sections, filling a scroll box the app owns. */
export class MenuGrid {
  private readonly renderer: CliRenderer;
  private readonly theme: Theme;
  private readonly scroll: ScrollBoxRenderable;
  private readonly tileWidth: number;
  private sections: GridSection[] = [];
  private readonly tiles = new Map<string, Tile>();
  private sectionIndex = 0;
  private tileIndex = 0;
  private focused = false;

  constructor(renderer: CliRenderer, theme: Theme, options: MenuGridOptions) {
    this.renderer = renderer;
    this.theme = theme;
    this.scroll = options.scroll;
    this.tileWidth = options.tileWidth ?? 28;

    renderer.on("resize", () => {
      if (this.focused) this.applySelection();
    });
  }

  /** Whether there are any tiles */
  get hasEntries(): boolean {
    return this.tiles.size > 0;
  }

  /** Whether a tile is highlighted */
  get isFocused(): boolean {
    return this.focused;
  }

  /** The highlighted tile's id */
  getSelectedId(): string | undefined {
    return this.sections[this.sectionIndex]?.items[this.tileIndex]?.id;
  }

  /** Replaces the tiles; sections without items are skipped. */
  setSections(sections: readonly MenuGridSection[]): void {
    this.clearContent();
    this.sectionIndex = 0;
    this.tileIndex = 0;

    for (const section of sections) {
      if (section.items.length === 0) continue;

      const heading =
        section.title.length > 0
          ? new SectionHeading(this.renderer, this.theme, {
              id: `${this.scroll.id}-heading-${section.id}`,
              title: section.title,
              icon: section.icon,
              marginTop: this.sections.length === 0 ? 0 : 1,
            })
          : undefined;

      if (heading) this.scroll.add(heading.box);

      this.sections.push({ items: section.items, heading });

      for (const item of section.items) {
        const tile = new Tile(this.renderer, this.theme, {
          id: `${this.scroll.id}-tile-${item.id}`,
          primary: item.primary,
          secondary: item.secondary,
          icon: item.icon,
          width: this.tileWidth,
        });

        this.tiles.set(item.id, tile);
        this.scroll.add(tile.box);
      }
    }

    if (this.focused) this.applySelection();
  }

  /** One section without a heading. */
  setItems(items: readonly MenuGridItem[]): void {
    this.setSections([{ id: "default", title: "", items }]);
  }

  /** Changes one tile's text in place. */
  updateItem(
    id: string,
    patch: {
      readonly primary?: string;
      readonly secondary?: string | readonly string[];
    },
  ): void {
    const tile = this.tiles.get(id);

    if (patch.primary !== undefined) tile?.setPrimary(patch.primary);

    if (patch.secondary !== undefined) tile?.setSecondary(patch.secondary);
  }

  /** Removes every tile and heading. */
  clear(): void {
    this.clearContent();
    this.sectionIndex = 0;
    this.tileIndex = 0;
    this.focused = false;
  }

  /** Highlights the selected tile. */
  focus(): void {
    if (this.tiles.size === 0) return;

    this.focused = true;
    this.applySelection();
  }

  /** Clears the highlight, keeping the selection. */
  blur(): void {
    this.focused = false;

    for (const tile of this.tiles.values()) tile.setSelected(false);
  }

  /** Selects the first tile and scrolls to the top. */
  resetSelection(): void {
    this.sectionIndex = 0;
    this.tileIndex = 0;
    this.scroll.scrollTop = 0;
    this.applySelection();
  }

  /** Handles the arrow keys; returns whether it used the key. */
  handleKeyPress(key: KeyEvent): boolean {
    const direction = DIRECTION_KEYS.get(key.name);

    if (this.tiles.size === 0 || direction === undefined) return false;

    if (!this.focused) this.focus();

    this.move(direction);

    return true;
  }

  private clearContent(): void {
    for (const tile of this.tiles.values()) this.scroll.remove(tile.box);

    for (const { heading } of this.sections)
      if (heading) this.scroll.remove(heading.box);

    this.tiles.clear();
    this.sections = [];
  }

  /** Moves to the nearest tile in that direction, preferring the same line. */
  private move(direction: Direction): void {
    const positions = this.positions();
    const current = positions.find(({ id }) => id === this.getSelectedId());

    if (current === undefined) return;

    let best: TilePosition | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of positions) {
      const dx = candidate.x - current.x;
      const dy = candidate.y - current.y;
      const horizontal = direction === "left" || direction === "right";
      const ahead = horizontal ? dx : dy;
      const across = horizontal ? dy : dx;
      const forward = direction === "right" || direction === "down";
      const distance = forward ? ahead : -ahead;

      if (distance <= 0) continue;

      const score = Math.abs(across) * 1000 + distance;

      if (score >= bestScore) continue;

      bestScore = score;
      best = candidate;
    }

    if (best === undefined) return;

    this.sectionIndex = best.section;
    this.tileIndex = best.index;
    this.applySelection();
  }

  private positions(): TilePosition[] {
    return this.sections.flatMap(({ items }, section) =>
      items.flatMap(({ id }, index) => {
        const box = this.tiles.get(id)?.box;

        return box === undefined
          ? []
          : [
              {
                id,
                section,
                index,
                x: box.x + box.width / 2,
                y: box.y + box.height / 2,
              },
            ];
      }),
    );
  }

  private applySelection(): void {
    for (const tile of this.tiles.values()) tile.setSelected(false);

    const id = this.getSelectedId();
    const tile = id === undefined ? undefined : this.tiles.get(id);

    if (!this.focused || tile === undefined) return;

    tile.setSelected(true);
    this.scroll.scrollChildIntoView(tile.box.id);
  }
}
