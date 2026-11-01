/**
 * The view's boot script, loaded as a classic script in `<head>` so the stored
 * theme and mode apply before the first paint and nothing flashes or jumps.
 * An inline script runs as soon as it's inserted, still before first paint.
 */
import { themeBootScript } from "@timmo001/groundwork-tokens/page";

import { themeOptions } from "./theme.ts";

const script = document.createElement("script");

script.textContent = themeBootScript(themeOptions);

document.head.append(script);

script.remove();
