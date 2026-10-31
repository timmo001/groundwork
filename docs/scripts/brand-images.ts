// Renders the PNG branding from src/assets/logo.svg. Run with: bun run brand
import { writeBrandImages } from "@timmo001/docs-kit";

const written = await writeBrandImages({
  logo: "src/assets/logo.svg",
  title: "Groundwork",
  tagline: [
    "The groundwork for designing and building",
    "for every app, CLI and agent.",
  ],
  site: "groundwork.timmo.dev",
  background: "#1b1e23",
  accent: "#e5e8ec",
  outputs: {
    socialPreview: "../.github/social-preview.png",
    logo: "public/logo.png",
    appleTouchIcon: "public/apple-touch-icon.png",
  },
});

for (const file of written) console.log(`Wrote ${file}`);
