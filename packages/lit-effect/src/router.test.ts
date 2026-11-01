/**
 * Tests that routes match, parse and build URLs both ways, including under a
 * base path.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Schema } from "effect";
import { NoParams, NoSearch, makeRouter, route } from "./router.ts";

const Page = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(1),
);

const router = makeRouter(
  {
    home: route("/", NoParams, NoSearch),
    issue: route(
      "/issues/:id",
      Schema.Struct({ id: Schema.String }),
      Schema.Struct({
        q: Schema.optional(Schema.String),
        page: Schema.optional(Page),
      }),
    ),
  },
  { basePath: "/app/" },
);

test("links and URLs round trip through the codecs", () => {
  const link = router.href("issue", {
    params: { id: "a b" },
    search: { q: "fan", page: 2 },
  });

  expect(link).toBe("/app/issues/a%20b?q=fan&page=2");

  expect(router.parse(new URL(link, "https://example.test"))).toEqual({
    name: "issue",
    params: { id: "a b" },
    search: { q: "fan", page: 2 },
  });
});

test("a bad search param is dropped, not the page", () => {
  expect(
    router.parse(new URL("https://example.test/app/issues/7?page=0&q=x")),
  ).toEqual({
    name: "issue",
    params: { id: "7" },
    search: { q: "x" },
  });
});

test("an unknown path is notFound", () => {
  expect(router.parse(new URL("https://example.test/app/nope"))).toEqual({
    name: "notFound",
    path: "/nope",
  });
});
