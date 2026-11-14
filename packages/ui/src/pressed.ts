/**
 * `pressedBelow`, whether a press landed on something that does its own
 * thing inside a surface, such as a control over a player's picture. Only
 * what's below the surface counts: the surface itself and what's above it
 * may be focusable, such as a stage with `tabindex="0"` for its keys, and
 * aren't something pressed.
 *
 * @module
 */

/**
 * Whether anything on an event's `path` before `surface`, from the target
 * out, is `pressable`. A path that never reaches `surface` counts whole.
 */
export const pressedBelow = <Target>(
  path: readonly Target[],
  surface: Target,
  pressable: (target: Target) => boolean,
) => {
  const end = path.indexOf(surface);

  return (end === -1 ? path : path.slice(0, end)).some(pressable);
};
