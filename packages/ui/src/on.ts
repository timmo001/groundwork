/**
 * `on()`: listens for a `gw-` element's own events, typed from the
 * generated `GwEventMap`, so a handler gets `CustomEvent<{ value: string }>`
 * for `pick` with no cast.
 * Docs: https://groundwork.timmo.dev/components/#using-with-lit
 *
 * @module
 */
import type { GwEventMap } from "./events.js";

export type { GwEventMap } from "./events.js";

type EventTag = keyof GwEventMap;

/** A `gw-` element that fires events of its own. */
export type GwEventTarget = HTMLElementTagNameMap[EventTag];

/** The events an element fires, found from the tag its class is defined for. */
export type GwEventsOf<E extends GwEventTarget> = {
  [T in EventTag]: E extends HTMLElementTagNameMap[T] ? GwEventMap[T] : never;
}[EventTag];

/**
 * A handler for one event. Declared as a method so it's checked bivariantly
 * and can be handed to `addEventListener`, which only knows it as an `Event`.
 */
type Listener<T extends Event> = {
  handle(event: T): void;
}["handle"];

/**
 * Adds a listener for one of the element's own events, typed from its
 * `@fires` docs, and returns a function that removes it.
 *
 * @example
 * on(menu, "pick", (event) => open(event.detail.value));
 */
export function on<
  E extends GwEventTarget,
  K extends keyof GwEventsOf<E> & string,
>(
  element: E,
  type: K,
  listener: Listener<GwEventsOf<E>[K] & Event>,
  options?: AddEventListenerOptions,
): () => void {
  const handler: Listener<Event> = listener;

  element.addEventListener(type, handler, options);

  return () => element.removeEventListener(type, handler, options);
}
