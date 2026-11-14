/**
 * `gw-control-group`: controls that work together on one pill, such as a
 * day with its arrows or a zoom with its steps.
 * Docs: https://groundwork.timmo.dev/components/actions/#control-group
 *
 * It's light DOM, like the fields: its children stay its own, so its styles,
 * adopted into the document or shadow root it sits in, reach their parts and
 * the fields' triggers.
 *
 * @module
 */
import { GwElement, css } from "./element.js";
import { adoptStyles } from "./fields.js";

/**
 * The track and what it does to the controls on it. Each control is a
 * section, parted from the one before by a line, square where it meets
 * another and rounded only at the pill's two ends, so a hovered or pressed
 * one fills its whole section rather than floating inside it.
 */
export const controlGroupStyles = css`
  :where(gw-control-group) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: stretch;
    box-sizing: border-box;
    max-width: 100%;
    vertical-align: middle;
    font-family: var(--gw-font-sans);
    color: var(--gw-color-text-primary);
    background: var(
      --gw-control-group-background,
      var(--gw-color-surface-lower)
    );
    border: max(var(--gw-border-width), 1px) solid
      var(--gw-control-group-border-color, var(--gw-color-border-normal));
    border-radius: var(--gw-control-group-radius, var(--gw-radius-pill));
  }

  :where(gw-control-group)[hidden] {
    display: none;
  }

  /* Square between sections; the first and last shown round on the
     pill's outer side */
  gw-control-group > * {
    --_gw-group-start: 0px;
    --_gw-group-end: 0px;

    flex: none;
  }

  gw-control-group > :not([hidden]):not(:not([hidden]) ~ *) {
    --_gw-group-start: var(--gw-control-group-radius, var(--gw-radius-pill));
  }

  gw-control-group > :not([hidden]):not(:has(~ :not([hidden]))) {
    --_gw-group-end: var(--gw-control-group-radius, var(--gw-radius-pill));
  }

  /* A line before every section but the first. Set the property on one
     control to change or drop the line before it */
  gw-control-group > :not([hidden]) ~ :not([hidden]) {
    border-inline-start: 1px solid
      var(--gw-control-group-separator, var(--gw-color-border-quiet));
  }

  /* Each control fills its section's height. Never on a hidden one, which
     would show it again */
  gw-control-group
    > :is(
      gw-button,
      gw-menu-button,
      gw-segmented,
      gw-select,
      gw-date-picker
    ):not([hidden]) {
    display: flex;
  }

  /* Buttons draw as plain ones in their own color, with no fill or outline
     until they're hovered or pressed */
  gw-control-group > gw-button::part(button),
  gw-control-group > gw-menu-button::part(trigger) {
    height: auto;
    background: transparent;
    border-color: transparent;
    border-start-start-radius: var(--_gw-group-start);
    border-end-start-radius: var(--_gw-group-start);
    border-start-end-radius: var(--_gw-group-end);
    border-end-end-radius: var(--_gw-group-end);
    scale: none;
  }

  gw-control-group > gw-button::part(button) {
    color: var(--gw-button-ink, var(--gw-button-tone));
  }

  gw-control-group > gw-menu-button::part(trigger) {
    color: var(--gw-color-text-strong);
  }

  gw-control-group > gw-menu-button[active]::part(trigger) {
    color: var(--gw-color-accent);
  }

  gw-control-group > gw-button:not([disabled])::part(button):hover,
  gw-control-group > gw-menu-button::part(trigger):hover {
    background: var(
      --gw-control-group-hovered,
      var(--gw-color-fill-neutral-hovered)
    );
  }

  gw-control-group > gw-button:not([disabled])::part(button):active,
  gw-control-group > gw-menu-button::part(trigger):active {
    background: var(
      --gw-control-group-pressed,
      var(--gw-color-fill-neutral-pressed)
    );
  }

  /* A toggle that's on keeps its tint, as it has out of a group */
  gw-control-group > gw-button[toggle][pressed]::part(button) {
    background: color-mix(in oklch, var(--gw-button-tone) 16%, transparent);
  }

  gw-control-group > gw-button[disabled]::part(button) {
    color: var(--gw-color-text-disabled);
    background: transparent;
  }

  /* Inset, so the ring stays inside its section rather than over the line
     or the track's edge */
  gw-control-group > gw-button::part(button):focus-visible,
  gw-control-group > gw-menu-button::part(trigger):focus-visible {
    outline-offset: calc(var(--gw-focus-width) * -1);
  }

  /* A segmented control's own track gives way to the group's; its options
     and picked pill stay as they are */
  gw-control-group > gw-segmented::part(track) {
    align-items: center;
    background: transparent;
    border-color: transparent;
  }

  /* Icon-only options are square, so the picked pill is a circle */
  gw-control-group > gw-segmented[labels="hide"]::part(option) {
    aspect-ratio: 1;
    justify-content: center;
    padding: 0;
  }

  /* A select's or date picker's trigger draws as the buttons do. Give it
     label-hidden or inline-label, since a label above would sit inside the
     pill */
  gw-control-group
    > :is(gw-select, gw-date-picker)
    > :is(.gw-select-trigger, .gw-date-picker-trigger) {
    flex: 1;
    background: transparent;
    border-color: transparent;
    border-start-start-radius: var(--_gw-group-start);
    border-end-start-radius: var(--_gw-group-start);
    border-start-end-radius: var(--_gw-group-end);
    border-end-end-radius: var(--_gw-group-end);
  }

  gw-control-group
    > :is(gw-select, gw-date-picker)
    > :is(.gw-select-trigger, .gw-date-picker-trigger):hover:not(:disabled) {
    background: var(
      --gw-control-group-hovered,
      var(--gw-color-fill-neutral-hovered)
    );
  }

  gw-control-group
    > :is(gw-select, gw-date-picker)
    > :is(.gw-select-trigger, .gw-date-picker-trigger):active:not(:disabled) {
    background: var(
      --gw-control-group-pressed,
      var(--gw-color-fill-neutral-pressed)
    );
  }

  gw-control-group
    > :is(gw-select, gw-date-picker)
    > :is(.gw-select-trigger, .gw-date-picker-trigger):focus-visible {
    outline-offset: calc(var(--gw-focus-width) * -1);
  }

  gw-control-group
    > :is(gw-select, gw-date-picker)
    > :is(.gw-select-trigger, .gw-date-picker-trigger)[aria-invalid="true"] {
    border-color: var(--gw-color-border-danger);
  }

  /* Forced colors drop the tint that marks a toggle that's on, so it takes
     the system's selection colors, as it does out of a group */
  @media (forced-colors: active) {
    gw-control-group > gw-button[toggle][pressed]::part(button) {
      color: HighlightText;
      background: Highlight;
      forced-color-adjust: none;
    }
  }
`;

/**
 * Controls that work together on one pill-shaped track, the same surface and
 * border as `gw-segmented`'s, such as a day between its previous and next
 * arrows, or a picture's fit or fill beside its zoom steps.
 *
 * Put `gw-button`, `gw-menu-button`, `gw-segmented`, `gw-select` or
 * `gw-date-picker` inside. Each is a section, parted from the one before by a
 * quiet line. They draw with no fill or outline of their own, and a hovered or
 * pressed one fills its whole section: square where it meets the next, and
 * rounded only at the pill's two ends. A `gw-segmented` loses its own track,
 * and with `labels="hide"` its options are square, so the picked one is a
 * circle. A select or date picker needs `label-hidden` or `inline-label`.
 *
 * It's a `group` for assistive technology, named by `label`. Its children
 * stay in light DOM, and its styles are adopted into the document or shadow
 * root it sits in, in the components layer, so a page's own CSS still wins.
 *
 * @element gw-control-group
 * @summary Controls that work together on one pill.
 *
 * @attr {string} label - The group's accessible name, such as `Zoom` or `Day`.
 *
 * @slot - The controls, each a section of the pill.
 *
 * @cssprop --gw-control-group-background - The track's fill. Defaults to `--gw-color-surface-lower`.
 * @cssprop --gw-control-group-border-color - The track's border. Defaults to `--gw-color-border-normal`.
 * @cssprop --gw-control-group-radius - The pill's corners, and its end sections' outer ones. Defaults to `--gw-radius-pill`.
 * @cssprop --gw-control-group-separator - The line before each section after the first. Set it on one control, such as to `transparent`, to change only the line before it. Defaults to `--gw-color-border-quiet`.
 * @cssprop --gw-control-group-hovered - A section's fill under the pointer. Defaults to `--gw-color-fill-neutral-hovered`.
 * @cssprop --gw-control-group-pressed - A section's fill while it's pressed. Defaults to `--gw-color-fill-neutral-pressed`.
 */
export class GwControlGroup extends GwElement {
  static override shadow = false;

  static override properties = {
    label: {},
  } as const;

  declare label: string;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.label = "";
    this.#internals.role = "group";
  }

  override connectedCallback() {
    super.connectedCallback();
    adoptStyles(this, controlGroupStyles);
  }

  protected override update() {
    this.#internals.ariaLabel = this.label || null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-control-group": GwControlGroup;
  }
}
