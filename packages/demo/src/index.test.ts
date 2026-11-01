/**
 * Tests the fixture `Items` service every demo runs on: applying moves an item
 * to its available version, and an unknown id fails rather than throwing.
 *
 * @module
 */
import { expect, test } from "bun:test";
import { Effect, Exit } from "effect";
import { Items } from "./index.ts";

const run = <A, E>(effect: Effect.Effect<A, E, Items>) =>
  Effect.runPromiseExit(effect.pipe(Effect.provide(Items.fixture)));

test("apply moves an item to its available version", async () => {
  const exit = await run(
    Effect.gen(function* () {
      const items = yield* Items;
      const applied = yield* items.apply("tools");
      const list = yield* items.list();

      return { applied, pending: list.filter((item) => item.pending).length };
    }),
  );

  expect(Exit.isSuccess(exit)).toBe(true);

  if (Exit.isSuccess(exit)) {
    expect(exit.value.applied).toMatchObject({
      current: "2026.11.0",
      pending: false,
    });
    expect(exit.value.pending).toBe(2);
  }
});

test("apply fails on an unknown id", async () => {
  const exit = await run(Effect.flatMap(Items, (items) => items.apply("nope")));

  expect(Exit.isFailure(exit)).toBe(true);
});
