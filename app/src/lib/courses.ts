export interface CourseData {
    id: string;
    slug: string;
    title: string;
    titlePt: string;
    titleEs: string;
    description: string;
    descriptionPt: string;
    track: "anchor" | "defi" | "nft" | "core";
    level: "beginner" | "intermediate" | "advanced";
    lessonCount: number;
    xpPerLesson: number;
    completionBonus: number;
    prerequisiteId?: string;
    isActive: boolean;
    startingSoon?: boolean;
    thumbnail: string;
    instructor: string;
    duration: string; // e.g. "4 hours"
    lessons: LessonData[];
}

export interface LessonData {
    id: string;
    index: number;
    title: string;
    content: string; // Markdown
    hasCodeChallenge: boolean;
    challenge?: CodeChallenge;
}

export interface CodeChallenge {
    prompt: string;
    starterCode: string;
    testCases: { input: string; expected: string; description: string }[];
    language: "typescript" | "rust";
}

export const STATIC_COURSES: CourseData[] = [
    {
        id: "anchor-basics",
        slug: "anchor-basics",
        title: "Anchor Development Basics",
        titlePt: "Fundamentos do Anchor",
        titleEs: "Fundamentos de Anchor",
        description: "Learn to build Solana programs with the Anchor framework from zero to deployed.",
        descriptionPt: "Aprenda a criar programas Solana com o framework Anchor do zero ao deploy.",
        track: "anchor",
        level: "beginner",
        lessonCount: 8,
        xpPerLesson: 100,
        completionBonus: 400,
        isActive: true,
        thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
        instructor: "Superteam Brazil",
        duration: "6 hours",
        lessons: [
            {
                id: "anchor-basics-0",
                index: 0,
                title: "Introduction to Anchor",
                content: `# Introduction to Anchor

Anchor is a framework for Solana's Sealevel runtime providing several convenient developer tools. It makes building secure Solana programs significantly easier.

## What You'll Learn
- What Anchor is and why use it
- Setting up your development environment
- Your first Anchor program structure

## Key Concepts

**Accounts** are the fundamental unit of state in Solana. Programs are stateless — all state lives in accounts.

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId");

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\`

Every Anchor program has three sections:
1. The **program ID** declaration
2. The **instruction handlers** (the logic)
3. The **account structs** (validation)`,
                hasCodeChallenge: false,
            },
            {
                id: "anchor-basics-1",
                index: 1,
                title: "PDAs & Account Storage",
                content: `# Program Derived Addresses (PDAs)

PDAs are accounts owned by programs — they have no private key and can only be signed by the program itself.

## Deriving a PDA

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed"), user.toBuffer()],
  PROGRAM_ID
);
\`\`\`

## Storing PDAs in Anchor

\`\`\`rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub score: u64,
    pub bump: u8,
}
\`\`\``,
                hasCodeChallenge: true,
                challenge: {
                    prompt: "Derive the enrollment PDA for courseId 'anchor-basics' and the connected wallet",
                    starterCode: `import { PublicKey } from "@solana/web3.js";\n\nconst PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");\nconst courseId = "anchor-basics";\nconst wallet = new PublicKey("YourWalletAddressHere");\n\n// Derive the enrollment PDA\nconst [enrollmentPda] = PublicKey.findProgramAddressSync(\n  // TODO: fill in the seeds\n  [],\n  PROGRAM_ID\n);\n\nconsole.log("Enrollment PDA:", enrollmentPda.toBase58());`,
                    testCases: [
                        {
                            input: "courseId=anchor-basics, wallet=11111111111111111111111111111111",
                            expected: "A valid base58 public key",
                            description: "Should derive a deterministic PDA from seeds",
                        },
                    ],
                    language: "typescript",
                },
            },
        ],
    },
    {
        id: "defi-fundamentals",
        slug: "defi-fundamentals",
        title: "DeFi on Solana",
        titlePt: "DeFi no Solana",
        titleEs: "DeFi en Solana",
        description: "Understand AMMs, liquidity pools, and lending protocols on Solana.",
        descriptionPt: "Entenda AMMs, pools de liquidez e protocolos de empréstimo no Solana.",
        track: "defi",
        level: "intermediate",
        lessonCount: 6,
        xpPerLesson: 150,
        completionBonus: 450,
        prerequisiteId: "anchor-basics",
        isActive: true,
        thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        instructor: "Superteam Brazil",
        duration: "5 hours",
        lessons: [
            {
                id: "defi-fundamentals-0",
                index: 0,
                title: "Introduction to DeFi",
                content: `# Decentralized Finance on Solana

DeFi protocols remove intermediaries by using smart contracts (programs) to facilitate financial transactions.

## Core DeFi Primitives

- **DEXs** — Decentralized Exchanges (Raydium, Orca, Jupiter)
- **Lending** — Borrow/supply assets (MarginFi, Kamino)
- **Stablecoins** — USDC, USDT, and algorithmic variants
- **Yield Farming** — Earn rewards by providing liquidity

## Why Solana?

Solana processes ~50,000 TPS with sub-second finality and <$0.01 fees, making DeFi accessible to everyone.`,
                hasCodeChallenge: false,
            },
        ],
    },
    {
        id: "nft-metaplex",
        slug: "nft-metaplex",
        title: "NFTs with Metaplex Core",
        titlePt: "NFTs com Metaplex Core",
        titleEs: "NFTs con Metaplex Core",
        description: "Build NFT collections, mint assets, and implement soulbound credentials using Metaplex Core.",
        descriptionPt: "Construa coleções NFT, mint assets e implemente credenciais soulbound usando Metaplex Core.",
        track: "nft",
        level: "intermediate",
        lessonCount: 7,
        xpPerLesson: 120,
        completionBonus: 420,
        isActive: true,
        thumbnail: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80",
        instructor: "Superteam Brazil",
        duration: "5 hours",
        lessons: [
            {
                id: "nft-metaplex-0",
                index: 0,
                title: "Metaplex Core Overview",
                content: `# Metaplex Core

Metaplex Core is the next-generation NFT standard on Solana, replacing Token Metadata with a more efficient and flexible system.

## Key Features

- **Single account** per asset (cheaper than previous standards)
- **Plugins** — extensible behavior (royalties, freeze, burn, etc.)
- **Collections** — group assets with collection PDAs

## Soulbound NFTs (PermanentFreezeDelegate)

\`\`\`typescript
import { create } from "@metaplex-foundation/mpl-core";

await create(umi, {
  asset: asset.publicKey,
  name: "Superteam Academy Credential",
  uri: metadataUri,
  plugins: [{
    type: "PermanentFreezeDelegate",
    frozen: true,
    authority: { type: "UpdateAuthority" }
  }]
}).sendAndConfirm(umi);
\`\`\``,
                hasCodeChallenge: false,
            },
        ],
    },
    {
        id: "solana-core",
        slug: "solana-core",
        title: "Solana Core Concepts",
        titlePt: "Conceitos Fundamentais do Solana",
        titleEs: "Conceptos Fundamentales de Solana",
        description: "Deep dive into Solana's architecture: accounts, runtime, tokens, and the execution model.",
        descriptionPt: "Mergulhe na arquitetura do Solana: contas, runtime, tokens e o modelo de execução.",
        track: "core",
        level: "beginner",
        lessonCount: 10,
        xpPerLesson: 75,
        completionBonus: 375,
        isActive: true,
        startingSoon: false,
        thumbnail: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&q=80",
        instructor: "Superteam Brazil",
        duration: "8 hours",
        lessons: [],
    },
    {
        id: "anchor-advanced",
        slug: "anchor-advanced",
        title: "Advanced Anchor Patterns",
        titlePt: "Padrões Avançados no Anchor",
        titleEs: "Patrones Avanzados de Anchor",
        description: "CPIs, account compression, custom errors, and production-ready program architecture.",
        descriptionPt: "CPIs, compressão de contas, erros customizados e arquitetura de programas production-ready.",
        track: "anchor",
        level: "advanced",
        lessonCount: 8,
        xpPerLesson: 200,
        completionBonus: 800,
        prerequisiteId: "anchor-basics",
        isActive: true,
        startingSoon: true,
        thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
        instructor: "Superteam Brazil",
        duration: "7 hours",
        lessons: [],
    },
];

export function getCourseBySlug(slug: string): CourseData | undefined {
    return STATIC_COURSES.find((c) => c.slug === slug);
}

export function getCourseById(id: string): CourseData | undefined {
    return STATIC_COURSES.find((c) => c.id === id);
}
