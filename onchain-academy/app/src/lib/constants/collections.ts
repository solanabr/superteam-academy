/**
 * Track-to-collection address mapping.
 *
 * Each track has a Metaplex Core collection on devnet used for
 * credential NFTs. Set the corresponding NEXT_PUBLIC_*_COLLECTION
 * env var after creating collections with create_achievement_type.
 */
export const TRACK_COLLECTIONS: Record<string, string> = {
  rust: (process.env.NEXT_PUBLIC_RUST_COLLECTION ?? "").trim(),
  anchor: (process.env.NEXT_PUBLIC_ANCHOR_COLLECTION ?? "").trim(),
  frontend: (process.env.NEXT_PUBLIC_FRONTEND_COLLECTION ?? "").trim(),
  security: (process.env.NEXT_PUBLIC_SECURITY_COLLECTION ?? "").trim(),
  defi: (process.env.NEXT_PUBLIC_DEFI_COLLECTION ?? "").trim(),
  mobile: (process.env.NEXT_PUBLIC_MOBILE_COLLECTION ?? "").trim(),
};

/**
 * Returns the collection address for a given track, or null if not configured.
 */
export function getTrackCollection(track: string): string | null {
  const addr = TRACK_COLLECTIONS[track];
  return addr && addr.length > 0 ? addr : null;
}
