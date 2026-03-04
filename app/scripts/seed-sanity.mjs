import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "efj5r9bz",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// ------------------------------------------------------------------
// Tracks
// ------------------------------------------------------------------
const tracks = [
  {
    _type: "track",
    _id: "track-fundamentals",
    title: "Solana Fundamentals",
    slug: { _type: "slug", current: "solana-fundamentals" },
    description:
      "Learn the core concepts of Solana blockchain, including accounts, transactions, programs, and the runtime.",
    icon: "book-open",
    order: 1,
  },
  {
    _type: "track",
    _id: "track-rust",
    title: "Rust for Solana",
    slug: { _type: "slug", current: "rust-for-solana" },
    description:
      "Master Rust programming tailored for Solana development — ownership, lifetimes, and systems programming.",
    icon: "code",
    order: 2,
  },
  {
    _type: "track",
    _id: "track-anchor",
    title: "Anchor Development",
    slug: { _type: "slug", current: "anchor-development" },
    description:
      "Build production-ready Solana programs with the Anchor framework.",
    icon: "anchor",
    order: 3,
  },
  {
    _type: "track",
    _id: "track-defi",
    title: "DeFi Protocols",
    slug: { _type: "slug", current: "defi-protocols" },
    description:
      "Understand and build DeFi protocols on Solana — AMMs, lending, and token mechanics.",
    icon: "coins",
    order: 4,
  },
  {
    _type: "track",
    _id: "track-security",
    title: "Security & Auditing",
    slug: { _type: "slug", current: "security-auditing" },
    description:
      "Learn to identify vulnerabilities and audit Solana programs for production safety.",
    icon: "shield",
    order: 5,
  },
  {
    _type: "track",
    _id: "track-fullstack",
    title: "Full-Stack dApps",
    slug: { _type: "slug", current: "full-stack-dapps" },
    description:
      "Build complete decentralized applications combining Solana programs with modern frontend frameworks.",
    icon: "layers",
    order: 6,
  },
];

// ------------------------------------------------------------------
// Lessons for the first course
// ------------------------------------------------------------------
const solanaIntroLessons = [
  {
    _type: "lesson",
    _id: "lesson-what-is-solana",
    title: "What is Solana?",
    slug: { _type: "slug", current: "what-is-solana" },
    type: "content",
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "Solana is a high-performance blockchain designed for decentralized applications and crypto-currencies. It uses a unique combination of Proof of History (PoH) and Proof of Stake (PoS) consensus mechanisms to achieve incredibly fast transaction speeds of up to 65,000 TPS with sub-second finality.",
          },
        ],
      },
      {
        _type: "block",
        _key: "b2",
        style: "h2",
        children: [
          { _type: "span", _key: "s2", text: "Key Features" },
        ],
      },
      {
        _type: "block",
        _key: "b3",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s3",
            text: "• Low transaction costs (fractions of a cent)\n• Sub-second finality\n• Parallel transaction processing via Sealevel\n• Growing ecosystem of DeFi, NFTs, and dApps\n• Rust-based programming model",
          },
        ],
      },
    ],
    estimatedMinutes: 10,
    xpReward: 15,
    order: 1,
  },
  {
    _type: "lesson",
    _id: "lesson-accounts-model",
    title: "The Accounts Model",
    slug: { _type: "slug", current: "accounts-model" },
    type: "content",
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "Unlike Ethereum's contract-centric model, Solana uses an accounts-based model. Everything on Solana is an account — programs, tokens, user data. Understanding accounts is fundamental to building on Solana.",
          },
        ],
      },
      {
        _type: "block",
        _key: "b2",
        style: "h2",
        children: [{ _type: "span", _key: "s2", text: "Account Types" }],
      },
      {
        _type: "block",
        _key: "b3",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s3",
            text: "• Data accounts — store state (owned by programs)\n• Program accounts — store executable code (immutable)\n• Native accounts — system programs (System Program, Token Program, etc.)",
          },
        ],
      },
    ],
    estimatedMinutes: 15,
    xpReward: 20,
    order: 2,
  },
  {
    _type: "lesson",
    _id: "lesson-transactions",
    title: "Transactions & Instructions",
    slug: { _type: "slug", current: "transactions-instructions" },
    type: "content",
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "Transactions are the fundamental unit of activity on Solana. Each transaction contains one or more instructions, which are calls to programs. Understanding how transactions are structured and processed is key to building efficient dApps.",
          },
        ],
      },
    ],
    estimatedMinutes: 20,
    xpReward: 25,
    order: 3,
  },
  {
    _type: "lesson",
    _id: "lesson-first-program-challenge",
    title: "Your First Solana Transaction",
    slug: { _type: "slug", current: "first-transaction-challenge" },
    type: "challenge",
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "Time to write your first Solana transaction! In this challenge, you'll use the @solana/web3.js library to create and send a SOL transfer on Devnet.",
          },
        ],
      },
    ],
    starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Generate a new keypair for the sender
const sender = Keypair.generate();

// TODO: Airdrop 1 SOL to sender
// TODO: Create a transfer instruction to send 0.5 SOL to a random recipient
// TODO: Send and confirm the transaction
// TODO: Log the transaction signature

async function main() {
  // Your code here
}

main();`,
    solutionCode: `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const sender = Keypair.generate();
const recipient = Keypair.generate();

async function main() {
  // Airdrop 1 SOL
  const airdropSig = await connection.requestAirdrop(sender.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Create transfer instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  // Build and send transaction
  const transaction = new Transaction().add(transferInstruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
  console.log("Transaction signature:", signature);
}

main();`,
    expectedOutput: "Transaction signature:",
    hints: [
      "Use connection.requestAirdrop() to get test SOL",
      "SystemProgram.transfer() creates a transfer instruction",
      "sendAndConfirmTransaction() sends and waits for confirmation",
    ],
    estimatedMinutes: 25,
    xpReward: 50,
    order: 4,
  },
  {
    _type: "lesson",
    _id: "lesson-pda-intro",
    title: "Program Derived Addresses (PDAs)",
    slug: { _type: "slug", current: "pda-intro" },
    type: "content",
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "PDAs are special addresses that are derived deterministically from a program ID and a set of seeds. They allow programs to 'own' accounts and sign transactions on their behalf. PDAs are essential for building stateful programs.",
          },
        ],
      },
    ],
    estimatedMinutes: 20,
    xpReward: 30,
    order: 5,
  },
];

// ------------------------------------------------------------------
// Modules
// ------------------------------------------------------------------
const modules = [
  {
    _type: "module",
    _id: "module-solana-basics",
    title: "Solana Basics",
    order: 1,
    lessons: [
      { _type: "reference", _ref: "lesson-what-is-solana", _key: "l1" },
      { _type: "reference", _ref: "lesson-accounts-model", _key: "l2" },
      { _type: "reference", _ref: "lesson-transactions", _key: "l3" },
    ],
  },
  {
    _type: "module",
    _id: "module-hands-on",
    title: "Hands-On Development",
    order: 2,
    lessons: [
      {
        _type: "reference",
        _ref: "lesson-first-program-challenge",
        _key: "l4",
      },
      { _type: "reference", _ref: "lesson-pda-intro", _key: "l5" },
    ],
  },
];

// ------------------------------------------------------------------
// Courses
// ------------------------------------------------------------------
const courses = [
  {
    _type: "course",
    _id: "course-intro-solana",
    title: "Introduction to Solana",
    slug: { _type: "slug", current: "introduction-to-solana" },
    description:
      "A comprehensive introduction to Solana blockchain — from core concepts to your first transaction. Perfect for developers new to Solana.",
    difficulty: "beginner",
    duration: "3 hours",
    xpReward: 500,
    track: { _type: "reference", _ref: "track-fundamentals" },
    tags: ["solana", "blockchain", "beginner", "web3"],
    modules: [
      { _type: "reference", _ref: "module-solana-basics", _key: "m1" },
      { _type: "reference", _ref: "module-hands-on", _key: "m2" },
    ],
    order: 1,
  },
  {
    _type: "course",
    _id: "course-rust-basics",
    title: "Rust Programming for Solana",
    slug: { _type: "slug", current: "rust-programming-for-solana" },
    description:
      "Learn Rust from scratch with a focus on what matters for Solana development. Covers ownership, borrowing, structs, enums, and error handling.",
    difficulty: "beginner",
    duration: "5 hours",
    xpReward: 750,
    track: { _type: "reference", _ref: "track-rust" },
    tags: ["rust", "programming", "beginner"],
    modules: [],
    order: 2,
  },
  {
    _type: "course",
    _id: "course-anchor-intro",
    title: "Building with Anchor",
    slug: { _type: "slug", current: "building-with-anchor" },
    description:
      "Master the Anchor framework to build, test, and deploy Solana programs. Covers account validation, error handling, and testing patterns.",
    difficulty: "intermediate",
    duration: "6 hours",
    xpReward: 1000,
    track: { _type: "reference", _ref: "track-anchor" },
    tags: ["anchor", "programs", "intermediate"],
    modules: [],
    order: 3,
  },
  {
    _type: "course",
    _id: "course-token-program",
    title: "Token Program Deep Dive",
    slug: { _type: "slug", current: "token-program-deep-dive" },
    description:
      "Understand SPL tokens, Token-2022, and how to create, mint, and manage tokens on Solana. Covers fungible and non-fungible tokens.",
    difficulty: "intermediate",
    duration: "4 hours",
    xpReward: 800,
    track: { _type: "reference", _ref: "track-fundamentals" },
    tags: ["tokens", "spl", "nft", "intermediate"],
    modules: [],
    order: 4,
  },
  {
    _type: "course",
    _id: "course-defi-amm",
    title: "Building a DeFi AMM",
    slug: { _type: "slug", current: "building-defi-amm" },
    description:
      "Build an automated market maker from scratch on Solana. Covers liquidity pools, swap math, and fee mechanisms.",
    difficulty: "advanced",
    duration: "8 hours",
    xpReward: 2000,
    track: { _type: "reference", _ref: "track-defi" },
    tags: ["defi", "amm", "advanced", "liquidity"],
    modules: [],
    order: 5,
  },
  {
    _type: "course",
    _id: "course-security",
    title: "Solana Security Essentials",
    slug: { _type: "slug", current: "solana-security-essentials" },
    description:
      "Learn to identify common vulnerabilities in Solana programs — missing signer checks, integer overflow, PDA seed collisions, and more.",
    difficulty: "advanced",
    duration: "5 hours",
    xpReward: 1500,
    track: { _type: "reference", _ref: "track-security" },
    tags: ["security", "audit", "advanced"],
    modules: [],
    order: 6,
  },
  {
    _type: "course",
    _id: "course-fullstack-dapp",
    title: "Full-Stack Solana dApp",
    slug: { _type: "slug", current: "full-stack-solana-dapp" },
    description:
      "Build a complete dApp from Anchor program to Next.js frontend. Covers wallet integration, transaction building, and real-time updates.",
    difficulty: "intermediate",
    duration: "10 hours",
    xpReward: 1500,
    track: { _type: "reference", _ref: "track-fullstack" },
    tags: ["fullstack", "nextjs", "dapp", "intermediate"],
    modules: [],
    order: 7,
  },
];

// ------------------------------------------------------------------
// Seed
// ------------------------------------------------------------------
async function seed() {
  console.log("Seeding Sanity CMS...\n");

  // Create tracks
  console.log("Creating tracks...");
  for (const track of tracks) {
    await client.createOrReplace(track);
    console.log(`  ✓ ${track.title}`);
  }

  // Create lessons
  console.log("\nCreating lessons...");
  for (const lesson of solanaIntroLessons) {
    await client.createOrReplace(lesson);
    console.log(`  ✓ ${lesson.title}`);
  }

  // Create modules
  console.log("\nCreating modules...");
  for (const mod of modules) {
    await client.createOrReplace(mod);
    console.log(`  ✓ ${mod.title}`);
  }

  // Create courses
  console.log("\nCreating courses...");
  for (const course of courses) {
    await client.createOrReplace(course);
    console.log(`  ✓ ${course.title}`);
  }

  console.log("\n✓ Seed complete! Created:");
  console.log(`  ${tracks.length} tracks`);
  console.log(`  ${solanaIntroLessons.length} lessons`);
  console.log(`  ${modules.length} modules`);
  console.log(`  ${courses.length} courses`);
}

seed().catch(console.error);
