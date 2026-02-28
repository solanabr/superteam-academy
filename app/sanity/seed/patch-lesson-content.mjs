// Patch Sanity lessons with real Portable Text content
// Run: node sanity/seed/patch-lesson-content.mjs

const PROJECT_ID = "k9esrahg";
const DATASET = "production";
const TOKEN = "skfRfU3FegWfLuXfwxUhcbg8OpneMQeOv2SmYcYAWYNoQP3AeBgCTtDmDw4hlblzMwHGsl1Exyp9UTZrD";

const API = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;

function block(text, style = "normal") {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style,
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text, marks: [] }],
    markDefs: [],
  };
}

function h2(text) { return block(text, "h2"); }
function h3(text) { return block(text, "h3"); }
function p(text) { return block(text, "normal"); }

function code(codeText, language = "rust") {
  return { _type: "code", _key: Math.random().toString(36).slice(2), language, code: codeText };
}

function bullets(items) {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: items.map(text => ({ _type: "span", _key: Math.random().toString(36).slice(2), text, marks: [] })),
    markDefs: [],
  };
}

// Returns array of bullet blocks (one per item)
function ul(items) {
  return items.map(text => ({
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text, marks: [] }],
    markDefs: [],
  }));
}

const LESSONS = [
  {
    id: "lesson-what-is-solana-v2",
    content: [
      p("Solana is a high-performance, permissionless blockchain designed for mass adoption. It achieves 65,000+ TPS with sub-second finality and fees under $0.01 — without sacrificing decentralization."),
      h2("Why Solana?"),
      p("Most blockchains face a fundamental trade-off: speed, security, or decentralization — pick two. Solana solves this with eight core innovations working together."),
      h2("Key Innovations"),
      ...ul([
        "Proof of History (PoH) — a cryptographic clock that sequences transactions before consensus",
        "Tower BFT — a PoH-optimized version of PBFT consensus",
        "Turbine — block propagation protocol breaking data into small packets",
        "Gulf Stream — mempool-less transaction forwarding to upcoming validators",
        "Sealevel — parallel smart contract runtime (runs thousands of programs simultaneously)",
        "Pipeline — transaction processing unit for hardware optimization",
        "Cloudbreak — horizontally-scaled accounts database",
        "Archivers — distributed ledger storage",
      ]),
      h2("The Result"),
      p("Solana processes blocks every 400ms (2–3 orders of magnitude faster than Bitcoin/Ethereum). Transaction fees average $0.00025. The network has processed over 250 billion transactions since launch."),
      h2("Solana vs. Ethereum"),
      code(`// Ethereum: 15 TPS, ~$5 fees, 12s block time
// Solana:   65,000 TPS, $0.00025 fees, 400ms block time

// Same result — different execution environments:
// Ethereum uses the EVM (stack machine, solidity)
// Solana uses the BPF VM (register machine, Rust/C/C++)`, "typescript"),
      p("The biggest conceptual shift coming from Ethereum: Solana has no concept of 'smart contract storage'. Everything is accounts. Programs are stateless — they store no data themselves. Data lives in separate accounts owned by those programs."),
    ],
  },
  {
    id: "lesson-why-solana-different",
    content: [
      p("Coming from Ethereum or other EVM chains? Solana's programming model feels alien at first. This lesson breaks down the key mental model shifts."),
      h2("Stateless Programs"),
      p("In Ethereum, a smart contract owns its storage. In Solana, programs are stateless — they contain only logic. All state lives in separate accounts that programs read and write."),
      code(`// Ethereum (Solidity) — contract owns data:
contract Counter {
    uint256 public count; // stored IN the contract
    function increment() public { count++; }
}

// Solana (Anchor) — program is stateless, data in account:
#[program]
pub mod counter {
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1; // data is IN the account
        Ok(())
    }
}`, "typescript"),
      h2("The Account Model"),
      p("Every piece of data on Solana lives in an account. Accounts have:"),
      ...ul([
        "A public key (address)",
        "A lamport balance (SOL stored as lamports: 1 SOL = 1,000,000,000 lamports)",
        "A data field (arbitrary bytes)",
        "An owner (the program that can modify this account's data)",
        "An executable flag (true = this account IS a program)",
      ]),
      h2("Rent"),
      p("Accounts must maintain a minimum lamport balance proportional to their data size. This is called 'rent exemption'. If an account falls below this threshold, it gets deleted. Programs typically pre-fund accounts to be rent-exempt for life."),
      code(`// Rent exemption calculation:
// Minimum balance = 0.00089 SOL per byte (approximately)
// An account with 1KB of data needs ~0.89 SOL to be rent-exempt

// In practice, use the Solana CLI:
// solana rent 1000   # → shows minimum balance for 1000 bytes`, "bash"),
      h2("Transaction Model"),
      p("Solana transactions must declare ALL accounts they will read or write upfront. This lets the runtime parallelize non-conflicting transactions (Sealevel). No surprises — the VM knows exactly what a transaction will touch before executing it."),
    ],
  },
  {
    id: "lesson-setup-env",
    content: [
      p("Set up a complete Solana development environment. This takes 15–30 minutes and you only do it once."),
      h2("1. Install Rust"),
      code(`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup component add rustfmt clippy
rustc --version  # should print rustc 1.75+`, "bash"),
      h2("2. Install Solana CLI"),
      code(`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version  # should print solana-cli 1.18+`, "bash"),
      h2("3. Install Anchor"),
      code(`cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
anchor --version  # should print anchor-cli 0.31+`, "bash"),
      h2("4. Create a Devnet Wallet"),
      code(`# Generate a new keypair (save the mnemonic!)
solana-keygen new --outfile ~/.config/solana/id.json

# Configure CLI to use devnet
solana config set --url devnet

# Get your public key
solana address

# Airdrop 2 SOL for testing
solana airdrop 2`, "bash"),
      h2("5. Verify Installation"),
      code(`# Check balance (should show 2 SOL)
solana balance

# Create a test Anchor project
anchor init hello-world
cd hello-world
anchor build  # downloads dependencies + compiles
anchor test   # runs against local validator`, "bash"),
      h2("Editor Setup"),
      p("Install VS Code with these extensions: rust-analyzer (Rust language server), Better TOML (Cargo.toml syntax), Error Lens (inline errors). The rust-analyzer extension gives you autocomplete, inline type hints, and go-to-definition across all Rust code."),
    ],
  },
  {
    id: "lesson-everything-is-account",
    content: [
      p("Solana's defining feature is its account model. Understanding it deeply unlocks everything else."),
      h2("Account Structure"),
      code(`pub struct Account {
    pub lamports: u64,           // SOL balance in lamports
    pub data: Vec<u8>,           // arbitrary byte array
    pub owner: Pubkey,           // program that owns this account
    pub executable: bool,        // is this a program?
    pub rent_epoch: Epoch,       // legacy field, ignore for now
}`, "rust"),
      h2("Types of Accounts"),
      p("There are four main account types you'll encounter:"),
      ...ul([
        "Wallet accounts — owned by System Program, hold SOL, controlled by private key",
        "Program accounts — executable=true, contain compiled BPF bytecode",
        "Data accounts — owned by programs, store program state",
        "Token accounts — owned by SPL Token program, track token balances",
      ]),
      h2("Ownership Rules"),
      p("This is the most important rule in Solana: only the account's owner program can modify its data. The System Program owns all wallets. Your Anchor program owns the accounts it creates. This is enforced at the runtime level — you cannot bypass it."),
      code(`// The System Program (11111111111111111111111111111111) can:
// - Create new accounts
// - Allocate data space
// - Transfer SOL from accounts it owns (wallets)

// Your program (deployed BPF bytecode) can:
// - Modify data in accounts it owns
// - Transfer lamports from accounts it owns
// - Cross-Program Invoke (CPI) other programs`, "rust"),
      h2("Program Derived Addresses (PDAs)"),
      p("PDAs are accounts with addresses derived from seeds + program ID rather than keypairs. They have no private key — only your program can sign for them. This is how programs 'own' data accounts in a deterministic, trustless way."),
    ],
  },
  {
    id: "lesson-challenge-read-onchain",
    starterCode: `import { Connection, PublicKey } from "@solana/web3.js";

// Challenge: Read on-chain data
// 1. Connect to Devnet
// 2. Fetch the account info for the given public key
// 3. Return the lamport balance as SOL (divide by 1e9)

export async function getBalance(address: string): Promise<number> {
  // TODO: Create a connection to devnet
  // Hint: use "https://api.devnet.solana.com"

  // TODO: Create a PublicKey from the address string

  // TODO: Fetch the account balance using getBalance()

  // TODO: Convert lamports to SOL and return
  return 0;
}`,
    solutionCode: `import { Connection, PublicKey } from "@solana/web3.js";

export async function getBalance(address: string): Promise<number> {
  const connection = new Connection("https://api.devnet.solana.com");
  const pubkey = new PublicKey(address);
  const lamports = await connection.getBalance(pubkey);
  return lamports / 1e9; // convert lamports to SOL
}`,
    content: [
      p("Time to interact with Devnet for real. You'll write a TypeScript function that connects to Solana and reads an account balance."),
      h2("The Connection Object"),
      p("Everything starts with a Connection. It's your RPC gateway to a Solana cluster."),
      code(`import { Connection, PublicKey } from "@solana/web3.js";

// Connect to devnet
const connection = new Connection("https://api.devnet.solana.com");

// Or use a dedicated RPC (faster, higher rate limits):
// const connection = new Connection("https://devnet.helius-rpc.com/?api-key=YOUR_KEY");`, "typescript"),
      h2("Reading Balances"),
      code(`const pubkey = new PublicKey("YOUR_WALLET_ADDRESS");

// Returns balance in lamports (1 SOL = 1,000,000,000 lamports)
const lamports = await connection.getBalance(pubkey);
const sol = lamports / 1e9;
console.log(\`Balance: \${sol} SOL\`);`, "typescript"),
      h2("Your Task"),
      p("Complete the getBalance function in the editor. It should: connect to devnet, parse the address into a PublicKey, fetch the balance, convert from lamports to SOL, and return the SOL amount."),
    ],
  },
  {
    id: "lesson-what-is-anchor",
    content: [
      p("Anchor is the de-facto framework for Solana development. It handles the boilerplate so you can focus on business logic."),
      h2("What Anchor Does"),
      ...ul([
        "Generates account validation code from attribute macros (#[account(...)]) ",
        "Auto-generates IDL (Interface Definition Language) for client SDKs",
        "Provides safe CPI (Cross-Program Invocation) helpers",
        "Includes a testing framework built on Mocha/Chai",
        "Adds discriminators to prevent account confusion attacks",
      ]),
      h2("A Minimal Anchor Program"),
      code(`use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, message: String) -> Result<()> {
        let account = &mut ctx.accounts.greeting;
        account.message = message;
        account.author = ctx.accounts.user.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Greeting::SPACE
    )]
    pub greeting: Account<'info, Greeting>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Greeting {
    pub message: String,
    pub author: Pubkey,
}

impl Greeting {
    const SPACE: usize = 4 + 200 + 32; // string prefix + max chars + pubkey
}`, "rust"),
      h2("The #[program] Macro"),
      p("Every public function in the #[program] module becomes a callable instruction. The first argument is always a Context<T> where T is an Accounts struct. The context gives you access to all validated accounts."),
      h2("The #[derive(Accounts)] Macro"),
      p("This generates all the deserialization and validation code. Every field is an account. Anchor checks ownership, discriminators, signer status, mutability — all from the attribute constraints you write."),
    ],
  },
  {
    id: "lesson-challenge-first-anchor",
    starterCode: `use anchor_lang::prelude::*;

declare_id!("PLACEHOLDER");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set the counter's count to 0
        // TODO: Set the counter's authority to the user's public key
        todo!()
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the counter's count by 1
        // Hint: use checked_add to prevent overflow
        todo!()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Counter::SPACE
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

impl Counter {
    const SPACE: usize = 8 + 32; // u64 + Pubkey
}`,
    solutionCode: `use anchor_lang::prelude::*;

declare_id!("PLACEHOLDER");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.user.key();
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + Counter::SPACE)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

impl Counter {
    const SPACE: usize = 8 + 32;
}`,
    content: [
      p("Build your first Anchor program: a counter with owner-gated increment. This is the 'Hello World' of Solana programs."),
      h2("Your Task"),
      p("Complete two instructions in the counter program:"),
      ...ul([
        "initialize — create a Counter account, set count to 0, set authority to the user's pubkey",
        "increment — increment count by 1, but only if the signer is the authority",
      ]),
      h2("Key Concepts"),
      p("The has_one = authority constraint on the Increment struct automatically verifies that counter.authority == authority.key(). You don't write this check manually — Anchor does it."),
      code(`// Anchor generates this check for free:
// #[account(has_one = authority)]
// expands to:
if counter.authority != authority.key() {
    return Err(ErrorCode::ConstraintHasOne.into());
}`, "rust"),
      p("Use checked_add for arithmetic to prevent integer overflow. In production Solana programs, overflow is a critical vulnerability."),
    ],
  },
  {
    id: "lesson-program-derived-addresses-v2",
    content: [
      p("Program Derived Addresses are one of the most powerful concepts in Solana. They let your program own accounts in a deterministic, keyless way."),
      h2("What is a PDA?"),
      p("A PDA is a public key that is derived from seeds + a program ID, and falls OFF the ed25519 elliptic curve. This means no one has the private key — the program itself can sign for it using the seeds."),
      code(`// Derive a PDA:
const [pda, bump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("user-stats"),
    userPubkey.toBuffer(),
  ],
  programId
);

// The 'bump' is a nonce (0-255) that pushes the address off the curve
// findProgramAddress finds the canonical bump automatically`, "typescript"),
      h2("In Anchor"),
      code(`#[derive(Accounts)]
pub struct CreateUserStats<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserStats::SPACE,
        seeds = [b"user-stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}`, "rust"),
      h2("Why PDAs?"),
      ...ul([
        "Deterministic — given the same seeds, you always get the same address. No need to store it.",
        "Owned by your program — only your program can modify the account.",
        "Can sign CPIs — your program can invoke other programs on behalf of a PDA.",
        "No private key — eliminates a whole class of key management vulnerabilities.",
      ]),
      h2("Canonical Bump"),
      p("findProgramAddress searches for the highest bump value (starting from 255) that produces a valid off-curve address. Always store this bump in your account and use it on subsequent calls — deriving it repeatedly is expensive."),
    ],
  },
];

async function patch(mutations) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  console.log(`Patching ${LESSONS.length} lessons...`);

  for (const lesson of LESSONS) {
    const patch_ops = {};
    if (lesson.content) patch_ops.content = lesson.content;
    if (lesson.starterCode) patch_ops.starterCode = lesson.starterCode;
    if (lesson.solutionCode) patch_ops.solutionCode = lesson.solutionCode;

    try {
      await patch([{ patch: { id: lesson.id, set: patch_ops } }]);
      console.log(`✓ ${lesson.id}`);
    } catch (e) {
      console.error(`✗ ${lesson.id}: ${e.message}`);
    }
  }

  console.log("Done.");
}

main();
