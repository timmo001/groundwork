/**
 * `followLink`: passes a click on an element that stands for a link, such as
 * a `gw-button` pill or a `gw-card`, on to the link itself, keeping its keys
 * and button so Ctrl, Cmd, Shift and the middle button still open a new tab
 * or window, and a page's own router still leaves those clicks alone.
 * Docs: https://groundwork.timmo.dev/components/#helpers
 *
 * @module
 */

/**
 * Follows `link` as the click or middle-button `auxclick` `event` would
 * have, had it landed on the link: the same keys held and the same button,
 * where `link.click()` would drop them and always open in place.
 *
 * ```ts
 * row.addEventListener("click", (event) => {
 *   if (!event.composedPath().includes(link)) followLink(link, event);
 * });
 * ```
 */
export const followLink = (link: HTMLAnchorElement, event: MouseEvent) => {
  link.dispatchEvent(
    new MouseEvent(event.type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: event.view,
      detail: event.detail,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    }),
  );
};
