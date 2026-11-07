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
import {
  appThemeStorageKey,
  appThemeStyleId,
  customThemeId,
  customThemeStyleId,
  omarchyStorageKeys,
  omarchyThemeId,
  omarchyThemeStyleId,
  themeAllows,
  themeChoice,
  themeStorageKeys,
  type ThemeBootOptions,
  type ThemeChoice,
  type ThemeMode,
  type ThemeScheme,
} from "./choices.ts";
import type { OmarchyCurrentTheme } from "./omarchy.ts";
import type { ThemeStore } from "./runtime.ts";
import type { Theme } from "./schema.ts";
// Only for `document.modelContext`'s type; the tools themselves load lazily
import type {} from "./webmcp.ts";

export {
  appThemeStorageKey,
  appThemeStyleId,
  coreThemeChoices,
  customThemeId,
  customThemeStyleId,
  omarchyThemeId,
  omarchyThemeStyleId,
  optionalThemeChoices,
  optionalThemeDocuments,
  themeAllows,
  themeBootScript,
  themeChoice,
  themeCovers,
  themeOptions,
  type ThemeBootOptions,
  type ThemeChoice,
  type ThemeMode,
  type ThemeScheme,
} from "./choices.ts";

const modes: readonly ThemeMode[] = ["auto", "light", "dark", "darker"];

export interface PageThemeState {
  readonly mode: ThemeMode;
  /** The scheme in use, with `auto` resolved from the system. */
  readonly scheme: ThemeScheme;
  /** The theme id in use: a built-in one, an app theme's, `omarchy` or `custom`. */
  readonly theme: string;
  /**
   * The one scheme the theme in use covers, such as `light` for Catppuccin
   * Latte, or `null` when it has both. Pass it to the picker's `scheme`, so
   * the other modes can't be picked.
   */
  readonly only: ThemeScheme | null;
  /** The visitor's own theme's name, when they've imported one. */
  readonly custom: string | null;
  /** The desktop's Omarchy theme as a choice, when the app passed one. */
  readonly omarchy: ThemeChoice | null;
}

/** What `importTheme` reports: the theme's name and any contrast misses, or why it failed. */
export type ImportResult =
  | {
      readonly ok: true;
      readonly name: string;
      readonly misses: readonly string[];
    }
  | { readonly ok: false; readonly error: string };

export interface PageThemeOptions extends ThemeBootOptions {
  /** The built-in themes to offer, their CSS already on the page. */
  readonly themes: readonly ThemeChoice[];
  /**
   * The app's own theme documents, offered after `themes`. Each is solved
   * under its own id on load and its CSS cached, so the boot script applies
   * a picked one before the first paint.
   */
  readonly appThemes?: readonly Theme[];
  /**
   * The full documents of `themes`, loaded only when the WebMCP tools
   * register. Defaults to the core themes.
   */
  readonly documents?: () => Promise<readonly Theme[]>;
  /** The element the attributes go on. Defaults to `<html>`. */
  readonly root?: HTMLElement;
  /**
   * The app's own tones, solved into an imported theme's CSS beside its
   * roles. The built-in themes' tones come from `appTones` in the runtime
   * entry, on the page with their CSS.
   */
  readonly tones?: Readonly<Record<string, string>>;
  /**
   * Where the visitor's own theme is kept beyond this browser, such as an
   * app's host or a profile. Its theme replaces the local one on load, and
   * importing or resetting writes through to it. Local storage still caches
   * the CSS, so the theme applies before the first paint.
   */
  readonly store?: ThemeStore;
}

export interface PageTheme {
  readonly state: () => PageThemeState;
  /** Sets the mode, unless the theme in use doesn't come in it. */
  readonly setMode: (mode: ThemeMode) => void;
  /** Picks a theme, moving to its scheme when it has only one. */
  readonly setTheme: (id: string) => void;
  /** Solves a theme document's JSON or an Omarchy `colors.toml` and applies it. */
  readonly importTheme: (text: string) => Promise<ImportResult>;
  /** Drops the visitor's own theme and goes back to the defaults. */
  readonly reset: () => void;
  /**
   * Offers the Omarchy theme the app runs under, or drops it with `null`.
   * It's only ever a choice, never the default; while it's picked, a theme
   * switch on the desktop follows through. Apps that can read it, such as
   * desktop apps, pass it on start and on every switch.
   */
  readonly setOmarchyTheme: (
    theme: OmarchyCurrentTheme | null,
  ) => Promise<void>;
  /** Calls `listener` on every change; returns a function that stops it. */
  readonly subscribe: (listener: (state: PageThemeState) => void) => () => void;
}

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

const schemeValue = (value: string | null): ThemeScheme | undefined =>
  value === "light" || value === "dark" ? value : undefined;

/**
 * Sets up the page's theme from what's stored, falling back to the defaults,
 * and registers the WebMCP theme tools where the browser offers them.
 *
 * There's one pick. A theme with one scheme keeps the page in it, so its
 * other modes can't be set. An imported or Omarchy theme is offered once
 * there is one, but is only used when it's picked: the default is always
 * `defaultTheme`.
 */
export const pageTheme = (options: PageThemeOptions): PageTheme => {
  const stored = themeStorageKeys(options.key);
  const storedOmarchy = omarchyStorageKeys(options.key);
  const root = options.root ?? document.documentElement;
  const defaultMode = options.defaultMode ?? "auto";
  const listeners = new Set<(state: PageThemeState) => void>();

  const appThemes = options.appThemes ?? [];
  const appChoices = appThemes.map(themeChoice);
  const offered = [...options.themes, ...appChoices];
  const known = (id: string) => offered.some((theme) => theme.id === id);

  const setStyle = (id: string, css: string | null) => {
    let style = document.getElementById(id);

    if (css === null) {
      style?.remove();

      return;
    }

    if (style === null) {
      style = document.createElement("style");
      style.id = id;
      document.head.append(style);
    }

    style.textContent = css;
  };

  /** The Omarchy theme as a choice, from the last one the app passed. */
  let omarchy: ThemeChoice | null = null;

  {
    const css = read(storedOmarchy.css);
    const name = read(storedOmarchy.name);
    const mode = schemeValue(read(storedOmarchy.mode));

    if (css !== null && name !== null && mode !== undefined) {
      omarchy = { id: omarchyThemeId, name, mode };

      // The boot script may have put it on already
      if (document.getElementById(omarchyThemeStyleId) === null) {
        setStyle(omarchyThemeStyleId, css);
      }
    }
  }

  /** The visitor's own theme as a choice, when there's one. */
  let custom: ThemeChoice | null =
    read(stored.css) === null
      ? null
      : {
          id: customThemeId,
          name: read(stored.name) ?? "Custom",
          mode: schemeValue(read(stored.scheme)),
        };

  const choiceOf = (id: string | null) =>
    id === null
      ? undefined
      : [
          ...offered,
          ...(omarchy === null ? [] : [omarchy]),
          ...(custom === null ? [] : [custom]),
        ].find((theme) => theme.id === id);

  const system = matchMedia("(prefers-color-scheme: dark)");

  const schemeOf = (mode: ThemeMode): ThemeScheme =>
    mode === "light"
      ? "light"
      : mode === "auto" && !system.matches
        ? "light"
        : "dark";

  /** `mode`, or the theme's own scheme when it doesn't come in `mode`. */
  const fit = (choice: ThemeChoice | undefined, mode: ThemeMode): ThemeMode =>
    choice === undefined || themeAllows(choice, mode)
      ? mode
      : (choice.mode ?? mode);

  const resolve = (theme: string, mode: ThemeMode): PageThemeState => {
    const choice = choiceOf(theme);
    const fitted = fit(choice, mode);

    return {
      mode: fitted,
      scheme: schemeOf(fitted),
      theme,
      only: choice?.mode ?? null,
      custom: custom?.name ?? null,
      omarchy,
    };
  };

  /** The default, as `reset` and a vanished pick go back to. */
  const fallback = () => resolve(options.defaultTheme, defaultMode);

  let state: PageThemeState = (() => {
    const theme = read(stored.theme);
    const mode = modes.find((entry) => entry === read(stored.mode));

    return theme !== null && choiceOf(theme) !== undefined
      ? resolve(theme, mode ?? defaultMode)
      : resolve(options.defaultTheme, mode ?? defaultMode);
  })();

  const commit = (next: PageThemeState, save = true) => {
    state = next;

    if (save) {
      write(stored.theme, state.theme);
      write(stored.mode, state.mode);
    }

    root.setAttribute("data-gw-theme", state.theme);

    if (state.mode === "auto") root.removeAttribute("data-gw-mode");
    else root.setAttribute("data-gw-mode", state.mode);

    for (const listener of listeners) listener(state);
  };

  /**
   * Solves a document under the custom id and keeps it. `pick` uses it,
   * as an import does; a theme from the store is only offered.
   */
  const applyCustom = async (
    document: Theme,
    text: string,
    { pick, keep }: { pick: boolean; keep: boolean },
  ) => {
    const { appTonesCss, runtimeTheme } = await import("./runtime.ts");
    const runtime = runtimeTheme(document, customThemeId);

    const css =
      options.tones === undefined
        ? runtime.css
        : `${runtime.css}\n\n${appTonesCss(options.tones, runtime.theme)}`;

    const scheme =
      runtime.theme.modes.light === undefined
        ? "dark"
        : runtime.theme.modes.dark === undefined
          ? "light"
          : undefined;

    setStyle(customThemeStyleId, css);
    write(stored.document, text);
    write(stored.css, css);
    write(stored.name, document.name);
    write(stored.scheme, scheme ?? null);
    custom = { id: customThemeId, name: document.name, mode: scheme };

    commit(
      resolve(
        pick || state.theme === customThemeId ? customThemeId : state.theme,
        state.mode,
      ),
    );

    if (keep) await options.store?.save(text).catch(() => undefined);

    return runtime.checks
      .filter((result) => !result.passes)
      .map(
        (result) =>
          `${result.role} in ${result.mode} (${result.ratio.toFixed(2)})`,
      );
  };

  /** Drops the visitor's own theme, leaving it if it was in use. */
  const dropCustom = () => {
    setStyle(customThemeStyleId, null);

    for (const key of [
      stored.document,
      stored.css,
      stored.name,
      stored.scheme,
    ]) {
      write(key, null);
    }

    custom = null;
  };

  const setTheme = (id: string) => {
    if (choiceOf(id) === undefined) return;

    commit(resolve(id, state.mode));
  };

  // A system change moves `auto` between light and dark
  system.addEventListener("change", () => {
    if (state.mode === "auto") commit(resolve(state.theme, state.mode), false);
  });

  const page: PageTheme = {
    state: () => state,
    setMode: (mode) => {
      const choice = choiceOf(state.theme);

      if (choice !== undefined && !themeAllows(choice, mode)) return;

      commit(resolve(state.theme, mode));
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

      const misses = await applyCustom(parsed.success, text, {
        pick: true,
        keep: true,
      });

      return { ok: true, name: parsed.success.name, misses };
    },
    reset: () => {
      dropCustom();
      write(stored.theme, null);
      write(stored.mode, null);
      commit(fallback(), false);
      void options.store?.clear().catch(() => undefined);
    },
    setOmarchyTheme: async (theme) => {
      let next: ThemeChoice | null = null;

      if (theme !== null) {
        const { Result } = await import("effect");

        const { appTonesCss, omarchyTheme, runtimeTheme } =
          await import("./runtime.ts");

        const name = `Omarchy (${theme.name})`;
        const parsed = omarchyTheme(theme.colors, name, omarchyThemeId);

        if (Result.isSuccess(parsed)) {
          const runtime = runtimeTheme(parsed.success);

          const css =
            options.tones === undefined
              ? runtime.css
              : `${runtime.css}\n\n${appTonesCss(options.tones, runtime.theme)}`;

          setStyle(omarchyThemeStyleId, css);
          write(storedOmarchy.css, css);
          write(storedOmarchy.name, name);
          write(storedOmarchy.mode, parsed.success.mode);
          next = { id: omarchyThemeId, name, mode: parsed.success.mode };
        }
      }

      if (next === null) {
        // Gone, or a colors.toml that doesn't map
        setStyle(omarchyThemeStyleId, null);

        for (const key of Object.values(storedOmarchy)) write(key, null);
      }

      omarchy = next;

      // While it's picked, a switch between a light and a dark Omarchy
      // theme moves the page across; once it's gone, the default takes over
      commit(
        state.theme !== omarchyThemeId
          ? resolve(state.theme, state.mode)
          : next === null
            ? fallback()
            : resolve(omarchyThemeId, state.mode),
      );
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  // A stored pick is saved back, in case its mode had to move to fit the
  // theme; with nothing stored, the defaults stay unsaved so a new default
  // reaches the visitor
  commit(state, read(stored.theme) !== null);

  // An app's own themes are solved on every load, so a solver change
  // reaches them; the cache only serves the boot script's first paint
  if (appThemes.length > 0) {
    void import("./runtime.ts").then(({ appTonesCss, runtimeTheme }) => {
      for (const theme of appThemes) {
        const runtime = runtimeTheme(theme);

        const css =
          options.tones === undefined
            ? runtime.css
            : `${runtime.css}\n\n${appTonesCss(options.tones, runtime.theme)}`;

        setStyle(appThemeStyleId(theme.id), css);
        write(appThemeStorageKey(options.key, theme.id), css);
      }
    });
  }

  // The store's theme wins over this browser's, since another client may
  // have changed or dropped it. It's offered, and used only when this
  // browser had the visitor's own theme picked
  if (options.store !== undefined) {
    void options.store
      .load()
      .then(async (text) => {
        if (text === read(stored.document)) return;

        if (text === null) {
          dropCustom();
          commit(
            state.theme === customThemeId
              ? fallback()
              : resolve(state.theme, state.mode),
          );

          return;
        }

        const { Result } = await import("effect");
        const parsed = await readTheme(text);

        if (Result.isSuccess(parsed)) {
          await applyCustom(parsed.success, text, { pick: false, keep: false });
        }
      })
      .catch(() => undefined);
  }

  if (document.modelContext !== undefined) {
    void import("./webmcp.ts").then(
      async ({ coreThemes, registerThemeTools }) => {
        const documents = [
          ...((await options.documents?.()) ?? coreThemes),
          ...appThemes,
        ].filter((theme) => known(theme.id));

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
            else void applyCustom(theme, text, { pick: true, keep: true });
          },
        });
      },
    );
  }

  return page;
};
