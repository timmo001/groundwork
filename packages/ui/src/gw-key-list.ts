/**
 * `gw-key-list`: a list of keys or gestures and what each does, for a
 * page's help.
 * Docs: https://groundwork.timmo.dev/components/overlays/#key-list
 *
 * @module
 */
import { noKeyboardQuery, touchQuery } from "./adaptive.js";
import { GwElement, css } from "./element.js";
import { adoptStyles } from "./fields.js";

const keyListStyles = css`
  /* One grid for every group, so what the keys do lines up across them */
  gw-key-list {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--gw-space-4);
  }

  gw-key-list > * {
    grid-column: 1 / -1;
  }

  @media not ${touchQuery} {
    gw-key-list[input="touch"] {
      display: none;
    }
  }

  @media ${noKeyboardQuery} {
    gw-key-list[input="keys"] {
      display: none;
    }
  }

  gw-key-list :is(h2, h3, h4, h5, h6) {
    margin: var(--gw-space-4) 0 var(--gw-space-2);
    color: var(--gw-color-text-secondary);
    font-size: var(--gw-font-size-s);
    font-weight: var(--gw-font-weight-strong);
  }

  gw-key-list > :is(h2, h3, h4, h5, h6):first-child {
    margin-block-start: 0;
  }

  gw-key-list dl {
    display: grid;
    grid-template-columns: subgrid;
    row-gap: var(--gw-space-2);
    align-items: center;
    margin: 0;
  }

  gw-key-list dl > div {
    display: contents;
  }

  gw-key-list dt {
    white-space: nowrap;
  }

  gw-key-list dd {
    margin: 0;
    color: var(--gw-color-text-secondary);
  }

  gw-key-list kbd {
    display: inline-block;
    min-inline-size: 1.5em;
    padding: 0.1em 0.4em;
    color: var(--gw-color-text-strong);
    font-family: var(--gw-font-mono);
    font-size: 0.8125em;
    text-align: center;
    background: var(--gw-color-surface-raised);
    border: 1px solid var(--gw-color-border-normal);
    border-block-end-width: 2px;
    border-radius: var(--gw-radius-s);
  }
`;

/**
 * The keys or gestures a page answers and what each does, as a page's help
 * lists them: a `<dl>` of `<dt>` (each key in a `<kbd>`, such as
 * `<kbd>Shift</kbd> + <kbd>←</kbd>`) and `<dd>`, after a heading for each
 * group where there's more than one. Keys sit in a column of their own, and
 * what they do lines up beside them across every group.
 *
 * `input` shows the list only where it applies: `touch` for gestures, where
 * there's a touch screen, and `keys` for keys, everywhere but a touch screen
 * with nothing that hovers, such as a phone. A help with both lists shows
 * both on a laptop with a touch screen.
 *
 * Its children stay in light DOM, and its styles are adopted into the
 * document or shadow root it sits in, in the components layer, so a page's
 * own CSS still wins.
 *
 * @element gw-key-list
 * @summary The keys or gestures a page answers, for its help.
 *
 * @attr {"touch"|"keys"} input - Shows it only where a touch screen (`touch`) or a keyboard (`keys`) is likely. Leave it out to always show it.
 *
 * @slot - Headings and `<dl>` lists of keys or gestures.
 */
export class GwKeyList extends GwElement {
  static override shadow = false;

  static override properties = {
    input: { reflect: true },
  } as const;

  declare input: "touch" | "keys" | undefined;

  override connectedCallback() {
    super.connectedCallback();
    adoptStyles(this, keyListStyles);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-key-list": GwKeyList;
  }
}
