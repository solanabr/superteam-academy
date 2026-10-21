import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";
import type { AchievementDoc, CourseDoc } from "@/lib/content/types";
import { siteUrl } from "./site-origin";

/**
 * Metaplex JSON for the NFTs the platform creates from content: achievement
 * types (whose URI every awarded achievement copies) and course credential
 * collections. Built from the committed bundle only, so the document carries
 * nothing a learner wrote and nothing about who made the course.
 */

export const NFT_SYMBOL = "STACAD";
const PLATFORM = "Superteam Academy";

/** Square brand mark, used when content has no image of its own. */
export const BRAND_IMAGE_PATH = "/android-chrome-512x512.png";

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

export interface NftMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: NftAttribute[];
  properties: {
    category: "image";
    files: { uri: string; type: string }[];
  };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function imageType(uri: string): string {
  const ext = new URL(uri).pathname.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_TYPES[ext] ?? "image/png";
}

/**
 * A content image, but only when it is on the content blob store the compiler
 * writes to. Anything else falls back to the brand mark rather than putting an
 * arbitrary host in front of wallets.
 */
export function contentImageUrl(value: unknown, origin: string): string {
  const url = text(value);
  if (url && url.startsWith(`${CONTENT_BLOB_BASE_URL}/`)) return url;
  return siteUrl(BRAND_IMAGE_PATH, origin);
}

function build(
  fields: Omit<NftMetadata, "symbol" | "properties">
): NftMetadata {
  return {
    ...fields,
    symbol: NFT_SYMBOL,
    properties: {
      category: "image",
      files: [{ uri: fields.image, type: imageType(fields.image) }],
    },
  };
}

export function achievementMetadata(
  doc: AchievementDoc,
  origin: string
): NftMetadata {
  const name = text(doc.name) ?? doc._id;
  const attributes: NftAttribute[] = [
    { trait_type: "Type", value: "Achievement" },
  ];
  const category = text(doc.category);
  if (category) attributes.push({ trait_type: "Category", value: category });
  const xp = positiveNumber(doc.xpReward);
  if (xp !== null) attributes.push({ trait_type: "XP Reward", value: xp });
  attributes.push({ trait_type: "Platform", value: PLATFORM });

  return build({
    name,
    description:
      text(doc.description) ?? `${name}, an achievement on ${PLATFORM}.`,
    image: siteUrl(BRAND_IMAGE_PATH, origin),
    external_url: siteUrl("/", origin),
    attributes,
  });
}

export function courseCollectionMetadata(
  doc: CourseDoc,
  origin: string
): NftMetadata {
  const title = text(doc.title) ?? doc._id;
  const attributes: NftAttribute[] = [
    { trait_type: "Type", value: "Course Credential" },
    { trait_type: "Course", value: title },
  ];
  const difficulty = text(doc.difficulty);
  if (difficulty) {
    attributes.push({ trait_type: "Difficulty", value: difficulty });
  }
  attributes.push({ trait_type: "Platform", value: PLATFORM });

  const summary = `Completion credentials for ${title} on ${PLATFORM}.`;
  const description = text(doc.description);

  return build({
    // Matches the on-chain collection name (`deployCourseTrackCollection`).
    name: `${title} Credentials`,
    description: description ? `${summary} ${description}` : summary,
    image: contentImageUrl(doc.thumbnail, origin),
    external_url: siteUrl(
      `/courses/${encodeURIComponent(doc.slug.current)}`,
      origin
    ),
    attributes,
  });
}
