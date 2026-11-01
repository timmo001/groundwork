/**
 * The small scrollbars `themes.css` gives the page, as a sheet for shadow
 * roots, which the page's rules can't reach, and the page scroll tracking
 * that squares the window's thumb off at its ends.
 *
 * @module
 */

/**
 * The page's scrollbars for a shadow root: a small rounded thumb on a clear
 * track with no arrow buttons, squaring off at the ends of its track. Every
 * `gw-` element adopts it; add it to an app's own components' styles to match.
 * The `--gw-scrollbar-*` properties restyle it as they do the page's.
 */
export const scrollbars = new CSSStyleSheet();

scrollbars.replaceSync(`
  @supports not selector(::-webkit-scrollbar) {
    * {
      scrollbar-width: thin;
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
    width: var(--gw-scrollbar-size, 0.4rem);
    height: var(--gw-scrollbar-size, 0.4rem);
    background: var(--gw-scrollbar-track, transparent);
  }

  ::-webkit-scrollbar-thumb {
    background: var(
      --gw-scrollbar-thumb,
      color-mix(
        in oklab,
        var(--gw-color-text-secondary, currentColor) 45%,
        transparent
      )
    );
    border-radius:
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-top, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-top, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-bottom, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-bottom, 1));
  }

  ::-webkit-scrollbar-thumb:horizontal {
    border-radius:
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-left, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-right, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-right, 1))
      calc(var(--gw-scrollbar-size, 0.4rem) * var(--gw-scrollbar-left, 1));
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(
      --gw-scrollbar-thumb,
      color-mix(
        in oklab,
        var(--gw-color-text-secondary, currentColor) 70%,
        transparent
      )
    );
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
`);

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
