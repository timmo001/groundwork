/**
 * Styles and helpers every component shares: the base sheet, tones and icons.
 *
 * @module
 */
import { css } from "./element.js";

const svgNamespace = "http://www.w3.org/2000/svg";

/**
 * The `xs` to `xl` presets on a `size` attribute, as `--gw-<name>-scale`
 * around 1 for medium, so an app can also set any size between or beyond
 * them. A control multiplies its height and icon by `--gw-control-scale`
 * too, which follows the theme's density, and its text only by its own
 * scale, since spacing and type already follow density on their own.
 */
export const controlSizes = (name: string) => css`
  :host([size="xs"]) {
    --gw-${name}-scale: 0.6;
  }

  :host([size="small"]) {
    --gw-${name}-scale: 0.8;
  }

  :host([size="large"]) {
    --gw-${name}-scale: 1.2;
  }

  :host([size="xl"]) {
    --gw-${name}-scale: 1.4;
  }
`;

/**
 * What every component shares: box sizing, the focus ring, icons and the
 * tones that set `--gw-tone` from a `tone` attribute.
 */
export const base = css`
  :host {
    font-family: var(--gw-font-sans);
    color: var(--gw-color-text-primary);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host([hidden]),
  [hidden] {
    display: none !important;
  }

  :focus-visible {
    outline: var(--gw-focus-width) solid var(--gw-color-focus);
    outline-offset: var(--gw-focus-offset);
  }

  .icon {
    flex: none;
    width: var(--gw-icon-size, 1.25rem);
    height: var(--gw-icon-size, 1.25rem);
    fill: currentColor;
  }

  :host([tone="accent"]) {
    --gw-tone: var(--gw-color-accent);
    --gw-tone-fill: var(--gw-color-fill-accent-quiet);
    --gw-tone-border: var(--gw-color-border-accent);
  }

  :host([tone="info"]) {
    --gw-tone: var(--gw-color-info);
    --gw-tone-fill: var(--gw-color-fill-info-quiet);
    --gw-tone-border: var(--gw-color-border-info);
  }

  :host([tone="success"]) {
    --gw-tone: var(--gw-color-success);
    --gw-tone-fill: var(--gw-color-fill-success-quiet);
    --gw-tone-border: var(--gw-color-border-success);
  }

  :host([tone="warning"]) {
    --gw-tone: var(--gw-color-warning);
    --gw-tone-fill: var(--gw-color-fill-warning-quiet);
    --gw-tone-border: var(--gw-color-border-warning);
  }

  :host([tone="danger"]) {
    --gw-tone: var(--gw-color-danger);
    --gw-tone-fill: var(--gw-color-fill-danger-quiet);
    --gw-tone-border: var(--gw-color-border-danger);
  }

  :host([tone="important"]) {
    --gw-tone: var(--gw-color-important);
    --gw-tone-fill: var(--gw-color-fill-important-quiet);
    --gw-tone-border: var(--gw-color-border-important);
  }

  /* :host too, since * in a shadow root doesn't match it, and the skeletons
     pulse on their host */
  @media (prefers-reduced-motion: reduce) {
    :host,
    *,
    *::before,
    *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  }
`;

/** The tones a component's `tone` attribute takes. */
export type Tone =
  | "neutral"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "important";

/**
 * An icon from SVG path data, such as one of `@mdi/js`'s or Lucide's paths,
 * so each app picks its own set. Without a label it's hidden from assistive
 * technology. Change its path later with `setIconPath`.
 */
export const createIcon = (path: string, label?: string) => {
  const element = document.createElementNS(svgNamespace, "svg");

  element.classList.add("icon");
  element.setAttribute("viewBox", "0 0 24 24");
  element.setAttribute("role", label === undefined ? "presentation" : "img");
  element.setAttribute("aria-hidden", label === undefined ? "true" : "false");

  if (label !== undefined) element.setAttribute("aria-label", label);

  element.append(document.createElementNS(svgNamespace, "path"));
  setIconPath(element, path);

  return element;
};

/** Changes an icon's path data. */
export const setIconPath = (icon: SVGSVGElement, path: string) => {
  icon.querySelector("path")?.setAttribute("d", path);
};
