import type {
  Achievement,
  Course,
  Credential,
  LeaderboardEntry,
  UserProfile,
} from "@/types";

const lesson = (
  id: string,
  title: string,
  kind: "content" | "challenge",
  objective: string,
  markdown: string,
  starterCode?: string,
) => ({
  id,
  title,
  kind,
  durationMinutes: kind === "challenge" ? 30 : 18,
  objective,
  markdown,
  starterCode,
  expectedOutput: kind === "challenge" ? "All assertions pass" : undefined,
});

export const mockCourses: Course[] = [
  {
    id: "course-solana-fundamentals",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    subtitle: "Runtime, accounts and transactions",
    description:
      "Build deep intuition for Solana's account model, transaction lifecycle and compute budgeting.",
    instructor: "Camila Souza",
    difficulty: "beginner",
    durationHours: 12,
    enrolledCount: 1862,
    tags: ["Runtime", "Web3.js", "Accounts"],
    prerequisites: ["JavaScript basics", "CLI usage"],
    outcomes: [
      "Read and deserialize account state",
      "Craft and simulate transactions",
      "Debug common runtime errors",
    ],
    gradient: "from-[#9945FF] via-[#7d53ff] to-[#14F195]",
    modules: [
      {
        id: "sf-m1",
        title: "Understanding Solana Accounts",
        description: "Learn rent, ownership and data layouts.",
        lessons: [
          lesson(
            "sf-l1",
            "Account Model Mental Map",
            "content",
            "Differentiate EOAs and Solana accounts.",
            "### Why accounts matter\nEvery byte on Solana lives in an account. Programs are stateless executables and write data into accounts they own.",
          ),
          lesson(
            "sf-l2",
            "Rent and Exemption",
            "content",
            "Calculate rent exempt balances.",
            "### Rent basics\nAccounts below rent exemption can be reclaimed. Use `getMinimumBalanceForRentExemption` before allocation.",
          ),
          lesson(
            "sf-l3",
            "Decode Account Data",
            "challenge",
            "Decode binary data using Buffer layouts.",
            "### Challenge\nImplement a decoder for a user progress account.",
            "export function decodeProgress(data: Buffer) {\n  // TODO\n}\n",
          ),
        ],
      },
      {
        id: "sf-m2",
        title: "Transactions and Signers",
        description: "Understand message compilation and signing.",
        lessons: [
          lesson(
            "sf-l4",
            "Instruction Anatomy",
            "content",
            "Explain account metas and instruction data.",
            "### Instruction anatomy\nEach instruction defines program id, account metas and opaque byte payload.",
          ),
          lesson(
            "sf-l5",
            "Fee Payer and Recent Blockhash",
            "content",
            "Configure transaction context.",
            "### Context\nWithout a valid blockhash and fee payer, transaction simulation fails.",
          ),
          lesson(
            "sf-l6",
            "Compose a Transfer Tx",
            "challenge",
            "Build and sign a SOL transfer transaction.",
            "### Challenge\nCreate a transaction with one transfer instruction and serialize it.",
            "export async function buildTransferTx(connection, from, to) {\n  // TODO\n}\n",
          ),
        ],
      },
      {
        id: "sf-m3",
        title: "Performance and Debugging",
        description: "Use logs and simulation tools effectively.",
        lessons: [
          lesson(
            "sf-l7",
            "Simulation and Logs",
            "content",
            "Use simulateTransaction for fast feedback.",
            "### Debug loop\nSimulate first, inspect logs, then send signed transaction.",
          ),
          lesson(
            "sf-l8",
            "Compute Budget Program",
            "content",
            "Increase units for heavy instructions.",
            "### Compute\nUse ComputeBudgetProgram to set unit limits and priority fees.",
          ),
          lesson(
            "sf-l9",
            "Fix the Failing CPI",
            "challenge",
            "Trace and fix a CPI authorization bug.",
            "### Challenge\nIdentify why CPI fails due to signer mismatch.",
            "export function validateSigner(accounts) {\n  // TODO\n}\n",
          ),
        ],
      },
    ],
  },
  {
    id: "course-anchor-101",
    slug: "anchor-101",
    title: "Anchor 101",
    subtitle: "From IDL to production workflow",
    description:
      "Learn Anchor macros, account constraints and testing patterns that teams use in production.",
    instructor: "Lucas Faria",
    difficulty: "beginner",
    durationHours: 14,
    enrolledCount: 1340,
    tags: ["Anchor", "Rust", "Testing"],
    prerequisites: ["Solana fundamentals", "Rust basics"],
    outcomes: [
      "Author secure Anchor instructions",
      "Create deterministic PDAs",
      "Write complete integration tests",
    ],
    gradient: "from-[#3f2d78] via-[#9945FF] to-[#14F195]",
    modules: [
      {
        id: "a1-m1",
        title: "Anchor Setup",
        description: "CLI, workspace structure and IDL generation.",
        lessons: [
          lesson("a1-l1", "Anchor CLI", "content", "Install and verify toolchain.", "### Setup\nUse `avm` to pin Anchor versions across your team."),
          lesson("a1-l2", "Program Skeleton", "content", "Create instructions and account structs.", "### Program anatomy\nAnchor wires instruction handlers and account validation macros."),
          lesson("a1-l3", "First Test", "challenge", "Write your first passing mocha test.", "### Challenge\nInitialize state and assert fields.", "describe('anchor-101', () => {\n  it('initializes state', async () => {\n    // TODO\n  });\n});\n"),
        ],
      },
      {
        id: "a1-m2",
        title: "PDAs and Constraints",
        description: "Deterministic addressing and account rules.",
        lessons: [
          lesson("a1-l4", "PDA Seeds", "content", "Build deterministic addresses.", "### Seeds\nDerive PDAs from stable business keys like user + course id."),
          lesson("a1-l5", "Account Constraints", "content", "Use `has_one`, `seeds`, and `bump`.", "### Validation\nConstraints guard invariants before instruction logic runs."),
          lesson("a1-l6", "Guard Unauthorized Writes", "challenge", "Prevent unauthorized state updates.", "### Challenge\nAdd constraints to block foreign authority writes.", "#[derive(Accounts)]\npub struct Update<'info> {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "a1-m3",
        title: "IDL-Driven Clients",
        description: "Generate TS clients and improve DX.",
        lessons: [
          lesson("a1-l7", "IDL Internals", "content", "Understand instruction and account schemas.", "### IDL\nYour frontend can call methods safely with generated types."),
          lesson("a1-l8", "Frontend Provider", "content", "Wire Anchor provider in a React app.", "### Provider\nUse wallet adapter + connection + AnchorProvider."),
          lesson("a1-l9", "Build a Typed Client", "challenge", "Call methods with strict types.", "### Challenge\nBuild a `completeLesson` call wrapper.", "export async function completeLesson(program, accounts) {\n  // TODO\n}\n"),
        ],
      },
    ],
  },
  {
    id: "course-defi-developer",
    slug: "defi-developer",
    title: "DeFi Developer",
    subtitle: "AMMs, lending, and risk controls",
    description:
      "Model token economics and build safe DeFi primitives with robust validation and oracle handling.",
    instructor: "Mariana Prado",
    difficulty: "intermediate",
    durationHours: 20,
    enrolledCount: 942,
    tags: ["DeFi", "Oracles", "Risk"],
    prerequisites: ["Anchor 101", "Math for DeFi"],
    outcomes: ["Build AMM swap math", "Use oracle safety checks", "Design liquidation guardrails"],
    gradient: "from-[#0b1026] via-[#2f3a77] to-[#14F195]",
    modules: [
      {
        id: "dd-m1",
        title: "AMM Mechanics",
        description: "Constant product and fees.",
        lessons: [
          lesson("dd-l1", "x*y=k Refresher", "content", "Understand pool invariants.", "### Invariant\nSwaps preserve `x*y=k` with fees and slippage."),
          lesson("dd-l2", "Slippage and Price Impact", "content", "Estimate output safely.", "### Execution\nProtect users with min output constraints."),
          lesson("dd-l3", "Implement Quote Function", "challenge", "Calculate output and fee.", "### Challenge\nReturn amount out and effective price.", "export function quote(amountIn, reserveIn, reserveOut) {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "dd-m2",
        title: "Oracle Safety",
        description: "TWAP and stale price protections.",
        lessons: [
          lesson("dd-l4", "Oracle Fundamentals", "content", "Use trusted data feeds.", "### Oracle\nNever rely on a single spot price sample."),
          lesson("dd-l5", "Staleness Checks", "content", "Reject stale prices.", "### Guard\nDefine max age windows for feeds."),
          lesson("dd-l6", "Liquidation Trigger", "challenge", "Validate liquidation thresholds.", "### Challenge\nOnly liquidate when health factor is below 1.0.", "export function canLiquidate(healthFactor, priceAgeSec) {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "dd-m3",
        title: "Protocol Security",
        description: "Attack surfaces and mitigations.",
        lessons: [
          lesson("dd-l7", "Flash Loan Vectors", "content", "Analyze manipulation routes.", "### Security\nAssume adversarial composability in every instruction."),
          lesson("dd-l8", "Invariant Monitoring", "content", "Track health metrics.", "### Monitoring\nAlert on reserve divergence and liquidity shocks."),
          lesson("dd-l9", "Exploit Postmortem", "challenge", "Patch an exploited vault flow.", "### Challenge\nIdentify missing checks in withdraw path.", "pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n  // TODO\n}\n"),
        ],
      },
    ],
  },
  {
    id: "course-token-2022",
    slug: "token-2022",
    title: "Token-2022 in Practice",
    subtitle: "Extensions, transfer hooks and metadata",
    description:
      "Launch modern tokens using Token-2022 extensions and integrate compliant transfer controls.",
    instructor: "Eduardo Lima",
    difficulty: "intermediate",
    durationHours: 11,
    enrolledCount: 701,
    tags: ["SPL", "Token-2022", "Extensions"],
    prerequisites: ["Solana fundamentals"],
    outcomes: [
      "Choose extension sets for products",
      "Create transfer-fee tokens",
      "Integrate transfer hooks",
    ],
    gradient: "from-[#14203d] via-[#225f84] to-[#14F195]",
    modules: [
      {
        id: "t22-m1",
        title: "Token Extensions",
        description: "What changed from legacy SPL token.",
        lessons: [
          lesson("t22-l1", "Extension Overview", "content", "Map extension capabilities.", "### Extensions\nMetadata, transfer fee, default account state and more."),
          lesson("t22-l2", "Mint Setup", "content", "Allocate mint with extension space.", "### Space\nUse `getMintLen` for correct account size."),
          lesson("t22-l3", "Create Extension Mint", "challenge", "Initialize mint with metadata pointer.", "### Challenge\nConfigure mint + authority accounts.", "export async function createToken2022Mint(connection, payer) {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "t22-m2",
        title: "Transfer Controls",
        description: "Fees and programmable checks.",
        lessons: [
          lesson("t22-l4", "Transfer Fees", "content", "Configure basis points and max fee.", "### Fees\nBalance token UX and protocol sustainability."),
          lesson("t22-l5", "Transfer Hook", "content", "Call custom programs on transfer.", "### Hook\nEnforce business logic for every token movement."),
          lesson("t22-l6", "Write a Hook Validator", "challenge", "Block unauthorized transfer destinations.", "### Challenge\nValidate account allowlist.", "pub fn validate_transfer(ctx: Context<TransferHook>) -> Result<()> {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "t22-m3",
        title: "Production Ops",
        description: "Monitoring and migration strategy.",
        lessons: [
          lesson("t22-l7", "Indexing Token Events", "content", "Track transfers reliably.", "### Indexing\nCapture transfer hooks and standard events for analytics."),
          lesson("t22-l8", "Wallet Compatibility", "content", "Handle mixed wallet support.", "### Compatibility\nProvide graceful fallbacks for unsupported extensions."),
          lesson("t22-l9", "Migration Plan", "challenge", "Design token migration without downtime.", "### Challenge\nPlan phased migration with user comms.", "export function migrationChecklist() {\n  // TODO\n}\n"),
        ],
      },
    ],
  },
  {
    id: "course-nft-mastery",
    slug: "nft-mastery",
    title: "NFT Mastery",
    subtitle: "Compressed NFTs and collection engineering",
    description:
      "Ship performant NFT collections with metadata standards, compressed assets and royalty strategy.",
    instructor: "Ana Beatriz",
    difficulty: "intermediate",
    durationHours: 13,
    enrolledCount: 1150,
    tags: ["NFT", "Compressed", "Metaplex"],
    prerequisites: ["Solana fundamentals"],
    outcomes: ["Mint compressed NFTs", "Model royalty policy", "Build collection UX"],
    gradient: "from-[#2d1e4f] via-[#8d4ef0] to-[#14F195]",
    modules: [
      {
        id: "nm-m1",
        title: "Metadata Standards",
        description: "Token metadata and collection verification.",
        lessons: [
          lesson("nm-l1", "Metadata Fields", "content", "Design useful metadata schemas.", "### Metadata\nPrefer stable, explicit attributes for indexers."),
          lesson("nm-l2", "Collection Authority", "content", "Verify and manage collections.", "### Authority\nOnly trusted authority can verify items."),
          lesson("nm-l3", "Create Collection Metadata", "challenge", "Publish metadata JSON and verify items.", "### Challenge\nMint and verify collection NFT.", "export async function verifyCollection(connection, wallet) {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "nm-m2",
        title: "Compressed NFTs",
        description: "Merkle trees and cheap minting.",
        lessons: [
          lesson("nm-l4", "Compression Basics", "content", "Understand bubblegum model.", "### Compression\nState is stored in Merkle trees for large scale minting."),
          lesson("nm-l5", "Tree Authority", "content", "Manage tree updates.", "### Tree\nDefine update authority and retention policy."),
          lesson("nm-l6", "Mint to Tree", "challenge", "Mint compressed assets with proofs.", "### Challenge\nMint cNFT and verify leaf index.", "export async function mintCompressedNft(client, tree) {\n  // TODO\n}\n"),
        ],
      },
      {
        id: "nm-m3",
        title: "Marketplace Readiness",
        description: "Royalties, listing and analytics.",
        lessons: [
          lesson("nm-l7", "Royalty Tradeoffs", "content", "Balance creator earnings and liquidity.", "### Royalties\nConsider optional royalty enforcement in modern markets."),
          lesson("nm-l8", "Trait Analytics", "content", "Analyze rarity and floor movement.", "### Analytics\nTrack traits tied to market activity."),
          lesson("nm-l9", "Launch Checklist", "challenge", "Plan mint launch operations.", "### Challenge\nBuild pre-launch checklist and failover plan.", "export const launchChecklist = [\n  // TODO\n];\n"),
        ],
      },
    ],
  },
  {
    id: "course-security-auditing",
    slug: "security-auditing",
    title: "Security Auditing",
    subtitle: "Threat modeling for Solana programs",
    description:
      "Perform practical audits for Solana programs with repeatable methodology and exploit simulations.",
    instructor: "Rafael Mendonca",
    difficulty: "advanced",
    durationHours: 24,
    enrolledCount: 620,
    tags: ["Security", "Auditing", "Rust"],
    prerequisites: ["Anchor 101", "DeFi Developer"],
    outcomes: ["Run threat models", "Write PoCs", "Produce client-ready reports"],
    gradient: "from-[#140f1f] via-[#3b2b58] to-[#14F195]",
    modules: [
      {
        id: "sa-m1",
        title: "Audit Methodology",
        description: "Scope, assumptions and risk scoring.",
        lessons: [
          lesson("sa-l1", "Threat Model Setup", "content", "Define attacker capabilities.", "### Scope\nStart with assets, invariants and trust boundaries."),
          lesson("sa-l2", "Risk Prioritization", "content", "Score exploitability and impact.", "### Severity\nUse a consistent severity matrix across reports."),
          lesson("sa-l3", "Invariant Inventory", "challenge", "Document all protocol invariants.", "### Challenge\nWrite invariant list and test mapping.", "export const invariants = [\n  // TODO\n];\n"),
        ],
      },
      {
        id: "sa-m2",
        title: "Exploit Development",
        description: "Build deterministic proof-of-concept exploits.",
        lessons: [
          lesson("sa-l4", "Unauthorized CPI", "content", "Detect signer and authority gaps.", "### CPI\nAssume arbitrary invocation contexts."),
          lesson("sa-l5", "Arithmetic Bugs", "content", "Prevent precision and overflow issues.", "### Math\nUse checked arithmetic and bounded conversions."),
          lesson("sa-l6", "Write Exploit Test", "challenge", "Create a failing exploit regression test.", "### Challenge\nReproduce exploit before patching.", "it('exploit: drains vault', async () => {\n  // TODO\n});\n"),
        ],
      },
      {
        id: "sa-m3",
        title: "Reporting and Remediation",
        description: "Deliver actionable reports.",
        lessons: [
          lesson("sa-l7", "Writing Findings", "content", "Describe root cause and remediation.", "### Findings\nInclude impact, PoC, and concrete fixes."),
          lesson("sa-l8", "Patch Validation", "content", "Ensure fixes hold under edge cases.", "### Validation\nAdd regression tests before closure."),
          lesson("sa-l9", "Final Audit Delivery", "challenge", "Produce executive + technical summary.", "### Challenge\nDraft complete report for stakeholders.", "# Security Report\n\n## Executive Summary\n- TODO\n"),
        ],
      },
    ],
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    userId: "u-camila",
    username: "camila.sol",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    country: "BR",
    xp: 28400,
    level: 16,
    weeklyGain: 1450,
    badges: ["Audit Ace", "Anchor Veteran"],
  },
  {
    userId: "u-diego",
    username: "diego.dev",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=diego",
    country: "AR",
    xp: 27100,
    level: 16,
    weeklyGain: 1280,
    badges: ["cNFT Builder", "Streak 30"],
  },
  {
    userId: "u-luana",
    username: "luana.anchor",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=luana",
    country: "BR",
    xp: 25220,
    level: 15,
    weeklyGain: 1120,
    badges: ["Mentor", "Bug Hunter"],
  },
  {
    userId: "u-max",
    username: "maxxvalidator",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=max",
    country: "US",
    xp: 24110,
    level: 15,
    weeklyGain: 970,
    badges: ["Runtime Expert"],
  },
  {
    userId: "u-sofia",
    username: "sofia.nft",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=sofia",
    country: "MX",
    xp: 22980,
    level: 15,
    weeklyGain: 900,
    badges: ["Creator", "Collection Lead"],
  },
];

export const mockProfiles: UserProfile[] = [
  {
    id: "u-camila",
    username: "camila.sol",
    displayName: "Camila Silva",
    bio: "Solana educator focused on secure protocol design and developer enablement.",
    location: "Sao Paulo, BR",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=camila",
    walletAddress: "5XnVjQYw2vV5xB7BnzH4JDuwxb9fADUan6P6Jg6A8Wdp",
    xp: 28400,
    level: 16,
    enrolledCourseIds: ["course-security-auditing", "course-defi-developer"],
    interests: ["Auditing", "Anchor", "Protocol Design"],
    skills: {
      "Smart Contract Security": 94,
      Anchor: 89,
      DeFi: 83,
      "Token Engineering": 71,
      "Frontend dApps": 64,
    },
  },
  {
    id: "u-local",
    username: "you",
    displayName: "You",
    bio: "Builder on Superteam Academy, tracking progress daily.",
    location: "Remote",
    avatar: "https://api.dicebear.com/9.x/glass/svg?seed=you",
    xp: 1320,
    level: 3,
    enrolledCourseIds: ["course-solana-fundamentals", "course-anchor-101"],
    interests: ["Solana", "Learning", "DevRel"],
    skills: {
      "Smart Contract Security": 28,
      Anchor: 44,
      DeFi: 32,
      "Token Engineering": 41,
      "Frontend dApps": 53,
    },
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "ach-first-lesson",
    title: "Genesis Step",
    description: "Complete your first lesson",
    icon: "Rocket",
    xpReward: 40,
    rarity: "common",
    unlocked: true,
  },
  {
    id: "ach-7-day",
    title: "Relentless",
    description: "Keep a 7-day learning streak",
    icon: "Flame",
    xpReward: 120,
    rarity: "rare",
    unlocked: false,
  },
  {
    id: "ach-audit",
    title: "Exploit Hunter",
    description: "Finish Security Auditing track",
    icon: "Shield",
    xpReward: 320,
    rarity: "epic",
    unlocked: false,
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-solana-foundations",
    courseId: "course-solana-fundamentals",
    title: "Solana Fundamentals Credential",
    issuedAt: "2026-01-17T11:20:00.000Z",
    issuer: "Superteam Academy",
    imageUri: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=600&q=80",
    txSignature: "4hM3mkY7fH9U1UGMDCbLEoyTj2r6n8yNEQ5rxpVwq2pTfY4q3d4qFVeV8wHzqAdDk8xqWm3w2BPfQ5",
  },
  {
    id: "cred-anchor-practitioner",
    courseId: "course-anchor-101",
    title: "Anchor 101 Practitioner",
    issuedAt: "2026-02-03T09:55:00.000Z",
    issuer: "Superteam Academy",
    imageUri: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=600&q=80",
  },
];

export const landingTestimonials = [
  {
    name: "Fernanda Costa",
    role: "Protocol Engineer at Solana Startup",
    quote:
      "Superteam Academy helped me move from Solidity to shipping Anchor programs with confidence.",
  },
  {
    name: "Tiago Mendes",
    role: "Security Researcher",
    quote:
      "The auditing track mirrors real engagements. I used the checklist in two paid reviews already.",
  },
  {
    name: "Daniel Ortiz",
    role: "DevRel Lead",
    quote:
      "The curriculum is practical, not generic. Every module ends with something you can demo.",
  },
];
