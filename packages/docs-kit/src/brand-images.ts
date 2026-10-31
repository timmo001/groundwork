import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Where to write each image. Leave one out to skip it. */
export interface BrandImageOutputs {
  /** 1280×640 card for the GitHub repository's social preview. */
  socialPreview?: string;
  /** 1200×630 Open Graph card. */
  og?: string;
  /** 512px transparent logo, for `seo.organization.logo` and search engines. */
  logo?: string;
  /** 180px logo on the card background, for iOS home screens. */
  appleTouchIcon?: string;
}

/** Options for {@link writeBrandImages}. */
export interface BrandImagesOptions {
  /** Path to the square SVG logo. */
  logo: string;
  /** Card headline, usually the site title. */
  title: string;
  /** Card subtitle, one entry per line. */
  tagline: readonly string[];
  /** Site address shown under the tagline. */
  site: string;
  /** Card and icon background color. */
  background: string;
  /** Color of the top strip and the site address. */
  accent: string;
  outputs: BrandImageOutputs;
}

const fontStack = "Inter, 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif";

const svgOpenTag = /^<svg\b[^>]*>/;

/** The card title's largest font size, used whenever the title fits. */
const titleMaxSize = 104;

/**
 * Roughly how wide a bold title character is, as a share of its font size.
 * On the generous side, so a long title shrinks before it runs off the card.
 */
const titleCharWidth = 0.6;

const escapeXml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/**
 * Render the raster branding from a site's SVG logo: share cards with the
 * logo, title, tagline and site address, and square PNG logos. Returns the
 * paths written.
 */
export const writeBrandImages = async (
  options: BrandImagesOptions,
): Promise<string[]> => {
  const logo = (await readFile(options.logo, "utf8")).trim();
  const openTag = svgOpenTag.exec(logo)?.[0];
  const viewBox = openTag?.match(/\bviewBox="([^"]+)"/)?.[1];

  if (openTag === undefined || viewBox === undefined) {
    throw new Error(
      `${options.logo} must start with an <svg> tag that has a viewBox`,
    );
  }

  const logoAt = (x: number, y: number, size: number) =>
    logo.replace(
      openTag,
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}">`,
    );

  const card = (width: number, height: number) => {
    const logoSize = 300;
    const logoX = Math.round(width * 0.09);
    const logoY = Math.round((height - logoSize) / 2);
    const textX = logoX + logoSize + 60;
    const top = Math.round(height / 2 - 25);

    // Shrink a long title to fit beside the logo, keeping the same margin on
    // the right as between the logo and the text
    const titleSize = Math.min(
      titleMaxSize,
      Math.floor(
        (width - textX - 60) / (options.title.length * titleCharWidth),
      ),
    );

    const taglineLines = options.tagline
      .map(
        (line, index) =>
          `<text x="${textX + 4}" y="${top + 72 + index * 48}" font-size="38" fill-opacity="0.88">${escapeXml(line)}</text>`,
      )
      .join("\n    ");

    const siteY = top + 72 + Math.max(options.tagline.length - 1, 0) * 48 + 80;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${options.background}"/>
  <rect width="${width}" height="10" fill="${options.accent}"/>
  ${logoAt(logoX, logoY, logoSize)}
  <g font-family="${fontStack}" fill="#ffffff">
    <text x="${textX}" y="${top}" font-size="${titleSize}" font-weight="700">${escapeXml(options.title)}</text>
    ${taglineLines}
    <text x="${textX + 4}" y="${siteY}" font-size="30" fill="${options.accent}">${escapeXml(options.site)}</text>
  </g>
</svg>`;
  };

  const square = (size: number, fill?: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${fill === undefined ? logoAt(0, 0, size) : `<rect width="${size}" height="${size}" fill="${fill}"/>${logoAt(size * 0.1, size * 0.1, size * 0.8)}`}
</svg>`;

  const { outputs } = options;

  const images = [
    { file: outputs.socialPreview, render: () => card(1280, 640) },
    { file: outputs.og, render: () => card(1200, 630) },
    { file: outputs.logo, render: () => square(512) },
    {
      file: outputs.appleTouchIcon,
      render: () => square(180, options.background),
    },
  ];

  const written: string[] = [];

  for (const { file, render } of images) {
    if (file === undefined) continue;
    await mkdir(path.dirname(file), { recursive: true });
    await sharp(Buffer.from(render())).png().toFile(file);
    written.push(file);
  }

  return written;
};
