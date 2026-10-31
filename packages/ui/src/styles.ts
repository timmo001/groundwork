import { html, svg } from "lit";
import { css } from "./element.js";

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

  @media (prefers-reduced-motion: reduce) {
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
 * technology.
 */
export const icon = (path: string, label?: string) =>
  html`<svg
    class="icon"
    viewBox="0 0 24 24"
    role=${label === undefined ? "presentation" : "img"}
    aria-hidden=${label === undefined ? "true" : "false"}
    aria-label=${label ?? ""}
  >
    ${svg`<path d=${path}></path>`}
  </svg>`;

const svgNamespace = "http://www.w3.org/2000/svg";

/**
 * The same icon as an element, for components built on `GwElement`. Change
 * its path later with `setIconPath`.
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
