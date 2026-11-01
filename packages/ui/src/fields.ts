/**
 * What the form fields share: the light DOM base and the styles for labels,
 * hints, errors and the select's trigger and list.
 *
 * @module
 */
import { GwElement, css } from "./element.js";

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

  :where(gw-input, gw-select) .gw-field-heading {
    display: flex;
    gap: var(--gw-space-1);
    align-items: center;
  }

  :where(gw-input, gw-select) .gw-field-heading > label {
    font-size: var(--gw-font-size-s);
    font-weight: var(--gw-font-weight-strong);
    color: var(--gw-color-text-strong);
  }

  /* The (i) button by the label that opens a field's longer help */
  :where(gw-input, gw-select) .gw-info {
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    color: var(--gw-color-text-secondary);
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: var(--gw-radius-pill);
    transition:
      color var(--gw-motion-fast) var(--gw-motion-easing),
      background-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  :where(gw-input, gw-select) .gw-info:hover {
    color: var(--gw-color-text-strong);
    background: var(--gw-color-fill-neutral-hovered);
  }

  :where(gw-input, gw-select) .gw-info:focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: var(--gw-focus-offset);
  }

  :where(gw-input, gw-select) .gw-info[hidden] {
    display: none;
  }

  :where(gw-input, gw-select) .gw-info > .icon {
    width: 1rem;
    height: 1rem;
    fill: currentColor;
  }

  :where(gw-input, gw-select) :where(input, .gw-select-trigger) {
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

  /* The trigger shows the chosen option, with its icon, and a chevron with
     room around it that turns over while the list is open */
  gw-select .gw-select-trigger {
    display: flex;
    gap: var(--gw-space-2);
    align-items: center;
    padding-inline-end: var(--gw-space-3);
    text-align: start;
    cursor: pointer;
  }

  gw-select .gw-select-value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  gw-select .gw-select-value[data-placeholder] {
    color: var(--gw-color-text-secondary);
  }

  gw-select .gw-select-trigger > .icon {
    flex: none;
    width: var(--gw-icon-size, 1.25rem);
    height: var(--gw-icon-size, 1.25rem);
    fill: currentColor;
  }

  gw-select .gw-select-trigger > .icon:last-child {
    color: var(--gw-color-text-secondary);
    transition: rotate var(--gw-motion-normal) var(--gw-motion-easing);
  }

  gw-select[open] .gw-select-trigger > .icon:last-child {
    rotate: 180deg;
  }

  gw-select .gw-select-trigger > .icon[hidden] {
    display: none;
  }

  /* The list opens under the trigger, growing from it, or as a bottom sheet
     sliding up on phones */
  gw-select .gw-select-popup {
    position: fixed;
    inset: unset;
    box-sizing: border-box;
    max-width: calc(100vw - 12px);
    padding: 0;
    margin: 0;
    overflow: hidden;
    color: var(--gw-color-text-primary);
    background: var(--gw-color-surface-overlay);
    border: max(var(--gw-border-width), 1px) solid var(--gw-color-border-normal);
    border-radius: var(--gw-radius-panel);
    box-shadow: var(--gw-shadow-l);
    opacity: 0;
    scale: 1 0.96;
    transform-origin: top;
    transition:
      opacity var(--gw-motion-fast) var(--gw-motion-easing),
      scale var(--gw-motion-normal) var(--gw-motion-easing),
      translate var(--gw-motion-normal) var(--gw-motion-easing),
      display var(--gw-motion-normal) allow-discrete,
      overlay var(--gw-motion-normal) allow-discrete;
  }

  gw-select .gw-select-popup[data-placement="above"] {
    transform-origin: bottom;
  }

  gw-select .gw-select-popup:popover-open {
    opacity: 1;
    scale: 1;
  }

  @starting-style {
    gw-select .gw-select-popup:popover-open {
      opacity: 0;
      scale: 1 0.96;
    }
  }

  gw-select .gw-select-popup[data-placement="sheet"] {
    inset: auto 0 0;
    width: 100%;
    max-width: none;
    padding-block-end: env(safe-area-inset-bottom);
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    scale: 1;
    translate: 0 100%;
    --gw-option-list-height: 60vh;
  }

  gw-select .gw-select-popup[data-placement="sheet"]:popover-open {
    translate: 0 0;
  }

  @starting-style {
    gw-select .gw-select-popup[data-placement="sheet"]:popover-open {
      translate: 0 100%;
    }
  }

  gw-select .gw-select-popup[data-placement="sheet"]::backdrop {
    background: rgb(0 0 0 / 40%);
  }

  :where(gw-input, gw-select) :where(input, .gw-select-trigger):hover {
    border-color: var(--gw-color-border-loud);
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox)
    :where(input, .gw-select-trigger):focus-visible {
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

  :where(gw-switch, gw-checkbox, gw-select) .gw-visually-hidden {
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
    transition:
      background-color var(--gw-motion-normal) var(--gw-motion-easing),
      border-color var(--gw-motion-normal) var(--gw-motion-easing);
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
    transition:
      translate var(--gw-motion-normal) var(--gw-motion-easing),
      background-color var(--gw-motion-normal) var(--gw-motion-easing);
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

const adoptStyles = (element: Element, sheet: CSSStyleSheet) => {
  const root = element.getRootNode();

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
export class LightElement extends GwElement {
  static override shadow = false;

  override connectedCallback() {
    super.connectedCallback();
    adoptStyles(this, fieldStyles);
  }
}
