/**
 * `gw-code`: code or a diff in a read-only CodeMirror view, with a toolbar
 * to wrap its lines, find in it and copy it.
 * Docs: https://groundwork.timmo.dev/components/display/#code
 *
 * @module
 */
import { json } from "@codemirror/lang-json";
import {
  HighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  closeSearchPanel,
  openSearchPanel,
  search,
  searchKeymap,
  searchPanelOpen,
} from "@codemirror/search";
import {
  Compartment,
  EditorState,
  RangeSetBuilder,
  type StateEffect,
} from "@codemirror/state";
import { Decoration, EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";

import { GwElement, css, h, setAttribute } from "./element.js";
import type {} from "./gw-button.js";
import { getStorage } from "./storage.js";
import { base } from "./styles.js";

// MDI's wrap, magnify, content-copy and check
const wrapIcon =
  "M21,5H3V7H21V5M3,19H10V17H3V19M3,13H18C19,13 20,13.43 20,15C20,16.57 19,17 18,17H16V15L12,18L16,21V19H18C20.95,19 22,17.73 22,15C22,12.28 21,11 18,11H3V13Z";

const findIcon =
  "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";

const copyIcon =
  "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";

const copiedIcon = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";

/** How long the Copy button says what happened before it's back. */
const copiedFor = 2000;

/** How a diff line reads, from its first characters. */
const kindOf = (line: string) => {
  if (line.startsWith("+++") || line.startsWith("---")) return "file";

  if (line.startsWith("+")) return "add";

  if (line.startsWith("-")) return "remove";

  if (line.startsWith("@@")) return "hunk";

  return undefined;
};

const diffDecorations = {
  file: Decoration.line({ class: "gw-diff-file" }),
  add: Decoration.line({ class: "gw-diff-add" }),
  remove: Decoration.line({ class: "gw-diff-remove" }),
  hunk: Decoration.line({ class: "gw-diff-hunk" }),
};

/** Tints a diff's lines by their kind, again whenever the text changes. */
const diffLines = EditorView.decorations.compute(["doc"], (state) => {
  const builder = new RangeSetBuilder<Decoration>();

  for (let number = 1; number <= state.doc.lines; number++) {
    const line = state.doc.line(number);
    const kind = kindOf(line.text);

    if (kind !== undefined) {
      builder.add(line.from, line.from, diffDecorations[kind]);
    }
  }

  return builder.finish();
});

const jsonHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--gw-color-info)" },
    { tag: tags.string, color: "var(--gw-color-success)" },
    { tag: tags.number, color: "var(--gw-color-warning)" },
    { tag: tags.bool, color: "var(--gw-color-important)" },
    { tag: tags.null, color: "var(--gw-color-text-secondary)" },
    { tag: tags.punctuation, color: "var(--gw-color-text-secondary)" },
    { tag: tags.separator, color: "var(--gw-color-text-secondary)" },
  ]),
);

/** What each `language` adds: its parser, highlighting and folds. */
const languages = {
  json: [json(), jsonHighlight, foldGutter()],
};

const isLanguage = (name: string): name is keyof typeof languages =>
  Object.hasOwn(languages, name);

/**
 * CodeMirror's own styles sit outside Groundwork's cascade layer, so the
 * view is themed here, from the tokens, to follow every theme and mode.
 */
const editorTheme = EditorView.theme({
  "&": {
    flex: "1 1 auto",
    minHeight: "0",
    maxHeight: "var(--gw-code-max-height, 32rem)",
    color: "var(--gw-color-text-primary)",
    backgroundColor: "var(--gw-color-surface-lower)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    overflow: "auto",
    overscrollBehaviorX: "contain",
    fontFamily: "var(--gw-font-mono)",
    fontSize: "var(--gw-font-size-s)",
    lineHeight: "1.5",
  },
  ".cm-content": {
    padding: "var(--gw-space-3) 0",
    caretColor: "var(--gw-color-accent)",
  },
  ".cm-line": { padding: "0 var(--gw-space-3)" },
  ".cm-gutters": {
    color: "var(--gw-color-text-secondary)",
    backgroundColor: "var(--gw-color-surface-lower)",
    border: "none",
    borderRight: "var(--gw-border-width) solid var(--gw-color-border-quiet)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-foldPlaceholder": {
    color: "var(--gw-color-accent)",
    backgroundColor: "var(--gw-color-fill-accent-quiet)",
    border: "none",
    padding: "0 var(--gw-space-1)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--gw-color-fill-accent-quiet) !important",
  },
  ".cm-searchMatch": {
    backgroundColor:
      "color-mix(in oklab, var(--gw-color-warning) 30%, transparent)",
    borderRadius: "var(--gw-radius-s)",
  },
  ".cm-searchMatch-selected": {
    backgroundColor:
      "color-mix(in oklab, var(--gw-color-accent) 45%, transparent)",
  },
  ".gw-diff-add": {
    color: "var(--gw-color-success)",
    backgroundColor: "var(--gw-color-fill-success-quiet)",
  },
  ".gw-diff-remove": {
    color: "var(--gw-color-danger)",
    backgroundColor: "var(--gw-color-fill-danger-quiet)",
  },
  ".gw-diff-hunk, .gw-diff-file": {
    color: "var(--gw-color-text-secondary)",
  },
  ".cm-panels": {
    color: "var(--gw-color-text-primary)",
    backgroundColor: "var(--gw-color-surface-default)",
  },
  ".cm-panels-top": {
    borderBottom: "var(--gw-border-width) solid var(--gw-color-border-quiet)",
  },
  ".cm-panel.cm-search": {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--gw-space-2)",
    padding:
      "var(--gw-space-2) var(--gw-space-10) var(--gw-space-2) var(--gw-space-3)",
    fontFamily: "var(--gw-font-sans)",
    fontSize: "var(--gw-font-size-xs)",
  },
  ".cm-search br": { display: "none" },
  ".cm-panel.cm-search label": {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--gw-space-1)",
  },
  ".cm-textfield, .cm-button": {
    height: "1.875rem",
    margin: "0",
    padding: "0 var(--gw-space-2)",
    font: "inherit",
    color: "var(--gw-color-text-primary)",
    backgroundColor: "var(--gw-color-surface-lower)",
    backgroundImage: "none",
    border: "var(--gw-border-width) solid var(--gw-color-border-normal)",
    borderRadius: "var(--gw-radius-m)",
  },
  ".cm-textfield:focus": {
    outline: "none",
    borderColor: "var(--gw-color-accent)",
  },
  ".cm-button": { cursor: "pointer" },
  ".cm-button:hover": { borderColor: "var(--gw-color-accent)" },
  ".cm-panel.cm-search [name=close]": {
    top: "50%",
    right: "var(--gw-space-3)",
    transform: "translateY(-50%)",
    fontSize: "var(--gw-font-size-l)",
    color: "var(--gw-color-text-secondary)",
    cursor: "pointer",
  },
});

/** The find panel's words, in sentence case. */
const searchPhrases = EditorState.phrases.of({
  Find: "Find",
  next: "Next",
  previous: "Previous",
  all: "All",
  "match case": "Match case",
  regexp: "Regex",
  "by word": "Whole word",
  close: "Close",
});

/**
 * Code or a diff, such as a patch waiting on review or a module's data, in
 * a read-only view that scrolls up to `--gw-code-max-height`, so a long one
 * never stretches the page. A toolbar wraps its lines, finds in it (with
 * match case, regex and whole word) and copies it. The view takes focus, so
 * the keyboard can select text, and Ctrl+F finds in it while it's focused.
 *
 * With `diff`, added and removed lines are tinted and hunk headers are
 * quiet. `language="json"` highlights JSON and lets its objects fold.
 * `storage-key` keeps whether someone turned wrapping on or off. A viewer
 * that fills the page can set `--gw-code-height` and take Ctrl+F anywhere
 * on the page with `find-shortcut`. Put it in a `gw-expansion`'s `draw`, so
 * a folded one isn't built until it's opened.
 *
 * @element gw-code
 * @summary Code or a diff in a read-only view, to wrap, find in and copy.
 *
 * @attr {string} content - The code.
 * @attr {boolean} diff - Reads it as a unified diff and tints its lines.
 * @attr {"json"} language - Highlights it as this language, with folds.
 * @attr {string} label - The view's accessible name, such as the file's name.
 * @attr {boolean} wrap - Wraps long lines rather than scrolling sideways; how it starts when it has a `storage-key`.
 * @attr {boolean} line-numbers - Numbers the lines.
 * @attr {boolean} find-shortcut - Ctrl+F anywhere on the page finds in it while it's shown, rather than in the page.
 * @attr {string} storage-key - Keeps whether someone turned wrapping on or off in `localStorage` under this key.
 *
 * @fires change - When someone turns wrapping on or off. Read `wrap`.
 *
 * @csspart tools - The toolbar.
 * @csspart code - The view.
 *
 * @cssprop --gw-code-max-height - How tall it grows before it scrolls. Defaults to `32rem`.
 * @cssprop --gw-code-height - A fixed height, such as to fill the page with `--gw-code-max-height: none`. Defaults to `auto`.
 */
export class GwCode extends GwElement {
  static override properties = {
    content: {},
    diff: { type: "boolean", reflect: true },
    language: {},
    label: {},
    wrap: { type: "boolean", reflect: true },
    lineNumbers: { type: "boolean", attribute: "line-numbers" },
    findShortcut: { type: "boolean", attribute: "find-shortcut" },
    storageKey: { attribute: "storage-key" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: var(--gw-code-height, auto);
        overflow: hidden;
        background: var(--gw-color-surface-lower);
        border: var(--gw-border-width) solid var(--gw-color-border-quiet);
        border-radius: var(--gw-radius-control);
      }

      .tools {
        display: flex;
        flex: none;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--gw-space-1);
        padding: var(--gw-space-1) var(--gw-space-2);
        background: var(--gw-color-surface-default);
        border-bottom: var(--gw-border-width) solid var(--gw-color-border-quiet);
      }

      .code {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
      }
    `,
  ];

  declare content: string;
  declare diff: boolean;
  declare language: string;
  declare label: string;
  declare wrap: boolean;
  declare lineNumbers: boolean;
  declare findShortcut: boolean;
  declare storageKey: string;

  readonly #wrapButton = h(
    "gw-button",
    {
      size: "xs",
      variant: "neutral",
      appearance: "plain",
      labels: "auto",
      icon: wrapIcon,
      toggle: true,
    },
    "Wrap",
  );

  readonly #findButton = h(
    "gw-button",
    {
      size: "xs",
      variant: "neutral",
      appearance: "plain",
      labels: "auto",
      icon: findIcon,
      title: "Find (Ctrl+F)",
    },
    "Find",
  );

  readonly #copyButton = h(
    "gw-button",
    {
      size: "xs",
      variant: "neutral",
      appearance: "plain",
      labels: "auto",
      icon: copyIcon,
    },
    "Copy",
  );

  readonly #tools = h(
    "div",
    { class: "tools", part: "tools", role: "toolbar", "aria-label": "Code" },
    this.#wrapButton,
    this.#findButton,
    this.#copyButton,
  );

  readonly #code = h("div", { class: "code", part: "code" });

  readonly #wrapping = new Compartment();

  readonly #numbers = new Compartment();

  readonly #syntax = new Compartment();

  readonly #name = new Compartment();

  #view: EditorView | undefined;

  #copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.content = "";
    this.diff = false;
    this.language = "";
    this.label = "";
    this.wrap = false;
    this.lineNumbers = false;
    this.findShortcut = false;
    this.storageKey = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.#onPageKeydown, true);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.#onPageKeydown, true);
  }

  /** Opens the find panel, or closes it when it's open. */
  toggleFind() {
    if (this.#view === undefined) return;

    if (searchPanelOpen(this.#view.state)) closeSearchPanel(this.#view);
    else openSearchPanel(this.#view);
  }

  /** With `find-shortcut`, Ctrl+F anywhere finds in it while it's shown. */
  readonly #onPageKeydown = (event: KeyboardEvent) => {
    const find =
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === "f";

    if (
      !find ||
      !this.findShortcut ||
      this.#view === undefined ||
      !this.checkVisibility()
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openSearchPanel(this.#view);
  };

  readonly #onWrapClick = () => {
    this.wrap = !this.wrap;

    if (this.storageKey !== "") getStorage().set(this.storageKey, this.wrap);

    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  readonly #onCopyClick = async () => {
    let copied = true;

    try {
      await navigator.clipboard.writeText(this.content);
    } catch {
      copied = false;
    }

    setAttribute(this.#copyButton, "icon", copied ? copiedIcon : copyIcon);
    this.#copyButton.textContent = copied ? "Copied" : "Couldn't copy";
    clearTimeout(this.#copiedTimer);
    this.#copiedTimer = setTimeout(() => {
      setAttribute(this.#copyButton, "icon", copyIcon);
      this.#copyButton.textContent = "Copy";
    }, copiedFor);
  };

  #syntaxFor() {
    return [
      this.diff ? diffLines : [],
      isLanguage(this.language) ? languages[this.language] : [],
    ];
  }

  protected override create(root: ShadowRoot) {
    this.#wrapButton.addEventListener("click", this.#onWrapClick);
    this.#findButton.addEventListener("click", () => this.toggleFind());
    this.#copyButton.addEventListener("click", this.#onCopyClick);
    root.append(this.#tools, this.#code);

    this.#view = new EditorView({
      state: EditorState.create({
        doc: this.content,
        extensions: [
          // Read-only but focusable, so the keyboard can select and find
          EditorState.readOnly.of(true),
          search({
            top: true,
            // A third of the way down, so the lines before it show too
            scrollToMatch: (range, view) =>
              EditorView.scrollIntoView(range, {
                y: "start",
                yMargin: view.scrollDOM.clientHeight / 3,
              }),
          }),
          keymap.of(searchKeymap),
          searchPhrases,
          editorTheme,
          this.#wrapping.of(this.wrap ? EditorView.lineWrapping : []),
          this.#numbers.of(this.lineNumbers ? lineNumbers() : []),
          this.#syntax.of(this.#syntaxFor()),
          this.#name.of(EditorView.contentAttributes.of({})),
        ],
      }),
      parent: this.#code,
      root,
    });
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("storageKey") && this.storageKey !== "") {
      const kept = getStorage().get(this.storageKey);

      if (kept === true || kept === false) this.wrap = kept;
    }

    setAttribute(this.#wrapButton, "pressed", this.wrap);

    const view = this.#view;

    if (view === undefined) return;

    const effects: StateEffect<unknown>[] = [];

    if (changed.has("wrap")) {
      effects.push(
        this.#wrapping.reconfigure(this.wrap ? EditorView.lineWrapping : []),
      );
    }

    if (changed.has("lineNumbers")) {
      effects.push(
        this.#numbers.reconfigure(this.lineNumbers ? lineNumbers() : []),
      );
    }

    if (changed.has("diff") || changed.has("language")) {
      effects.push(this.#syntax.reconfigure(this.#syntaxFor()));
    }

    if (changed.has("label")) {
      effects.push(
        this.#name.reconfigure(
          EditorView.contentAttributes.of(
            this.label === "" ? {} : { "aria-label": this.label },
          ),
        ),
      );
    }

    const current = view.state.doc.toString();

    // Replacing only changed text keeps the scroll position and folds
    // while live content updates
    view.dispatch({
      changes:
        changed.has("content") && this.content !== current
          ? { from: 0, to: current.length, insert: this.content }
          : [],
      effects,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-code": GwCode;
  }
}
