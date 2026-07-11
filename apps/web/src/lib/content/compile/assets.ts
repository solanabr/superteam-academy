import { createHash } from "node:crypto";

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
