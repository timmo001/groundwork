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

export { PaneHeader } from "./pane-header.ts";

export { DEFAULT_THEME, loadTheme, themeFor, type Theme } from "./theme.ts";
