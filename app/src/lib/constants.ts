import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf";
export const PROGRAM_PK = new PublicKey(PROGRAM_ID);
export const XP_TOKEN_MINT = "XPT2BDiuNVR12Lo3MdqAkB6hAjSRinCV3JuW8K7i7xX";
export const XP_TOKEN_MINT_PK = new PublicKey(XP_TOKEN_MINT);
export const METAPLEX_CORE_PROGRAM = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
export const MPL_CORE_PROGRAM_ID = new PublicKey(METAPLEX_CORE_PROGRAM);
export const TOKEN_2022_PROGRAM_PK = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export const DEVNET_RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const HELIUS_DEVNET_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || DEVNET_RPC;

export const LOCALES = ["en", "pt-BR", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
    en: "English",
    "pt-BR": "Português",
    es: "Español",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
    en: "🇺🇸",
    "pt-BR": "🇧🇷",
    es: "🇪🇸",
};

export const XP_REWARDS = {
    LESSON_MIN: 10,
    LESSON_MAX: 50,
    CHALLENGE_MIN: 25,
    CHALLENGE_MAX: 100,
    COURSE_MIN: 500,
    COURSE_MAX: 2000,
    DAILY_STREAK: 10,
    FIRST_DAILY: 25,
} as const;

export const STREAK_MILESTONES = [7, 30, 100] as const;

export const NAV_ITEMS = [
    { key: "courses", href: "/courses" },
    { key: "dashboard", href: "/dashboard" },
    { key: "leaderboard", href: "/leaderboard" },
] as const;

export const TRACKS = [
    { id: "solana-fundamentals", name: "Solana Fundamentals", color: "#9945ff" },
    { id: "anchor-development", name: "Anchor Development", color: "#14f195" },
    { id: "defi-developer", name: "DeFi Developer", color: "#06b6d4" },
    { id: "nft-creator", name: "NFT Creator", color: "#f59e0b" },
    { id: "security-auditor", name: "Security Auditor", color: "#ef4444" },
    { id: "full-stack-solana", name: "Full Stack Solana", color: "#8b5cf6" },
] as const;
