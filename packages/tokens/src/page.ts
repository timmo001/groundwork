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

/** Light or dark: the side of a mode a theme has to cover. Darker is dark. */
export type ThemeScheme = "light" | "dark";

export interface PageThemeState {
  readonly mode: ThemeMode;
  /** The scheme in use, with `auto` resolved from the system. */
  readonly scheme: ThemeScheme;
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

/**
 * A theme to offer, by id and name. A `Theme` document is one. `mode` marks
 * a theme with only one scheme, such as Catppuccin Latte: it's offered and
 * kept for that scheme alone, beside a pick for the other.
 */
export interface ThemeChoice {
  readonly id: string;
  readonly name: string;
  readonly mode?: ThemeScheme | undefined;
}

/** Whether `choice` can show in `scheme`. */
export const themeCovers = (choice: ThemeChoice, scheme: ThemeScheme) =>
  choice.mode === undefined || choice.mode === scheme;

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
  /**
   * The app's own tones, solved into an imported theme's CSS beside its
   * roles. The built-in themes' tones come from `appTones` in the runtime
   * entry, on the page with their CSS.
   */
  readonly tones?: Readonly<Record<string, string>>;
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
  dark: `${key}:id-dark`,
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

  return `(()=>{const c=${config};let s;try{s=localStorage}catch{}const g=(k)=>{try{return s?.getItem(k)??null}catch{return null}};const r=document.documentElement;const m=g(c.keys.mode)??c.mode;const d=m==="dark"||m==="darker"||(m==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);let t=(d?g(c.keys.dark):null)??g(c.keys.theme)??c.theme;if(t===c.custom){const css=g(c.keys.css);if(css){const e=document.createElement("style");e.id=c.style;e.textContent=css;document.head.append(e)}else t=c.theme}r.setAttribute("data-gw-theme",t);if(m==="auto")r.removeAttribute("data-gw-mode");else r.setAttribute("data-gw-mode",m)})();`;
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
  const customName = read(stored.name);
  const customCss = read(stored.css);

  const system = matchMedia("(prefers-color-scheme: dark)");

  const schemeOf = (mode: ThemeMode): ThemeScheme =>
    mode === "light"
      ? "light"
      : mode === "auto" && !system.matches
        ? "light"
        : "dark";

  /** Whether `id` can be the pick for `scheme`. */
  const fits = (id: string | null, scheme: ThemeScheme, custom: boolean) =>
    id !== null &&
    ((id === customThemeId && custom) ||
      options.themes.some(
        (theme) => theme.id === id && themeCovers(theme, scheme),
      ));

  const fallback = (scheme: ThemeScheme) =>
    options.themes.some(
      (theme) =>
        theme.id === options.defaultTheme && themeCovers(theme, scheme),
    )
      ? options.defaultTheme
      : (options.themes.find((theme) => themeCovers(theme, scheme))?.id ??
        options.defaultTheme);

  const storedLight = read(stored.theme);
  const storedDark = read(stored.dark) ?? storedLight;

  /** The theme kept for each scheme. */
  let picks: Record<ThemeScheme, string> = {
    light: fits(storedLight, "light", customCss !== null)
      ? (storedLight ?? options.defaultTheme)
      : fallback("light"),
    dark: fits(storedDark, "dark", customCss !== null)
      ? (storedDark ?? options.defaultTheme)
      : fallback("dark"),
  };

  const savePicks = () => {
    write(stored.theme, picks.light);
    write(stored.dark, picks.dark);
  };

  const resolve = (mode: ThemeMode, custom: string | null): PageThemeState => {
    const scheme = schemeOf(mode);

    return { mode, scheme, theme: picks[scheme], custom };
  };

  let state: PageThemeState = resolve(
    modes.find((mode) => mode === storedMode) ?? defaultMode,
    customCss === null ? null : customName,
  );

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
    const { appTonesCss, runtimeTheme } = await import("./runtime.ts");
    const runtime = runtimeTheme(document, customThemeId);

    const css =
      options.tones === undefined
        ? runtime.css
        : `${runtime.css}\n\n${appTonesCss(options.tones, runtime.theme)}`;

    setStyle(css);
    write(stored.document, text);
    write(stored.css, css);
    write(stored.name, document.name);
    picks = { light: customThemeId, dark: customThemeId };
    savePicks();
    commit(resolve(state.mode, document.name));

    return runtime.checks
      .filter((result) => !result.passes)
      .map(
        (result) =>
          `${result.role} in ${result.mode} (${result.ratio.toFixed(2)})`,
      );
  };

  const setTheme = (id: string) => {
    if (id === customThemeId) {
      if (state.custom === null) return;

      picks = { light: id, dark: id };
    } else {
      const choice = options.themes.find((theme) => theme.id === id);

      if (choice === undefined) return;

      picks =
        choice.mode === undefined
          ? { light: id, dark: id }
          : { ...picks, [choice.mode]: id };

      // Picking a light-only theme in dark, or the reverse, shows it
      if (choice.mode !== undefined && choice.mode !== state.scheme) {
        savePicks();
        write(stored.mode, choice.mode);
        commit(resolve(choice.mode, state.custom));

        return;
      }
    }

    savePicks();
    commit(resolve(state.mode, state.custom));
  };

  // A system change moves `auto` between the light and dark picks
  system.addEventListener("change", () => {
    if (state.mode === "auto") commit(resolve(state.mode, state.custom));
  });

  const page: PageTheme = {
    state: () => state,
    setMode: (mode) => {
      write(stored.mode, mode);
      commit(resolve(mode, state.custom));
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

      picks = { light: fallback("light"), dark: fallback("dark") };
      commit(resolve(defaultMode, null));
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
