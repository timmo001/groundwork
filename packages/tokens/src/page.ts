/**
 * A page's theme and mode: keeps the visitor's pick across visits, applies
 * it to `<html>`, and lets them bring their own theme. The solver and the
 * WebMCP tools load only when a custom theme or `document.modelContext`
 * needs them, so a page that only switches built-in themes stays small.
 *
 * Put `themeBootScript()` in an inline `<script>` in `<head>` so the stored
 * pick applies before the first paint.
 *
 * @module
 */
import base from "../themes/base.json" with { type: "json" };
import bridge from "../themes/bridge.json" with { type: "json" };
import glazing from "../themes/glazing.json" with { type: "json" };
import slate from "../themes/slate.json" with { type: "json" };
import snag from "../themes/snag.json" with { type: "json" };
import survey from "../themes/survey.json" with { type: "json" };
import type { Theme } from "./schema.ts";
// Only for `document.modelContext`'s type; the tools themselves load lazily
import type {} from "./webmcp.ts";

/** How light the page is: `auto` follows the system. */
export type ThemeMode = "auto" | "light" | "dark" | "darker";

/** The theme id a visitor's own theme is solved under. */
export const customThemeId = "custom";

/** The id of the `<style>` holding a custom theme's CSS. */
export const customThemeStyleId = "gw-custom-theme";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

export interface PageThemeState {
  readonly mode: ThemeMode;
  /** The theme id in use: a built-in one, or `custom`. */
  readonly theme: string;
  /** The visitor's own theme's name, when they've imported one. */
  readonly custom: string | null;
}

/** What `importTheme` reports: the theme's name and any contrast misses, or why it failed. */
export type ImportResult =
  | {
      readonly ok: true;
      readonly name: string;
      readonly misses: readonly string[];
    }
  | { readonly ok: false; readonly error: string };

/** A theme to offer, by id and name. A `Theme` document is one. */
export interface ThemeChoice {
  readonly id: string;
  readonly name: string;
}

/** The core themes by id and name, in the order the docs list them. */
export const coreThemeChoices: readonly ThemeChoice[] = [
  base,
  glazing,
  survey,
  slate,
  bridge,
  snag,
].map(({ id, name }) => ({ id, name }));

export interface PageThemeOptions {
  /** The local storage key prefix, such as `my-site:theme`. */
  readonly key: string;
  /** The built-in themes to offer, their CSS already on the page. */
  readonly themes: readonly ThemeChoice[];
  /**
   * The full documents of `themes`, loaded only when the WebMCP tools
   * register. Defaults to the core themes.
   */
  readonly documents?: () => Promise<readonly Theme[]>;
  /** The theme id to start with. */
  readonly defaultTheme: string;
  /** The mode to start with. Defaults to `auto`. */
  readonly defaultMode?: ThemeMode;
  /** The element the attributes go on. Defaults to `<html>`. */
  readonly root?: HTMLElement;
}

export interface PageTheme {
  readonly state: () => PageThemeState;
  readonly setMode: (mode: ThemeMode) => void;
  readonly setTheme: (id: string) => void;
  /** Solves a theme document's JSON or an Omarchy `colors.toml` and applies it. */
  readonly importTheme: (text: string) => Promise<ImportResult>;
  /** Drops the visitor's own theme and goes back to the defaults. */
  readonly reset: () => void;
  /** Calls `listener` on every change; returns a function that stops it. */
  readonly subscribe: (listener: (state: PageThemeState) => void) => () => void;
}

const keys = (key: string) => ({
  mode: `${key}:mode`,
  theme: `${key}:id`,
  document: `${key}:custom`,
  css: `${key}:custom-css`,
  name: `${key}:custom-name`,
});

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Blocked or full: the pick still applies until the page closes
  }
};

/**
 * An inline script that applies the stored mode, theme and any custom theme's
 * cached CSS before the first paint. Takes the same key and defaults as
 * `pageTheme`.
 */
export const themeBootScript = (
  options: Pick<PageThemeOptions, "key" | "defaultTheme" | "defaultMode">,
) => {
  const stored = keys(options.key);

  const config = JSON.stringify({
    keys: stored,
    theme: options.defaultTheme,
    mode: options.defaultMode ?? "auto",
    custom: customThemeId,
    style: customThemeStyleId,
  });

  return `(()=>{const c=${config};let s;try{s=localStorage}catch{}const g=(k)=>{try{return s?.getItem(k)??null}catch{return null}};const r=document.documentElement;let t=g(c.keys.theme)??c.theme;const m=g(c.keys.mode)??c.mode;if(t===c.custom){const css=g(c.keys.css);if(css){const e=document.createElement("style");e.id=c.style;e.textContent=css;document.head.append(e)}else t=c.theme}r.setAttribute("data-gw-theme",t);if(m==="auto")r.removeAttribute("data-gw-mode");else r.setAttribute("data-gw-mode",m)})();`;
};

/** Reads a theme from JSON text or an Omarchy `colors.toml`. */
const readTheme = async (text: string) => {
  const { Result } = await import("effect");
  const { omarchyTheme, parseTheme } = await import("./runtime.ts");
  const parsed = parseTheme(text);

  if (Result.isSuccess(parsed) || text.trimStart().startsWith("{")) {
    return parsed;
  }

  return omarchyTheme(text);
};

/**
 * Sets up the page's theme from what's stored, falling back to the defaults,
 * and registers the WebMCP theme tools where the browser offers them.
 */
export const pageTheme = (options: PageThemeOptions): PageTheme => {
  const stored = keys(options.key);
  const root = options.root ?? document.documentElement;
  const defaultMode = options.defaultMode ?? "auto";
  const listeners = new Set<(state: PageThemeState) => void>();

  const known = (id: string) => options.themes.some((theme) => theme.id === id);

  const storedMode = read(stored.mode);
  const storedTheme = read(stored.theme);
  const customName = read(stored.name);
  const customCss = read(stored.css);

  let state: PageThemeState = {
    mode: modes.find((mode) => mode === storedMode) ?? defaultMode,
    theme:
      storedTheme !== null &&
      (known(storedTheme) ||
        (storedTheme === customThemeId && customCss !== null))
        ? storedTheme
        : options.defaultTheme,
    custom: customCss === null ? null : customName,
  };

  const setStyle = (css: string | null) => {
    let style = document.getElementById(customThemeStyleId);

    if (css === null) {
      style?.remove();

      return;
    }

    if (style === null) {
      style = document.createElement("style");
      style.id = customThemeStyleId;
      document.head.append(style);
    }

    style.textContent = css;
  };

  const commit = (next: PageThemeState) => {
    state = next;
    root.setAttribute("data-gw-theme", state.theme);

    if (state.mode === "auto") root.removeAttribute("data-gw-mode");
    else root.setAttribute("data-gw-mode", state.mode);

    for (const listener of listeners) listener(state);
  };

  /** Solves a document under the custom id, applies it and keeps it. */
  const applyCustom = async (document: Theme, text: string) => {
    const { runtimeTheme } = await import("./runtime.ts");
    const runtime = runtimeTheme(document, customThemeId);

    setStyle(runtime.css);
    write(stored.document, text);
    write(stored.css, runtime.css);
    write(stored.name, document.name);
    write(stored.theme, customThemeId);
    commit({ ...state, theme: customThemeId, custom: document.name });

    return runtime.checks
      .filter((result) => !result.passes)
      .map(
        (result) =>
          `${result.role} in ${result.mode} (${result.ratio.toFixed(2)})`,
      );
  };

  const setTheme = (id: string) => {
    if (!known(id) && !(id === customThemeId && state.custom !== null)) return;

    write(stored.theme, id);
    commit({ ...state, theme: id });
  };

  const page: PageTheme = {
    state: () => state,
    setMode: (mode) => {
      write(stored.mode, mode);
      commit({ ...state, mode });
    },
    setTheme,
    importTheme: async (text) => {
      const { Result } = await import("effect");
      const parsed = await readTheme(text);

      if (Result.isFailure(parsed)) {
        return {
          ok: false,
          error: `That isn't a theme document or an Omarchy colors.toml: ${String(parsed.failure).slice(0, 400)}`,
        };
      }

      const misses = await applyCustom(parsed.success, text);

      return { ok: true, name: parsed.success.name, misses };
    },
    reset: () => {
      setStyle(null);

      for (const key of Object.values(stored)) write(key, null);

      commit({ mode: defaultMode, theme: options.defaultTheme, custom: null });
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  commit(state);

  if (document.modelContext !== undefined) {
    void import("./webmcp.ts").then(
      async ({ coreThemes, registerThemeTools }) => {
        const documents = ((await options.documents?.()) ?? coreThemes).filter(
          (theme) => known(theme.id),
        );

        registerThemeTools({
          themes: documents,
          // The custom document is kept by `applyCustom`, so a built-in pick
          // doesn't overwrite it
          store: {
            load: async () =>
              state.custom === null ? null : read(stored.document),
            save: async () => {},
            clear: async () => {
              page.reset();
            },
          },
          apply: ({ document: theme, text }) => {
            if (documents.includes(theme)) setTheme(theme.id);
            else void applyCustom(theme, text);
          },
        });
      },
    );
  }

  return page;
};
