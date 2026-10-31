import { docsConfig } from "@timmo001/docs-kit/blume";
import { defineConfig } from "blume";

export default defineConfig(
  docsConfig({
    title: "Groundwork",
    description:
      "One design and architecture system for every app, site, CLI, terminal UI, Omarchy panel and agent.",
    site: "groundwork.timmo.dev",
    github: { owner: "timmo001", repo: "groundwork" },
    navigation: {
      sidebar: [
        "/",
        "/principles",
        "/targets",
        {
          label: "Foundations",
          root: "/foundations",
          items: [
            "/foundations/colour",
            "/foundations/type",
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
          items: ["/components/demo"],
        },
        "/roadmap",
      ],
    },
    theme: {
      accent: {
        light: "#1b2025",
        dark: "#e5e8ec",
      },
    },
  }),
);
