/**
 * The app's PWA config: what `@timmo001/groundwork-pwa` gives it. Only the
 * name is needed, and every piece is on unless it's turned off here, such as
 * `offline: false`. The build writes the manifest from it and the page and
 * service worker read it.
 */
import { definePwaConfig } from "@timmo001/groundwork-pwa";

export default definePwaConfig({
  name: "Groundwork Updates",
  shortName: "Updates",
  description: "Groundwork's demo app, installed as a PWA",
  shortcuts: [{ name: "This phone", url: "./#phone" }],
});
