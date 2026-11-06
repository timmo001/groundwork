/**
 * The report page's own CSS: the page's surface and type, and the few
 * blocks Groundwork has no element for (stats and the breakdown bar), all on
 * the `--gw-*` tokens so every theme applies.
 *
 * @module
 */
export const reportCss = `
html {
  background: var(--gw-color-surface-default);
  color: var(--gw-color-text-primary);
  font-family: var(--gw-font-sans);
  font-size: var(--gw-font-size-m);
  line-height: 1.5;
  color-scheme: light dark;
}

body {
  margin: 0;
}

gw-page {
  padding-block: var(--gw-space-4) var(--gw-space-12);
}

a {
  color: var(--gw-color-link);
  text-decoration-color: color-mix(in oklch, currentColor 40%, transparent);
  text-underline-offset: 0.15em;
}

a:hover {
  text-decoration-color: currentColor;
}

code,
.gw-report-mono {
  font-family: var(--gw-font-mono);
  font-size: 0.92em;
}

code {
  padding: 0.05em 0.3em;
  border-radius: var(--gw-radius-xs);
  background: var(--gw-color-fill-neutral-resting);
}

.gw-report-brand {
  display: inline-flex;
  gap: var(--gw-space-2);
  align-items: center;
  color: var(--gw-color-text-strong);
  font-weight: var(--gw-font-weight-strong);
  text-decoration: none;
}

.gw-report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gw-space-2);
  align-items: center;
  margin-top: calc(-1 * var(--gw-space-3));
}

.gw-report-section {
  display: flex;
  flex-direction: column;
  gap: var(--gw-space-4);
  scroll-margin-top: var(--gw-space-12);
}

.gw-report-lede,
.gw-report-paragraph,
.gw-report-note {
  margin: 0;
  max-width: 72ch;
}

.gw-report-lede,
.gw-report-muted {
  color: var(--gw-color-text-secondary);
}

.gw-report-note {
  color: var(--gw-color-text-secondary);
  font-size: var(--gw-font-size-s);
}

.gw-report-section > .gw-report-lede {
  margin-top: calc(-1 * var(--gw-space-2));
}

.gw-report-heading {
  margin: var(--gw-space-2) 0 0;
  color: var(--gw-color-text-strong);
  font-size: var(--gw-font-size-m);
  font-weight: var(--gw-font-weight-strong);
}

.gw-report-delta {
  margin-inline-start: var(--gw-space-2);
  color: var(--gw-color-text-secondary);
  font-family: var(--gw-font-figures);
  font-size: var(--gw-font-size-xs);
  font-variant-numeric: tabular-nums;
  font-weight: var(--gw-font-weight-regular);
}

.gw-report-chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--gw-space-1);
  align-items: center;
  vertical-align: middle;
}

/* A block of its own, so a linked chip lines up with the chips beside it
   rather than sitting on the text's baseline */
.gw-report-chip-link {
  display: inline-flex;
  text-decoration: none;
}

.gw-report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--gw-space-3);
}

.gw-report-stat {
  display: flex;
  flex-direction: column;
  gap: var(--gw-space-1);
  padding: var(--gw-space-3) var(--gw-space-4);
  border: 1px solid var(--gw-color-border-quiet);
  border-radius: var(--gw-radius-panel);
  background: var(--gw-color-surface-raised);
}

.gw-report-stat strong {
  color: var(--gw-color-text-strong);
  font-family: var(--gw-font-figures);
  font-size: var(--gw-font-size-2xl);
  font-variant-numeric: tabular-nums;
  font-weight: var(--gw-font-weight-strong);
  line-height: 1.1;
}

.gw-report-stat span {
  display: inline-flex;
  gap: var(--gw-space-2);
  align-items: center;
  color: var(--gw-color-text-secondary);
  font-size: var(--gw-font-size-s);
}

.gw-report-stat .gw-report-delta {
  margin: 0;
}

.gw-report-breakdown {
  display: flex;
  overflow: hidden;
  height: 0.75rem;
  border-radius: var(--gw-radius-pill);
  background: var(--gw-color-fill-neutral-resting);
}

.gw-report-breakdown[data-size="small"] {
  min-width: 6rem;
  height: 0.5rem;
}

.gw-report-breakdown > span {
  min-width: 0;
}

.gw-report-breakdown > span + span {
  box-shadow: inset 2px 0 0 var(--gw-color-surface-raised);
}

.gw-report-breakdown > [data-tone="neutral"] { background: var(--gw-color-border-loud); }
.gw-report-breakdown > [data-tone="accent"] { background: var(--gw-color-accent); }
.gw-report-breakdown > [data-tone="info"] { background: var(--gw-color-info); }
.gw-report-breakdown > [data-tone="success"] { background: var(--gw-color-success); }
.gw-report-breakdown > [data-tone="warning"] { background: var(--gw-color-warning); }
.gw-report-breakdown > [data-tone="danger"] { background: var(--gw-color-danger); }
.gw-report-breakdown > [data-tone="important"] { background: var(--gw-color-important); }

.gw-report-cards {
  --gw-grid-min: 20rem;
}

.gw-report-list {
  margin: 0;
  padding-inline-start: var(--gw-space-5);
}

.gw-report-list li + li {
  margin-top: var(--gw-space-2);
}

.gw-report-list ul {
  margin: var(--gw-space-1) 0 0;
  padding-inline-start: var(--gw-space-5);
  font-size: var(--gw-font-size-s);
}

.gw-report-list ul li + li {
  margin-top: 0;
}
`;
