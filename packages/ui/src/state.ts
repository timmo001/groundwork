/**
 * The rules every shadow root needs to beat its element's own styles: the
 * `hidden` attribute and reduced motion, in a layer above the components
 * layer, so they win without `!important`.
 *
 * @module
 */

/**
 * The cascade layer for the state rules. It's ordered after the components
 * layer, `componentsLayer` in `element.ts`, which imports this module, so the
 * names are written out here.
 */
export const stateLayer = "groundwork.state";

/**
 * Hides anything with `hidden`, and under reduced motion stops every
 * animation and transition except a loading ring's turn (`.ring`), which
 * shows that something is still happening rather than decorating it. Every
 * `gw-` element adopts it last. Being in a layer rather than `!important`, a
 * page's own rules on a host or a part still win, so an app can keep a
 * skeleton pulsing or show a hidden element its own way.
 */
export const state = new CSSStyleSheet();

state.replaceSync(`@layer groundwork.components, ${stateLayer};

@layer ${stateLayer} {
  :host([hidden]),
  [hidden] {
    display: none;
  }

  /* :host too, since * in a shadow root doesn't match it, and the skeletons
     pulse on their host */
  @media (prefers-reduced-motion: reduce) {
    :host,
    *,
    *::before,
    *::after {
      animation-duration: 0s;
      transition-duration: 0s;
    }

    .ring {
      animation-duration: revert-layer;
    }
  }
}`);
