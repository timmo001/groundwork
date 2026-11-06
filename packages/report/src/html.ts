/**
 * Markup built as strings on the server: `html` escapes every value it's
 * given unless it's markup already, so a report never needs a DOM to render.
 *
 * @module
 */

/** Markup that's safe to put on the page as it is. */
export class Html {
  constructor(readonly value: string) {}

  toString() {
    return this.value;
  }
}

/** What a block takes as content: markup, text that gets escaped, or a list of them. */
export type Content =
  Html | string | number | boolean | null | undefined | readonly Content[];

const entities = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
]);

/** Escapes text for an element's content or a quoted attribute. */
export const escape = (text: string) =>
  text.replace(/[&<>"']/g, (char) => entities.get(char) ?? char);

/** Renders content to a string: markup as it is, anything else escaped. */
export const render = (content: Content): string => {
  if (content instanceof Html) return content.value;

  if (Array.isArray(content)) return content.map(render).join("");

  if (
    content === null ||
    content === undefined ||
    content === true ||
    content === false
  )
    return "";

  return escape(String(content));
};

/**
 * What `JSON.stringify` writes: plain values, and arrays and objects of
 * them. An `undefined` property is left out.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | { readonly [key: string]: Json | undefined };

/** Marks a string as markup, for HTML the caller built and trusts. */
export const raw = (value: string) => new Html(value);

/** A template literal of markup, with its values escaped. */
export const html = (
  strings: TemplateStringsArray,
  ...values: readonly Content[]
) =>
  new Html(
    strings.reduce(
      (out, part, index) =>
        out + part + (index < values.length ? render(values[index]) : ""),
      "",
    ),
  );

/**
 * JSON for an attribute, such as `items` on `gw-facts`, escaped once here
 * and marked as markup so `html` doesn't escape it again.
 */
export const json = (value: Json) => raw(escape(JSON.stringify(value)));

/** Escapes inline backtick spans as `<code>`, for prose from a config file. */
export const prose = (text: string) =>
  raw(escape(text).replace(/`([^`]+)`/g, "<code>$1</code>"));
