/**
 * `gw-app-bar`: a header pinned to the top, floating once the page scrolls.
 * Docs: https://groundwork.timmo.dev/components/layout/#app-bar
 *
 * @module
 */
import { GwElement, css, h, setAttribute } from "./element.js";
import { base, createIcon, setIconPath } from "./styles.js";

// MDI's menu and close
const menuIcon = "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";

const closeIcon =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/** Below this width the nav moves into a menu. */
const menuBelow = 600;

/**
 * A site or app header pinned to the top of the page, with a brand, nav
 * links and actions, full width with its content kept to the content width.
 * It's transparent at first, then gets a blurred surface and a bottom border
 * once the page scrolls, or once the element
 * `reveal-after` names scrolls out of view, such as a hero. With
 * `reveal-after` the brand stays hidden until then, so a large logo in the
 * hero hands over to the small one in the bar.
 *
 * `overlay` lays it over the top of the page rather than taking room, for a
 * page that opens with a hero. Below 600px wide the nav moves into a menu
 * opened from a button, which closes on Esc, a click outside or a link.
 *
 * @element gw-app-bar
 * @summary A header pinned to the top, floating once the page scrolls.
 *
 * @attr {string} reveal-after - A CSS selector for the element, such as a hero, to scroll past before the bar floats and the brand shows.
 * @attr {boolean} overlay - Lays the bar over the top of the page instead of taking room.
 * @attr {boolean} floating - Whether it floats. Set by the bar as the page scrolls.
 * @attr {boolean} menu-open - Whether the nav menu is open on narrow screens.
 * @attr {string} menu-label - The menu button's accessible name. Defaults to `Menu`.
 *
 * @slot brand - A logo or name linking home.
 * @slot - The nav links.
 * @slot actions - Icon links and buttons at the end.
 *
 * @csspart bar - The bar.
 * @csspart nav - The nav links' container, the menu panel on narrow screens.
 *
 * @fires {Event} toggle - When the nav menu opens or closes.
 */
export class GwAppBar extends GwElement {
  static override properties = {
    revealAfter: { attribute: "reveal-after" },
    overlay: { type: "boolean", reflect: true },
    floating: { type: "boolean", reflect: true },
    menuOpen: { type: "boolean", attribute: "menu-open", reflect: true },
    menuLabel: { attribute: "menu-label" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        position: sticky;
        inset-block-start: 0;
        z-index: 50;
        display: block;
      }

      :host([overlay]) {
        position: fixed;
        inset-inline: 0;
      }

      .bar {
        position: relative;
        display: flex;
        gap: var(--gw-space-3);
        align-items: center;
        min-height: 3.5rem;
        padding: var(--gw-space-1)
          max(var(--gw-space-3), (100% - var(--gw-content-width)) / 2);
        border-block-end: max(var(--gw-border-width), 1px) solid transparent;
        transition:
          background-color var(--gw-motion-normal) var(--gw-motion-easing),
          border-color var(--gw-motion-normal) var(--gw-motion-easing),
          backdrop-filter var(--gw-motion-normal) var(--gw-motion-easing);
      }

      :host([floating]) .bar,
      :host([menu-open]) .bar {
        background: color-mix(
          in oklab,
          var(--gw-color-surface-default) 82%,
          transparent
        );
        border-color: var(--gw-color-border-quiet);
        backdrop-filter: blur(12px) saturate(1.4);
      }

      .brand {
        display: flex;
        flex: none;
        align-items: center;
        transition:
          opacity var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing);
      }

      :host([reveal-after]:not([floating])) .brand {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
        translate: 0 -0.25rem;
        transition:
          opacity var(--gw-motion-normal) var(--gw-motion-easing),
          translate var(--gw-motion-normal) var(--gw-motion-easing),
          visibility var(--gw-motion-normal) allow-discrete;
      }

      .nav {
        display: flex;
        flex: 1;
        gap: var(--gw-space-1);
        align-items: center;
        min-width: 0;
      }

      .actions {
        display: flex;
        flex: none;
        gap: var(--gw-space-1);
        align-items: center;
        margin-inline-start: auto;
      }

      .menu {
        display: none;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        padding: 0;
        color: var(--gw-color-text-strong);
        cursor: pointer;
        background: none;
        border: 0;
        border-radius: var(--gw-radius-pill);
        transition: background-color var(--gw-motion-fast)
          var(--gw-motion-easing);
      }

      .menu:hover {
        background: var(--gw-color-fill-neutral-hovered);
      }

      @media (max-width: ${menuBelow - 0.02}px) {
        .menu {
          display: inline-grid;
        }

        .nav {
          position: absolute;
          inset-block-start: 100%;
          inset-inline: 0;
          flex-direction: column;
          gap: var(--gw-space-0-5);
          align-items: stretch;
          padding: var(--gw-space-2) var(--gw-space-3);
          visibility: hidden;
          background: var(--gw-color-surface-default);
          border-block-end: max(var(--gw-border-width), 1px) solid
            var(--gw-color-border-quiet);
          box-shadow: var(--gw-shadow-m);
          opacity: 0;
          translate: 0 -0.5rem;
          transition:
            opacity var(--gw-motion-fast) var(--gw-motion-easing),
            translate var(--gw-motion-normal) var(--gw-motion-easing),
            visibility var(--gw-motion-normal) allow-discrete;
        }

        :host([menu-open]) .nav {
          visibility: visible;
          opacity: 1;
          translate: 0 0;
        }
      }
    `,
  ];

  declare revealAfter: string;
  declare overlay: boolean;
  declare floating: boolean;
  declare menuOpen: boolean;
  declare menuLabel: string;

  readonly #menuIcon = createIcon(menuIcon);

  readonly #menu = h(
    "button",
    { type: "button", class: "menu", "aria-expanded": "false" },
    this.#menuIcon,
  );

  readonly #nav = h("div", { class: "nav", part: "nav" }, h("slot"));

  #observer: IntersectionObserver | undefined;

  #frame = 0;

  constructor() {
    super();
    this.revealAfter = "";
    this.overlay = false;
    this.floating = false;
    this.menuOpen = false;
    this.menuLabel = "Menu";
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("pointerdown", this.#onOutside, true);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.#watch(), {
        once: true,
      });
    } else {
      this.#watch();
    }
  }

  override disconnectedCallback() {
    this.#unwatch();
    document.removeEventListener("keydown", this.#onKeydown);
    document.removeEventListener("pointerdown", this.#onOutside, true);
    super.disconnectedCallback();
  }

  /** Opens or closes the nav menu on narrow screens. */
  toggleMenu(open = !this.menuOpen) {
    if (open === this.menuOpen) return;

    this.menuOpen = open;
    this.dispatchEvent(new Event("toggle"));
  }

  readonly #onScroll = () => {
    if (this.#frame !== 0) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.floating = window.scrollY > 0;
    });
  };

  readonly #onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.menuOpen) {
      this.toggleMenu(false);
      this.#menu.focus();
    }
  };

  readonly #onOutside = (event: PointerEvent) => {
    if (this.menuOpen && !event.composedPath().includes(this)) {
      this.toggleMenu(false);
    }
  };

  #unwatch() {
    this.#observer?.disconnect();
    this.#observer = undefined;
    window.removeEventListener("scroll", this.#onScroll);
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  /** Floats past the `reveal-after` element, or once the page scrolls without one. */
  #watch() {
    this.#unwatch();

    const target = this.revealAfter
      ? document.querySelector(this.revealAfter)
      : null;

    if (target === null) {
      window.addEventListener("scroll", this.#onScroll, { passive: true });
      this.floating = window.scrollY > 0;

      return;
    }

    // The bar floats once the target's bottom passes under the bar
    this.#observer = new IntersectionObserver(
      ([entry]) => {
        if (entry !== undefined) this.floating = !entry.isIntersecting;
      },
      { rootMargin: `-${this.offsetHeight}px 0px 0px 0px` },
    );
    this.#observer.observe(target);
  }

  protected override create(root: ShadowRoot) {
    this.#menu.addEventListener("click", () => {
      this.toggleMenu();
    });
    // A link picked from the menu closes it
    this.#nav.addEventListener("click", (event) => {
      if (
        event.composedPath().some((node) => node instanceof HTMLAnchorElement)
      ) {
        this.toggleMenu(false);
      }
    });

    root.append(
      h(
        "div",
        { class: "bar", part: "bar" },
        h("div", { class: "brand" }, h("slot", { name: "brand" })),
        this.#menu,
        this.#nav,
        h("div", { class: "actions" }, h("slot", { name: "actions" })),
      ),
    );
  }

  protected override update(changed: ReadonlySet<string>) {
    setAttribute(this.#menu, "aria-label", this.menuLabel);
    setAttribute(this.#menu, "aria-expanded", this.menuOpen ? "true" : "false");
    setIconPath(this.#menuIcon, this.menuOpen ? closeIcon : menuIcon);

    if (changed.has("revealAfter") && this.isConnected) this.#watch();
  }
}

GwAppBar.define("gw-app-bar");

declare global {
  interface HTMLElementTagNameMap {
    "gw-app-bar": GwAppBar;
  }
}
