const PASTEL_PALETTE = [
  "#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#e0bbe4",
  "#ffdfba", "#c9b1ff", "#a8e6cf", "#ffd3b6", "#ffaaa7",
  "#d4a5a5", "#9ec1cf", "#9ee09e", "#fdfd96", "#c3bef7",
] as const;

/** Deterministic pastel colors from name for Facehash avatars */
export function getAvatarColors(name: string): string[] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  const i1 = Math.abs(hash) % PASTEL_PALETTE.length;
  const i2 = Math.abs(hash * 7 + 1) % PASTEL_PALETTE.length;
  const i3 = Math.abs(hash * 13 + 2) % PASTEL_PALETTE.length;
  return [PASTEL_PALETTE[i1], PASTEL_PALETTE[i2], PASTEL_PALETTE[i3]];
}
