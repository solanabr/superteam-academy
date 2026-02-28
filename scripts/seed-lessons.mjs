/**
 * Seed 5 full lessons into Sanity for solana-fundamentals course
 * Run: node scripts/seed-lessons.mjs
 */

const TOKEN = 'skfRfU3FegWfLuXfwxUhcbg8OpneMQeOv2SmYcYAWYNoQP3AeBgCTtDmDw4hlblzMwHGsl1Exyp9UTZrD';
const PROJECT_ID = 'k9esrahg';
const DATASET = 'production';
const API = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/${DATASET}`;

function block(text, style = 'normal') {
  return {
    _type: 'block', _key: key(),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: key(), marks: [], text }]
  };
}

function code(codeText, language = 'typescript') {
  return { _type: 'code', _key: key(), language, code: codeText };
}

function callout(text, tone = 'info') {
  return {
    _type: 'callout', _key: key(), tone,
    body: [block(text)]
  };
}

let _keyCounter = 0;
function key() { return `k${++_keyCounter}${Math.random().toString(36).slice(2, 6)}`; }

// ─── LESSON 1: What is Solana? ───────────────────────────────────────────────
const lesson1 = {
  _id: 'lesson-what-is-solana-v2',
  _type: 'lesson',
  title: 'What is Solana?',
  lessonType: 'content',
  order: 1,
  xpReward: 50,
  estimatedMinutes: 12,
  content: [
    block('Solana is a high-performance Layer 1 blockchain built for scale. While Ethereum processes ~15 transactions per second and Bitcoin ~7, Solana handles 65,000+ TPS with sub-second finality and fees of $0.00025 per transaction.', 'normal'),
    block('Key Numbers', 'h2'),
    code(`// Solana vs other blockchains (approx. 2024 data)
const comparison = {
  solana:   { tps: 65_000, finality: '400ms',  avgFee: '$0.00025' },
  ethereum: { tps: 15,     finality: '~12min',  avgFee: '$2–30'    },
  bitcoin:  { tps: 7,      finality: '~60min',  avgFee: '$1–5'     },
};`, 'typescript'),
    block('How does Solana achieve this?', 'h2'),
    block('Solana combines 8 core innovations. The two most important are:', 'normal'),
    block('1. Proof of History (PoH)', 'h3'),
    block('PoH is a cryptographic clock built into the protocol. Instead of validators needing to agree on time (which requires rounds of communication), PoH creates a verifiable sequence of events using a SHA-256 hash chain. Each output becomes the input to the next hash:', 'normal'),
    code(`// Simplified PoH: each hash includes the previous one
// This creates a verifiable timestamp without network coordination
hash_0 = sha256("genesis")
hash_1 = sha256(hash_0 + event_A)
hash_2 = sha256(hash_1)
hash_3 = sha256(hash_2 + event_B)
// ...65,000 hashes/second → sub-400ms slots`, 'bash'),
    block('2. Turbine — Block Propagation', 'h3'),
    block('When a leader produces a block, it uses Turbine to fan-out data to the network. The block is split into small packets (shreds) and distributed like a BitTorrent tree. Validators only need to receive their fraction and forward it, not the entire block.', 'normal'),
    block('The Solana Architecture', 'h2'),
    code(`// Key roles in the Solana network
Leader (validator):
  - Selected via Proof of Stake (stake-weighted rotation)
  - Creates blocks during its ~400ms slot
  - Executes transactions and propagates shreds via Turbine

Validators:
  - Vote on blocks every slot
  - Stake SOL as economic collateral
  - Run the Sealevel parallel runtime

RPC Nodes:
  - Non-voting gateways for developers
  - Expose JSON-RPC API (getTransaction, sendTransaction, etc.)
  - Helius, QuickNode, Triton are popular providers`, 'bash'),
    block('Accounts — Everything Lives in Account State', 'h2'),
    block('Unlike Ethereum where smart contracts store state inside themselves, Solana separates programs from data. Programs are stateless executable code. All state lives in separate account objects that programs read and write.', 'normal'),
    code(`// Solana account structure
pub struct Account {
    pub lamports: u64,        // SOL balance (1 SOL = 1_000_000_000 lamports)
    pub data: Vec<u8>,        // arbitrary data the program stores
    pub owner: Pubkey,        // which program owns + can modify this account
    pub executable: bool,     // is this account a program?
    pub rent_epoch: u64,      // deprecated, always 0 in new accounts
}`, 'rust'),
    block('The Solana Ecosystem', 'h2'),
    block('Solana hosts over $10B in DeFi TVL, 2M+ daily active wallets, and hundreds of protocols: Raydium and Orca (DEXes), Marinade (liquid staking), Tensor (NFT marketplace), Jupiter (aggregator), Drift and Zeta (perps). The SPL token standard powers thousands of tokens including USDC, which does over $500M/day in volume on Solana.', 'normal'),
  ],
};

// ─── LESSON 2: Why Solana is Different ──────────────────────────────────────
const lesson2 = {
  _id: 'lesson-why-solana-different',
  _type: 'lesson',
  title: 'Why Solana is Different',
  lessonType: 'content',
  order: 2,
  xpReward: 50,
  estimatedMinutes: 15,
  content: [
    block('Most blockchains pick two from the "blockchain trilemma": security, decentralization, scalability. Solana\'s thesis is that hardware improvements (Moore\'s law) mean you don\'t have to sacrifice — build for the hardware available today and scale with it.', 'normal'),
    block('The 8 Innovations', 'h2'),
    code(`1. Proof of History (PoH)      — cryptographic clock, enables ordering without coordination
2. Tower BFT                   — PoH-aware PBFT consensus, uses the clock to reduce voting overhead
3. Turbine                     — block propagation via shreds (like BitTorrent for blocks)
4. Gulf Stream                 — mempool-less transaction forwarding to anticipated leaders
5. Sealevel                   — parallel smart contract runtime (runs thousands of TXs in parallel)
6. Pipelining                  — transaction processing pipeline across CPU/GPU/SSD
7. Cloudbreak                  — horizontally scaled account database (random-access SSD)
8. Archivers                   — distributed ledger storage network`, 'bash'),
    block('Sealevel: Parallel Execution', 'h2'),
    block('This is Solana\'s secret weapon. Every transaction declares upfront which accounts it will read and which it will write. The Sealevel runtime uses this to schedule non-overlapping transactions in parallel across CPU cores.', 'normal'),
    code(`// Transaction declares account access pattern upfront
// This is how the runtime knows what can run in parallel

// TX_A reads/writes: [user_wallet, token_account_A]
// TX_B reads/writes: [other_user, token_account_B]
// → TX_A and TX_B can run SIMULTANEOUSLY (no overlap)

// TX_C reads/writes: [user_wallet, token_account_C]
// → TX_C must wait for TX_A (shared user_wallet write)

// Ethereum must execute TX_A → TX_B → TX_C sequentially
// Solana: [TX_A, TX_B] in parallel, then TX_C`, 'typescript'),
    block('Gulf Stream — No Mempool', 'h2'),
    block('Ethereum has a mempool where transactions wait for inclusion. Validators pick from the mempool based on fees. This causes fee spikes during congestion and MEV extraction.', 'normal'),
    block('Solana knows who the next 4 leaders will be (stake-weighted rotation is deterministic). So when you submit a transaction, your RPC node forwards it directly to the current and upcoming leaders — no waiting in a shared pool.', 'normal'),
    code(`// Gulf Stream flow:
// 1. You send TX to your RPC node
// 2. RPC forwards TX to current leader + next 3 upcoming leaders
// 3. Leaders buffer TXs before their slot
// 4. Leader includes TX in next block (usually < 400ms)
// Result: no mempool bidding wars, predictable inclusion`, 'bash'),
    block('Lamports and Rent', 'h2'),
    block('SOL is divisible into lamports (1 SOL = 1,000,000,000 lamports). Every account on-chain must maintain a minimum lamport balance proportional to its data size — this is called rent-exemption. If an account drops below this minimum, it gets deleted.', 'normal'),
    code(`// Rent exemption calculation
// The minimum balance to keep an account alive forever
// (as of 2024: ~6960 lamports per byte)

const LAMPORTS_PER_SOL = 1_000_000_000;

// A 200-byte account needs roughly:
const rentExempt = 6960 * 200; // ≈ 1,392,000 lamports ≈ 0.001392 SOL

// When you create an account via a program, you pay this upfront
// When you close an account, you get the lamports back (rent reclaim)`, 'typescript'),
    block('Compute Units', 'h2'),
    block('Solana measures transaction complexity in Compute Units (CU). Every instruction costs CU: simple arithmetic ~1 CU, hash operations ~5 CU, account lookups ~25 CU, syscalls vary. The default CU limit per transaction is 200,000 CU. You can request up to 1.4M CU with a SetComputeUnitLimit instruction.', 'normal'),
    code(`// Optimize CU usage in your programs
use anchor_lang::prelude::*;

#[program]
pub mod efficient_program {
    use super::*;

    pub fn process(ctx: Context<Process>, data: u64) -> Result<()> {
        // ✅ Good: cache account data in local variables
        let amount = ctx.accounts.vault.amount;

        // ❌ Bad: reading ctx.accounts.vault.amount multiple times
        // costs CU each time due to account serialization overhead

        msg!("Processing: {}", data); // msg! costs ~100 CU
        Ok(())
    }
}`, 'rust'),
    block('The Developer Experience', 'h2'),
    block('Building on Solana means writing Rust programs compiled to BPF bytecode, deployed to the network, and called via JSON-RPC. The Anchor framework adds a layer of safety (account validation macros, IDL generation) that dramatically reduces boilerplate and security bugs compared to raw Solana programs.', 'normal'),
  ],
};

// ─── LESSON 3: Everything is an Account ─────────────────────────────────────
const lesson3 = {
  _id: 'lesson-everything-is-account',
  _type: 'lesson',
  title: 'Everything is an Account',
  lessonType: 'content',
  order: 4,
  xpReward: 75,
  estimatedMinutes: 18,
  content: [
    block('In Solana, accounts are the fundamental unit of storage. Programs, tokens, NFTs, user data, configuration — everything is an account. Understanding accounts is the most important concept to grasp when building on Solana.', 'normal'),
    block('Account Types', 'h2'),
    code(`// Three types of accounts on Solana:

// 1. SYSTEM ACCOUNTS (owned by System Program)
//    - Regular wallets
//    - No data, just lamports
//    - System Program is the only one that can create new accounts

// 2. PROGRAM ACCOUNTS (executable: true)
//    - The deployed bytecode of your Rust program
//    - Owned by BPF Loader program
//    - Immutable data (unless program is upgradeable)

// 3. DATA ACCOUNTS
//    - Owned by a program (not System Program)
//    - Store arbitrary data that the owning program controls
//    - This is where your program state lives`, 'typescript'),
    block('Reading Account Data', 'h2'),
    block('Every Solana account has the same structure. The "data" field contains raw bytes that your program interprets according to its own schema (using Borsh serialization in Anchor).', 'normal'),
    code(`import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// Get raw account info
const pubkey = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const info = await connection.getAccountInfo(pubkey);

console.log({
  lamports: info?.lamports,          // balance in lamports
  owner: info?.owner.toBase58(),      // which program owns this
  executable: info?.executable,       // is this a program?
  dataLength: info?.data.length,      // bytes of stored data
});
// Output for the SPL Token Program:
// { lamports: 1141440, owner: 'BPFLoaderUpgradeab...',
//   executable: true, dataLength: 36 }`, 'typescript'),
    block('The Account Model vs Ethereum', 'h2'),
    code(`// ETHEREUM smart contract
contract Counter {
    uint256 count = 0;  // state lives INSIDE the contract

    function increment() public {
        count++;
    }
    function get() public view returns (uint256) {
        return count;  // read from contract's own storage
    }
}

// SOLANA equivalent
// Program (stateless — just logic):
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    ctx.accounts.counter.count += 1;  // modify external account
    Ok(())
}

// Data account (holds state):
#[account]
pub struct Counter {
    pub count: u64,  // stored in a separate account, not the program
}
// The program and data are DIFFERENT accounts!`, 'rust'),
    block('Account Ownership', 'h2'),
    block('The owner field is critical: only the owning program can modify an account\'s data or reduce its lamports. Any program can READ any account, but only the owner can WRITE.', 'normal'),
    code(`// Account ownership rules:
// ✅ Program can modify data in accounts it OWNS
// ✅ Any program can READ any account
// ✅ System Program can transfer lamports FROM accounts it owns (wallets)
// ❌ Program CANNOT modify data in accounts owned by other programs
// ❌ Program CANNOT reduce lamports it doesn't own

// Example: System Program owns your wallet
// → Only System Program can debit your wallet
// → Your program CAN read your wallet balance
// → Your program CANNOT steal your wallet lamports
// (unless you sign a transaction that explicitly authorizes it)`, 'typescript'),
    block('Program Derived Addresses (PDAs)', 'h2'),
    block('Programs cannot sign transactions (they have no private keys). But they often need to control accounts. PDAs solve this: they\'re addresses derived deterministically from seeds, and the program that matches can "sign" via the runtime.', 'normal'),
    code(`// PDA derivation
const [pda, bump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("counter"),    // seed 1: string
    wallet.publicKey.toBuffer() // seed 2: user's pubkey
  ],
  programId
);
// pda is a unique address for this (program, wallet) pair
// No private key exists for pda — only the program can authorize it

// In your Rust program, you "sign" with the PDA like:
// seeds = [b"counter", user.key().as_ref()],
// bump = ctx.bumps.counter_pda`, 'typescript'),
    block('Account Space Planning', 'h2'),
    block('When you create a data account, you must allocate space upfront. You cannot grow it later without closing and recreating. Plan your account size carefully:', 'normal'),
    code(`// Space calculation for an account
#[account]
pub struct UserProfile {
    pub authority: Pubkey,    // 32 bytes
    pub username: String,     // 4 (length prefix) + max 32 bytes
    pub xp: u64,              // 8 bytes
    pub level: u8,            // 1 byte
    pub joined_at: i64,       // 8 bytes (unix timestamp)
}

// Total space needed:
// 8 (discriminator) + 32 + 36 + 8 + 1 + 8 = 93 bytes
// Add buffer for future fields → allocate 128 bytes

// In Anchor:
#[account(
    init,
    payer = payer,
    space = 8 + 32 + 36 + 8 + 1 + 8, // discriminator + fields
)]
pub user_profile: Account<'info, UserProfile>,`, 'rust'),
  ],
};

// ─── LESSON 4: System Program & Rent ────────────────────────────────────────
const lesson4 = {
  _id: 'lesson-system-program-rent',
  _type: 'lesson',
  title: 'System Program & Rent',
  lessonType: 'content',
  order: 5,
  xpReward: 75,
  estimatedMinutes: 15,
  content: [
    block('The System Program (address: 11111111111111111111111111111111) is the most fundamental program on Solana. It\'s the only program that can create new accounts and the only one that can transfer SOL from system-owned accounts (wallets).', 'normal'),
    block('What the System Program Does', 'h2'),
    code(`// System Program instructions:
// 1. CreateAccount — creates a new account, allocates space, assigns owner
// 2. Transfer — moves lamports between system-owned accounts
// 3. Allocate — allocates space for an existing account
// 4. Assign — changes the owner of an account
// 5. CreateAccountWithSeed — deterministic address creation
// 6. AdvanceNonceAccount — for durable nonces (offline signing)

// Every time you see "Account created" in Anchor, it calls System Program
// under the hood with CreateAccount instruction`, 'typescript'),
    block('Rent-Exemption in Practice', 'h2'),
    block('Every byte of account data costs lamports to store. Accounts below the rent-exemption threshold get garbage-collected by the runtime. In practice, you always fund accounts to be rent-exempt (one-time payment, no ongoing fee).', 'normal'),
    code(`import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// How many lamports does a 200-byte account need to be rent-exempt?
const bytes = 200;
const lamports = await connection.getMinimumBalanceForRentExemption(bytes);
console.log(\`Rent-exempt minimum for \${bytes} bytes: \${lamports} lamports\`);
console.log(\`= \${lamports / LAMPORTS_PER_SOL} SOL\`);
// Output: Rent-exempt minimum for 200 bytes: 2039280 lamports
// = 0.00203928 SOL`, 'typescript'),
    block('Creating Accounts Manually', 'h2'),
    block('In Anchor, @account(init, ...) handles this automatically. But understanding what happens under the hood helps you debug and optimize:', 'normal'),
    code(`import {
  Connection, Keypair, SystemProgram,
  Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL
} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const payer = Keypair.generate(); // your wallet
const newAccount = Keypair.generate();

// Step 1: Calculate rent-exempt minimum
const space = 100; // bytes of data
const rentExempt = await connection.getMinimumBalanceForRentExemption(space);

// Step 2: Build the createAccount instruction
const createIx = SystemProgram.createAccount({
  fromPubkey: payer.publicKey,         // who pays
  newAccountPubkey: newAccount.publicKey, // new account address
  lamports: rentExempt,                // fund for rent exemption
  space: space,                        // bytes to allocate
  programId: MY_PROGRAM_ID,           // who will own this account
});

// Step 3: Send transaction
const tx = new Transaction().add(createIx);
await sendAndConfirmTransaction(connection, tx, [payer, newAccount]);`, 'typescript'),
    block('Account Lifecycle', 'h2'),
    code(`// 1. CREATION
//    SystemProgram.createAccount → account exists, has data + lamports

// 2. ACTIVE
//    Your program reads/writes data
//    Lamports stay above rent-exempt minimum → account stays alive

// 3. CLOSING (rent reclaim)
//    Program zeroes data + transfers all lamports back to payer
//    Account returns to "uninitialized" state (system-owned, 0 data)

// In Anchor, closing an account:
#[account(
    mut,
    close = authority  // send lamports to authority, zero data
)]
pub data_account: Account<'info, MyData>,
// Anchor automatically handles the lamport transfer and data zeroing`, 'rust'),
    block('SOL Transfers', 'h2'),
    block('Direct SOL transfers between wallets use the System Program. When your program needs to transfer SOL, it uses a Cross-Program Invocation (CPI) to the System Program:', 'normal'),
    code(`use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub fn pay_reward(ctx: Context<PayReward>, amount: u64) -> Result<()> {
    // CPI to System Program to transfer SOL
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        cpi_accounts,
    );
    system_program::transfer(cpi_ctx, amount)?;

    msg!("Transferred {} lamports", amount);
    Ok(())
}`, 'rust'),
    block('Practical: Check Any Account', 'h2'),
    code(`// Useful for debugging — inspect any account on-chain
const inspect = async (address: string) => {
  const connection = new Connection("https://api.devnet.solana.com");
  const pubkey = new PublicKey(address);

  const [info, balance] = await Promise.all([
    connection.getAccountInfo(pubkey),
    connection.getBalance(pubkey),
  ]);

  console.log("Owner:", info?.owner.toBase58());
  console.log("Executable:", info?.executable);
  console.log("Data (hex):", info?.data.toString('hex').slice(0, 64), "...");
  console.log("Balance:", balance / 1e9, "SOL");

  // If owner is "11111111111111111111111111111111" → it's a wallet
  // If executable is true → it's a deployed program
  // Otherwise → it's a data account owned by some program
};`, 'typescript'),
  ],
};

// ─── LESSON 5: Challenge — Read On-Chain Data ────────────────────────────────
const lesson5 = {
  _id: 'lesson-challenge-read-onchain',
  _type: 'lesson',
  title: 'Challenge: Read On-Chain Data',
  lessonType: 'challenge',
  order: 6,
  xpReward: 150,
  estimatedMinutes: 20,
  content: [
    block('Time to write real TypeScript code that talks to the Solana devnet. You\'ll use @solana/web3.js to fetch account data, check balances, and inspect the on-chain state of real programs.', 'normal'),
    block('Your Task', 'h2'),
    block('Write a function getAccountSummary(address: string) that fetches account info from devnet and returns an object with these fields: isWallet (true if owned by System Program), isSolProgram (true if executable), lamports (number), and ownerProgram (the owner address as a string).', 'normal'),
    block('Hints', 'h2'),
    block('Use connection.getAccountInfo(pubkey) to get account data. The System Program address is "11111111111111111111111111111111". The owner field on AccountInfo is a PublicKey — call .toBase58() to get the string.', 'normal'),
    code(`// System Program public key (constant)
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

// Useful imports (already in scope in the challenge):
// import { Connection, PublicKey } from "@solana/web3.js";
// const connection = new Connection("https://api.devnet.solana.com");`, 'typescript'),
  ],
  starterCode: `import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

interface AccountSummary {
  isWallet: boolean;
  isSolProgram: boolean;
  lamports: number;
  ownerProgram: string;
}

export async function getAccountSummary(address: string): Promise<AccountSummary> {
  // TODO: Create a PublicKey from the address string

  // TODO: Fetch account info using connection.getAccountInfo()

  // TODO: Return an AccountSummary object
  // Tip: if info is null, the account doesn't exist (lamports = 0)

  return {
    isWallet: false,
    isSolProgram: false,
    lamports: 0,
    ownerProgram: "",
  };
}`,
  solutionCode: `import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

interface AccountSummary {
  isWallet: boolean;
  isSolProgram: boolean;
  lamports: number;
  ownerProgram: string;
}

export async function getAccountSummary(address: string): Promise<AccountSummary> {
  const pubkey = new PublicKey(address);
  const info = await connection.getAccountInfo(pubkey);

  if (!info) {
    return {
      isWallet: false,
      isSolProgram: false,
      lamports: 0,
      ownerProgram: "",
    };
  }

  const ownerProgram = info.owner.toBase58();

  return {
    isWallet: ownerProgram === SYSTEM_PROGRAM && !info.executable,
    isSolProgram: info.executable,
    lamports: info.lamports,
    ownerProgram,
  };
}`,
  testCases: [
    {
      description: 'Import Connection from @solana/web3.js',
      input: 'Connection',
      expectedOutput: 'true',
    },
    {
      description: 'Import PublicKey from @solana/web3.js',
      input: 'PublicKey',
      expectedOutput: 'true',
    },
    {
      description: 'Use getAccountInfo to fetch account data',
      input: 'getAccountInfo',
      expectedOutput: 'true',
    },
    {
      description: 'Call toBase58() to convert PublicKey to string',
      input: 'toBase58',
      expectedOutput: 'true',
    },
    {
      description: 'Return ownerProgram field in the result',
      input: 'ownerProgram',
      expectedOutput: 'true',
    },
  ],
};

// ─── Mutations ───────────────────────────────────────────────────────────────
const lessons = [lesson1, lesson2, lesson3, lesson4, lesson5];

const mutations = lessons.map(lesson => ({
  createOrReplace: lesson
}));

console.log(`Seeding ${lessons.length} lessons...`);
lessons.forEach(l => console.log(` - [${l.lessonType}] ${l._id}: ${l.title}`));

const response = await fetch(API, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({ mutations }),
});

const result = await response.json();
if (result.error) {
  console.error('Error:', result.error);
  process.exit(1);
}

console.log(`\n✓ Done! ${result.results?.length ?? 0} documents created/updated.`);
result.results?.forEach(r => console.log(`  ${r.operation}: ${r.id}`));
