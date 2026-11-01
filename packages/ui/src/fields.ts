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

  /* Sizes run xs to xl through --gw-field-scale, around 1 for medium, and
     the control's height follows the theme's density too */
  :where(gw-input, gw-select)[size="xs"] {
    --gw-field-scale: 0.6;
  }

  :where(gw-input, gw-select)[size="small"] {
    --gw-field-scale: 0.8;
  }

  :where(gw-input, gw-select)[size="large"] {
    --gw-field-scale: 1.2;
  }

  :where(gw-input, gw-select)[size="xl"] {
    --gw-field-scale: 1.4;
  }

  :where(gw-input, gw-select) :where(input, textarea, .gw-select-trigger) {
    --gw-field-size: var(--gw-field-scale, 1);
    --gw-icon-size: calc(
      1.25rem * var(--gw-field-size) * var(--gw-control-scale, 1)
    );

    width: 100%;
    min-height: calc(
      2.5rem * var(--gw-field-size) * var(--gw-control-scale, 1)
    );
    padding: 0 calc(var(--gw-space-3) * var(--gw-field-size));
    font: inherit;
    font-size: calc(var(--gw-font-size-s) * var(--gw-field-size));
    color: var(--gw-color-text-strong);
    background: var(--gw-color-surface-lower);
    border: var(--gw-border-width) solid var(--gw-color-border-normal);
    border-radius: var(--gw-radius-control);
    transition: border-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  /* An icon inside the field, before the text, with the text moved clear of
     it */
  gw-input .gw-input-control {
    position: relative;
    display: flex;
    align-items: center;
  }

  gw-input .gw-input-control > .icon {
    position: absolute;
    inset-inline-start: calc(var(--gw-space-3) * var(--gw-field-scale, 1));
    width: calc(1.125rem * var(--gw-field-scale, 1));
    height: calc(1.125rem * var(--gw-field-scale, 1));
    color: var(--gw-color-text-secondary);
    pointer-events: none;
    fill: currentColor;
  }

  gw-input .gw-input-control > .icon[hidden] {
    display: none;
  }

  gw-input .gw-input-control > .icon:not([hidden]) + input {
    padding-inline-start: calc(
      (var(--gw-space-3) * 2 + 1.125rem) * var(--gw-field-scale, 1)
    );
  }

  /* A textarea keeps the field's padding on every side and grows by its
     corner, never sideways out of the layout */
  gw-input textarea {
    display: block;
    padding-block: calc(var(--gw-space-2) * var(--gw-field-size));
    line-height: 1.5;
    resize: vertical;
  }

  gw-input[monospace] :where(input, textarea) {
    font-family: var(--gw-font-mono);
  }

  gw-input .gw-optional {
    font-weight: var(--gw-font-weight-regular);
    color: var(--gw-color-text-secondary);
  }

  gw-input .gw-optional[hidden] {
    display: none;
  }

  /* The show and hide button sits inside the end of a password field, with
     the text kept clear of it */
  gw-input .gw-reveal {
    position: absolute;
    inset-inline-end: calc(var(--gw-space-1) * var(--gw-field-scale, 1));
    display: grid;
    place-items: center;
    width: calc(2rem * var(--gw-field-scale, 1));
    height: calc(2rem * var(--gw-field-scale, 1));
    padding: 0;
    color: var(--gw-color-text-secondary);
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: var(--gw-radius-control);
    transition:
      color var(--gw-motion-fast) var(--gw-motion-easing),
      background-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  gw-input .gw-reveal:hover:not(:disabled) {
    color: var(--gw-color-text-strong);
    background: var(--gw-color-fill-neutral-hovered);
  }

  gw-input .gw-reveal:focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: calc(var(--gw-focus-width) * -1);
  }

  gw-input .gw-reveal:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  gw-input .gw-reveal[hidden] {
    display: none;
  }

  gw-input .gw-reveal > .icon {
    width: calc(1.125rem * var(--gw-field-scale, 1));
    height: calc(1.125rem * var(--gw-field-scale, 1));
    fill: currentColor;
  }

  gw-input .gw-input-control:has(> .gw-reveal:not([hidden])) > input {
    padding-inline-end: calc(
      (var(--gw-space-1) + 2rem + var(--gw-space-1)) * var(--gw-field-scale, 1)
    );
  }

  /* The trigger shows the chosen option, with its icon, and a chevron with
     room around it that turns over while the list is open */
  gw-select .gw-select-trigger {
    display: flex;
    gap: calc(var(--gw-space-2) * var(--gw-field-size));
    align-items: center;
    padding-inline-end: calc(var(--gw-space-3) * var(--gw-field-size));
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

  /* With an inline label the select sits among toolbar controls, so it's a
     pill that fits its content, like the toggles and buttons beside it */
  gw-select[inline-label] {
    display: inline-flex;
  }

  gw-select[inline-label] .gw-select-trigger {
    width: auto;
    padding-inline: calc(var(--gw-space-4) * var(--gw-field-size))
      calc(var(--gw-space-3) * var(--gw-field-size));
    border-radius: var(--gw-radius-pill);
  }

  /* An inline label reads as a quiet prefix to the value */
  gw-select .gw-select-inline-label {
    flex: none;
    color: var(--gw-color-text-secondary);
  }

  gw-select .gw-select-inline-label[hidden] {
    display: none;
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

  /* With multiple, a full-width Clear under the list empties the choice */
  gw-select .gw-select-clear {
    display: block;
    width: 100%;
    min-height: 2.5rem;
    padding: 0 var(--gw-space-3);
    font: inherit;
    font-size: var(--gw-font-size-s);
    font-weight: var(--gw-font-weight-strong);
    color: var(--gw-color-text-secondary);
    cursor: pointer;
    background: none;
    border: 0;
    border-block-start: var(--gw-border-width) solid
      var(--gw-color-border-quiet);
    transition:
      color var(--gw-motion-fast) var(--gw-motion-easing),
      background-color var(--gw-motion-fast) var(--gw-motion-easing);
  }

  gw-select .gw-select-clear:hover {
    color: var(--gw-color-text-strong);
    background: var(--gw-color-fill-neutral-hovered);
  }

  gw-select .gw-select-clear:focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: calc(var(--gw-focus-width) * -1);
  }

  gw-select .gw-select-clear[hidden] {
    display: none;
  }

  :where(gw-input) .gw-input-control:focus-within > .icon {
    color: var(--gw-color-text-strong);
  }

  :where(gw-input, gw-select)
    :where(input, textarea, .gw-select-trigger):hover {
    border-color: var(--gw-color-border-loud);
  }

  :where(gw-input, gw-select, gw-switch, gw-checkbox)
    :where(input, textarea, .gw-select-trigger):focus-visible {
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

  :where(gw-input, gw-switch, gw-checkbox, gw-select) .gw-visually-hidden {
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

  gw-range {
    display: flex;
    flex-direction: column;
    gap: var(--gw-space-2);
    min-width: 0;
    font-family: var(--gw-font-sans);
    color: var(--gw-color-text-primary);
  }

  gw-range > label {
    font-size: var(--gw-font-size-s);
    font-weight: var(--gw-font-weight-strong);
    color: var(--gw-color-text-strong);
  }

  gw-range .gw-range-control {
    position: relative;
    display: block;
  }

  gw-range input {
    display: block;
    width: 100%;
    margin: 0;
    accent-color: var(--gw-color-fill-accent-resting);
    cursor: pointer;
  }

  gw-range input:focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: var(--gw-focus-offset);
  }

  gw-range input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* The value above the thumb while it's held */
  gw-range .gw-range-bubble {
    position: absolute;
    bottom: calc(100% + var(--gw-space-1));
    padding: var(--gw-space-1) var(--gw-space-2);
    font-size: var(--gw-font-size-xs);
    font-variant-numeric: tabular-nums;
    color: var(--gw-color-on-accent);
    white-space: nowrap;
    pointer-events: none;
    background: var(--gw-color-fill-accent-resting);
    border-radius: var(--gw-radius-control);
    box-shadow: var(--gw-shadow-s);
    translate: -50% 0;
  }

  gw-range .gw-range-bubble[hidden] {
    display: none;
  }

  gw-range .gw-hint {
    margin: 0;
    font-size: var(--gw-font-size-xs);
    color: var(--gw-color-text-secondary);
  }

  gw-range .gw-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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
