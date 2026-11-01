/**
 * Groundwork's terminal components: OpenTUI renderables and formatters on
 * the terminal tokens, so every Groundwork TUI looks and behaves the same.
 * Docs: https://groundwork.timmo.dev/terminal
 *
 * @packageDocumentation
 */
export { AppHeader, type AppHeaderOptions } from "./app-header.ts";

export { formatBreadcrumb } from "./breadcrumb.ts";

export { formatHelpBar, GLOBAL_HELP, type HelpEntry } from "./help-bar.ts";

export {
  MenuList,
  type MenuListItem,
  type MenuListOptions,
} from "./menu-list.ts";

export { PaneHeader } from "./pane-header.ts";

export { ScrollSurface, type ScrollSurfaceOptions } from "./scroll-surface.ts";

export {
  StatusList,
  type StatusListItem,
  type StatusListOptions,
} from "./status-list.ts";

export { surfaceBackground } from "./styles.ts";

export { DEFAULT_THEME, loadTheme, themeFor, type Theme } from "./theme.ts";
