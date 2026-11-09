/**
 * The small scrollbars `themes.css` gives the page, as a sheet for shadow
 * roots, which the page's rules can't reach, and the page scroll tracking
 * that squares the window's thumb off at its ends.
 *
 * @module
 */

/**
 * The scrollbars inside a shadow root, which the page's rules can't reach: a
 * rounded thumb on a clear track with no arrow buttons, squaring off at the
 * ends of its track, as the page's are, but thinner and fainter until it's
 * hovered, so a menu's, list's or table's scrollbar keeps out of the way of
 * what it scrolls. Every `gw-` element adopts it; add it to an app's own
 * components' styles to match.
 *
 * Each element restyles its own through `--gw-<element>-scrollbar-size`,
 * `-radius`, `-thumb`, `-thumb-hovered` and `-track`, such as
 * `--gw-table-scrollbar-radius: 0` (`scrollbarHooks` maps them). Unset, they
 * fall back to `--gw-scrollbar-inner-*` for every element's, then the page's
 * `--gw-scrollbar-size`, `--gw-scrollbar-thumb` and `--gw-scrollbar-track`.
 * It's in the components layer, `componentsLayer` in `element.ts`, which
 * imports this module, so the name is written out here.
 */
export const scrollbars = new CSSStyleSheet();

/** One of the scrollbar's hooks: the element's own, every element's, then the page's. */
const hook = (name: string, page: string) =>
  `var(--_gw-scrollbar-${name}, var(--gw-scrollbar-inner-${name}, ${page}))`;

const size = hook("size", "var(--gw-scrollbar-size, 0.25rem)");

const radius = hook("radius", size);

const track = hook("track", "var(--gw-scrollbar-track, transparent)");

const thumb = (name: string, strength: number) =>
  hook(
    name,
    `var(--gw-scrollbar-thumb, color-mix(in oklab, var(--gw-color-text-secondary, currentColor) ${strength}%, transparent))`,
  );

const scrollbarParts = [
  "size",
  "radius",
  "thumb",
  "thumb-hovered",
  "track",
] as const;

const hookSheets = new Map<string, CSSStyleSheet>();

/**
 * The sheet that gives an element its own scrollbar hooks,
 * `--gw-<element>-scrollbar-*`, named from its tag without the `gw-`, so a
 * menu's scrollbar can differ from a table's. Each is set on the host, where
 * an unset hook leaves its scrollbars to the shared ones rather than taking
 * the enclosing element's. `GwElement` adopts it beside `scrollbars`.
 */
export const scrollbarHooks = (tag: string) => {
  const name = tag.replace(/^gw-/, "");
  const kept = hookSheets.get(name);

  if (kept !== undefined) return kept;

  const sheet = new CSSStyleSheet();

  sheet.replaceSync(`@layer groundwork.components {
  :host {
${scrollbarParts.map((part) => `    --_gw-scrollbar-${part}: var(--gw-${name}-scrollbar-${part});`).join("\n")}
  }
}`);
  hookSheets.set(name, sheet);

  return sheet;
};

scrollbars.replaceSync(`@layer groundwork.components {
  @supports not selector(::-webkit-scrollbar) {
    * {
      scrollbar-width: thin;
      scrollbar-color: ${thumb("thumb", 25)} ${track};
    }
  }

  * {
    animation:
      gw-scrollbar-edges-y linear both,
      gw-scrollbar-edges-x linear both;
    animation-timeline: scroll(self y), scroll(self x);
  }

  @keyframes gw-scrollbar-edges-y {
    0% {
      --gw-scrollbar-top: 0;
    }

    1% {
      --gw-scrollbar-top: 1;
    }

    99% {
      --gw-scrollbar-bottom: 1;
    }

    100% {
      --gw-scrollbar-bottom: 0;
    }
  }

  @keyframes gw-scrollbar-edges-x {
    0% {
      --gw-scrollbar-left: 0;
    }

    1% {
      --gw-scrollbar-left: 1;
    }

    99% {
      --gw-scrollbar-right: 1;
    }

    100% {
      --gw-scrollbar-right: 0;
    }
  }

  ::-webkit-scrollbar {
    width: ${size};
    height: ${size};
    background: ${track};
  }

  ::-webkit-scrollbar-thumb {
    background: ${thumb("thumb", 25)};
    border-radius:
      calc(${radius} * var(--gw-scrollbar-top, 1))
      calc(${radius} * var(--gw-scrollbar-top, 1))
      calc(${radius} * var(--gw-scrollbar-bottom, 1))
      calc(${radius} * var(--gw-scrollbar-bottom, 1));
  }

  ::-webkit-scrollbar-thumb:horizontal {
    border-radius:
      calc(${radius} * var(--gw-scrollbar-left, 1))
      calc(${radius} * var(--gw-scrollbar-right, 1))
      calc(${radius} * var(--gw-scrollbar-right, 1))
      calc(${radius} * var(--gw-scrollbar-left, 1));
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${thumb("thumb-hovered", 60)};
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
}`);

let followingPageScroll = false;

/**
 * Sets `--gw-scrollbar-top`, `-bottom`, `-left` and `-right` on the root as
 * the page scrolls, 0 against that end and 1 elsewhere, so the window's
 * scrollbar thumb squares off at the ends like the others. The window's
 * scrollbar doesn't repaint for the scroll-driven animation the themes give
 * other scrollers. Every `gw-` element starts it when it's defined.
 */
export const followPageScroll = () => {
  if (followingPageScroll) return;

  followingPageScroll = true;

  const root = document.documentElement;

  const set = (edge: string, against: boolean) => {
    const value = against ? "0" : "1";

    if (root.style.getPropertyValue(`--gw-scrollbar-${edge}`) !== value)
      root.style.setProperty(`--gw-scrollbar-${edge}`, value);
  };

  const update = () => {
    const page = document.scrollingElement ?? root;

    set("top", page.scrollTop <= 0);
    set("bottom", page.scrollTop + page.clientHeight >= page.scrollHeight - 1);
    set("left", page.scrollLeft <= 0);
    set("right", page.scrollLeft + page.clientWidth >= page.scrollWidth - 1);
  };

  update();
  addEventListener("scroll", update, { passive: true });
  new ResizeObserver(update).observe(root);
};
