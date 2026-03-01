import { PublicKey } from "@solana/web3.js";
import { Credential } from "@/types";

// Simple mock data - no real blockchain calls needed for demo
export async function getXPBalance(wallet: PublicKey): Promise<number> {
  // Return demo XP value
  return 2450;
}

export async function getCredentials(wallet: PublicKey): Promise<Credential[]> {
  // Return demo credentials
  return [
    {
      id: "dev-fundamentals",
      track: "Development",
      level: 3,
      earnedAt: "2026-01-15",
      xp: 1200,
      mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      metadata: {
        name: "Development Fundamentals",
        image: "/credentials/dev-fundamentals.png",
        attributes: [
          { trait_type: "Track", value: "Development" },
          { trait_type: "Level", value: "3" },
        ],
      },
    },
    {
      id: "anchor-graduate",
      track: "Development",
      level: 2,
      earnedAt: "2026-01-10",
      xp: 800,
      mintAddress: "8YAf...4DEF",
      metadata: {
        name: "Anchor Graduate",
        image: "/credentials/anchor-graduate.png",
        attributes: [
          { trait_type: "Track", value: "Development" },
          { trait_type: "Level", value: "2" },
        ],
      },
    },
  ];
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) || 1;
}

// Calculate XP needed for next level
export function getXPToNextLevel(level: number): number {
  return Math.pow(level + 1, 2) * 100;
}

// Calculate progress to next level
export function getProgressToNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelBaseXP = Math.pow(level, 2) * 100;
  const nextLevelXP = Math.pow(level + 1, 2) * 100;
  const progress = ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
