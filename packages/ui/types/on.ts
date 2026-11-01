/**
 * Type checks for `on()`, run by `tsc`: each element's own events reach the
 * handler with their `@fires` type and no cast, and the wrong event or
 * element doesn't compile.
 */
import { on } from "../src/index.js";

declare const menu: HTMLElementTagNameMap["gw-command-menu"];
declare const dialog: HTMLElementTagNameMap["gw-dialog"];
declare const select: HTMLElementTagNameMap["gw-select"];
declare const button: HTMLElementTagNameMap["gw-button"];

on(menu, "pick", (event) => event.detail.value.toUpperCase());

on(dialog, "close", () => dialog.returnValue);

const off = on(select, "change", (event) => event.type);

off();

// @ts-expect-error gw-dialog doesn't fire pick
on(dialog, "pick", () => undefined);

// @ts-expect-error a close event has no detail
on(dialog, "close", (event) => event.detail);

// @ts-expect-error gw-button fires no events of its own
on(button, "click", () => undefined);
