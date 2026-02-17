export type Course = {
  slug: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  lessons: { slug: string; title: string; minutes: number }[];
};

export const COURSES: Course[] = [
  {
    slug: "solana-foundations",
    title: "Solana Foundations",
    description:
      "Wallets, accounts, transactions, and how Solana actually works — in one practical path.",
    level: "Beginner",
    tags: ["Solana", "Web3", "Wallet"],
    lessons: [
      { slug: "accounts", title: "Accounts + rent 101", minutes: 12 },
      { slug: "transactions", title: "Transactions + signatures", minutes: 14 },
      { slug: "spl", title: "SPL tokens basics", minutes: 16 },
    ],
  },
  {
    slug: "anchor-escrow",
    title: "Anchor Escrow (Secure Patterns)",
    description:
      "Build an escrow program with correct authority checks, PDAs, and tests.",
    level: "Intermediate",
    tags: ["Anchor", "Security", "PDA"],
    lessons: [
      { slug: "pda", title: "PDA seeds + constraints", minutes: 18 },
      { slug: "cpi", title: "Token CPI + invariants", minutes: 22 },
    ],
  },
  {
    slug: "token-2022",
    title: "Token-2022 for Builders",
    description:
      "Extensions, metadata, and the gotchas you only learn by shipping.",
    level: "Advanced",
    tags: ["Token-2022", "Extensions"],
    lessons: [
      { slug: "extensions", title: "Extensions overview", minutes: 15 },
      { slug: "metadata", title: "MetadataPointer + TokenMetadata", minutes: 20 },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}
