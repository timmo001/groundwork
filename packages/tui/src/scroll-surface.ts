/**
 * The scroll surface: a scroll box with a one-column position marker in place
 * of the native scrollbar, so the gutter never changes the content's width.
 *
 * @module
 */
import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextRenderable,
  fg,
  t,
} from "@opentui/core";
import type { CliRenderer, ScrollBoxOptions } from "@opentui/core";
import type { Theme } from "./theme.ts";

export interface ScrollSurfaceOptions extends ScrollBoxOptions {
  readonly theme: Theme;
}

/** Draws the marker column: a thumb of `┃` on a track of `│`. */
const renderMarker = (
  viewport: number,
  extent: number,
  offset: number,
): string => {
  if (viewport <= 0) return "";

  if (extent === 0)
    return Array.from({ length: viewport }, () => " ").join("\n");

  const thumb = Math.max(
    1,
    Math.floor((viewport * viewport) / (viewport + extent)),
  );

  const start = Math.round((offset / extent) * Math.max(0, viewport - thumb));

  return Array.from({ length: viewport }, (_, row) =>
    row >= start && row < start + thumb ? "┃" : "│",
  ).join("\n");
};

/** A scroll box with a fixed marker column and no native scrollbar. */
export class ScrollSurface extends BoxRenderable {
  readonly scrollBox: ScrollBoxRenderable;
  private readonly marker: TextRenderable;
  private readonly surfaceTheme: Theme;
  private markerText = "";
  private markerMetrics = "";

  constructor(
    renderer: CliRenderer,
    { theme, width, ...options }: ScrollSurfaceOptions,
  ) {
    const outer = {
      id: options.id,
      height: options.height,
      flexGrow: options.flexGrow,
      flexShrink: options.flexShrink,
      minHeight: options.minHeight,
      backgroundColor: options.backgroundColor,
      focusable: options.focusable,
    };

    super(renderer, {
      ...Object.fromEntries(
        Object.entries(outer).filter(([, value]) => value !== undefined),
      ),
      flexDirection: "row",
      width: width ?? "100%",
    });
    this.surfaceTheme = theme;

    this.scrollBox = new ScrollBoxRenderable(renderer, {
      ...options,
      id: `${options.id}-scrollbox`,
      flexGrow: 1,
      minWidth: 0,
    });

    this.scrollBox.renderAfter = () => this.syncMarker();
    this.scrollBox.verticalScrollBar.visible = false;

    this.marker = new TextRenderable(renderer, {
      id: `${options.id}-marker`,
      width: 1,
      height: "100%",
      flexShrink: 0,
      content: "",
      wrapMode: "none",
    });

    this.add(this.scrollBox);
    this.add(this.marker);
  }

  /** Adds a child to the scrolled content. */
  addContent(renderable: Parameters<ScrollBoxRenderable["add"]>[0]): number {
    return this.scrollBox.add(renderable);
  }

  override focus(): void {
    this.scrollBox.focus();
  }

  override blur(): void {
    this.scrollBox.blur();
  }

  override handleKeyPress(
    key: Parameters<ScrollBoxRenderable["handleKeyPress"]>[0],
  ): boolean {
    const handled = this.scrollBox.handleKeyPress(key);
    this.syncMarker();

    return handled;
  }

  /** Redraws the marker when the viewport, content or offset changed. */
  syncMarker(): void {
    const viewport = this.scrollBox.viewport.height;

    if (viewport <= 0) return;

    const extent = Math.max(0, this.scrollBox.scrollHeight - viewport);
    const offset = Math.max(0, Math.min(this.scrollBox.scrollTop, extent));
    const metrics = `${viewport}:${extent}:${offset}`;

    if (metrics === this.markerMetrics) return;

    this.markerMetrics = metrics;
    const marker = renderMarker(viewport, extent, offset);

    if (marker === this.markerText) return;

    this.markerText = marker;
    this.marker.content = t`${fg(this.surfaceTheme.fgSubtle)(marker)}`;
  }

  protected override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.markerMetrics) this.syncMarker();
  }
}
