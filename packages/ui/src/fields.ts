import { LitElement, css, type CSSResult } from "lit";

/**
 * Field components render their native control in light DOM, never in a
 * shadow root: password managers and `<label for>` can't reach across one,
 * and a form only submits controls it can see. Their styles are adopted into
 * whichever document or shadow root they sit in.
 */
export const fieldStyles = css`
  :where(gw-input, gw-select, gw-switch, gw-checkbox) {
    display: flex;
    flex-direction: column;
    gap: var(--gw-space-2);
    font-family: var(--gw-font-sans);
    color: var(--gw-color-text-primary);
  }

  :where(gw-input, gw-select) > label {
    font-size: var(--gw-font-size-s);
    font-weight: var(--gw-font-weight-strong);
    color: var(--gw-color-text-strong);
  }

  :where(gw-input, gw-select) :where(input, select) {
    width: 100%;
    min-height: 2.5rem;
    padding: 0 var(--gw-space-3);
    font: inherit;
    font-size: var(--gw-font-size-s);
    color: var(--gw-color-text-strong);
    background: var(--gw-color-surface-lower);
    border: var(--gw-border-width) solid var(--gw-color-border-normal);
    border-radius: var(--gw-radius-control);
    transition: border-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  :where(gw-input, gw-select) :where(input, select):hover {
    border-color: var(--gw-color-border-loud);
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox)
    :where(input, select):focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: var(--gw-focus-offset);
  }

  :where(gw-input, gw-select) [aria-invalid="true"] {
    border-color: var(--gw-color-border-danger);
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox) :disabled {
    color: var(--gw-color-text-disabled);
    cursor: not-allowed;
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox) .gw-hint {
    margin: 0;
    font-size: var(--gw-font-size-xs);
    color: var(--gw-color-text-secondary);
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox) .gw-error {
    margin: 0;
    font-size: var(--gw-font-size-xs);
    color: var(--gw-color-danger);
  }

  :where(gw-switch, gw-checkbox) > label {
    display: inline-flex;
    gap: var(--gw-space-3);
    align-items: center;
    font-size: var(--gw-font-size-s);
    cursor: pointer;
  }

  :where(gw-switch, gw-checkbox) .gw-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  gw-checkbox input {
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    accent-color: var(--gw-color-fill-accent-resting);
  }

  gw-switch input {
    position: relative;
    flex: none;
    width: 2.5rem;
    height: 1.5rem;
    margin: 0;
    cursor: pointer;
    appearance: none;
    background: var(--gw-color-surface-lower);
    border: var(--gw-border-width) solid var(--gw-color-border-loud);
    border-radius: var(--gw-radius-pill);
    transition: background-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  gw-switch input::after {
    position: absolute;
    inset-block-start: 0.1875rem;
    inset-inline-start: 0.1875rem;
    width: 1rem;
    height: 1rem;
    content: "";
    background: var(--gw-color-text-secondary);
    border-radius: 50%;
    transition: translate var(--gw-motion-fast) var(--gw-motion-easing);
  }

  gw-switch input:checked {
    background: var(--gw-color-fill-accent-resting);
    border-color: transparent;
  }

  gw-switch input:checked::after {
    translate: 1rem 0;
    background: var(--gw-color-on-accent);
  }

  gw-switch input:disabled {
    opacity: 0.5;
  }
`;

const adoptStyles = (element: Element, styles: CSSResult) => {
  const root = element.getRootNode();
  const sheet = styles.styleSheet;

  if (sheet === undefined) return;

  if (root instanceof Document || root instanceof ShadowRoot) {
    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
  }
};

let lastId = 0;

/** An id for a control, unique on the page, for labels and descriptions. */
export const fieldId = () => {
  lastId += 1;

  return `gw-field-${lastId}`;
};

/** A component that renders into itself, so its native control stays in light DOM. */
export class LightElement extends LitElement {
  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    adoptStyles(this, fieldStyles);
  }
}
