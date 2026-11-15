/**
 * Tab inside a modal overlay: `trapTab` keeps Tab and Shift+Tab within it,
 * wrapping at either end, as a modal dialog does, and `tabbables` lists what
 * Tab stops on in an element, through shadow roots and slots. Every
 * Groundwork overlay that's a dialog over a scrim traps with it, so the
 * keyboard can't reach the page the scrim keeps the pointer from.
 * Docs: https://groundwork.timmo.dev/components/overlays/#the-keyboard
 *
 * @module
 */

/** An unchecked radio whose group has a checked one, which Tab passes over. */
const passedRadio = (element: HTMLElement) => {
  if (
    !(element instanceof HTMLInputElement) ||
    element.type !== "radio" ||
    element.checked ||
    element.name === ""
  ) {
    return false;
  }

  const root = element.getRootNode();

  if (!(root instanceof Document || root instanceof ShadowRoot)) return false;

  return [...root.querySelectorAll("input[type=radio]:checked")].some(
    (radio) =>
      radio instanceof HTMLInputElement &&
      radio.name === element.name &&
      radio.form === element.form,
  );
};

/** Whether Tab stops on `element` itself, rather than inside it. */
const stopsOn = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.tabIndex >= 0 &&
  element.shadowRoot?.delegatesFocus !== true &&
  !element.matches(":disabled") &&
  element.checkVisibility({ visibilityProperty: true }) &&
  !passedRadio(element);

/**
 * What Tab stops on inside `root`, in order: through open shadow roots, and
 * through slots to what's slotted into them, skipping anything disabled,
 * hidden or inert. Positive `tabindex` values count in place.
 */
export const tabbables = (root: Element): HTMLElement[] => {
  const found: HTMLElement[] = [];

  const visit = (element: Element) => {
    if (element instanceof HTMLElement && element.inert) return;

    if (element instanceof HTMLSlotElement) {
      for (const child of element.assignedElements({ flatten: true })) {
        visit(child);
      }

      return;
    }

    if (stopsOn(element)) found.push(element);

    for (const child of (element.shadowRoot ?? element).children) visit(child);
  };

  visit(root);

  return found;
};

/** The focused element, inside whichever shadow roots hold it. */
const deepActive = () => {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
};

/**
 * Keeps Tab and Shift+Tab within `surface`, a modal overlay, from its
 * `keydown` listener: past the last stop, Tab goes back to the first, and
 * Shift+Tab from the first, or from the surface itself, to the last. With
 * nothing to stop on, the focus stays on the surface. Any other key, or a
 * Tab between two stops, it leaves to the browser. Returns whether it moved
 * the focus.
 *
 * ```ts
 * surface.addEventListener("keydown", (event) => {
 *   if (event.key === "Escape") close();
 *   else trapTab(event, surface);
 * });
 * ```
 */
export const trapTab = (event: KeyboardEvent, surface: HTMLElement) => {
  if (
    event.key !== "Tab" ||
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return false;
  }

  const stops = tabbables(surface);
  const active = deepActive();
  const first = stops[0];
  const last = stops.at(-1);

  let next: HTMLElement | undefined;

  if (first === undefined || last === undefined) next = surface;
  else if (event.shiftKey && (active === first || active === surface)) {
    next = last;
  } else if (!event.shiftKey && active === last) next = first;

  if (next === undefined) return false;

  event.preventDefault();
  next.focus();

  return true;
};
