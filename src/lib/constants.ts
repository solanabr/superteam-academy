/**
 * Program constants derived from docs/SPEC.md and docs/ARCHITECTURE.md.
 * All values here are the canonical frontend references for on-chain state.
 */

// ─── PDA Seeds (ARCHITECTURE.md §Account Map) ──────────────────────
export const PDA_SEEDS = {
  CONFIG: "config",
  COURSE: "course",
  LEARNER: "learner",
  ENROLLMENT: "enrollment",
  CREDENTIAL: "credential",
} as const;

// ─── Token-2022 Extensions (SPEC.md §1) ────────────────────────────
export const XP_TOKEN_EXTENSIONS = [
  "NonTransferable",
  "PermanentDelegate",
  "MetadataPointer",
  "TokenMetadata",
] as const;

// ─── Track Registry (SPEC.md §4, off-chain) ────────────────────────
export const TRACKS = {
  0: { name: "standalone", display: "Standalone Course", icon: "📦" },
  1: { name: "anchor", display: "Anchor Framework", icon: "⚓" },
  2: { name: "rust", display: "Rust for Solana", icon: "🦀" },
  3: { name: "defi", display: "DeFi Development", icon: "💰" },
  4: { name: "security", display: "Program Security", icon: "🔒" },
} as const satisfies Record<number, { name: string; display: string; icon: string }>;

export type TrackId = keyof typeof TRACKS;

// ─── Level Derivation (SPEC.md §1) ─────────────────────────────────
// "Level = floor(sqrt(xp / 100))"
// 0-99 XP → Level 0, 100-399 → Level 1, 400-899 → Level 2, etc.

/**
 * Derives level from XP using the canonical formula from SPEC.md §1.
 *
 * @param xp - Total XP balance
 * @returns Derived level number
 */
export function deriveLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Returns the XP required to reach a given level.
 *
 * @param level - Target level
 * @returns Minimum XP required for that level
 */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Returns XP progress towards the next level as a percentage (0–100).
 *
 * @param xp - Current XP balance
 * @returns Percentage progress towards next level
 */
export function levelProgress(xp: number): number {
  const currentLevel = deriveLevel(xp);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range === 0) return 100;
  return Math.min(100, ((xp - currentLevelXP) / range) * 100);
}

// ─── Rate Limits (SPEC.md §10) ──────────────────────────────────────
export const RATE_LIMITS = {
  MAX_DAILY_XP: 2_000,
  MAX_LESSONS_PER_HOUR: 10,
  MAX_CHALLENGES_PER_HOUR: 5,
  UNENROLL_COOLDOWN_SECONDS: 86_400, // 24h
} as const;

// ─── Account Sizes (ARCHITECTURE.md §Account Sizes) ────────────────
export const ACCOUNT_SIZES = {
  CONFIG: 183,
  COURSE: 230,
  LEARNER_PROFILE: 111,
  ENROLLMENT: 99,
  CREDENTIAL: 88,
} as const;

// ─── ZK Compression Lookup Tables (ARCHITECTURE.md §ZK Compression) ─
export const LOOKUP_TABLES = {
  MAINNET: "9NYFyEqPkyXUhkerbGHXUXkvb4qpzeEdHuGpgbgpH1NJ",
  DEVNET: "qAJZMgnQJ8G6vA3WRcjD9Jan1wtKkaCFWLWskxJrR5V",
} as const;

// ─── Achievement Definitions (SPEC.md §9, bitmap up to 256) ────────
export const MAX_ACHIEVEMENTS = 256;

// ─── Streak Milestones (SPEC.md §8) ────────────────────────────────
export const STREAK_MILESTONES = [7, 30, 100, 365] as const;
