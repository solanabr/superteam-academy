/**
 * Returns lesson-appropriate starter/playground code for content and quiz lessons.
 * Challenge lessons use lesson.challenge.starterCode from mock-data instead.
 */

export function getStarterCodeForLesson(lessonId: string, _courseSlug?: string): string {
  const codeByLesson: Record<string, string> = {
    // Solana Fundamentals - Chapter 1
    'lesson-1-1': `// The Solana Vision: Connect to devnet and get the current slot
// Proof of History orders transactions; slot is the clock

import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const slot = await connection.getSlot();
console.log("Current slot:", slot);
`,
    'lesson-1-2': `// Proof of History: Get block height (another time measure)
// PoH is a cryptographic clock that orders transactions

import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const height = await connection.getBlockHeight();
console.log("Current block height:", height);
`,
    'lesson-1-3': `// Accounts & Programs: Read an account's balance
// Every piece of data on Solana lives in an account

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const publicKey = new PublicKey("11111111111111111111111111111111");
const balance = await connection.getBalance(publicKey);
console.log("Balance (lamports):", balance);
console.log("Balance (SOL):", balance / LAMPORTS_PER_SOL);
`,
    'lesson-1-4': `// Quiz: Solana Basics - Quick recap
// Try: get slot, block height, and balance

import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const slot = await connection.getSlot();
const height = await connection.getBlockHeight();
console.log("Slot:", slot, "| Block height:", height);
`,
    // Solana Fundamentals - Chapter 2
    'lesson-2-1': `// Setting Up: Verify your connection to devnet
// Use clusterApiUrl for a clean endpoint

import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const version = await connection.getVersion();
console.log("RPC version:", version);
`,
    // lesson-2-2 and lesson-2-3 use challenge.starterCode
    // Solana Fundamentals - Chapter 3
    'lesson-3-1': `// SPL Token Standard: Tokens are accounts owned by the Token Program
// Here we just connect; token ops use @solana/spl-token

const connection = new Connection("https://api.devnet.solana.com");
const slot = await connection.getSlot();
console.log("Connected. Current slot:", slot);
`,
    'lesson-3-2': `// Token-2022: New extensions (transfer hooks, metadata, etc.)
// Connection check before we dive into token creation

const connection = new Connection("https://api.devnet.solana.com");
console.log("Ready for Token-2022. Endpoint:", connection.rpcEndpoint);
`,
    // Rust course - content lessons (Rust snippets for context; run as TS for demo)
    'lesson-r1-1': `// Ownership & Borrowing (Rust concept - try the logic in JS)
// In Rust: one owner, borrow with & or &mut

const owner = "hello";
const borrowed = owner;  // In Rust this would move
console.log("Owner:", owner);
`,
    'lesson-r1-2': `// Structs & Enums (Rust concept)
// In JS we approximate with objects

const point = { x: 1, y: 2 };
console.log("Point:", point.x, point.y);
`,
    'lesson-r2-1': `// Borsh serialization: Solana programs use Borsh for account data
// Client-side we use @coral-xyz/borsh or similar

console.log("Borsh: binary format for Solana account data");
`,
    'lesson-r2-2': `// Program architecture: entrypoint, instructions, state
// Programs are stateless; state lives in accounts

console.log("Solana program = entrypoint + instructions + accounts");
`,
    // Anchor
    'lesson-a1-1': `// What is Anchor? A framework for Solana programs
// We'll write programs in Rust; client in TS

console.log("Anchor = IDL + macros + client SDK");
`,
    'lesson-a1-2': `// Program structure: declare_id!, program module, instructions

console.log("Anchor program: lib.rs with #[program] mod");
`,
    // DeFi
    'lesson-d1-1': `// What is DeFi? AMMs, lending, swaps on-chain

const connection = new Connection("https://api.devnet.solana.com");
console.log("DeFi on Solana: Jupiter, Raydium, Marinade...");
`,
    'lesson-d1-2': `// AMM mechanics: x*y=k, liquidity pools

console.log("AMM: constant product formula, LPs earn fees");
`,
    // NFT
    'lesson-n1-1': `// NFT standards: Metaplex Token Metadata, Bubblegum (cNFTs)

const connection = new Connection("https://api.devnet.solana.com");
console.log("NFTs on Solana: Metaplex, compressed NFTs");
`,
    'lesson-n1-2': `// Compressed NFTs: state compression, smaller cost

console.log("cNFTs: Merkle tree, no full account per NFT");
`,
    // Security
    'lesson-s1-1': `// Integer overflow/underflow: use checked math in programs

console.log("Rust: use checked_add, saturating_* to avoid overflows");
`,
    'lesson-s1-2': `// Missing owner checks: always validate account.owner

console.log("Validate: account.owner == expected_program_id");
`,
  };

  return (
    codeByLesson[lessonId] ||
    `// Practice: Connect to devnet and get the current slot.
import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const slot = await connection.getSlot();
console.log("Current slot:", slot);
`
  );
}
