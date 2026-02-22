/**
 * Shared achievement metadata — single source of truth for glyphs,
 * display names, hints, and tier classification.
 *
 * Used by: dashboard-identity-panel.tsx, achievement-card.tsx, achievement-grid.tsx
 */

export interface AchievementMeta {
  id: string;
  glyph: string;
  name: string;
  hint: string;
}

/** All achievements with V9 monospace glyphs — keyed by full Sanity _id */
export const ACHIEVEMENT_META: AchievementMeta[] = [
  // Progress
  {
    id: "achievement-first-steps",
    glyph: "01",
    name: "First Steps",
    hint: "Complete your first lesson",
  },
  {
    id: "achievement-course-completer",
    glyph: "\u2726",
    name: "Completer",
    hint: "Complete an entire course",
  },
  {
    id: "achievement-speed-runner",
    glyph: "\u00bb",
    name: "Speed Run",
    hint: "Complete a course in under 24 hours",
  },
  // Streaks
  {
    id: "achievement-week-warrior",
    glyph: "7\u00d7",
    name: "7d Streak",
    hint: "Maintain a 7-day learning streak",
  },
  {
    id: "achievement-monthly-master",
    glyph: "30",
    name: "30d Master",
    hint: "Maintain a 30-day learning streak",
  },
  {
    id: "achievement-consistency-king",
    glyph: "\u221e",
    name: "100d King",
    hint: "Maintain a 100-day learning streak",
  },
  // Skills
  {
    id: "achievement-rust-rookie",
    glyph: "Rs",
    name: "Rust Rookie",
    hint: "Complete your first Rust challenge",
  },
  {
    id: "achievement-anchor-expert",
    glyph: "\u2b21",
    name: "Anchor Pro",
    hint: "Complete all Anchor framework lessons",
  },
  {
    id: "achievement-full-stack-solana",
    glyph: "\u25ce",
    name: "Full Stack",
    hint: "Complete all Solana Developer Path courses",
  },
  // Special
  {
    id: "achievement-early-adopter",
    glyph: "\u2729",
    name: "Early Bird",
    hint: "Join during the first month",
  },
  {
    id: "achievement-bug-hunter",
    glyph: "\u203b",
    name: "Bug Hunter",
    hint: "Report a verified platform bug",
  },
  {
    id: "achievement-perfect-score",
    glyph: "A+",
    name: "Perfect",
    hint: "Complete all challenges with no wrong attempts",
  },
];

/** Fast id→glyph lookup (used by achievement-card when only id is available) */
export const GLYPH_MAP: Record<string, string> = Object.fromEntries(
  ACHIEVEMENT_META.map((a) => [a.id, a.glyph])
);

/** Achievements that use the Solana iridescent tier (.dm-oct.sol / .ach-medal.sol) */
export const SOL_TIER_IDS = new Set([
  "achievement-full-stack-solana",
  "achievement-consistency-king",
  "achievement-early-adopter",
]);
