export const siteConfig = {
  name: "Superteam Academy",
  description:
    "The ultimate learning platform for Solana developers. From zero to deploying production-ready dApps.",
  url: "https://academy.superteam.fun",
  links: {
    twitter: "https://x.com/SuperteamBR",
    discord: "https://discord.gg/superteambrasil",
    github: "https://github.com/solanabr",
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
  6: "Partners",
  7: "Others",
};

export const courseThumbnails: Record<string, string> = {
  "solana-dev-setup": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "anchor-fundamentals": "https://i.ibb.co/B5H3wpmh/anchor-fundamentals.jpg",
  "metaplex-tokens": "https://i.ibb.co/TVWt16r/metaplex.png",
  "metaplex-nfts": "https://i.ibb.co/TVWt16r/metaplex.png",
  "metaplex-smart-contracts": "https://i.ibb.co/TVWt16r/metaplex.png",
  "metaplex-dev-tools": "https://i.ibb.co/TVWt16r/metaplex.png",
  "solana-getting-started": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-core-concepts": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-token-basics": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-token-extensions": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-developing-programs": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-frontend": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-rust-sdk": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-typescript-sdk": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-python-sdk": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-java-sdk": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-go-sdk": "https://i.ibb.co/FLrYxm5Y/solana.webp",
  "solana-gaming-sdks": "https://i.ibb.co/FLrYxm5Y/solana.webp",
};
