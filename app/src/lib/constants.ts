export const siteConfig = {
  name: "Superteam Academy",
  description:
    "The ultimate learning platform for Solana developers. From zero to deploying production-ready dApps.",
  url: "https://academy.superteam.fun",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/SuperteamBR",
    discord: "https://discord.gg/superteambrasil",
    github: "https://github.com/solanabr/superteam-academy",
  },
} as const;

export const solanaConfig = {
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID!,
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet") as
    | "devnet"
    | "mainnet-beta",
  heliusApiKey: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
} as const;

export const XP_PER_LEVEL_BASE = 100;

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / XP_PER_LEVEL_BASE));
}

export function xpForLevel(level: number): number {
  return level * level * XP_PER_LEVEL_BASE;
}

export function xpProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return { level, currentLevelXp, nextLevelXp, progress };
}

export const difficultyLabels: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

export const trackLabels: Record<number, string> = {
  1: "Solana Fundamentals",
  2: "Anchor Development",
  3: "DeFi Development",
  4: "NFT & Metaplex",
  5: "Full Stack Solana",
};

export const courseThumbnails: Record<string, string> = {
  "solana-dev-setup": "/courses/solana-dev-setup.svg",
  "intro-to-solana": "/courses/intro-to-solana.webp",
  "anchor-fundamentals": "/courses/anchor-fundamentals.svg",
  "token-extensions": "/courses/token-extensions.png",
  "metaplex-core-nfts": "/courses/metaplex-core-nfts.png",
  "defi-on-solana": "/courses/defi-on-solana.svg",
};
