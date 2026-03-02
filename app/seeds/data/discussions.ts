/**
 * 10 discussion threads with nested comment trees.
 * Thread #5 has 7-level nesting. Each comment references author by user index (0-11).
 */

export interface SeedComment {
  authorIndex: number;
  body: string;
  children?: SeedComment[];
}

export interface SeedThread {
  title: string;
  body: string;
  scope: "community" | "lesson";
  category?: string;
  tags: string[];
  authorIndex: number;
  isPinned?: boolean;
  lessonId?: string; // filled at seed time
  courseId?: string;
  comments: SeedComment[];
}

export function getThreads(): SeedThread[] {
  return [
    // ── Thread 1: General welcome (pinned) ─────────────────────────────
    {
      title: "Welcome to Superteam Academy!",
      body: "Hey everyone! Welcome to the community. Introduce yourself and share what you're building on Solana.",
      scope: "community",
      category: "General",
      tags: ["welcome", "introductions"],
      authorIndex: 10, // Debbie Discuss
      isPinned: true,
      comments: [
        {
          authorIndex: 0, // Alex
          body: "Excited to be here! I'm working on a DeFi protocol on Solana.",
          children: [
            {
              authorIndex: 3, // Suki
              body: "Cool! What kind of DeFi? AMM, lending, or something else?",
              children: [
                {
                  authorIndex: 0,
                  body: "Concentrated liquidity AMM with on-chain limit orders.",
                },
              ],
            },
          ],
        },
        {
          authorIndex: 7, // Nova
          body: "Just joined! Coming from Ethereum, excited to learn Solana.",
        },
        {
          authorIndex: 1, // Priya
          body: "Welcome Nova! The Intro to Solana course is a great starting point.",
        },
      ],
    },

    // ── Thread 2: Help with Anchor ─────────────────────────────────────
    {
      title: "How to handle PDA bumps in Anchor?",
      body: "I'm confused about when to store bumps vs recalculate them. The docs say to store canonical bumps but I see examples both ways. What's the best practice?",
      scope: "community",
      category: "Help",
      tags: ["anchor", "pda", "best-practices"],
      authorIndex: 2, // Marcus
      comments: [
        {
          authorIndex: 11, // Thread King
          body: "Always store the canonical bump in the PDA account data. Recalculating on every call wastes CU and can lead to subtle bugs if the bump search order changes.",
          children: [
            {
              authorIndex: 2,
              body: "Makes sense. So I should add a `bump: u8` field to my account struct?",
              children: [
                {
                  authorIndex: 11,
                  body: "Exactly. Use `#[account(init, seeds = [...], bump)]` for init, then `#[account(seeds = [...], bump = account.bump)]` for subsequent access.",
                },
              ],
            },
          ],
        },
        {
          authorIndex: 0, // Alex
          body: "Thread King nailed it. Also check the Anchor Fundamentals course Module 3 — it covers this in depth.",
        },
      ],
    },

    // ── Thread 3: Show & Tell ──────────────────────────────────────────
    {
      title: "Built a token-gated NFT gallery with Metaplex Core",
      body: "Just finished building a gallery dApp that uses Metaplex Core for NFT display and token-gating. Used Next.js + the DAS API for fetching assets. Happy to share the code!",
      scope: "community",
      category: "Show & Tell",
      tags: ["metaplex", "nft", "nextjs", "project"],
      authorIndex: 0, // Alex
      comments: [
        {
          authorIndex: 3, // Suki
          body: "This is amazing! Would love to see the DAS API integration code.",
        },
        {
          authorIndex: 4, // Jordan
          body: "Nice work! How did you handle the token-gating middleware?",
          children: [
            {
              authorIndex: 0,
              body: "I used a Next.js middleware that checks token ownership via Helius DAS. If the wallet holds the required collection NFT, access is granted.",
            },
          ],
        },
        {
          authorIndex: 10, // Debbie
          body: "This would make a great tutorial! Have you considered writing it up?",
        },
      ],
    },

    // ── Thread 4: Ideas ───────────────────────────────────────────────
    {
      title: "Feature request: code playground for challenges",
      body: "It would be awesome to have an in-browser Rust playground for the challenge exercises, similar to the Rust Playground but integrated into the lesson view.",
      scope: "community",
      category: "Ideas",
      tags: ["feature-request", "challenges", "playground"],
      authorIndex: 4, // Jordan
      comments: [
        {
          authorIndex: 10, // Debbie
          body: "Love this idea! WebAssembly-based Rust compilation would be incredible.",
        },
        {
          authorIndex: 1, // Priya
          body: "We could use the Piston API for multi-language execution. It already supports Rust and TypeScript.",
          children: [
            {
              authorIndex: 4,
              body: "That's exactly what I was thinking! Even a simple stdin/stdout runner would be a huge improvement.",
            },
          ],
        },
      ],
    },

    // ── Thread 5: Deep nesting (7 levels) ──────────────────────────────
    {
      title: "Understanding Solana's account model vs Ethereum's",
      body: "Coming from Ethereum, I'm struggling to understand why Solana separates data from code. Can someone explain the mental model?",
      scope: "community",
      category: "Help",
      tags: ["solana", "accounts", "ethereum", "beginner"],
      authorIndex: 7, // Nova
      comments: [
        {
          authorIndex: 11, // Thread King — Level 1
          body: "Think of it this way: on Ethereum, a smart contract IS its data. On Solana, programs are stateless — they read and write to separate account PDAs.",
          children: [
            {
              authorIndex: 7, // Nova — Level 2
              body: "So the program is like a pure function and accounts are the database?",
              children: [
                {
                  authorIndex: 11, // Level 3
                  body: "Exactly! Programs are deployed once and are immutable (unless upgradeable). All state lives in accounts that the program owns.",
                  children: [
                    {
                      authorIndex: 2, // Marcus — Level 4
                      body: "This is what makes Solana fast — parallel execution. If two transactions touch different accounts, they can run in parallel.",
                      children: [
                        {
                          authorIndex: 7, // Nova — Level 5
                          body: "Oh! So that's why you have to specify all accounts upfront in the transaction?",
                          children: [
                            {
                              authorIndex: 0, // Alex — Level 6
                              body: "Yes! The runtime uses this to schedule parallel execution. It's called Sealevel.",
                              children: [
                                {
                                  authorIndex: 1, // Priya — Level 7
                                  body: "And this is why account conflicts can cause transaction failures — two txs writing the same account can't parallelize.",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Thread 6: Lesson-scoped (Intro to Solana) ─────────────────────
    {
      title: "Confused about rent exemption calculation",
      body: "In the lesson about account creation, it mentions rent exemption but doesn't explain how to calculate the minimum lamports. Can someone clarify?",
      scope: "lesson",
      category: "Help",
      tags: ["rent", "accounts", "question"],
      authorIndex: 5, // Casey
      comments: [
        {
          authorIndex: 10, // Debbie
          body: "Use `connection.getMinimumBalanceForRentExemption(dataSize)`. The data size is in bytes — for a simple counter it's just 8 bytes (u64).",
          children: [
            {
              authorIndex: 5,
              body: "Thanks! So a u64 counter account would need about 0.00114 SOL?",
              children: [
                {
                  authorIndex: 10,
                  body: "Close! It also includes the 128 bytes of account overhead. So `getMinimumBalanceForRentExemption(8)` returns the exact amount.",
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Thread 7: Lesson-scoped (Anchor Fundamentals) ─────────────────
    {
      title: "Error: AccountNotInitialized in challenge 2.3",
      body: "Getting `AccountNotInitialized` when trying to call the update instruction. My init worked fine. What am I missing?",
      scope: "lesson",
      category: "Help",
      tags: ["anchor", "error", "challenge"],
      authorIndex: 6, // DevRaj
      comments: [
        {
          authorIndex: 11, // Thread King
          body: "Make sure you're passing the same PDA seeds. The most common mistake is using a different seed derivation between init and subsequent calls.",
        },
        {
          authorIndex: 1, // Priya
          body: "Also check that you're using `Account<'info, YourStruct>` not `UncheckedAccount`. Anchor needs the type annotation to deserialize.",
          children: [
            {
              authorIndex: 6,
              body: "That was it! I had `UncheckedAccount` from copy-pasting. Changed to `Account<'info, Counter>` and it works now. Thanks!",
            },
          ],
        },
      ],
    },

    // ── Thread 8: Community help ──────────────────────────────────────
    {
      title: "Best resources for learning Rust before Solana?",
      body: "I want to build a solid Rust foundation before diving into Anchor. What resources do you recommend alongside the Academy courses?",
      scope: "community",
      category: "Help",
      tags: ["rust", "learning", "resources"],
      authorIndex: 8, // Fresh Start
      comments: [
        {
          authorIndex: 1, // Priya
          body: "The Rust Book (doc.rust-lang.org/book) is essential. Chapters 1-10 cover everything you need for Solana dev.",
        },
        {
          authorIndex: 11, // Thread King
          body: "Also try Rustlings (github.com/rust-lang/rustlings) — it's interactive exercises that drill ownership and borrowing.",
        },
        {
          authorIndex: 0, // Alex
          body: "The Rust for Solana course here on Academy is specifically designed for this! It bridges Rust fundamentals to on-chain development.",
        },
      ],
    },

    // ── Thread 9: Show & Tell ─────────────────────────────────────────
    {
      title: "Completed all 8 courses - my journey recap",
      body: "Just finished the last course! Took me 3 months. Here's what I learned and the project I built along the way — a DAO voting system with on-chain governance.",
      scope: "community",
      category: "Show & Tell",
      tags: ["milestone", "journey", "dao"],
      authorIndex: 1, // Priya
      comments: [
        {
          authorIndex: 0, // Alex
          body: "Congrats Priya! That's an incredible achievement. The DAO system looks production-ready.",
        },
        {
          authorIndex: 10, // Debbie
          body: "Amazing journey! Would you be open to mentoring newer learners?",
          children: [
            {
              authorIndex: 1,
              body: "Absolutely! Happy to help anyone getting started. Feel free to tag me in threads.",
            },
          ],
        },
        {
          authorIndex: 3, // Suki
          body: "The token economics in your DAO are really well thought out. Great application of the Token Engineering course material.",
        },
      ],
    },

    // ── Thread 10: General discussion ──────────────────────────────────
    {
      title: "What's everyone building for the Solana hackathon?",
      body: "The Colosseum hackathon is coming up! Anyone from the Academy planning to participate? Would love to form a team.",
      scope: "community",
      category: "General",
      tags: ["hackathon", "colosseum", "team"],
      authorIndex: 3, // Suki
      comments: [
        {
          authorIndex: 2, // Marcus
          body: "I'm in! Working on a prediction market using Switchboard oracles.",
        },
        {
          authorIndex: 4, // Jordan
          body: "Building a social-fi app with on-chain reputation. Looking for a frontend dev if anyone's interested.",
          children: [
            {
              authorIndex: 7, // Nova
              body: "I'd love to join! I'm strong on React/Next.js and learning Solana integration.",
              children: [
                {
                  authorIndex: 4,
                  body: "Perfect! DM me on Discord and we'll sync up.",
                },
              ],
            },
          ],
        },
        {
          authorIndex: 0, // Alex
          body: "Count me in for judging/mentoring. Last hackathon was a blast.",
        },
      ],
    },
  ];
}
