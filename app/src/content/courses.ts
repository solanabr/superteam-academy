import type { CourseCatalogItem, CourseWithContent, LessonWithContent } from '@/types/course';

/**
 * Course catalog data
 * In production, this could be fetched from a CMS or database
 */
export const courses: CourseCatalogItem[] = [
  {
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description:
      'Learn the core concepts of Solana blockchain, including accounts, transactions, programs, and the runtime.',
    thumbnail: '/images/courses/solana-fundamentals.png',
    difficulty: 'beginner',
    duration: 180,
    xpReward: 500,
    track: 'Core',
    lessonsCount: 8,
    modulesCount: 3,
    tags: ['solana', 'blockchain', 'fundamentals'],
    instructor: {
      name: 'Ana Silva',
      avatar: '/images/instructors/ana-silva.png',
      bio: 'Senior Solana Developer at Superteam Brazil',
    },
  },
  {
    slug: 'rust-for-solana',
    title: 'Rust for Solana Development',
    description:
      'Master Rust programming fundamentals specifically tailored for Solana smart contract development.',
    thumbnail: '/images/courses/rust-solana.png',
    difficulty: 'intermediate',
    duration: 300,
    xpReward: 800,
    track: 'Development',
    lessonsCount: 12,
    modulesCount: 4,
    tags: ['rust', 'programming', 'solana'],
    instructor: {
      name: 'Lucas Mendes',
      avatar: '/images/instructors/lucas-mendes.png',
      bio: 'Rust Engineer & Solana Core Contributor',
    },
  },
  {
    slug: 'anchor-framework',
    title: 'Building with Anchor Framework',
    description:
      'Build secure and efficient Solana programs using the Anchor framework with practical examples.',
    thumbnail: '/images/courses/anchor.png',
    difficulty: 'intermediate',
    duration: 240,
    xpReward: 700,
    track: 'Development',
    lessonsCount: 10,
    modulesCount: 3,
    tags: ['anchor', 'framework', 'smart-contracts'],
    instructor: {
      name: 'João Costa',
      avatar: '/images/instructors/joao-costa.png',
      bio: 'Lead Smart Contract Developer',
    },
  },
  {
    slug: 'solana-pay',
    title: 'Solana Pay Integration',
    description:
      'Implement Solana Pay in your applications for instant, fee-less payments in USDC and SOL.',
    thumbnail: '/images/courses/solana-pay.png',
    difficulty: 'beginner',
    duration: 90,
    xpReward: 300,
    track: 'Payments',
    lessonsCount: 5,
    modulesCount: 2,
    tags: ['solana-pay', 'payments', 'integration'],
  },
  {
    slug: 'nft-development',
    title: 'NFT Development on Solana',
    description:
      'Create, mint, and manage NFT collections on Solana using Metaplex and Candy Machine.',
    thumbnail: '/images/courses/nft.png',
    difficulty: 'intermediate',
    duration: 210,
    xpReward: 600,
    track: 'NFTs',
    lessonsCount: 9,
    modulesCount: 3,
    tags: ['nft', 'metaplex', 'candy-machine'],
  },
  {
    slug: 'defi-protocols',
    title: 'DeFi Protocols on Solana',
    description:
      'Understand and interact with major DeFi protocols on Solana including Jupiter, Raydium, and Marinade.',
    thumbnail: '/images/courses/defi.png',
    difficulty: 'advanced',
    duration: 270,
    xpReward: 900,
    track: 'DeFi',
    lessonsCount: 11,
    modulesCount: 4,
    tags: ['defi', 'protocols', 'advanced'],
  },
];

/**
 * Full course content with lessons
 */
export const courseContent: Record<string, CourseWithContent> = {
  'solana-fundamentals': {
    id: 'course-001',
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description:
      'Learn the core concepts of Solana blockchain, including accounts, transactions, programs, and the runtime.',
    thumbnail: '/images/courses/solana-fundamentals.png',
    difficulty: 'beginner',
    duration: 180,
    xpReward: 500,
    track: 'Core',
    prerequisites: [],
    learningObjectives: [
      'Understand the Solana architecture and how it differs from other blockchains',
      'Learn about accounts, programs, and transactions',
      'Set up a local development environment',
      'Create and sign transactions with Solana wallets',
    ],
    tags: ['solana', 'blockchain', 'fundamentals'],
    modules: [
      {
        id: 'mod-001',
        title: 'Introduction to Solana',
        order: 1,
        description: 'Get started with Solana and understand its unique architecture.',
        lessons: [
          {
            id: 'lesson-001',
            slug: 'what-is-solana',
            title: 'What is Solana?',
            type: 'content',
            order: 1,
            moduleId: 'mod-001',
            xpReward: 50,
            duration: 15,
            content: `# What is Solana?

Solana is a high-performance blockchain platform designed for decentralized applications and cryptocurrencies. It was founded by Anatoly Yakovenko in 2017 and launched in March 2020.

## Key Features

### Speed
Solana can process **65,000+ transactions per second** (TPS), making it one of the fastest blockchains in existence. This is achieved through several innovative technologies:

- **Proof of History (PoH)**: A cryptographic clock that timestamps transactions
- **Tower BFT**: An optimized version of PBFT consensus
- **Turbine**: A block propagation protocol
- **Gulf Stream**: Mempool-less transaction forwarding

### Low Cost
Transaction fees on Solana are incredibly low, typically around **$0.00025** per transaction. This makes it practical for:
- Micropayments
- High-frequency trading
- Gaming applications
- Social media platforms

<Callout type="info" title="Fun Fact">
Solana processes more transactions per day than Ethereum and Bitcoin combined, while using a fraction of the energy.
</Callout>

## Why Build on Solana?

Building on Solana offers several advantages:

1. **Developer Experience**: Rich tooling and documentation
2. **Ecosystem**: Access to DeFi, NFTs, and payments infrastructure
3. **Community**: Strong support from Superteam and other DAOs
4. **Funding**: Grants and investment opportunities

<Quiz 
  question="What is Solana's approximate transactions per second (TPS) capacity?"
  options={[
    { id: "a", text: "1,000 TPS" },
    { id: "b", text: "15,000 TPS" },
    { id: "c", text: "65,000+ TPS", isCorrect: true },
    { id: "d", text: "1 million TPS" }
  ]}
  explanation="Solana can process over 65,000 transactions per second thanks to innovations like Proof of History and parallel transaction processing."
/>

## Next Steps

In the next lesson, we'll dive deeper into Solana's architecture and understand how it achieves such high performance.
`,
            nextLesson: { slug: 'solana-architecture', title: 'Solana Architecture' },
          },
          {
            id: 'lesson-002',
            slug: 'solana-architecture',
            title: 'Solana Architecture',
            type: 'content',
            order: 2,
            moduleId: 'mod-001',
            xpReward: 75,
            duration: 25,
            content: `# Solana Architecture

Understanding Solana's architecture is crucial for building efficient applications. Let's explore the key components.

## Core Components

### Accounts
Everything on Solana is an **account**. Accounts store:
- Data (up to 10MB)
- SOL balance
- Owner program
- Executable flag

\`\`\`typescript
interface Account {
  data: Uint8Array;      // Account data
  executable: boolean;   // Is this a program?
  lamports: number;      // Balance in lamports
  owner: PublicKey;      // Program that owns this account
  rentEpoch: number;     // Epoch when rent was last deducted
}
\`\`\`

### Programs
Programs are the smart contracts of Solana. Key facts:
- Programs are **stateless**
- Data is stored in separate accounts
- Programs are owned by the BPF Loader
- Written in Rust, C, or using Anchor framework

<Callout type="tip" title="Native Programs">
Solana includes native programs like System Program, Token Program, and Associated Token Account Program that handle common operations.
</Callout>

### Transactions
Transactions contain one or more instructions that invoke programs:

\`\`\`typescript
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 1_000_000_000, // 1 SOL
  })
);
\`\`\`

## Consensus Mechanism

Solana uses a combination of:

| Component | Purpose |
|-----------|---------|
| Proof of History | Cryptographic timestamp |
| Tower BFT | Consensus voting |
| Turbine | Block propagation |
| Gulf Stream | Transaction forwarding |

## Cluster Types

Solana has different networks for different purposes:

1. **Mainnet-beta**: Production network
2. **Testnet**: Testing new features
3. **Devnet**: Developer testing (free SOL)
4. **Localnet**: Local development

<Quiz 
  question="What property makes Solana programs different from Ethereum smart contracts?"
  options={[
    { id: "a", text: "They use JavaScript" },
    { id: "b", text: "They are stateless", isCorrect: true },
    { id: "c", text: "They cannot interact with other programs" },
    { id: "d", text: "They are free to deploy" }
  ]}
  explanation="Solana programs are stateless - they don't store data themselves. Instead, data is stored in separate accounts that programs can read from and write to."
/>
`,
            prevLesson: { slug: 'what-is-solana', title: 'What is Solana?' },
            nextLesson: { slug: 'setup-environment', title: 'Setting Up Your Environment' },
          },
        ],
      },
      {
        id: 'mod-002',
        title: 'Development Environment',
        order: 2,
        description: 'Set up your local development environment for Solana.',
        lessons: [
          {
            id: 'lesson-003',
            slug: 'setup-environment',
            title: 'Setting Up Your Environment',
            type: 'content',
            order: 1,
            moduleId: 'mod-002',
            xpReward: 100,
            duration: 30,
            content: `# Setting Up Your Environment

Let's configure your development environment for Solana development.

## Prerequisites

Before we begin, make sure you have:
- **Node.js** 18+ installed
- **Rust** (latest stable version)
- A code editor (VS Code recommended)

## Installing Solana CLI

### macOS / Linux

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

### Windows

Download and run the installer from the [Solana releases page](https://github.com/solana-labs/solana/releases).

After installation, add Solana to your PATH and verify:

\`\`\`bash
solana --version
# solana-cli 1.18.x
\`\`\`

## Configuring for Devnet

Set your CLI to use devnet for testing:

\`\`\`bash
solana config set --url devnet
\`\`\`

<Callout type="warning" title="Network Selection">
Always double-check which network you're connected to before sending any transactions, especially when working with real SOL on mainnet.
</Callout>

## Creating a Wallet

Generate a new keypair for development:

\`\`\`bash
solana-keygen new --outfile ~/.config/solana/devnet.json
solana config set --keypair ~/.config/solana/devnet.json
\`\`\`

## Getting Devnet SOL

Request free SOL for testing:

\`\`\`bash
solana airdrop 2
# Requesting airdrop of 2 SOL...
# Signature: xxx
# 2 SOL
\`\`\`

Check your balance:

\`\`\`bash
solana balance
# 2 SOL
\`\`\`

## Installing Anchor

Anchor is the recommended framework for Solana development:

\`\`\`bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
anchor --version
\`\`\`

## Verify Your Setup

Run these commands to verify everything is working:

\`\`\`bash
# Check Solana CLI
solana --version

# Check your connection
solana cluster-version

# Check Rust
rustc --version
cargo --version

# Check Anchor
anchor --version
\`\`\`

<Callout type="success" title="You're Ready!">
If all commands work without errors, you're ready to start building on Solana!
</Callout>
`,
            prevLesson: { slug: 'solana-architecture', title: 'Solana Architecture' },
            nextLesson: { slug: 'first-transaction', title: 'Your First Transaction' },
          },
          {
            id: 'lesson-004',
            slug: 'first-transaction',
            title: 'Your First Transaction',
            type: 'challenge',
            order: 2,
            moduleId: 'mod-002',
            xpReward: 150,
            duration: 45,
            hints: [
              'Start by importing Connection and PublicKey from @solana/web3.js',
              'Use Connection.getBalance() to check the balance',
              'Remember to convert lamports to SOL (divide by 1e9)',
            ],
            content: `# Your First Transaction

Now let's write some code to interact with Solana!

## Connecting to the Network

First, we need to establish a connection to a Solana cluster:

\`\`\`typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'));
\`\`\`

## Reading Account Data

Let's check the balance of an account:

\`\`\`typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'));
const publicKey = new PublicKey('YOUR_PUBLIC_KEY');

const balance = await connection.getBalance(publicKey);
console.log(\`Balance: \${balance / LAMPORTS_PER_SOL} SOL\`);
\`\`\`

## Challenge: Check Wallet Balance

Complete the function below to check a wallet's balance and return it in SOL.

<ChallengeBlock
  title="Check Wallet Balance"
  prompt="Complete the getBalanceInSOL function that takes a wallet address string and returns the balance in SOL (not lamports)."
  language="typescript"
  starterCode={\`import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

async function getBalanceInSOL(walletAddress: string): Promise<number> {
  // Your code here
  // 1. Create a connection to devnet
  // 2. Convert the address string to a PublicKey
  // 3. Get the balance in lamports
  // 4. Convert to SOL and return

}

// Test it
getBalanceInSOL('YOUR_WALLET_ADDRESS').then(console.log);\`}
  solution={\`import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

async function getBalanceInSOL(walletAddress: string): Promise<number> {
  const connection = new Connection(clusterApiUrl('devnet'));
  const publicKey = new PublicKey(walletAddress);
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Test it
getBalanceInSOL('YOUR_WALLET_ADDRESS').then(console.log);\`}
  testCases={[
    { description: "Creates a Connection to devnet", expectedOutput: "Connection" },
    { description: "Converts address to PublicKey", expectedOutput: "PublicKey" },
    { description: "Returns balance in SOL", expectedOutput: "LAMPORTS_PER_SOL" }
  ]}
  hints={[
    "Import Connection, PublicKey, and LAMPORTS_PER_SOL from @solana/web3.js",
    "Use clusterApiUrl('devnet') for the RPC URL",
    "Divide lamports by LAMPORTS_PER_SOL to get SOL"
  ]}
  xpReward={150}
/>

## Next Steps

Now that you can read from Solana, in the next module we'll learn how to create and submit transactions!
`,
            prevLesson: { slug: 'setup-environment', title: 'Setting Up Your Environment' },
          },
        ],
      },
    ],
  },
};

/**
 * Get all courses for catalog
 */
export function getAllCourses(): CourseCatalogItem[] {
  return courses;
}

/**
 * Get course by slug
 */
export function getCourseBySlug(slug: string): CourseWithContent | undefined {
  return courseContent[slug];
}

/**
 * Get lesson by course slug and lesson slug
 */
export function getLesson(
  courseSlug: string,
  lessonSlug: string
):
  | {
      course: CourseWithContent;
      lesson: LessonWithContent;
      module: CourseWithContent['modules'][0];
    }
  | undefined {
  const course = courseContent[courseSlug];
  if (!course) return undefined;

  for (const courseModule of course.modules) {
    const lesson = courseModule.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) {
      return { course, lesson, module: courseModule };
    }
  }

  return undefined;
}

/**
 * Get courses by track
 */
export function getCoursesByTrack(track: string): CourseCatalogItem[] {
  return courses.filter((c) => c.track === track);
}

/**
 * Get all available tracks
 */
export function getAllTracks(): string[] {
  const tracks = new Set(courses.map((c) => c.track).filter(Boolean));
  return Array.from(tracks) as string[];
}

/**
 * Search courses
 */
export function searchCourses(query: string): CourseCatalogItem[] {
  const lowerQuery = query.toLowerCase();
  return courses.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}
