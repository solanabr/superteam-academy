import type { Track } from "./types";

export const tracks: Track[] = [
  {
    id: "solana-fundamentals",
    name: "Solana Fundamentals",
    description:
      "Master the basics of Solana blockchain development — accounts, transactions, programs, and your first on-chain interactions.",
    slug: "solana-fundamentals",
    icon: "Cube",
    courseCount: 3,
  },
  {
    id: "anchor-development",
    name: "Anchor Development",
    description:
      "Build production-ready Solana programs with the Anchor framework — PDAs, CPIs, testing, and advanced patterns.",
    slug: "anchor-development",
    icon: "Anchor",
    courseCount: 3,
  },
  {
    id: "defi-on-solana",
    name: "DeFi on Solana",
    description:
      "Design and implement decentralized finance protocols — token swaps, liquidity pools, lending, and yield strategies.",
    slug: "defi-on-solana",
    icon: "CurrencyDollar",
    courseCount: 3,
  },
];
