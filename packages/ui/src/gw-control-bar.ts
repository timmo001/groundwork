/**
 * `gw-control-bar`: a bar of controls in three groups, laid out in the
 * fewest rows they fit, with the seldom used folding into More.
 * Docs: https://groundwork.timmo.dev/components/actions/#control-bar
 *
 * @module
 */
import { GwElement, css, h } from "./element.js";
import type { GwButton } from "./gw-button.js";
import type { MenuItem } from "./gw-menu-button.js";
import { base } from "./styles.js";

// MDI's dots-vertical, for the More menu
const moreIcon =
  "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z";

// MDI's chevrons, for the tab that opens the rows past the first
const chevrons = {
  up: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
  down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
} as const;

/** The layouts it takes, as custom states, from the most room to the least. */
const layouts = ["tight", "split", "compact"] as const;

/** Room kept spare, as the measures round and the grid's don't. */
const spare = 8;

/** An element's width with its side margins. */
const outerWidth = (element: Element) => {
  const style = getComputedStyle(element);

  return (
    element.getBoundingClientRect().width +
    Number.parseFloat(style.marginInlineStart) +
    Number.parseFloat(style.marginInlineEnd)
  );
};

/**
 * A control that says how wide it is with everything showing, as
 * `inlineWidth`, and the least it can be, as `minInlineWidth` or its
 * `min-inline-size`, such as `gw-volume` or a `gw-segmented` with
 * `overflow`. It may be nested one deep, such as in an app's own wrapper.
 */
const shrinkerIn = (child: Element) =>
  [child, ...child.children].find(
    (each): each is Element & { readonly inlineWidth: number } =>
      "inlineWidth" in each && Number.isFinite(each.inlineWidth),
  );

/**
 * The least a shrinker can be. `minInlineWidth` first, as a page's
 * `* { min-width: 0 }` beats a shadow root's `:host` and zeroes its
 * `min-inline-size`.
 */
const leastWidth = (shrinker: Element) =>
  "minInlineWidth" in shrinker && Number.isFinite(shrinker.minInlineWidth)
    ? Number(shrinker.minInlineWidth)
    : Number.parseFloat(getComputedStyle(shrinker).minInlineSize) || 0;

const fullWidth = (child: Element) => {
  const inner = shrinkerIn(child);

  return inner === undefined
    ? outerWidth(child)
    : outerWidth(child) - outerWidth(inner) + inner.inlineWidth;
};

const tightWidth = (child: Element) => {
  const inner = shrinkerIn(child);

  return inner === undefined
    ? outerWidth(child)
    : outerWidth(child) -
        outerWidth(inner) +
        (leastWidth(inner) || outerWidth(inner));
};

/** The controls laid out in a line, and the gaps between them. */
const lineWidth = (
  children: readonly Element[],
  measure: (child: Element) => number,
  gap: number,
) =>
  children.reduce((sum, child) => sum + measure(child), 0) +
  gap * Math.max(children.length - 1, 0);

/** What a group showing these takes, and what it would with more beside it. */
interface Line {
  readonly full: number;
  readonly tight: number;
}

/**
 * A bar of controls, such as a player's, in three groups: `start`, the
 * middle (the default slot, such as play and pause) and `end`. It takes the
 * fewest rows they fit, measuring them laid out in one row whenever it or
 * any control changes size, so it never waits for something to overflow and
 * never wraps unevenly. It tightens in the order the
 * [layout](https://groundwork.timmo.dev/foundations/layout/#fewest-rows-then-overflow)
 * sets out, before it takes another row:
 *
 * 1. **One row**, the middle group centered between the sides while they
 *    leave it room.
 * 2. **Tight** (`:state(tight)`), still one row: controls marked
 *    `data-overflow` fold into a More menu at the end, and `gw-volume` gives
 *    up its slider for its button.
 * 3. **Two rows** (`:state(split)`): the middle group across the top, and
 *    the start and end under it, at either side; tight too, where that's
 *    what it takes.
 * 4. **Compact** (`:state(compact)`): each group on a row of its own,
 *    middle first, as on a phone. An app with a phone layout of its own
 *    sets it here, through the `bar`, `start`, `middle` and `end` parts.
 *
 * Each item in More mirrors its control: its label, icon, whether it's
 * disabled, and a toggle's `pressed`. Choosing one clicks the control, or
 * follows it when it's a link.
 *
 * A control with an `inlineWidth` of its own, and a `minInlineWidth` or
 * `min-inline-size`, such as `gw-volume` or a `gw-segmented` with
 * `overflow`, counts as its full width for one row and its least for tight.
 *
 * With `expandable`, once it takes more than one row it shows only the
 * first, the middle group, with a tab at its top edge that opens the rest,
 * as a player's controls over its picture do. `overlayControls()` sets it
 * there.
 *
 * @element gw-control-bar
 * @summary A bar of controls that takes the fewest rows they fit.
 *
 * @attr {string} label - The bar's accessible name, such as `Player controls`.
 * @attr {string} more-label - The More button's accessible name and tooltip. Defaults to `More`.
 * @attr {string} more-icon - SVG path data for the More button's icon. Defaults to three dots.
 * @attr {boolean} expandable - Shows only its first row while it takes more than one, with a tab that opens the rest.
 * @attr {boolean} expanded - Whether the rows past the first are open, with `expandable`.
 * @attr {string} expand-label - The tab's name while it would open the rows. Defaults to `More controls`.
 * @attr {string} collapse-label - The tab's name while it would close them. Defaults to `Fewer controls`.
 *
 * @slot start - The controls at the start, such as the volume.
 * @slot - The controls in the middle, such as play and pause.
 * @slot end - The controls at the end, such as full screen.
 *
 * @csspart bar - The grid that holds the groups.
 * @csspart start - The start group.
 * @csspart middle - The middle group.
 * @csspart end - The end group, More at its end.
 * @csspart more - The More menu, a `gw-menu-button`.
 * @csspart expand - The tab that opens the rows past the first, a `gw-button`.
 *
 * @cssprop --gw-control-bar-gap - The space between groups. Defaults to `--gw-space-6`.
 * @cssprop --gw-control-bar-group-gap - The space between controls in a group. Defaults to `--gw-space-2`.
 * @cssprop --gw-control-bar-row-gap - The space between rows. Defaults to `--gw-space-2`.
 *
 * @fires {Event} toggle - When the tab opens or closes the rows past the first. Read `expanded`.
 */
export class GwControlBar extends GwElement {
  static override properties = {
    label: {},
    moreLabel: { attribute: "more-label" },
    moreIcon: { attribute: "more-icon" },
    expandable: { type: "boolean", reflect: true },
    expanded: { type: "boolean", reflect: true },
    expandLabel: { attribute: "expand-label" },
    collapseLabel: { attribute: "collapse-label" },
  } as const;

  static override styles = [
    base,
    css`
      :host {
        position: relative;
        display: block;
      }

      /* The sides share what the middle leaves, so it sits in the middle
         while they're even and beside the wider one when they aren't */
      .bar {
        display: grid;
        grid-template-columns:
          minmax(max-content, 1fr) auto
          minmax(max-content, 1fr);
        gap: var(--gw-control-bar-row-gap, var(--gw-space-2))
          var(--gw-control-bar-gap, var(--gw-space-6));
        align-items: center;
      }

      .group {
        display: flex;
        flex-wrap: nowrap;
        gap: var(--gw-control-bar-group-gap, var(--gw-space-2));
        align-items: center;
        grid-row: 1;
      }

      .start {
        grid-column: 1;
      }

      .middle {
        grid-column: 2;
        justify-content: center;
      }

      .end {
        grid-column: 3;
        justify-content: flex-end;
      }

      .more,
      .expand {
        display: none;
      }

      /* Tight: the seldom used fold into More, and the start group takes
         what room is left, so a volume gives up its slider for its button */
      :host(:is(:state(tight), :state(compact))) ::slotted([data-overflow]) {
        display: none;
      }

      :host(:is(:state(tight), :state(compact))) .more {
        display: inline-block;
      }

      :host(:state(tight)) .bar {
        grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr);
      }

      :host(:state(tight)) .group {
        min-inline-size: 0;
      }

      /* Two rows: the middle across the top, the sides under it */
      :host(:state(split)) .bar {
        grid-template-columns: auto auto;
        justify-content: space-between;
      }

      :host(:state(split):state(tight)) .bar {
        grid-template-columns: minmax(0, 1fr) max-content;
      }

      :host(:state(split)) .middle {
        grid-column: 1 / -1;
      }

      :host(:state(split)) :is(.start, .end) {
        grid-row: 2;
      }

      :host(:state(split)) .start {
        grid-column: 1;
      }

      :host(:state(split)) .end {
        grid-column: 2;
      }

      /* Compact: a group on each row, the middle first */
      :host(:state(compact)) .bar {
        grid-template-columns: minmax(0, 1fr);
      }

      :host(:state(compact)) .group {
        grid-column: 1;
        flex-wrap: wrap;
        justify-content: center;
      }

      :host(:state(compact)) .start {
        grid-row: 2;
      }

      :host(:state(compact)) .end {
        grid-row: 3;
      }

      /* Expandable: the first row only, until the tab opens the rest */
      :host([expandable]:is(:state(split), :state(compact))) .expand {
        position: absolute;
        inset-block-end: 100%;
        inset-inline-end: 0;
        display: inline-block;
      }

      :host([expandable]:not([expanded]):is(:state(split), :state(compact)))
        :is(.start, .end) {
        display: none;
      }
    `,
  ];

  /** The bar's accessible name. */
  declare label: string;
  declare moreLabel: string;
  declare moreIcon: string;
  /** Shows only its first row while it takes more than one, with a tab that opens the rest. */
  declare expandable: boolean;
  /** Whether the rows past the first are open, with `expandable`. */
  declare expanded: boolean;
  declare expandLabel: string;
  declare collapseLabel: string;

  readonly #internals = this.attachInternals();

  readonly #slots = {
    start: h("slot", { name: "start" }),
    middle: h("slot"),
    end: h("slot", { name: "end" }),
  };

  readonly #more = h("gw-menu-button", {
    class: "more",
    part: "more",
    appearance: "plain",
    labels: "hide",
  });

  readonly #groups = {
    start: h("div", { class: "group start", part: "start" }, this.#slots.start),
    middle: h(
      "div",
      { class: "group middle", part: "middle" },
      this.#slots.middle,
    ),
    end: h(
      "div",
      { class: "group end", part: "end" },
      this.#slots.end,
      this.#more,
    ),
  };

  readonly #bar = h(
    "div",
    { class: "bar", part: "bar" },
    this.#groups.start,
    this.#groups.middle,
    this.#groups.end,
  );

  readonly #expand: GwButton = h("gw-button", {
    class: "expand",
    part: "expand",
    variant: "neutral",
    appearance: "plain",
    size: "small",
    labels: "hide",
  });

  readonly #resize = new ResizeObserver(() => {
    this.#schedule();
  });

  /** Mirrors the folded controls into More as they change. */
  readonly #mirror = new MutationObserver(() => {
    this.#fillMore();
  });

  /** The controls marked `data-overflow`, in order. */
  #folded: readonly Element[] = [];

  #frame = 0;

  constructor() {
    super();
    this.label = "";
    this.moreLabel = "More";
    this.moreIcon = moreIcon;
    this.expandable = false;
    this.expanded = false;
    this.expandLabel = "More controls";
    this.collapseLabel = "Fewer controls";
    this.#internals.role = "group";
  }

  protected override create(root: ShadowRoot) {
    for (const slot of Object.values(this.#slots)) {
      slot.addEventListener("slotchange", this.#watch);
    }

    this.#more.addEventListener("select", this.#onSelect);
    // A toggle's item is a checkbox, which fires check and stays open
    this.#more.addEventListener("check", this.#onSelect);
    this.#expand.addEventListener("click", () => {
      this.expanded = !this.expanded;
      this.dispatchEvent(new Event("toggle"));
    });
    root.append(this.#bar, this.#expand);
  }

  protected override update(changed: ReadonlySet<string>) {
    if (changed.has("label")) this.#internals.ariaLabel = this.label || null;

    this.#more.setAttribute("label", this.moreLabel);
    this.#more.setAttribute("icon", this.moreIcon);

    const open = this.expanded;

    this.#expand.textContent = open ? this.collapseLabel : this.expandLabel;
    this.#expand.setAttribute("icon", open ? chevrons.down : chevrons.up);
    this.#expand.setAttribute("aria-expanded", String(open));

    if (changed.has("expandable") || changed.has("expanded")) this.#schedule();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#watch();
    // The controls' widths change once the page's fonts load
    void document.fonts.ready.then(this.#schedule);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#mirror.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  /** The controls in each group, as slotted. */
  #controls(group: "start" | "middle" | "end") {
    return this.#slots[group].assignedElements({ flatten: true });
  }

  /** Watches the bar and every control, as one shown, hidden or relabeled changes what fits. */
  readonly #watch = () => {
    if (!this.isConnected) return;

    this.#resize.disconnect();
    this.#resize.observe(this, { box: "border-box" });

    const controls = [
      ...this.#controls("start"),
      ...this.#controls("middle"),
      ...this.#controls("end"),
    ];

    for (const control of controls) this.#resize.observe(control);

    this.#folded = controls.filter((control) =>
      control.hasAttribute("data-overflow"),
    );

    this.#mirror.disconnect();

    for (const control of this.#folded) {
      this.#mirror.observe(control, {
        attributes: true,
        attributeFilter: [
          "label",
          "icon",
          "disabled",
          "toggle",
          "pressed",
          "hidden",
          "href",
        ],
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    this.#fillMore();
    this.#schedule();
  };

  readonly #schedule = () => {
    if (this.#frame !== 0 || !this.isConnected) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#fit();
    });
  };

  /** Each folded control as an item: a toggle's says whether it's on. */
  #fillMore() {
    this.#more.items = this.#folded.flatMap((control, index): MenuItem[] => {
      if (control.hasAttribute("hidden")) return [];

      const icon = control.getAttribute("icon");

      const plain = {
        value: String(index),
        label:
          control.getAttribute("label") ?? control.textContent?.trim() ?? "",
        disabled: control.hasAttribute("disabled"),
      };

      const item = icon === null ? plain : { ...plain, icon };

      // A toggle's item is a checkbox that says whether it's on
      return control.hasAttribute("toggle")
        ? [
            {
              ...item,
              checkbox: true,
              checked: control.hasAttribute("pressed"),
            },
          ]
        : [item];
    });
  }

  readonly #onSelect = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;

    const value =
      event.detail !== null && "value" in event.detail
        ? Number(event.detail.value)
        : Number.NaN;

    const control = this.#folded[value];

    if (control === undefined || control.hasAttribute("disabled")) return;

    // A link, such as Download, is followed as its own would be
    const href = control.getAttribute("href");

    if (href === null) {
      if (control instanceof HTMLElement) control.click();

      return;
    }

    const link = h("a", {
      href,
      target: control.getAttribute("target"),
      rel: control.getAttribute("rel"),
      download: control.getAttribute("download"),
    });

    link.click();
  };

  /** What a group takes with every control showing, and tight. */
  #line(group: "start" | "middle" | "end"): Line & { readonly folded: number } {
    const shown = this.#controls(group).filter(
      (child) =>
        child.getBoundingClientRect().width > 0 &&
        !["absolute", "fixed"].includes(getComputedStyle(child).position),
    );

    const gap =
      Number.parseFloat(getComputedStyle(this.#groups[group]).columnGap) || 0;

    const kept = shown.filter((child) => !child.hasAttribute("data-overflow"));
    const folded = shown.filter((child) => child.hasAttribute("data-overflow"));

    return {
      full: lineWidth(shown, fullWidth, gap),
      tight: lineWidth(kept, tightWidth, gap),
      // More takes about one control's room, as an icon button
      folded: folded.length === 0 ? 0 : Math.max(...folded.map(outerWidth)),
    };
  }

  /** Lays the groups out in the fewest rows they fit, measured in one row. */
  #fit() {
    for (const name of layouts) this.#internals.states.delete(name);

    // A hidden bar has nothing to measure
    if (this.#bar.clientWidth === 0) return;

    const style = getComputedStyle(this.#bar);
    const gap = Number.parseFloat(style.columnGap) || 0;

    const endGap =
      Number.parseFloat(getComputedStyle(this.#groups.end).columnGap) || 0;

    const room =
      this.#bar.clientWidth -
      Number.parseFloat(style.paddingInlineStart) -
      Number.parseFloat(style.paddingInlineEnd) -
      spare;

    const start = this.#line("start");
    const middle = this.#line("middle");
    const end = this.#line("end");

    const more = Math.max(start.folded, middle.folded, end.folded);

    const endTight =
      more === 0 ? end.tight : end.tight + (end.tight > 0 ? endGap : 0) + more;

    // Gaps only between the groups that have something in them
    const across = (...widths: readonly number[]) => {
      const filled = widths.filter((width) => width > 0);

      return (
        filled.reduce((sum, width) => sum + width, 0) +
        gap * Math.max(filled.length - 1, 0)
      );
    };

    const fits = (left: number, middleWidth: number, right: number) => ({
      oneRow: across(left, middleWidth, right) <= room,
      twoRows: across(left, right) <= room && middleWidth <= room,
    });

    const full = fits(start.full, middle.full, end.full);
    const tight = fits(start.tight, middle.tight, endTight);

    // The fewest rows first, then every control where the rows are equal
    const [split, compact, tightened] = full.oneRow
      ? [false, false, false]
      : tight.oneRow
        ? [false, false, true]
        : full.twoRows
          ? [true, false, false]
          : tight.twoRows
            ? [true, false, true]
            : [false, true, false];

    if (tightened) this.#internals.states.add("tight");

    if (split) this.#internals.states.add("split");

    if (compact) this.#internals.states.add("compact");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gw-control-bar": GwControlBar;
  }
}
