/**
 * Runs the demo's `Items` operations for the menu: list, apply and restart,
 * with a toast for each result. The items come from Groundwork's demo app, so
 * this template is also the TUI demo. In a real tool, swap `Items.fixture`
 * for a layer with the system's SDK behind it.
 *
 * @module
 */
import { Items, type Item, type ItemsError } from "@timmo001/groundwork-demo";
import { Effect, ManagedRuntime } from "effect";
import type { Toast } from "@timmo001/groundwork-tui";

/** The `Items` operations, as promises the views can call */
export interface ItemsRunnerService {
  /** Every item and whether it has something to apply */
  readonly list: () => Promise<readonly Item[]>;
  /** Apply one item, or every pending item when `id` is undefined */
  readonly apply: (id: string | undefined) => Promise<void>;
  /** Restart the system the items belong to */
  readonly restart: () => Promise<void>;
}

/** Create an {@link ItemsRunnerService} on the fixture items */
export function createItemsRunner(toast: Toast): ItemsRunnerService {
  const runtime = ManagedRuntime.make(Items.fixture);

  const report = (
    effect: Effect.Effect<string, ItemsError, Items>,
  ): Promise<void> =>
    runtime.runPromise(
      effect.pipe(
        Effect.match({
          onFailure: (error) => toast.show("items", error.message, "error"),
          onSuccess: (message) => toast.show("items", message, "success"),
        }),
      ),
    );

  const applyAll = Effect.gen(function* () {
    const items = yield* Items;
    const pending = (yield* items.list()).filter((item) => item.pending);

    yield* Effect.forEach(pending, (item) => items.apply(item.id));

    return pending.length === 0
      ? "Nothing to apply"
      : `Applied ${pending.length} updates`;
  });

  const applyOne = (id: string) =>
    Effect.gen(function* () {
      const item = yield* (yield* Items).apply(id);

      return `${item.name} is on ${item.current}`;
    });

  return {
    list: () =>
      runtime.runPromise(
        Effect.gen(function* () {
          return yield* (yield* Items).list();
        }).pipe(Effect.orElseSucceed(() => [])),
      ),
    apply: (id) => {
      toast.show("items", "Applying...", "info");

      return report(id === undefined ? applyAll : applyOne(id));
    },
    restart: () =>
      report(
        Effect.gen(function* () {
          yield* (yield* Items).restart();

          return "Restarted";
        }),
      ),
  };
}
