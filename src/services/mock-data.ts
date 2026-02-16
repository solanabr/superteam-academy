import { Course, Achievement, LeaderboardEntry, StreakData, GamificationProfile, Progress, SkillNode, Credential } from '@/types';

// ============================================
// Mock Courses
// ============================================

export const MOCK_COURSES: Course[] = [
  {
    id: 'solana-101',
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals: The Genesis Quest',
    description: 'Begin your journey into the Solana ecosystem. Learn the core concepts of blockchain technology, understand Solana\'s architecture, and build your first interactions with the network. This quest will transform you from a curious newcomer into a confident Solana explorer.',
    shortDescription: 'Master the foundations of Solana blockchain development',
    thumbnail: '/images/courses/solana-101.jpg',
    difficulty: 'beginner',
    duration: '6 hours',
    totalXP: 1500,
    track: 'solana-fundamentals',
    tags: ['solana', 'blockchain', 'web3', 'fundamentals'],
    enrollmentCount: 2847,
    rating: 4.8,
    language: 'en',
    prerequisites: [],
    createdAt: '2025-12-01',
    updatedAt: '2026-01-15',
    instructor: {
      id: 'instructor-1',
      name: 'Lucas Silva',
      avatar: '/images/instructors/lucas.jpg',
      bio: 'Solana core contributor and educator with 5+ years of blockchain experience.',
      title: 'Senior Solana Developer',
      socialLinks: { twitter: '@lucassilva', github: 'lucassilva' },
    },
    modules: [
      {
        id: 'mod-1',
        title: 'Chapter 1: What is Solana?',
        description: 'Understanding the Solana blockchain',
        order: 0,
        xpReward: 200,
        lessons: [
          { id: 'lesson-1-1', title: 'The Solana Vision', description: 'Why Solana exists and what makes it unique', type: 'content', order: 0, content: '', xpReward: 25, duration: '10 min' },
          { id: 'lesson-1-2', title: 'Proof of History', description: 'Understanding Solana\'s consensus mechanism', type: 'content', order: 1, content: '', xpReward: 30, duration: '15 min' },
          { id: 'lesson-1-3', title: 'Accounts & Programs', description: 'The Solana account model explained', type: 'content', order: 2, content: '', xpReward: 35, duration: '15 min' },
          { id: 'lesson-1-4', title: 'Quiz: Solana Basics', description: 'Test your knowledge', type: 'quiz', order: 3, content: '', xpReward: 50, duration: '10 min' },
        ],
      },
      {
        id: 'mod-2',
        title: 'Chapter 2: Your First Transaction',
        description: 'Interacting with the Solana network',
        order: 1,
        xpReward: 300,
        lessons: [
          { id: 'lesson-2-1', title: 'Setting Up Your Environment', description: 'Install tools and configure your workspace', type: 'content', order: 0, content: '', xpReward: 20, duration: '20 min' },
          { id: 'lesson-2-2', title: 'Creating a Wallet', description: 'Generate your first Solana keypair', type: 'challenge', order: 1, content: '', xpReward: 50, duration: '15 min', challenge: { id: 'ch-1', title: 'Generate a Keypair', description: 'Create a Solana keypair using @solana/web3.js', prompt: 'Write a function that generates a new Solana keypair and returns the public key as a string.', starterCode: 'import { Keypair } from "@solana/web3.js";\n\nexport function generateKeypair(): string {\n  // Your code here\n}', solution: 'import { Keypair } from "@solana/web3.js";\n\nexport function generateKeypair(): string {\n  const keypair = Keypair.generate();\n  return keypair.publicKey.toBase58();\n}', language: 'typescript', testCases: [{ id: 'tc-1', name: 'Returns a valid base58 string', input: '', expectedOutput: 'Keypair|toBase58|generate', isHidden: false }], hints: ['Use Keypair.generate() to create a new keypair', 'The public key can be converted with .toBase58()'], difficulty: 'easy', xpReward: 50 } },
          { id: 'lesson-2-3', title: 'Sending SOL', description: 'Transfer SOL between accounts', type: 'challenge', order: 2, content: '', xpReward: 75, duration: '25 min', challenge: { id: 'ch-2', title: 'Send a SOL Transfer', description: 'Create and send a SOL transfer transaction', prompt: 'Write a function that builds a SOL transfer using SystemProgram.transfer. Call it with from/to addresses and amount in lamports. Log the transaction or signature.', starterCode: 'import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";\n\nasync function sendSOL(from: string, to: string, amountLamports: number) {\n  const connection = new Connection("https://api.devnet.solana.com");\n  const tx = new Transaction().add(\n    SystemProgram.transfer({\n      fromPubkey: new PublicKey(from),\n      toPubkey: new PublicKey(to),\n      lamports: amountLamports,\n    })\n  );\n  // In production: sign and send. Here we just build it.\n  console.log("Transfer instruction added. Lamports:", amountLamports);\n}\n\nsendSOL("11111111111111111111111111111111", "11111111111111111111111111111111", 1000);', solution: '', language: 'typescript', testCases: [{ id: 'tc-2', name: 'Uses SystemProgram.transfer', input: '', expectedOutput: 'SystemProgram|transfer|Transaction', isHidden: false }], hints: ['Use SystemProgram.transfer to create the instruction', 'Add the instruction to a Transaction'], difficulty: 'medium', xpReward: 75 } },
        ],
      },
      {
        id: 'mod-3',
        title: 'Chapter 3: Tokens on Solana',
        description: 'Understanding SPL tokens',
        order: 2,
        xpReward: 400,
        lessons: [
          { id: 'lesson-3-1', title: 'SPL Token Standard', description: 'How tokens work on Solana', type: 'content', order: 0, content: '', xpReward: 30, duration: '15 min' },
          { id: 'lesson-3-2', title: 'Token-2022 Extensions', description: 'New token standard features', type: 'content', order: 1, content: '', xpReward: 35, duration: '15 min' },
          { id: 'lesson-3-3', title: 'Create Your Token', description: 'Mint your first token', type: 'challenge', order: 2, content: '', xpReward: 100, duration: '30 min', challenge: { id: 'ch-3', title: 'Boss Battle: Create a Token', description: 'Create and mint an SPL token on devnet', prompt: 'Write a function that would create a new SPL token mint. Use Connection and PublicKey; log a placeholder mint address. (Full mint creation requires @solana/spl-token and a funded wallet.)', starterCode: '// Boss Battle: Create Your First Token (concept)\n// Full mint creation uses @solana/spl-token createMint\n\nimport { Connection, PublicKey } from "@solana/web3.js";\n\nasync function createToken() {\n  const connection = new Connection("https://api.devnet.solana.com");\n  // In production: create mint account, create token account, mint tokens\n  const placeholderMint = new PublicKey("11111111111111111111111111111111");\n  console.log("Mint address (placeholder):", placeholderMint.toBase58());\n}\n\ncreateToken();', solution: '', language: 'typescript', testCases: [{ id: 'tc-3', name: 'Uses PublicKey and logs mint concept', input: '', expectedOutput: 'PublicKey|mint|toBase58', isHidden: false }], hints: ['Use Connection and PublicKey', 'In production you would use createMint from @solana/spl-token'], difficulty: 'boss', xpReward: 100 } },
        ],
      },
    ],
  },
  {
    id: 'rust-101',
    slug: 'rust-for-solana',
    title: 'Rust for Solana: The Forge',
    description: 'Master Rust programming language with a focus on Solana program development. From ownership and borrowing to building production-ready on-chain programs, this quest forges you into a capable Rust developer.',
    shortDescription: 'Learn Rust programming for Solana development',
    thumbnail: '/images/courses/rust-101.jpg',
    difficulty: 'intermediate',
    duration: '12 hours',
    totalXP: 3000,
    track: 'rust-mastery',
    tags: ['rust', 'programming', 'systems', 'solana'],
    enrollmentCount: 1923,
    rating: 4.9,
    language: 'en',
    prerequisites: ['solana-fundamentals'],
    createdAt: '2025-12-15',
    updatedAt: '2026-01-20',
    instructor: {
      id: 'instructor-2',
      name: 'Ana Costa',
      avatar: '/images/instructors/ana.jpg',
      bio: 'Systems programmer and Rust evangelist. Building on Solana since 2021.',
      title: 'Rust Core Contributor',
      socialLinks: { twitter: '@anacosta', github: 'anacosta' },
    },
    modules: [
      {
        id: 'mod-r1',
        title: 'Chapter 1: Rust Foundations',
        description: 'Core Rust concepts',
        order: 0,
        xpReward: 500,
        lessons: [
          { id: 'lesson-r1-1', title: 'Ownership & Borrowing', description: 'The heart of Rust', type: 'content', order: 0, content: '', xpReward: 40, duration: '20 min' },
          { id: 'lesson-r1-2', title: 'Structs & Enums', description: 'Data structures in Rust', type: 'content', order: 1, content: '', xpReward: 40, duration: '20 min' },
          { id: 'lesson-r1-3', title: 'Error Handling', description: 'Result and Option types', type: 'challenge', order: 2, content: '', xpReward: 75, duration: '25 min', challenge: { id: 'ch-r1', title: 'Error Handling in Rust', description: 'Use Result and Option', prompt: 'Write Rust-style logic: a function that returns Result<number, string> and uses Ok/Err. (We evaluate pattern match; run in TS to see output.)', starterCode: '// Rust-style error handling (run as TS for demo)\nfunction parsePositive(s) {\n  const n = Number(s);\n  if (isNaN(n) || n < 0) return { err: "Invalid" };\n  return { ok: n };\n}\nconst result = parsePositive("42");\nconsole.log(result.ok ?? result.err);', solution: '', language: 'typescript', testCases: [{ id: 'tc-r1', name: 'Uses result/error pattern', input: '', expectedOutput: 'result|err|ok', isHidden: false }], hints: ['Result has Ok and Err variants', 'Match on the result before using the value'], difficulty: 'medium', xpReward: 75 } },
        ],
      },
      {
        id: 'mod-r2',
        title: 'Chapter 2: Rust for Programs',
        description: 'Applying Rust to Solana development',
        order: 1,
        xpReward: 700,
        lessons: [
          { id: 'lesson-r2-1', title: 'Serialization', description: 'Borsh and data serialization', type: 'content', order: 0, content: '', xpReward: 40, duration: '20 min' },
          { id: 'lesson-r2-2', title: 'Program Architecture', description: 'Structuring Solana programs', type: 'content', order: 1, content: '', xpReward: 50, duration: '25 min' },
          { id: 'lesson-r2-3', title: 'Boss: Build a Counter', description: 'Build a counter program from scratch', type: 'challenge', order: 2, content: '', xpReward: 100, duration: '45 min', challenge: { id: 'ch-r2', title: 'Boss: Counter Program', description: 'State and increment logic', prompt: 'Simulate a counter: state object with count, function to increment, and log the value. (On Solana this would be a PDA account.)', starterCode: '// Counter: state + increment (simulates program state)\nlet state = { count: 0 };\nfunction increment() {\n  state.count += 1;\n  return state.count;\n}\nincrement(); increment();\nconsole.log("Count:", state.count);', solution: '', language: 'typescript', testCases: [{ id: 'tc-r2', name: 'Increment and log count', input: '', expectedOutput: 'count|increment', isHidden: false }], hints: ['Store count in an object or variable', 'In Solana programs state lives in accounts'], difficulty: 'boss', xpReward: 100 } },
        ],
      },
    ],
  },
  {
    id: 'anchor-101',
    slug: 'anchor-essentials',
    title: 'Anchor Essentials: The Architect\'s Path',
    description: 'Learn the Anchor framework to rapidly build and deploy Solana programs. This quest teaches you to leverage Anchor\'s powerful abstractions for PDAs, CPIs, and account validation.',
    shortDescription: 'Build Solana programs with Anchor framework',
    thumbnail: '/images/courses/anchor-101.jpg',
    difficulty: 'intermediate',
    duration: '10 hours',
    totalXP: 2500,
    track: 'anchor-development',
    tags: ['anchor', 'solana', 'programs', 'smart-contracts'],
    enrollmentCount: 1567,
    rating: 4.7,
    language: 'en',
    prerequisites: ['rust-for-solana'],
    createdAt: '2026-01-01',
    updatedAt: '2026-02-01',
    instructor: {
      id: 'instructor-3',
      name: 'Pedro Martins',
      avatar: '/images/instructors/pedro.jpg',
      bio: 'Anchor framework contributor. Built 20+ production programs on Solana.',
      title: 'Lead Protocol Engineer',
      socialLinks: { twitter: '@pedromartins', github: 'pedromartins' },
    },
    modules: [
      {
        id: 'mod-a1',
        title: 'Chapter 1: Anchor Basics',
        description: 'Getting started with Anchor',
        order: 0,
        xpReward: 500,
        lessons: [
          { id: 'lesson-a1-1', title: 'What is Anchor?', description: 'Understanding the framework', type: 'content', order: 0, content: '', xpReward: 25, duration: '15 min' },
          { id: 'lesson-a1-2', title: 'Program Structure', description: 'Anatomy of an Anchor program', type: 'content', order: 1, content: '', xpReward: 35, duration: '20 min' },
          { id: 'lesson-a1-3', title: 'Your First Anchor Program', description: 'Build hello world', type: 'challenge', order: 2, content: '', xpReward: 75, duration: '30 min', challenge: { id: 'ch-a1', title: 'Anchor Hello World', description: 'Echo program logic in TS', prompt: 'Simulate an Anchor instruction: a function that takes a name string and returns a greeting. Log it. (Real Anchor uses #[program] and ctx.accounts.)', starterCode: '// Anchor-style: instruction handler (simulated)\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconst msg = greet("Solana");\nconsole.log(msg);', solution: '', language: 'typescript', testCases: [{ id: 'tc-a1', name: 'Greet function and log', input: '', expectedOutput: 'Hello|greet', isHidden: false }], hints: ['Anchor instructions are async functions', 'Use ctx.accounts to read account data'], difficulty: 'medium', xpReward: 75 } },
        ],
      },
    ],
  },
  {
    id: 'defi-101',
    slug: 'defi-on-solana',
    title: 'DeFi on Solana: The Treasure Hunt',
    description: 'Dive into decentralized finance on Solana. Build AMMs, lending protocols, and understand the DeFi ecosystem that makes Solana the fastest blockchain for financial applications.',
    shortDescription: 'Create DeFi applications on Solana',
    thumbnail: '/images/courses/defi-101.jpg',
    difficulty: 'advanced',
    duration: '15 hours',
    totalXP: 4000,
    track: 'defi-builder',
    tags: ['defi', 'solana', 'finance', 'amm', 'lending'],
    enrollmentCount: 984,
    rating: 4.6,
    language: 'en',
    prerequisites: ['anchor-essentials'],
    createdAt: '2026-01-10',
    updatedAt: '2026-02-05',
    instructor: {
      id: 'instructor-4',
      name: 'Maria Santos',
      avatar: '/images/instructors/maria.jpg',
      bio: 'DeFi protocol architect. Previously at Jump Trading and Solana Foundation.',
      title: 'DeFi Protocol Lead',
      socialLinks: { twitter: '@mariasantos', github: 'mariasantos' },
    },
    modules: [
      {
        id: 'mod-d1',
        title: 'Chapter 1: DeFi Foundations',
        description: 'Understanding DeFi primitives',
        order: 0,
        xpReward: 600,
        lessons: [
          { id: 'lesson-d1-1', title: 'What is DeFi?', description: 'Decentralized finance explained', type: 'content', order: 0, content: '', xpReward: 30, duration: '15 min' },
          { id: 'lesson-d1-2', title: 'AMM Mechanics', description: 'How automated market makers work', type: 'content', order: 1, content: '', xpReward: 40, duration: '25 min' },
          { id: 'lesson-d1-3', title: 'Build a Simple Swap', description: 'Create a token swap program', type: 'challenge', order: 2, content: '', xpReward: 100, duration: '45 min', challenge: { id: 'ch-d1', title: 'Swap Logic', description: 'Constant product or swap math', prompt: 'Implement constant-product style math: given reserveA, reserveB, amountIn, compute amountOut (simplified: amountOut = amountIn for demo). Log the result.', starterCode: '// Simple swap math (constant product: x * y = k)\nfunction getAmountOut(amountIn, reserveIn, reserveOut) {\n  const amountInWithFee = amountIn * 997;\n  const numerator = amountInWithFee * reserveOut;\n  const denominator = reserveIn * 1000 + amountInWithFee;\n  return Math.floor(numerator / denominator);\n}\nconst out = getAmountOut(100, 1000, 1000);\nconsole.log("Amount out:", out);', solution: '', language: 'typescript', testCases: [{ id: 'tc-d1', name: 'Swap math and log', input: '', expectedOutput: 'amountOut|swap|reserve', isHidden: false }], hints: ['AMM uses x*y=k', 'Fee is often 0.3% (997/1000)'], difficulty: 'hard', xpReward: 100 } },
        ],
      },
    ],
  },
  {
    id: 'nft-101',
    slug: 'nft-mastery',
    title: 'NFT Mastery: The Artist\'s Realm',
    description: 'Master NFT creation on Solana using Metaplex. From compressed NFTs to dynamic metadata, learn everything about building NFT-powered applications.',
    shortDescription: 'Design and deploy NFT collections on Solana',
    thumbnail: '/images/courses/nft-101.jpg',
    difficulty: 'intermediate',
    duration: '8 hours',
    totalXP: 2000,
    track: 'nft-creator',
    tags: ['nft', 'metaplex', 'solana', 'art', 'compressed-nft'],
    enrollmentCount: 2156,
    rating: 4.8,
    language: 'en',
    prerequisites: ['solana-fundamentals'],
    createdAt: '2026-01-05',
    updatedAt: '2026-02-10',
    instructor: {
      id: 'instructor-5',
      name: 'Rafael Oliveira',
      avatar: '/images/instructors/rafael.jpg',
      bio: 'Metaplex contributor and NFT infrastructure specialist.',
      title: 'NFT Protocol Engineer',
      socialLinks: { twitter: '@rafa_nft', github: 'rafaoliveira' },
    },
    modules: [
      {
        id: 'mod-n1',
        title: 'Chapter 1: NFT Fundamentals',
        description: 'Understanding NFTs on Solana',
        order: 0,
        xpReward: 400,
        lessons: [
          { id: 'lesson-n1-1', title: 'NFT Standards on Solana', description: 'Token Metadata and Bubblegum', type: 'content', order: 0, content: '', xpReward: 30, duration: '15 min' },
          { id: 'lesson-n1-2', title: 'Compressed NFTs', description: 'Scalable NFTs with state compression', type: 'content', order: 1, content: '', xpReward: 40, duration: '20 min' },
          { id: 'lesson-n1-3', title: 'Mint Your First cNFT', description: 'Create a compressed NFT', type: 'challenge', order: 2, content: '', xpReward: 75, duration: '30 min', challenge: { id: 'ch-n1', title: 'cNFT Metadata', description: 'Metadata shape for compressed NFT', prompt: 'Create a metadata object for an NFT: name, symbol, uri. Log it. (Real cNFTs use Metaplex Bubblegum and Merkle trees.)', starterCode: '// cNFT metadata (Bubblegum uses similar shape)\nconst metadata = {\n  name: "Solana Quest NFT",\n  symbol: "SQ",\n  uri: "https://example.com/metadata.json",\n};\nconsole.log("Metadata:", JSON.stringify(metadata, null, 2));', solution: '', language: 'typescript', testCases: [{ id: 'tc-n1', name: 'Metadata with name and uri', input: '', expectedOutput: 'metadata|uri|name', isHidden: false }], hints: ['Metaplex uses name, symbol, uri', 'Compressed NFTs use state compression'], difficulty: 'medium', xpReward: 75 } },
        ],
      },
    ],
  },
  {
    id: 'security-101',
    slug: 'solana-security',
    title: 'Solana Security: The Guardian\'s Trial',
    description: 'Learn to audit Solana programs and identify common vulnerabilities. From reentrancy attacks to PDA manipulation, become the security expert every team needs.',
    shortDescription: 'Audit smart contracts and find vulnerabilities',
    thumbnail: '/images/courses/security-101.jpg',
    difficulty: 'legendary',
    duration: '20 hours',
    totalXP: 5000,
    track: 'security-auditor',
    tags: ['security', 'audit', 'solana', 'vulnerabilities'],
    enrollmentCount: 743,
    rating: 4.9,
    language: 'en',
    prerequisites: ['anchor-essentials', 'rust-for-solana'],
    createdAt: '2026-01-20',
    updatedAt: '2026-02-12',
    instructor: {
      id: 'instructor-6',
      name: 'Thiago Ferreira',
      avatar: '/images/instructors/thiago.jpg',
      bio: 'Security researcher. Found critical vulnerabilities in major Solana protocols.',
      title: 'Head of Security',
      socialLinks: { twitter: '@thiago_sec', github: 'thiagoferreira' },
    },
    modules: [
      {
        id: 'mod-s1',
        title: 'Chapter 1: Common Vulnerabilities',
        description: 'Understanding attack vectors',
        order: 0,
        xpReward: 800,
        lessons: [
          { id: 'lesson-s1-1', title: 'Integer Overflow/Underflow', description: 'Arithmetic vulnerabilities', type: 'content', order: 0, content: '', xpReward: 50, duration: '25 min' },
          { id: 'lesson-s1-2', title: 'Missing Owner Checks', description: 'Account validation attacks', type: 'content', order: 1, content: '', xpReward: 50, duration: '25 min' },
          { id: 'lesson-s1-3', title: 'Find the Bug', description: 'Audit a vulnerable program', type: 'challenge', order: 2, content: '', xpReward: 100, duration: '45 min', challenge: { id: 'ch-s1', title: 'Find the Bug', description: 'Validate account owner', prompt: 'Write a check: function validateOwner(accountOwner, expectedProgramId) that returns true only if they match. Log the result. (Missing owner checks are a common vulnerability.)', starterCode: '// Security: always validate account owner\nfunction validateOwner(accountOwner, expectedProgramId) {\n  return accountOwner === expectedProgramId;\n}\nconst valid = validateOwner("11111111111111111111111111111111", "11111111111111111111111111111111");\nconsole.log("Owner valid:", valid);', solution: '', language: 'typescript', testCases: [{ id: 'tc-s1', name: 'Owner check implemented', input: '', expectedOutput: 'validateOwner|owner', isHidden: false }], hints: ['Programs must check account.owner', 'Prevent PDA or account misuse'], difficulty: 'boss', xpReward: 100 } },
        ],
      },
    ],
  },
];

// ============================================
// Mock Leaderboard
// ============================================

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'cryptovoyager', displayName: 'CryptoVoyager', avatar: '', xp: 15200, level: 12, streak: 45, title: 'Legend' },
  { rank: 2, userId: 'u2', username: 'rustmaster_br', displayName: 'RustMaster_BR', avatar: '', xp: 13800, level: 11, streak: 32, title: 'Grandmaster' },
  { rank: 3, userId: 'u3', username: 'sol_builder', displayName: 'SolBuilder', avatar: '', xp: 12500, level: 11, streak: 28, title: 'Grandmaster' },
  { rank: 4, userId: 'u4', username: 'defi_queen', displayName: 'DeFi Queen', avatar: '', xp: 11200, level: 10, streak: 21, title: 'Mythic' },
  { rank: 5, userId: 'u5', username: 'anchor_dev', displayName: 'AnchorDev', avatar: '', xp: 10100, level: 10, streak: 19, title: 'Mythic' },
  { rank: 6, userId: 'u6', username: 'nft_artisan', displayName: 'NFT Artisan', avatar: '', xp: 9500, level: 9, streak: 15, title: 'Legend' },
  { rank: 7, userId: 'u7', username: 'security_sage', displayName: 'Security Sage', avatar: '', xp: 8800, level: 9, streak: 12, title: 'Legend' },
  { rank: 8, userId: 'u8', username: 'token_wizard', displayName: 'Token Wizard', avatar: '', xp: 7600, level: 8, streak: 10, title: 'Grandmaster' },
  { rank: 9, userId: 'u9', username: 'chain_explorer', displayName: 'Chain Explorer', avatar: '', xp: 6900, level: 8, streak: 8, title: 'Master' },
  { rank: 10, userId: 'u10', username: 'web3_nomad', displayName: 'Web3 Nomad', avatar: '', xp: 6200, level: 7, streak: 7, title: 'Master' },
];

// ============================================
// Helper arrays
// ============================================

const MOCK_ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '👣', category: 'progress', rarity: 'common' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', rarity: 'common' },
  { id: 'first_course', name: 'Course Completer', description: 'Complete your first course', icon: '📜', category: 'progress', rarity: 'rare' },
  { id: 'rust_rookie', name: 'Rust Rookie', description: 'Complete your first Rust lesson', icon: '🦀', category: 'skill', rarity: 'common' },
  { id: 'early_adopter', name: 'Early Adopter', description: 'Join during beta', icon: '🌅', category: 'special', rarity: 'legendary' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Complete a challenge on first try', icon: '💎', category: 'special', rarity: 'epic' },
];

const MOCK_SKILL_NODES: SkillNode[] = [
  { id: 'sk-1', name: 'Solana Basics', track: 'solana-fundamentals', level: 3, maxLevel: 5, xp: 750, xpRequired: 1000, dependencies: [], isUnlocked: true },
  { id: 'sk-2', name: 'Rust', track: 'rust-mastery', level: 1, maxLevel: 5, xp: 200, xpRequired: 500, dependencies: ['sk-1'], isUnlocked: true },
  { id: 'sk-3', name: 'Anchor', track: 'anchor-development', level: 0, maxLevel: 5, xp: 0, xpRequired: 500, dependencies: ['sk-2'], isUnlocked: false },
  { id: 'sk-4', name: 'DeFi', track: 'defi-builder', level: 0, maxLevel: 5, xp: 0, xpRequired: 800, dependencies: ['sk-3'], isUnlocked: false },
  { id: 'sk-5', name: 'NFTs', track: 'nft-creator', level: 0, maxLevel: 5, xp: 0, xpRequired: 500, dependencies: ['sk-1'], isUnlocked: true },
  { id: 'sk-6', name: 'Security', track: 'security-auditor', level: 0, maxLevel: 5, xp: 0, xpRequired: 1000, dependencies: ['sk-2', 'sk-3'], isUnlocked: false },
];

// ============================================
// Mock User Profile
// ============================================

export const MOCK_GAMIFICATION_PROFILE: GamificationProfile = {
  userId: 'current-user',
  xp: 4250,
  level: 6,
  rank: 15,
  streak: {
    currentStreak: 12,
    longestStreak: 28,
    lastActivityDate: new Date().toISOString(),
    streakHistory: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return i < 12 ? date.toISOString().split('T')[0] : '';
    }).filter(Boolean),
    hasFreezeAvailable: true,
  },
  achievements: [
    { ...MOCK_ACHIEVEMENTS_LIST[0], unlockedAt: '2026-01-15' },
    { ...MOCK_ACHIEVEMENTS_LIST[1], unlockedAt: '2026-01-20' },
    { ...MOCK_ACHIEVEMENTS_LIST[3], unlockedAt: '2026-02-01' },
  ],
  unlockedAchievementBitmap: 0b1011,
  skills: MOCK_SKILL_NODES,
  title: 'Scholar',
};

export const MOCK_PROGRESS: Record<string, Progress> = {
  'solana-101': {
    userId: 'current-user',
    courseId: 'solana-101',
    enrolledAt: '2026-01-10',
    completedLessons: [0, 1, 2, 3, 4, 5],
    totalLessons: 10,
    currentModule: 1,
    currentLesson: 2,
    xpEarned: 750,
    completionPercentage: 60,
  },
  'rust-101': {
    userId: 'current-user',
    courseId: 'rust-101',
    enrolledAt: '2026-01-20',
    completedLessons: [0, 1],
    totalLessons: 6,
    currentModule: 0,
    currentLesson: 2,
    xpEarned: 200,
    completionPercentage: 33,
  },
};

