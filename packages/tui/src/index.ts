/**
 * Groundwork's terminal components: OpenTUI renderables and formatters on
 * the terminal tokens, so every Groundwork TUI looks and behaves the same.
 * Docs: https://groundwork.timmo.dev/terminal
 *
 * @packageDocumentation
 */
export { AppHeader, type AppHeaderOptions } from "./app-header.ts";

export { formatBreadcrumb } from "./breadcrumb.ts";

export { Button, type ButtonOptions, type ButtonVariant } from "./button.ts";

export { Collapsible, type CollapsibleOptions } from "./collapsible.ts";

export { formatFilterBar } from "./filter-bar.ts";

export {
  formatHeaderBar,
  type HeaderStatus,
  type HeaderTone,
} from "./header-bar.ts";

export { HeaderBlock, type HeaderBlockOptions } from "./header-block.ts";

export { formatHelpBar, GLOBAL_HELP, type HelpEntry } from "./help-bar.ts";

export { Input, type InputOptions } from "./input.ts";

export {
  MenuGrid,
  type MenuGridItem,
  type MenuGridOptions,
  type MenuGridSection,
} from "./menu-grid.ts";

export {
  MenuList,
  type MenuListItem,
  type MenuListOptions,
} from "./menu-list.ts";

export { PaneHeader } from "./pane-header.ts";

export {
  RadioGroup,
  type RadioChoice,
  type RadioGroupOptions,
} from "./radio-group.ts";

export { ScrollSurface, type ScrollSurfaceOptions } from "./scroll-surface.ts";

export {
  SectionHeading,
  type SectionHeadingOptions,
} from "./section-heading.ts";

export {
  StatusList,
  type StatusListItem,
  type StatusListOptions,
} from "./status-list.ts";

export { surfaceBackground } from "./styles.ts";

export { DEFAULT_THEME, loadTheme, themeFor, type Theme } from "./theme.ts";

export { Tile, type TileOptions } from "./tile.ts";
