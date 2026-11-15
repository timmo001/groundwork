/**
 * Stand-in actions for the action button demos. A `gw-action-button` with
 * `data-sample="works"` gets an action that answers after a moment, and one
 * with `data-sample="fails"` an action that fails with a reason.
 *
 * @module
 */

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Gives each sample action button in `frame` its stand-in action. */
export const fillSampleActions = (frame: HTMLElement) => {
  for (const button of frame.querySelectorAll("gw-action-button")) {
    const { sample } = button.dataset;

    if (sample === "works") {
      button.action = async () => {
        await wait(1200);
      };
    } else if (sample === "fails") {
      button.action = async () => {
        await wait(1200);

        throw new Error("The camera didn't answer. Check it's online, then try again.");
      };
    }
  }
};
