import { createHash } from "node:crypto";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";

/**
 * Image rules shared by the source tree and the `l10n/` overlays: only these
 * formats may ship (fail-closed on anything else), each served as exactly this
 * content type, and a per-file cap so a content PR cannot bloat the store. A
 * localized image inherits all three.
 */
export const IMAGE_CONTENT_TYPES: ReadonlyMap<string, string> = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
]);
export const ASSET_EXT_ALLOWLIST: ReadonlySet<string> = new Set(
  IMAGE_CONTENT_TYPES.keys()
);
/** 1 MiB. */
export const MAX_ASSET_BYTES = 1024 * 1024;

/** The paths the compiler treats as images: streamed and hashed, never kept. */
export const IMAGE_PATH_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

/** Lowercased extension of a path, or "" when it has none. */
export function imageExt(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot < 0 ? "" : base.slice(dot + 1).toLowerCase();
}

/** An image as the compiler sees it: its size and hash, never its bytes. */
export interface ImageRef {
  size: number;
  /** Hex sha256 of the bytes; null when the extraction skipped hashing (teacher preview). */
  sha256: string | null;
}

/**
 * Blob key for an image. Content-addressed, so identical bytes share one
 * object, nothing is ever overwritten, and a rolled-back bundle still resolves.
 */
export function contentImagePathname(sha256: string, ext: string): string {
  return `content/${sha256}.${ext}`;
}

export function contentImageUrl(sha256: string, ext: string): string {
  return `${CONTENT_BLOB_BASE_URL}/${contentImagePathname(sha256, ext)}`;
}

/**
 * One `assets.json` entry: what the build-time sync needs to fetch an image
 * from the content repo, verify it, and upload it under its key. `path` is one
 * repo path holding these bytes (the smallest, when several do).
 */
export interface AssetManifestEntry {
  sha256: string;
  ext: string;
  size: number;
  contentType: string;
  path: string;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Sanity's content-derived asset id: `image-<sha1>-<w>x<h>-<format>`. Uploading
 * the same bytes twice yields one asset (spec §9.6), so this id is our dedupe
 * key: compute it, skip the upload if it already exists.
 */
export function computeAssetId(
  bytes: Uint8Array,
  dims: Dimensions,
  format: string
): string {
  const sha1 = createHash("sha1").update(Buffer.from(bytes)).digest("hex");
  return `image-${sha1}-${dims.width}x${dims.height}-${format}`;
}

/** Build the public CDN url for an asset id (`image-<hash>-<dims>-<fmt>`). */
export function cdnUrl(
  assetId: string,
  projectId: string,
  dataset: string
): string {
  const m = /^image-([0-9a-f]+)-(\d+x\d+)-(\w+)$/.exec(assetId);
  if (!m) return "";
  const [, hash, dims, fmt] = m;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dims}.${fmt}`;
}

const IMG = /!\[([^\]]*)\]\(([^)]+)\)/g;
const isRemote = (u: string): boolean =>
  /^(https?:)?\/\//.test(u) || u.startsWith("/");

/**
 * Rewrite relative markdown image paths to resolved CDN urls (spec §9.6).
 * Absolute or remote urls are left untouched. `resolve` returns null when the
 * path has no uploaded asset (leave as-is so the failure is visible).
 */
export function rewriteMarkdownAssetPaths(
  markdown: string,
  resolve: (relPath: string) => string | null
): string {
  return markdown.replace(IMG, (whole, alt: string, url: string) => {
    if (isRemote(url)) return whole;
    const resolved = resolve(url);
    return resolved ? `![${alt}](${resolved})` : whole;
  });
}
