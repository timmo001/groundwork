/**
 * Keeps elements marked `data-page-theme` on the theme and mode picked in the
 * header, so Groundwork components outside a demo frame follow the page.
 *
 * @module
 */
const root = document.documentElement;

const follow = () => {
  const picker = document.querySelector("div[data-gw-theme-picker]");
  const fallback = picker instanceof HTMLElement ? picker.dataset.defaultTheme : undefined;
  const theme = root.dataset.gwDocsTheme ?? fallback ?? "base";

  const mode =
    root.dataset.theme !== "dark"
      ? "light"
      : root.hasAttribute("data-gw-darker")
        ? "darker"
        : "dark";

  for (const element of document.querySelectorAll("[data-page-theme]")) {
    if (!(element instanceof HTMLElement)) continue;

    element.dataset.gwTheme = theme;
    element.dataset.gwMode = mode;
  }
};

new MutationObserver(follow).observe(root, {
  attributes: true,
  attributeFilter: ["data-theme", "data-gw-darker", "data-gw-docs-theme"],
});

follow();

document.addEventListener("astro:after-swap", follow);
