/**
 * `gw-demo-app`: Groundwork's demo app as an update tool built from `gw-`
 * components, for the web demo on the Demo page and the desktop template. It
 * runs on the fixture `Items` service, the same one the other targets use, so
 * nothing sits behind it and a reload resets it. Load `web.css` with it.
 *
 * @module
 */
import {
  GwElement,
  h,
  type GwButton,
  type GwDialog,
} from "@timmo001/groundwork-ui";
import { Effect, Exit, ManagedRuntime } from "effect";

import { Items, type Item } from "./index.ts";

// MDI's update, restart and check
const icons = {
  update:
    "M21,10.12H14.22L16.96,7.3C14.23,4.6 9.81,4.5 7.08,7.2C4.35,9.91 4.35,14.28 7.08,17C9.81,19.7 14.23,19.7 16.96,17C18.32,15.65 19,14.08 19,12.1H21C21,14.08 20.12,16.65 18.36,18.39C14.85,21.87 9.15,21.87 5.64,18.39C2.14,14.92 2.11,9.28 5.62,5.81C9.13,2.34 14.76,2.34 18.27,5.81L21,3V10.12M12.5,8V12.25L16,14.33L15.28,15.54L11,13V8H12.5Z",
  restart:
    "M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
};

/**
 * The demo app's web target: lists the items, applies one or all of them, and
 * restarts after a confirmation. Results show on the buttons and rows that
 * caused them, not as alerts or toasts.
 */
export class GwDemoApp extends GwElement {
  static override shadow = false;

  // The fixture layer holds no resources, so the runtime lives with the page
  readonly #runtime = ManagedRuntime.make(Items.fixture);

  readonly #list = h("div", { class: "demo-app-list" });

  // Applied this session, so their rows say so and Restart asks to finish
  readonly #applied = new Set<string>();

  // A failed button's own label and color, put back once it works
  readonly #before = new Map<
    GwButton,
    { label: string; variant: GwButton["variant"] }
  >();

  readonly #restart: GwButton = h(
    "gw-button",
    { variant: "neutral", appearance: "outlined", icon: icons.restart },
    "Restart",
  );

  readonly #applyAll: GwButton = h(
    "gw-button",
    { appearance: "plain", icon: icons.update },
    "Apply all",
  );

  readonly #dialog: GwDialog = h(
    "gw-dialog",
    { heading: "Restart now?" },
    "The machine restarts to finish applying. Anything unsaved is lost.",
    h(
      "gw-button",
      {
        slot: "actions",
        value: "cancel",
        variant: "neutral",
        appearance: "outlined",
      },
      "Cancel",
    ),
    h(
      "gw-button",
      {
        slot: "actions",
        value: "restart",
        variant: "danger",
        appearance: "filled",
      },
      "Restart",
    ),
  );

  protected override create(root: HTMLElement) {
    this.#restart.addEventListener("click", () => {
      this.#dialog.open = true;
    });

    this.#applyAll.addEventListener("click", () => void this.#applyPending());

    this.#dialog.addEventListener("close", () => {
      if (this.#dialog.returnValue === "restart") void this.#restartNow();
    });

    root.append(
      h(
        "gw-page-header",
        {
          heading: "Updates",
          description:
            "What this machine has waiting, and what it's up to date on.",
          icon: icons.update,
        },
        h("div", { slot: "actions", class: "demo-app-actions" }, this.#restart),
      ),
      h(
        "gw-card",
        { heading: "Items" },
        h("div", { slot: "actions" }, this.#applyAll),
        this.#list,
      ),
      this.#dialog,
    );

    void this.#refresh();
  }

  /**
   * Runs an effect on the fixture service. A failure shows on the button that
   * started it, as a danger "Try again" with the cause as its tooltip.
   */
  async #run<A>(button: GwButton, effect: Effect.Effect<A, unknown, Items>) {
    button.loading = true;

    const exit = await this.#runtime.runPromiseExit(effect);

    button.loading = false;
    this.#failed(button, Exit.isFailure(exit) ? String(exit.cause) : undefined);

    return exit;
  }

  #failed(button: GwButton, cause: string | undefined) {
    const before = this.#before.get(button);

    if (cause) {
      if (!before) {
        this.#before.set(button, {
          label: button.textContent ?? "",
          variant: button.variant,
        });
      }

      button.variant = "danger";
      button.textContent = "Try again";
      button.title = cause;

      return;
    }

    if (!before) return;

    button.textContent = before.label;
    button.variant = before.variant;
    button.title = "";
    this.#before.delete(button);
  }

  async #refresh() {
    const exit = await this.#run(
      this.#applyAll,
      Effect.flatMap(Items, (items) => items.list()),
    );

    if (Exit.isSuccess(exit)) this.#render(exit.value);
  }

  #render(items: readonly Item[]) {
    const pending = items.filter((item) => item.pending).length;

    this.#applyAll.disabled = pending === 0;

    // Once something is applied, Restart turns accent to say it's next
    this.#restart.variant = this.#applied.size > 0 ? "brand" : "neutral";
    this.#restart.appearance = this.#applied.size > 0 ? "accent" : "outlined";

    this.#list.replaceChildren(
      ...items.map((item) => {
        const applied = this.#applied.has(item.id);

        if (!item.pending) {
          return this.#row(
            item,
            h(
              "gw-badge",
              { tone: applied ? "info" : "success", icon: icons.check },
              applied ? "Applied" : "Up to date",
            ),
          );
        }

        const apply: GwButton = h(
          "gw-button",
          { appearance: "outlined", size: "small" },
          "Apply",
        );

        apply.addEventListener("click", () => void this.#apply(apply, [item]));

        return this.#row(item, apply);
      }),
    );
  }

  #row(item: Item, control: HTMLElement) {
    return h(
      "gw-setting-row",
      {
        heading: item.name,
        description: item.pending
          ? `${item.description}. ${item.current} to ${item.available}.`
          : `${item.description}. ${item.current}.`,
      },
      control,
    );
  }

  async #apply(button: GwButton, items: readonly Item[]) {
    const pending = items.filter((item) => item.pending);

    if (pending.length === 0) return;

    const exit = await this.#run(
      button,
      Effect.flatMap(Items, (service) =>
        Effect.forEach(pending, (item) => service.apply(item.id)),
      ),
    );

    // A failed button keeps its "Try again" rather than being redrawn
    if (Exit.isFailure(exit)) return;

    for (const item of exit.value) this.#applied.add(item.id);

    await this.#refresh();
  }

  async #applyPending() {
    const exit = await this.#run(
      this.#applyAll,
      Effect.flatMap(Items, (items) => items.list()),
    );

    if (Exit.isSuccess(exit)) await this.#apply(this.#applyAll, exit.value);
  }

  async #restartNow() {
    const exit = await this.#run(
      this.#restart,
      Effect.flatMap(Items, (items) => items.restart()),
    );

    if (Exit.isFailure(exit)) return;

    this.#applied.clear();

    await this.#refresh();
  }
}

GwDemoApp.define("gw-demo-app");

declare global {
  interface HTMLElementTagNameMap {
    "gw-demo-app": GwDemoApp;
  }
}
