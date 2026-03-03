// ─── Lesson Page — Content Model & Mock Data ─────────────────
//
// Flexible content system: lessons are composed of ordered
// ContentBlock[] arrays. Instructors mix video, markdown, callouts
// in any combination. Code challenges and quizzes are separate
// top-level fields for structured interaction.

// ─── Types ─────────────────────────────────────────────────────

export type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'video'; url: string; title?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; content: string }

export interface CodeChallenge {
  prompt: string
  objectives: string[]
  starterCode: string
  language: 'rust' | 'typescript' | 'json'
  testCases: { name: string; expected: string; passed: boolean }[]
  expectedOutput: string
  solutionCode: string
}

export interface QuizQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'code'
  prompt: string
  options?: string[]
  correctIndex?: number
  correctIndices?: number[]
  starterCode?: string
  language?: string
  expected?: string
}

export interface Quiz {
  questions: QuizQuestion[]
}

export interface LessonContent {
  id: string
  courseSlug: string
  moduleId: string
  moduleTitle: string
  title: string
  type: 'video' | 'reading' | 'code_challenge' | 'quiz' | 'hybrid'
  xpReward: number
  completed: boolean
  duration: string
  blocks: ContentBlock[]
  challenge?: CodeChallenge
  quiz?: Quiz
  hints?: string[]
  solution?: string
}

// ─── Mock Lessons for "Solana Fundamentals" ────────────────────

export const lessonContents: Record<string, LessonContent> = {
  // ── Module 1: Introduction to Solana ──────────────────────

  l1: {
    id: 'l1',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm1',
    moduleTitle: 'Introduction to Solana',
    title: 'What is Solana?',
    type: 'video',
    xpReward: 25,
    completed: true,
    duration: '12 min',
    blocks: [
      {
        type: 'video',
        url: 'https://www.youtube.com/embed/1jzROE6EhxM',
        title: 'Introduction to Solana Blockchain',
      },
      {
        type: 'markdown',
        content: `## Key Takeaways

After watching this video, you should understand:

- **What Solana is** — a high-performance blockchain designed for mass adoption
- **Proof of History** — Solana's innovative consensus mechanism
- **400ms block times** — why Solana is one of the fastest blockchains
- **Low fees** — transactions cost fractions of a cent

Solana processes **65,000+ transactions per second** with sub-second finality, making it ideal for DeFi, gaming, and consumer applications.`,
      },
      {
        type: 'callout',
        variant: 'tip',
        content:
          "Bookmark the [Solana documentation](https://docs.solana.com) — you'll reference it frequently throughout this course.",
      },
    ],
    hints: [
      'Solana uses 8 key innovations to achieve high throughput.',
      'Proof of History is a cryptographic clock, not a consensus mechanism by itself.',
    ],
  },

  l2: {
    id: 'l2',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm1',
    moduleTitle: 'Introduction to Solana',
    title: 'Solana Architecture',
    type: 'reading',
    xpReward: 20,
    completed: true,
    duration: '8 min',
    blocks: [
      {
        type: 'markdown',
        content: `## Solana's Architecture

Solana's architecture is designed around **8 key innovations** that work together to achieve unprecedented throughput.

### The Runtime

The Solana runtime (called **Sealevel**) is the parallel smart contract execution engine. Unlike Ethereum's sequential EVM, Sealevel can process thousands of smart contracts in parallel.

\`\`\`
┌─────────────────────────────────────────┐
│           Solana Runtime (Sealevel)      │
├─────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │ TX1 │  │ TX2 │  │ TX3 │  │ TX4 │   │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘   │
│     │        │        │        │        │
│  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐   │
│  │Prog1│  │Prog2│  │Prog1│  │Prog3│   │
│  └─────┘  └─────┘  └─────┘  └─────┘   │
│     ▲ Parallel Execution ▲              │
└─────────────────────────────────────────┘
\`\`\`

### Account Model

Everything in Solana is an **account**. Programs are accounts, data is stored in accounts, even your wallet is an account.

\`\`\`typescript
interface Account {
  lamports: number;      // Balance in lamports (1 SOL = 1B lamports)
  data: Uint8Array;      // Arbitrary data
  owner: PublicKey;       // Program that owns this account
  executable: boolean;   // Is this a program?
  rentEpoch: number;     // Rent tracking
}
\`\`\`

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Programs** | On-chain code (like smart contracts) |
| **Accounts** | Store state and SOL |
| **Instructions** | Calls to programs with accounts |
| **Transactions** | Bundles of 1+ instructions |
| **Signatures** | Ed25519 cryptographic signatures |`,
      },
      {
        type: 'callout',
        variant: 'info',
        content:
          'Unlike Ethereum, Solana programs are **stateless**. All state is stored in separate accounts that programs read and write to.',
      },
      {
        type: 'markdown',
        content: `### Programs vs Smart Contracts

On Solana, we call them **programs**, not smart contracts. Key differences:

- Programs are **stateless** — they don't store data internally
- Programs are **upgradeable** by default (can be made immutable)
- Programs specify which accounts they need **upfront** (enables parallel execution)
- Programs are written in **Rust** (or C/C++) and compiled to BPF bytecode`,
      },
    ],
    hints: [
      'The account model is the most important concept to understand in Solana.',
      'Think of accounts as files in a filesystem — programs are the executables that read/write them.',
    ],
  },

  l3: {
    id: 'l3',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm1',
    moduleTitle: 'Introduction to Solana',
    title: 'Setting Up Your Environment',
    type: 'code_challenge',
    xpReward: 50,
    completed: true,
    duration: '20 min',
    blocks: [
      {
        type: 'markdown',
        content: `## Setting Up Your Development Environment

Before we start building, let's set up the tools you'll need for Solana development.

### Prerequisites

You should have the following installed:
- **Rust** (via rustup)
- **Solana CLI** (v1.18+)
- **Node.js** (v18+)
- **Anchor** (v0.30+)`,
      },
      {
        type: 'callout',
        variant: 'warning',
        content:
          "Make sure you're on **Solana CLI v1.18 or later**. Earlier versions have known compatibility issues with the latest Anchor releases.",
      },
    ],
    challenge: {
      prompt:
        'Write a TypeScript function that connects to Solana devnet and fetches the current slot number.',
      objectives: [
        'Import Connection from @solana/web3.js',
        'Connect to the devnet cluster',
        'Fetch and return the current slot number',
      ],
      starterCode: `import { Connection } from "@solana/web3.js";

async function getCurrentSlot(): Promise<number> {
  // TODO: Create a connection to devnet
  // TODO: Fetch the current slot
  // TODO: Return the slot number
}

// Test
getCurrentSlot().then(slot => console.log("Current slot:", slot));`,
      language: 'typescript',
      testCases: [
        {
          name: 'Creates Connection to devnet',
          expected: 'Connection object created',
          passed: false,
        },
        {
          name: 'Calls getSlot()',
          expected: 'Returns a number',
          passed: false,
        },
        {
          name: 'Returns valid slot number',
          expected: 'slot > 0',
          passed: false,
        },
      ],
      expectedOutput: 'Current slot: 284736291',
      solutionCode: `import { Connection, clusterApiUrl } from "@solana/web3.js";

async function getCurrentSlot(): Promise<number> {
  const connection = new Connection(clusterApiUrl("devnet"));
  const slot = await connection.getSlot();
  return slot;
}

getCurrentSlot().then(slot => console.log("Current slot:", slot));`,
    },
    hints: [
      'Use `clusterApiUrl("devnet")` to get the devnet RPC URL.',
      'The `Connection` class accepts a URL string as its first argument.',
      'Use `connection.getSlot()` — it returns a Promise<number>.',
    ],
    solution: `import { Connection, clusterApiUrl } from "@solana/web3.js";

async function getCurrentSlot(): Promise<number> {
  const connection = new Connection(clusterApiUrl("devnet"));
  const slot = await connection.getSlot();
  return slot;
}`,
  },

  // ── Module 2: Accounts & Transactions ─────────────────────

  l4: {
    id: 'l4',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm2',
    moduleTitle: 'Accounts & Transactions',
    title: 'Understanding Accounts',
    type: 'hybrid',
    xpReward: 35,
    completed: true,
    duration: '15 min',
    blocks: [
      {
        type: 'video',
        url: 'https://www.youtube.com/embed/1jzROE6EhxM',
        title: 'Deep Dive: Solana Account Model',
      },
      {
        type: 'markdown',
        content: `## The Account Model Deep Dive

Every piece of data on Solana lives in an **account**. This is fundamentally different from Ethereum where contracts store their own state.

### Account Types

1. **System Accounts** — Your wallet. Owned by the System Program.
2. **Program Accounts** — Executable code. Marked with \`executable: true\`.
3. **Data Accounts** — Store state for programs. Owned by the program that created them.
4. **Token Accounts** — SPL Token balances. Owned by the Token Program.

### Account Layout

\`\`\`rust
pub struct AccountInfo<'a> {
    pub key: &'a Pubkey,          // 32 bytes - account address
    pub lamports: &'a mut u64,     // 8 bytes  - SOL balance
    pub data: &'a mut [u8],        // variable - stored data
    pub owner: &'a Pubkey,         // 32 bytes - program owner
    pub rent_epoch: u64,           // 8 bytes  - rent tracking
    pub is_signer: bool,           // 1 byte   - signed this tx?
    pub is_writable: bool,         // 1 byte   - writable in tx?
    pub executable: bool,          // 1 byte   - is a program?
}
\`\`\``,
      },
      {
        type: 'callout',
        variant: 'tip',
        content:
          'Think of the Solana runtime as a **key-value store** where keys are public keys (addresses) and values are account data.',
      },
      {
        type: 'markdown',
        content: `### Rent

Accounts must maintain a minimum balance to stay alive — this is called **rent exemption**. The minimum is approximately:

\`\`\`
rent = 0.00089088 SOL per byte per year
\`\`\`

For a typical account with 100 bytes of data, you need about **0.00144768 SOL** to be rent-exempt.

> Most modern Solana programs require accounts to be rent-exempt at creation time.`,
      },
    ],
    hints: [
      'Every account has an owner — only the owner program can modify the account data.',
      'The System Program (11111111111111111111111111111111) owns all wallet accounts.',
    ],
  },

  l5: {
    id: 'l5',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm2',
    moduleTitle: 'Accounts & Transactions',
    title: 'Transaction Anatomy',
    type: 'reading',
    xpReward: 25,
    completed: false,
    duration: '10 min',
    blocks: [
      {
        type: 'markdown',
        content: `## Transaction Anatomy

A Solana transaction is a bundle of instructions sent atomically to the network.

### Structure

\`\`\`typescript
interface Transaction {
  signatures: Signature[];     // One per signer
  message: {
    header: MessageHeader;     // Signer counts
    accountKeys: PublicKey[];   // All accounts referenced
    recentBlockhash: string;   // Prevents replay
    instructions: Instruction[]; // The actual operations
  }
}
\`\`\`

### Transaction Lifecycle

\`\`\`
1. Build    → Create transaction with instructions
2. Sign     → Wallet signs with private key
3. Send     → Submit to RPC node
4. Process  → Leader includes in block
5. Confirm  → Network reaches consensus
6. Finalize → Transaction is permanent
\`\`\`

### Instructions

Each instruction specifies:
- **Program ID** — which program to call
- **Accounts** — which accounts the program needs
- **Data** — serialized arguments

\`\`\`typescript
interface TransactionInstruction {
  programId: PublicKey;
  keys: AccountMeta[];  // { pubkey, isSigner, isWritable }
  data: Buffer;          // Serialized instruction data
}
\`\`\``,
      },
      {
        type: 'callout',
        variant: 'info',
        content:
          'A single transaction can contain **multiple instructions** that execute atomically — if any instruction fails, the entire transaction is rolled back.',
      },
      {
        type: 'markdown',
        content: `### Key Limits

| Limit | Value |
|-------|-------|
| Max transaction size | 1,232 bytes |
| Max instructions per tx | ~20 (size dependent) |
| Max accounts per tx | 64 (v0 with ALTs: 256) |
| Max compute units | 1,400,000 CU |
| Blockhash validity | ~60 seconds |

### Versioned Transactions

Solana supports **v0 transactions** with Address Lookup Tables (ALTs) — these allow referencing up to 256 accounts by storing addresses in on-chain lookup tables.`,
      },
    ],
    hints: [
      'The recentBlockhash acts as a nonce to prevent replay attacks.',
      'Transactions expire after ~60 seconds if not confirmed.',
    ],
  },

  l6: {
    id: 'l6',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm2',
    moduleTitle: 'Accounts & Transactions',
    title: 'Build Your First Transaction',
    type: 'code_challenge',
    xpReward: 75,
    completed: false,
    duration: '25 min',
    blocks: [
      {
        type: 'markdown',
        content: `## Build Your First Transaction

Time to put theory into practice! In this challenge, you'll build a SOL transfer transaction from scratch.

### Your Task

Write a function that creates a transaction to transfer SOL from one wallet to another.`,
      },
      {
        type: 'callout',
        variant: 'tip',
        content:
          'Use `SystemProgram.transfer()` to create the transfer instruction. It takes `fromPubkey`, `toPubkey`, and `lamports` as parameters.',
      },
    ],
    challenge: {
      prompt:
        'Create a function that builds a SOL transfer transaction. The function should take a sender, recipient, and amount in SOL.',
      objectives: [
        'Create a new Transaction object',
        'Add a SystemProgram.transfer instruction',
        'Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)',
        'Return the unsigned transaction',
      ],
      starterCode: `import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

function buildTransferTx(
  from: PublicKey,
  to: PublicKey,
  amountInSol: number
): Transaction {
  // TODO: Create a new Transaction
  // TODO: Add a transfer instruction
  // TODO: Return the transaction
}

// Test
const sender = new PublicKey("11111111111111111111111111111111");
const receiver = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const tx = buildTransferTx(sender, receiver, 0.5);
console.log("Instructions:", tx.instructions.length);`,
      language: 'typescript',
      testCases: [
        {
          name: 'Creates Transaction object',
          expected: 'Transaction instance',
          passed: false,
        },
        {
          name: 'Has exactly 1 instruction',
          expected: 'instructions.length === 1',
          passed: false,
        },
        {
          name: 'Transfer amount is correct',
          expected: '500,000,000 lamports',
          passed: false,
        },
        {
          name: 'Uses correct recipient',
          expected: 'Matches toPubkey',
          passed: false,
        },
      ],
      expectedOutput: 'Instructions: 1',
      solutionCode: `import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

function buildTransferTx(
  from: PublicKey,
  to: PublicKey,
  amountInSol: number
): Transaction {
  const transaction = new Transaction();
  
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: amountInSol * LAMPORTS_PER_SOL,
    })
  );
  
  return transaction;
}

const sender = new PublicKey("11111111111111111111111111111111");
const receiver = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const tx = buildTransferTx(sender, receiver, 0.5);
console.log("Instructions:", tx.instructions.length);`,
    },
    hints: [
      'Start by creating a `new Transaction()` object.',
      'Use `transaction.add(...)` to add instructions.',
      'Remember: `LAMPORTS_PER_SOL` is a constant equal to 1,000,000,000.',
      'The `SystemProgram.transfer()` function returns an instruction — pass it directly to `.add()`.',
    ],
    solution: `const transaction = new Transaction();
transaction.add(
  SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: amountInSol * LAMPORTS_PER_SOL,
  })
);
return transaction;`,
  },

  // ── Module 3: Programs & PDAs ─────────────────────────────

  l7: {
    id: 'l7',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm3',
    moduleTitle: 'Programs & PDAs',
    title: 'Program Derived Addresses',
    type: 'hybrid',
    xpReward: 40,
    completed: false,
    duration: '18 min',
    blocks: [
      {
        type: 'video',
        url: 'https://www.youtube.com/embed/1jzROE6EhxM',
        title: 'Understanding PDAs on Solana',
      },
      {
        type: 'markdown',
        content: `## Program Derived Addresses (PDAs)

PDAs are one of Solana's most powerful features. They allow programs to **deterministically derive addresses** and **sign transactions** without a private key.

### How PDAs Work

\`\`\`
PDA = findProgramAddress([seed1, seed2, ...], programId)
    = SHA256(seed1 + seed2 + ... + programId + bump) (mod curve order)
\`\`\`

The key insight: PDAs are addresses that **fall off the Ed25519 curve**, meaning no private key exists for them. Only the program itself can sign for its PDAs.

### Common PDA Patterns

\`\`\`rust
// User-specific data account
let (pda, bump) = Pubkey::find_program_address(
    &[b"user_data", user.key().as_ref()],
    program_id
);

// Global state (singleton)
let (pda, bump) = Pubkey::find_program_address(
    &[b"global_config"],
    program_id
);

// Escrow between two parties
let (pda, bump) = Pubkey::find_program_address(
    &[b"escrow", maker.key().as_ref(), taker.key().as_ref()],
    program_id
);
\`\`\``,
      },
      {
        type: 'callout',
        variant: 'warning',
        content:
          'Always store the **bump seed** in your account data. Recomputing it on every call wastes compute units.',
      },
      {
        type: 'markdown',
        content: `### PDAs as Signers

When a program uses \`invoke_signed\`, it provides the seeds + bump to prove it "owns" the PDA:

\`\`\`rust
invoke_signed(
    &transfer_ix,
    &[pda_account, destination, system_program],
    &[&[b"vault", &[bump_seed]]], // signer seeds
)?;
\`\`\`

This is how programs can transfer SOL and tokens from PDA-owned accounts — **no private key needed**.`,
      },
    ],
    hints: [
      'PDAs are deterministic — the same seeds always produce the same address.',
      'The bump is the highest u8 value (255 down to 0) that produces a valid off-curve point.',
      'Use `find_program_address` to get both the PDA and the bump in one call.',
    ],
  },

  l8: {
    id: 'l8',
    courseSlug: 'solana-fundamentals',
    moduleId: 'm3',
    moduleTitle: 'Programs & PDAs',
    title: 'Cross-Program Invocations',
    type: 'quiz',
    xpReward: 30,
    completed: false,
    duration: '12 min',
    blocks: [
      {
        type: 'markdown',
        content: `## Cross-Program Invocations (CPIs)

CPIs allow one program to call another program's instructions. This is how composability works on Solana.

### CPI Basics

\`\`\`rust
// Simple CPI — caller is NOT a PDA
invoke(
    &instruction,            // The instruction to execute
    &[account1, account2],   // All accounts needed
)?;

// CPI with PDA signer — caller IS a PDA
invoke_signed(
    &instruction,
    &[pda_account, other_accounts],
    &[&[seeds, &[bump]]],   // PDA signer seeds
)?;
\`\`\`

### Security Considerations

When making CPIs, always verify:
1. **Program ID** — ensure you're calling the correct program
2. **Account ownership** — verify account owners match expectations
3. **Signer privileges** — don't pass through signer privileges unnecessarily`,
      },
      {
        type: 'callout',
        variant: 'warning',
        content:
          'CPI depth is limited to **4 levels**. Program A → B → C → D is the max chain.',
      },
    ],
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'radio',
          prompt: 'What function do you use when a PDA needs to sign a CPI?',
          options: [
            'invoke()',
            'invoke_signed()',
            'invoke_pda()',
            'pda_sign()',
          ],
          correctIndex: 1,
        },
        {
          id: 'q2',
          type: 'checkbox',
          prompt:
            'Which of the following are valid CPI security checks? (Select all that apply)',
          options: [
            'Verify the program ID of the called program',
            'Check account ownership matches expectations',
            'Validate signer privileges',
            'Ensure the CPI depth is less than 10',
          ],
          correctIndices: [0, 1, 2],
        },
        {
          id: 'q3',
          type: 'radio',
          prompt: 'What is the maximum CPI depth on Solana?',
          options: ['2 levels', '4 levels', '8 levels', 'Unlimited'],
          correctIndex: 1,
        },
        {
          id: 'q4',
          type: 'code',
          prompt:
            'Complete the invoke_signed call to transfer SOL from a PDA vault:',
          starterCode: `invoke_signed(
    &system_instruction::transfer(
        vault_pda.key,
        recipient.key,
        amount,
    ),
    &[vault_pda.clone(), recipient.clone(), system_program.clone()],
    // TODO: Add the signer seeds for the vault PDA
    // The vault PDA uses seeds: [b"vault", &[bump]]
)?;`,
          language: 'rust',
          expected: `&[&[b"vault", &[bump]]]`,
        },
      ],
    },
    hints: [
      '`invoke_signed` is used when a PDA needs to sign.',
      'CPI depth is limited to 4 levels — A → B → C → D.',
      'The signer seeds must match exactly what was used in `find_program_address`.',
    ],
  },
}

// ─── Lesson Order — for prev/next navigation ───────────────────

export const lessonOrder: string[] = [
  'l1',
  'l2',
  'l3',
  'l4',
  'l5',
  'l6',
  'l7',
  'l8',
]

export function getLessonNav(id: string) {
  const idx = lessonOrder.indexOf(id)
  return {
    current: idx + 1,
    total: lessonOrder.length,
    prev: idx > 0 ? lessonOrder[idx - 1] : null,
    next: idx < lessonOrder.length - 1 ? lessonOrder[idx + 1] : null,
    prevTitle: idx > 0 ? lessonContents[lessonOrder[idx - 1]]?.title : null,
    nextTitle:
      idx < lessonOrder.length - 1
        ? lessonContents[lessonOrder[idx + 1]]?.title
        : null,
  }
}
