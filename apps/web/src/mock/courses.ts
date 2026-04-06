import type { Course } from "@superteam-lms/types";

export const mockCourses = [
  {
    _id: "solana-fundamentals",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Learn the core concepts of the Solana network: accounts, programs, transactions, and the runtime model.",
    difficulty: "beginner",
    duration: 6,
    trackId: 1,
    xpReward: 50,
    totalLessons: 8,
    thumbnail: "/images/courses/fundamentals.jpg",
    tags: ["solana", "blockchain", "introduction"],
    instructor: {
      name: "Superteam Academy",
      avatar: "/avatars/superteam.jpg",
      bio: "The learning hub for the Solana ecosystem."
    },
    modules: [
      {
        _id: "intro",
        title: "Introduction to Solana",
        order: 1,
        description: "Get started with the basics of Solana.",
        lessons: [
          {
            _id: "what-is-solana",
            title: "What is Solana?",
            slug: "what-is-solana",
            order: 1,
            type: "content",
            videoUrl: "",
            content: "# What is Solana?\n\nSolana is a high-performance blockchain platform designed for decentralized applications and marketplaces.\n\n## Key Features\n- **Fast:** 400ms block times, 65k+ TPS\n- **Low cost:** Average transaction fee < $0.01\n- **Proof of History:** Unique consensus mechanism\n- **Growing ecosystem:** DeFi, NFTs, Gaming, and more\n\n## Why Build on Solana?\nSolana offers developers a unique combination of speed, low costs, and a growing ecosystem. Unlike other Layer 1s, Solana runs a single global state machine — no sharding, no rollups, just raw performance.",
          },
          {
            _id: "solana-accounts",
            title: "Solana Account Model",
            slug: "solana-accounts",
            order: 2,
            type: "content",
            videoUrl: "",
            content: "# Solana Account Model\n\nEverything on Solana is an account. Accounts store data and SOL.\n\n## Account Properties\n- **address:** A unique 32-byte public key\n- **lamports:** SOL balance (1 SOL = 1 billion lamports)\n- **data:** Arbitrary byte array\n- **owner:** The program that controls this account\n- **executable:** Whether this account contains a program\n\n## Key Concepts\n1. Accounts are allocated with a specific size at creation\n2. Rent is charged for data storage (or exempt with 2 years' rent)\n3. Only the owner program can modify an account's data",
          },
          {
            _id: "solana-programs",
            title: "Programs (Smart Contracts)",
            slug: "solana-programs",
            order: 3,
            type: "content",
            videoUrl: "",
            content: "# Solana Programs\n\nPrograms are the Solana equivalent of smart contracts.\n\n## How Programs Work\n- Programs are **stateless** — they don't store data themselves\n- Data lives in separate accounts owned by the program\n- Programs process **instructions** that reference accounts\n- Written in Rust (or C), compiled to BPF bytecode\n\n## Anchor Framework\nAnchor is the most popular framework for building Solana programs. It provides:\n- Account serialization/deserialization\n- Instruction handlers\n- Error handling\n- Client SDK generation",
          },
          {
            _id: "quiz-basics",
            title: "Quiz: Solana Basics",
            slug: "quiz-basics",
            order: 4,
            type: "challenge",
            content: "Test your knowledge of Solana basics.",
            code: "// Question: What is the minimum rent-exempt balance for a 100-byte account?\n// Write a function that calculates it.\n\nfunction calculateRentExempt(dataSize: number): number {\n  // TODO: Implement\n  // Hint: The formula is (128 + dataSize) * 6.96e-6 SOL * 2 years\n  return 0;\n}\n\nconsole.log(calculateRentExempt(100));",
            tests: [],
            hints: ["The rent calculation involves the total bytes (header + data), a per-byte-per-year rate, and a 2-year multiplier for exemption."],
            solution: "function calculateRentExempt(dataSize: number): number {\n  const bytesPerYear = 365.25 * 24 * 60 * 60;\n  const lamportsPerByte = 19.055441478439427;\n  return Math.ceil((128 + dataSize) * lamportsPerByte * 2);\n}\n\nconsole.log(calculateRentExempt(100));",
          },
        ],
      },
      {
        id: "dev-env",
        title: "Development Environment",
        lessons: [
          {
            id: "tooling-setup",
            title: "Setting Up Your Environment",
            durationMinutes: 25,
            isChallenge: false,
            content: "# Development Environment\n\n## Prerequisites\n- Rust (via rustup)\n- Solana CLI\n- Node.js 18+\n- Anchor Framework\n\n## Installation\n```bash\n# Install Rust\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\n# Install Solana CLI\nsh -c \"$(curl -sSfL https://release.solana.com/stable/install)\"\n\n# Install Anchor\ncargo install --git https://github.com/coral-xyz/anchor anchor-cli\n```\n\n## Configure Devnet\n```bash\nsolana config set --url devnet\nsolana-keygen new\nsolana airdrop 2\n```",
          },
          {
            id: "first-transaction",
            title: "Your First Transaction",
            durationMinutes: 30,
            isChallenge: true,
            starterCode: "import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';\n\nasync function sendSol() {\n  const connection = new Connection('https://api.devnet.solana.com');\n  const sender = Keypair.generate();\n  const receiver = Keypair.generate();\n\n  // TODO: Request airdrop for sender\n  // TODO: Create transfer instruction\n  // TODO: Send transaction\n\n  console.log('Transaction sent!');\n}\n\nsendSol();",
            solution: "import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';\n\nasync function sendSol() {\n  const connection = new Connection('https://api.devnet.solana.com');\n  const sender = Keypair.generate();\n  const receiver = Keypair.generate();\n\n  await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);\n  await new Promise(r => setTimeout(r, 2000));\n\n  const tx = new Transaction().add(\n    SystemProgram.transfer({\n      fromPubkey: sender.publicKey,\n      toPubkey: receiver.publicKey,\n      lamports: 0.5 * LAMPORTS_PER_SOL,\n    })\n  );\n\n  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);\n  console.log('Transaction sent!', sig);\n}\n\nsendSol();",
            hint: "Use connection.requestAirdrop() to fund the sender, SystemProgram.transfer() for the instruction, and sendAndConfirmTransaction() to submit.",
          },
          {
            id: "pda-intro",
            title: "Program Derived Addresses (PDAs)",
            durationMinutes: 20,
            isChallenge: false,
            content: "# Program Derived Addresses (PDAs)\n\nPDAs are deterministic addresses derived from seeds and a program ID.\n\n## Why PDAs?\n- Programs can **sign** for PDAs they own\n- Addresses are deterministic — anyone can derive the same PDA\n- Perfect for storing program state\n\n## Derivation\n```typescript\nconst [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from('seed'), userKey.toBuffer()],\n  programId\n);\n```\n\n## Common Patterns\n- Config account: `[\"config\"]`\n- User account: `[\"user\", wallet]`\n- Course enrollment: `[\"enrollment\", courseId, wallet]`",
          },
          {
            id: "pda-challenge",
            title: "PDA Challenge",
            durationMinutes: 15,
            isChallenge: true,
            starterCode: "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf');\n\n// TODO: Derive the enrollment PDA for courseId 'solana-101' and a learner wallet\nfunction deriveEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {\n  // Your code here\n  return PublicKey.default;\n}\n",
            solution: "import { PublicKey } from '@solana/web3.js';\n\nconst PROGRAM_ID = new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf');\n\nfunction deriveEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {\n  const [pda] = PublicKey.findProgramAddressSync(\n    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],\n    PROGRAM_ID\n  );\n  return pda;\n}\n",
            hint: "Use PublicKey.findProgramAddressSync with seeds: ['enrollment', courseId, learnerPubkey].",
          },
        ],
      },
    ],
  },
  {
    _id: "anchor-development",
    slug: "anchor-development",
    title: "Anchor Development",
    description: "Build production-grade Solana programs using the Anchor framework. PDAs, CPIs, Token integration.",
    difficulty: "intermediate",
    duration: 10,
    trackId: 1,
    xpReward: 75,
    totalLessons: 12,
    thumbnail: "/images/courses/anchor.jpg",
    tags: ["solana", "anchor", "rust"],
    instructor: {
      name: "Superteam Academy",
      avatar: "/avatars/superteam.jpg",
      bio: "The learning hub for the Solana ecosystem."
    },
    modules: [
      {
        _id: "anchor-basics",
        title: "Anchor Basics",
        description: "Learn the fundamentals of Anchor.",
        lessons: [
          { _id: "anchor-intro", title: "What is Anchor?", slug: "anchor-intro", order: 1, type: "content", content: "" },
          { _id: "anchor-project", title: "Project Structure", slug: "anchor-project", order: 2, type: "content", content: "" },
          { _id: "anchor-accounts", title: "Account Constraints", slug: "anchor-accounts", order: 3, type: "content", content: "" },
          { _id: "anchor-quiz", title: "Quiz: Anchor Basics", slug: "anchor-quiz", order: 4, type: "challenge", content: "", code: "", tests: [], hints: [], solution: "" },
        ],
        order: 1
      },
      {
        _id: "anchor-advanced",
        title: "Advanced Patterns",
        description: "Master advanced Anchor patterns.",
        lessons: [
          { _id: "anchor-cpi", title: "Cross-Program Invocation", slug: "anchor-cpi", order: 1, type: "content", content: "" },
          { _id: "anchor-token", title: "Token Integration", slug: "anchor-token", order: 2, type: "content", content: "" },
          { _id: "anchor-testing", title: "Testing with Bankrun", slug: "anchor-testing", order: 3, type: "content", content: "" },
          { _id: "anchor-challenge", title: "Build a Counter Program", slug: "anchor-challenge", order: 4, type: "challenge", content: "", code: "", tests: [], hints: [], solution: "" },
        ],
        order: 2
      },
    ],
  },
  {
    _id: "defi-tokens",
    slug: "defi-tokens",
    title: "DeFi & Tokens",
    description: "Master Token-2022, build AMMs, understand lending protocols, and implement advanced DeFi patterns.",
    difficulty: "advanced",
    duration: 14,
    trackId: 2,
    xpReward: 100,
    totalLessons: 10,
    thumbnail: "/images/courses/defi.jpg",
    tags: ["solana", "defi", "tokens"],
    instructor: {
      name: "Superteam Academy",
      avatar: "/avatars/superteam.jpg",
      bio: "The learning hub for the Solana ecosystem."
    },
    modules: [
      {
        _id: "token-basics",
        title: "Token Standards",
        description: "Learn SPL and Token-2022 standards.",
        lessons: [
          { _id: "spl-tokens", title: "SPL Tokens", slug: "spl-tokens", order: 1, type: "content", content: "" },
          { _id: "token-2022", title: "Token-2022 Extensions", slug: "token-2022", order: 2, type: "content", content: "" },
          { _id: "token-challenge", title: "Create a Token with Metadata", slug: "token-challenge", order: 3, type: "challenge", content: "", code: "", tests: [], hints: [], solution: "" },
        ],
        order: 1
      },
      {
        _id: "defi-patterns",
        title: "DeFi Patterns",
        description: "Understand AMMs and lending on Solana.",
        lessons: [
          { _id: "amm-basics", title: "AMM Fundamentals", slug: "amm-basics", order: 1, type: "content", content: "" },
          { _id: "lending", title: "Lending Protocols", slug: "lending", order: 2, type: "content", content: "" },
          { _id: "defi-challenge", title: "Build a Simple Swap", slug: "defi-challenge", order: 3, type: "challenge", content: "", code: "", tests: [], hints: [], solution: "" },
        ],
        order: 2
      },
    ],
  },
] as unknown as Course[];

export function findCourseBySlug(slug: string): Course | undefined {
  return (mockCourses as unknown as Course[]).find(course => course.slug === slug);
}
