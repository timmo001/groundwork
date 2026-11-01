import { docsConfig } from "@timmo001/docs-kit/blume";
import { defineConfig } from "blume";

export default defineConfig(
  docsConfig({
    title: "Groundwork",
    description:
      "The groundwork for designing and building apps, sites, CLIs, terminal UIs, Omarchy panels and agents.",
    site: "groundwork.timmo.dev",
    github: { owner: "timmo001", repo: "groundwork" },
    navigation: {
      sidebar: [
        "/",
        "/demo",
        "/principles",
        "/agents",
        "/targets",
        "/behavior",
        "/sync",
        {
          label: "Foundations",
          root: "/foundations",
          items: [
            "/foundations/color",
            "/foundations/type",
            "/foundations/spacing",
            "/foundations/iconography",
            "/foundations/layout",
          ],
        },
        {
          label: "Themes",
          root: "/themes",
          items: [
            "/themes/base",
            "/themes/glazing",
            "/themes/survey",
            "/themes/slate",
            "/themes/bridge",
            "/themes/snag",
            "/themes/optional",
            "/themes/contrast",
            "/themes/writing-a-theme",
          ],
        },
        {
          label: "Conventions",
          root: "/conventions",
          items: ["/conventions/labels", "/conventions/repositories"],
        },
        {
          label: "Components",
          root: "/components",
          items: [
            "/components/actions",
            "/components/inputs",
            "/components/display",
            "/components/feedback",
            "/components/overlays",
            "/components/layout",
          ],
        },
        {
          label: "Terminal",
          root: "/terminal",
          items: ["/terminal/components"],
        },
        {
          label: "Effect",
          root: "/effect",
          items: [
            "/effect/services",
            "/effect/schema",
            "/effect/cli-and-agents",
            "/effect/lit",
            "/effect/platform",
          ],
        },
        {
          label: "Roadmap",
          root: "/roadmap",
          items: ["/roadmap/next", "/roadmap/later", "/roadmap/built"],
        },
      ],
    },
  }),
);
