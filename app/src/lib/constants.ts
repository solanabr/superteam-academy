// Solana network
export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// XP & Leveling
export const XP_PER_LESSON_MIN = 10;
export const XP_PER_LESSON_MAX = 50;
export const XP_PER_CHALLENGE_MIN = 25;
export const XP_PER_CHALLENGE_MAX = 100;
export const XP_PER_COURSE_MIN = 500;
export const XP_PER_COURSE_MAX = 2000;
export const XP_DAILY_STREAK_BONUS = 10;
export const XP_FIRST_COMPLETION_BONUS = 25;
export const MAX_DAILY_XP = 2000;

// Streak milestones
export const STREAK_MILESTONES = [7, 30, 100, 365];

// Difficulty colors
export const DIFFICULTY_COLORS = {
  beginner: "text-brazil-green",
  intermediate: "text-brazil-gold",
  advanced: "text-brazil-coral",
} as const;

export const DIFFICULTY_BG = {
  beginner: "bg-brazil-green/10 text-brazil-green",
  intermediate: "bg-brazil-gold/10 text-brazil-gold",
  advanced: "bg-brazil-coral/10 text-brazil-coral",
} as const;

// Track registry (matches on-chain spec)
export const TRACKS: Record<number, { name: string; display: string; short: string; color: string; icon: string }> = {
  0: { name: "standalone", display: "Standalone",       short: "Core",     color: "#a1a1aa", icon: "BookOpen" },
  1: { name: "anchor",     display: "Anchor Framework", short: "Anchor",   color: "#4a8c5c", icon: "Anchor" },
  2: { name: "rust",       display: "Rust for Solana",  short: "Rust",     color: "#d4755e", icon: "Code" },
  3: { name: "defi",       display: "DeFi Development", short: "DeFi",     color: "#2d9b6e", icon: "TrendingUp" },
  4: { name: "security",   display: "Program Security", short: "Security", color: "#ef4444", icon: "Shield" },
  5: { name: "frontend",   display: "Frontend & dApps", short: "Frontend", color: "#43b5a0", icon: "Layout" },
  6: { name: "token",      display: "Token Engineering",short: "Tokens",   color: "#d4b83d", icon: "Coins" },
};

// Learning paths
export const LEARNING_PATHS = [
  {
    id: "solana-fundamentals",
    name: "Solana Fundamentals",
    description: "Start from zero and learn the core concepts of Solana blockchain development.",
    icon: "Rocket",
    courses: ["intro-to-solana", "solana-cli", "keypairs-and-wallets"],
    color: "#78c48c",
  },
  {
    id: "defi-developer",
    name: "DeFi Developer",
    description: "Build decentralized finance applications: AMMs, lending, and staking protocols.",
    icon: "TrendingUp",
    courses: ["token-program", "liquidity-pools", "lending-protocol"],
    color: "#5fd4a0",
  },
  {
    id: "anchor-mastery",
    name: "Anchor Mastery",
    description: "Master the Anchor framework for building Solana programs.",
    icon: "Anchor",
    courses: ["anchor-basics", "anchor-pdas", "anchor-testing", "anchor-security"],
    color: "#d4b83d",
  },
  {
    id: "full-stack-solana",
    name: "Full Stack Solana",
    description: "Build complete dApps from smart contracts to frontend interfaces.",
    icon: "Layers",
    courses: ["nextjs-solana", "wallet-adapter", "transaction-ui"],
    color: "#6dd8c4",
  },
];
