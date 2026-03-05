import { registerLessonContent } from "./courses-i18n";

// ═══════════════════════════════════════════════════════════════
// English translations — Courses 4, 5, 6
// ═══════════════════════════════════════════════════════════════

registerLessonContent("en", {
  // ── Course 4: Solana CLI Workshop ─────────────────────────────

  "cli-l1": {
    content: `# Installing the Solana CLI

The **Solana CLI** is the official command-line tool for interacting with the Solana blockchain. With it you can create wallets, send transactions, deploy programs and much more.

## Installation on macOS and Linux

The simplest way is using the official installation script from Anza (maintainer of the Agave validator):

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

This script downloads precompiled binaries and installs them to \`~/.local/share/solana/install/active_release/bin\`.

### Configuring the PATH

After installation, add the directory to your PATH. Edit your \`~/.bashrc\`, \`~/.zshrc\` or equivalent:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Reload your terminal:

\`\`\`bash
source ~/.zshrc   # or ~/.bashrc
\`\`\`

## Installation on Windows

On Windows, open **PowerShell** as administrator and run:

\`\`\`powershell
cmd /c "curl https://release.anza.xyz/stable/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\\solana-install-tmp\\solana-install-init.exe --create-dirs"
C:\\solana-install-tmp\\solana-install-init.exe stable
\`\`\`

Alternatively, use **WSL2** (Windows Subsystem for Linux) and follow the Linux instructions.

## Verifying the installation

Confirm everything is working:

\`\`\`bash
solana --version
# solana-cli 1.18.x (src:xxxxxxx; feat:xxxxxxxxxx, client:Agave)
\`\`\`

Other useful verification commands:

\`\`\`bash
solana-keygen --version
solana-test-validator --version
\`\`\`

## Updating

To update to the latest version:

\`\`\`bash
solana-install update
\`\`\`

## Troubleshooting

- **Command not found**: check that the PATH is configured correctly
- **Permission denied**: on Linux/macOS, do not use \`sudo\` — installation is in the user directory
- **Old version**: run \`solana-install update\` to update
- **WSL2 on Windows**: if you have issues with the native installer, prefer WSL2
- **Firewall/proxy**: the script needs to access \`release.anza.xyz\` — make sure your firewall allows it`,
    exerciseQuestion:
      "Which command verifies that the Solana CLI was installed correctly?",
    exerciseOptions: [
      "solana check",
      "solana --version",
      "solana verify",
      "solana-install status",
    ],
  },

  "cli-l2": {
    content: `# Configuring the Network

Solana has **three main networks** (clusters) and the CLI lets you switch between them easily.

## Available clusters

| Cluster | URL | Usage |
|---|---|---|
| **Devnet** | \`https://api.devnet.solana.com\` | Development and testing |
| **Testnet** | \`https://api.testnet.solana.com\` | Validator testing |
| **Mainnet-beta** | \`https://api.mainnet-beta.solana.com\` | Production |

## Setting the cluster

Use the \`solana config set\` command with the \`-u\` (or \`--url\`) flag:

\`\`\`bash
# Connect to devnet (recommended for development)
solana config set -u devnet

# Connect to testnet
solana config set -u testnet

# Connect to mainnet
solana config set -u mainnet-beta

# Use full URL
solana config set --url https://api.devnet.solana.com
\`\`\`

## Custom RPCs

Solana's public RPCs have strict **rate limits**. For serious development, use a dedicated RPC provider:

### Helius

\`\`\`bash
solana config set --url https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
\`\`\`

### QuickNode

\`\`\`bash
solana config set --url https://your-endpoint.solana-devnet.quiknode.pro/TOKEN/
\`\`\`

### Triton (via Alchemy)

\`\`\`bash
solana config set --url https://solana-devnet.g.alchemy.com/v2/YOUR_KEY
\`\`\`

## Checking the current configuration

\`\`\`bash
solana config get
\`\`\`

Expected output:

\`\`\`
Config File: /home/user/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /home/user/.config/solana/id.json
Commitment: confirmed
\`\`\`

## Tip: Localhost

For local testing, run the test validator and configure:

\`\`\`bash
solana-test-validator  # in another terminal
solana config set -u localhost
# URL will be http://127.0.0.1:8899
\`\`\`

The local validator is **much faster** and has no rate limits — ideal for iterative development.`,
    exerciseQuestion:
      "Which cluster is most recommended for development and testing on Solana?",
    exerciseOptions: [
      "Mainnet-beta, since it is the real environment",
      "Testnet, since it is exclusive for testing",
      "Devnet, since it is designed for development with free SOL",
      "Localhost, since it is the only free option",
    ],
  },

  "cli-l3": {
    content: `# Keypairs and Wallets

On Solana, every account is identified by a **cryptographic key pair** (keypair): a public key (address) and a private key (for signing transactions).

## Generating a new keypair

\`\`\`bash
solana-keygen new
\`\`\`

This command:

1. Generates an Ed25519 key pair
2. Asks for a **passphrase** (optional but recommended)
3. Shows the **seed phrase** (12 or 24 words) — **write it down and keep it safe!**
4. Saves the keypair to \`~/.config/solana/id.json\`

Expected output:

\`\`\`
Generating a new keypair
For added security, enter a BIP39 passphrase
NOTE! This passphrase improves security of the recovery seed phrase
BIP39 Passphrase (empty for none):
Wrote new keypair to /home/user/.config/solana/id.json
=============================================================
pubkey: 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
=============================================================
Save this seed phrase to recover your keypair:
word1 word2 word3 ... word12
=============================================================
\`\`\`

## Saving to another file

Use the \`--outfile\` flag to generate keypairs in specific locations:

\`\`\`bash
solana-keygen new --outfile ~/wallets/my-wallet.json
solana-keygen new --outfile ./deploy-keypair.json
\`\`\`

## Vanity (custom) addresses

The \`grind\` command lets you generate addresses starting with a specific prefix:

\`\`\`bash
# Generate address starting with "Sol"
solana-keygen grind --starts-with Sol:1

# Generate address starting with "ABC"
solana-keygen grind --starts-with ABC:1
\`\`\`

> **Note**: the longer the prefix, the more time it takes. 3 characters may take seconds, 5+ may take hours.

## Displaying the public address

\`\`\`bash
# Address of the default keypair
solana address

# Address of a specific file
solana address -k ~/wallets/my-wallet.json

# Verify a complete keypair
solana-keygen verify <PUBKEY> ~/wallets/my-wallet.json
\`\`\`

## Recovering from a seed phrase

\`\`\`bash
solana-keygen recover --outfile ~/wallets/recovered.json
# Paste the seed phrase when prompted
\`\`\`

## Security best practices

- **Never share** your private key or seed phrase
- **Never commit** keypair \`.json\` files to Git (add to \`.gitignore\`)
- Use a **passphrase** to add an extra layer of protection
- For production, consider **hardware wallets** (Ledger)
- Keep **backups** of your seed phrase in a safe, offline location
- Use different keypairs for **development** and **production**`,
    exerciseQuestion:
      "Which flag of solana-keygen new lets you save the keypair to a specific file?",
    exerciseOptions: ["--file", "--output", "--outfile", "--save-to"],
  },

  "cli-l4": {
    content: `# Airdrop and Balances

On the Solana **devnet** and **testnet**, you can request free SOL for testing using **airdrop**. This is essential for development since every transaction requires SOL to pay fees.

## Requesting an airdrop

\`\`\`bash
# Request 2 SOL (default)
solana airdrop 2

# Request 1 SOL
solana airdrop 1

# Airdrop to a specific address
solana airdrop 2 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
\`\`\`

> **Note**: airdrop only works on **devnet** and **testnet**. On mainnet, you need to buy SOL.

## Checking balance

\`\`\`bash
# Balance of the default keypair
solana balance

# Balance of a specific address
solana balance 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7

# Balance in lamports
solana balance --lamports
\`\`\`

## Lamports: the smallest unit

Just as Bitcoin has satoshis and Ethereum has wei, Solana uses **lamports**:

| Unit | Value |
|---|---|
| 1 SOL | 1,000,000,000 lamports |
| 1 lamport | 0.000000001 SOL |

\`\`\`bash
# The constant in code
LAMPORTS_PER_SOL = 1_000_000_000
\`\`\`

In practice:

\`\`\`
2.5 SOL = 2_500_000_000 lamports
0.001 SOL = 1_000_000 lamports
Typical fee = 5_000 lamports = 0.000005 SOL
\`\`\`

## Airdrop rate limits

The public devnet faucet has limits:

- **Maximum per request**: 2 SOL (on devnet) or 1 SOL (on testnet)
- **Cooldown**: there may be a wait between consecutive requests
- **IP-based**: the rate limit is per IP address

### Alternatives when the faucet is congested

1. **Web faucet**: [faucet.solana.com](https://faucet.solana.com)
2. **Local validator**: \`solana-test-validator\` — unlimited SOL, no rate limits
3. **Programmatic**: use \`connection.requestAirdrop()\` in code

\`\`\`bash
# If the airdrop fails, try the local validator
solana-test-validator &
solana config set -u localhost
solana airdrop 100  # works without limits on localhost
\`\`\`

## Checking full account info

To see all the details of an account:

\`\`\`bash
solana account <ADDRESS>
\`\`\`

This shows: balance, owner, data size, whether it is executable, and the rent epoch.`,
    exerciseQuestion: "How many lamports equal 1 SOL?",
    exerciseOptions: [
      "1,000,000 (one million)",
      "1,000,000,000 (one billion)",
      "100,000,000 (one hundred million)",
      "10,000,000,000 (ten billion)",
    ],
  },

  "cli-l5": {
    content: `# Transferring SOL

Transferring SOL is one of the most fundamental operations on the Solana blockchain. Let's learn how to do it both through the CLI and programmatically.

## Transfer via CLI

The \`solana transfer\` command sends SOL from your default wallet to another address:

\`\`\`bash
# Basic syntax
solana transfer <RECIPIENT> <AMOUNT>

# Example: send 0.5 SOL
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5

# With verbose confirmation
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5 --verbose
\`\`\`

## Verifying the transaction

After the transfer, the CLI returns a **signature** (signature/txid):

\`\`\`bash
# Check transaction status
solana confirm <SIGNATURE>

# View full details
solana transaction-history <ADDRESS>
\`\`\`

## Useful flags

\`\`\`bash
# Use a specific keypair as sender
solana transfer <DEST> 1 --keypair ~/wallets/other-wallet.json

# Allow funding of the fee payer
solana transfer <DEST> 1 --allow-unfunded-recipient

# Transfer all SOL (leaving 0)
solana transfer <DEST> ALL
\`\`\`

## Programmatic transfer (TypeScript)

Using \`@solana/web3.js\`, the transfer follows these steps:

1. Create a **Connection** to the cluster
2. Build the **instruction** via \`SystemProgram.transfer\`
3. Add the instruction to a **Transaction**
4. **Sign and send** with \`sendAndConfirmTransaction\`

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

async function transferSOL() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sender = Keypair.generate();

  // Airdrop to the sender
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  const receiver = Keypair.generate();

  // Create transfer instruction
  const instruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  // Build and send transaction
  const tx = new Transaction().add(instruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log('Transaction confirmed:', sig);
}
\`\`\`

## Understanding the signature

Every transaction on Solana generates a **unique signature** (base58, 88 characters). This signature serves as:

- **Unique identifier** of the transaction
- **Cryptographic proof** that the sender authorized it
- **Lookup key** on the Explorer`,
    exerciseQuestion:
      "Which Solana program is responsible for native SOL transfers?",
    exerciseOptions: [
      "Token Program",
      "System Program",
      "Associated Token Account Program",
      "Stake Program",
    ],
    challengePrompt:
      "Complete the TypeScript script that transfers 0.5 SOL from the sender to the receiver on devnet and prints the transaction signature.",
  },

  "cli-l6": {
    content: `# Exploring Transactions

After sending a transaction, it is essential to know how to **verify, explore and debug** what happened on-chain. Solana provides tools via CLI and web interfaces.

## Confirming transactions via CLI

\`\`\`bash
# Check if a transaction was confirmed
solana confirm <SIGNATURE>

# Example
solana confirm 5VGR...abc123
# Returns: Confirmed / Finalized / Not found
\`\`\`

The confirmation levels in Solana:

- **processed**: received by the current leader (~400ms)
- **confirmed**: voted by a supermajority of validators (~1s)
- **finalized**: 31+ slots after confirmed — irreversible (~12s)

## Solana Explorer

The [Solana Explorer](https://explorer.solana.com) is the official web interface for exploring transactions, accounts and blocks.

### Searching for a transaction

1. Go to [explorer.solana.com](https://explorer.solana.com)
2. Select the correct network (Devnet, Testnet or Mainnet)
3. Paste the transaction **signature** in the search bar

### Available information

A transaction page shows:

- **Status**: Success or Failed
- **Slot and timestamp**: when it was processed
- **Fee**: fee paid in lamports
- **Signers**: who signed the transaction
- **Instructions**: list of executed instructions
- **Logs**: program log messages
- **Accounts**: accounts read and written

## Exploring accounts via CLI

\`\`\`bash
# View account details
solana account <ADDRESS>

# Output includes:
# - Balance (lamports and SOL)
# - Owner (program that owns the account)
# - Data Length (bytes of stored data)
# - Executable (whether it is a program)
\`\`\`

## Transaction history

\`\`\`bash
# Recent transactions for an address
solana transaction-history <ADDRESS>

# With limit
solana transaction-history <ADDRESS> --limit 5
\`\`\`

## Program logs

To view detailed logs of a transaction:

\`\`\`bash
solana logs             # real-time log stream
solana logs <PROGRAM>   # logs only for a specific program
\`\`\`

Log example:

\`\`\`
Program 11111111111111111111111111111111 invoke [1]
Program 11111111111111111111111111111111 success
\`\`\`

## Alternative explorers

- **Solscan**: [solscan.io](https://solscan.io) — rich interface with analytics
- **SolanaFM**: [solana.fm](https://solana.fm) — advanced instruction decoding
- **XRAY**: [xray.helius.xyz](https://xray.helius.xyz) — detailed visualization by Helius

Each explorer has strengths — Solscan is great for tokens, SolanaFM for decoding complex programs, and XRAY for DeFi transactions.`,
    exerciseQuestion:
      "Which confirmation level in Solana guarantees that the transaction is irreversible?",
    exerciseOptions: ["processed", "confirmed", "finalized", "committed"],
  },

  // ── Course 5: Rust for Solana ─────────────────────────────────

  "rs-l1": {
    content: `# Why Rust for Solana?

Rust is the **primary** language for writing on-chain programs on Solana. But why did Solana Labs choose Rust? Let's understand the technical and practical reasons.

## Memory safety

Rust guarantees **memory safety at compile time** — no null pointers, no buffer overflows, no data races. This is **critical** for smart contracts where bugs can cost millions:

\`\`\`rust
// Rust does NOT allow null pointers
// Instead, it uses Option<T>
let valor: Option<u64> = Some(42);
let nenhum: Option<u64> = None;

// You are REQUIRED to handle the None
match valor {
    Some(v) => println!("Valor: {}", v),
    None => println!("Sem valor"),
}
\`\`\`

## Performance without a garbage collector

Rust has no **garbage collector (GC)**. Memory is managed by the **ownership** system at compile time:

- **Zero overhead**: no GC pauses (unlike Go, Java or JavaScript)
- **Predictable**: deterministic execution time — essential for blockchain
- **Efficient**: fine-grained control over allocation and memory layout

\`\`\`
Linguagem    | GC?   | Performance | Segurança
-------------|-------|-------------|----------
C/C++        | Não   | Alta        | Baixa
Java/Go      | Sim   | Média       | Média
Rust         | Não   | Alta        | Alta ✓
JavaScript   | Sim   | Baixa       | Média
\`\`\`

## Comparison with other languages

### Rust vs Solidity

| Aspect | Rust (Solana) | Solidity (Ethereum) |
|---|---|---|
| Execution model | Reusable on-chain program | Contract with its own state |
| Speed | ~65k TPS | ~15 TPS |
| Average cost | < $0.001 | $1 – $50+ |
| Ecosystem | Growing rapidly | Mature |

### Rust vs Move (Aptos/Sui)

Move is a blockchain-specific language, while Rust is **general-purpose** — meaning:

- More developers already know Rust
- Mature libraries and tooling (cargo, crates.io)
- Transferable skills to other projects

## The Solana ecosystem with Rust

In practice, Solana programs in Rust use the **Anchor** framework (from intermediate level):

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Programa inicializado!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\`

## Conclusion

Rust offers the ideal combination for blockchain: **safety + performance + no GC**. Learning Rust is an investment that goes beyond Solana — it is one of the most loved languages in the world for 8 consecutive years in the Stack Overflow Survey.`,
    exerciseQuestion:
      "What is the main advantage of Rust not having a garbage collector for on-chain programs?",
    exerciseOptions: [
      "The code is smaller",
      "No compilation needed",
      "Deterministic execution without unpredictable pauses",
      "Allows the use of null pointers for optimization",
    ],
  },

  "rs-l2": {
    content: `# Variables and Types in Rust

Let's learn the fundamentals of variables and types in Rust, which form the foundation for every Solana program.

## Declaring variables

In Rust, variables are **immutable by default**:

\`\`\`rust
let x = 5;      // immutable
// x = 10;      // ERROR! cannot reassign

let mut y = 5;  // mutable
y = 10;         // OK
\`\`\`

This design decision encourages immutability, reducing bugs — especially important in smart contracts.

## Numeric types

Rust has explicitly sized integer types:

\`\`\`rust
// Signed integers
let a: i8 = -128;       // -128 to 127
let b: i16 = -32768;    // -32768 to 32767
let c: i32 = 42;        // default for integers
let d: i64 = 1_000_000; // underscores for readability

// Unsigned integers — widely used in Solana!
let e: u8 = 255;
let f: u32 = 100_000;
let g: u64 = 1_000_000_000; // lamports are u64!
let h: u128 = 340_282_366_920_938_463_463;

// Floating point
let pi: f64 = 3.14159;
let taxa: f32 = 0.01;
\`\`\`

> **On Solana**: balances use \`u64\` (lamports), timestamps use \`i64\`, and high-precision calculations use \`u128\`.

## Strings

Rust has two main string types:

\`\`\`rust
// String — heap-allocated, mutable
let mut nome = String::from("Solana");
nome.push_str(" é incrível!");

// &str — string reference (string slice), immutable
let saudacao: &str = "Olá, mundo!";

// Conversion
let s: String = saudacao.to_string();
let slice: &str = &s;
\`\`\`

## Type inference

The Rust compiler usually infers the type:

\`\`\`rust
let x = 42;           // infers i32
let y = 3.14;         // infers f64
let nome = "Solana";  // infers &str
let ativo = true;     // infers bool
\`\`\`

## Shadowing

Rust allows **redeclaring** a variable with the same name:

\`\`\`rust
let x = 5;
let x = x + 1;    // shadowing: x is now 6
let x = x * 2;    // x is now 12

// Shadowing allows changing the type!
let spaces = "   ";        // &str
let spaces = spaces.len(); // usize — same name, different type
\`\`\`

## Constants

Constants are **always immutable** and require an explicit type:

\`\`\`rust
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const MAX_ACCOUNTS: usize = 32;
const PROGRAM_NAME: &str = "meu_programa";
\`\`\`

Differences from \`let\`:

- Must have an explicit type
- Must be initialized with a constant value (no function calls)
- Convention: SCREAMING_SNAKE_CASE
- Global or local scope

## Tuples and Arrays

\`\`\`rust
// Tuple — heterogeneous types
let info: (u64, &str, bool) = (1_000_000, "SOL", true);
let saldo = info.0;  // 1_000_000

// Array — fixed size, homogeneous type
let seeds: [u8; 4] = [1, 2, 3, 4];
let zeros = [0u8; 32]; // 32 zeroed bytes — common in Solana
\`\`\``,
    exerciseQuestion:
      "Which numeric type is used to represent balances in lamports on Solana?",
    exerciseOptions: ["i32", "f64", "u64", "u8"],
  },

  "rs-l3": {
    content: `# Ownership and Borrowing

The **ownership** system is the most unique concept in Rust. It guarantees memory safety without a garbage collector — and understanding it is essential for Solana programs.

## The three rules of ownership

1. Each value in Rust has **a single owner**
2. There can only be **one owner at a time**
3. When the owner goes out of scope, the value is **dropped**

\`\`\`rust
{
    let s = String::from("hello"); // s is the owner of "hello"
    // s is valid here
} // s goes out of scope — memory is freed automatically
\`\`\`

## Move semantics

When you assign a value to another variable, ownership is **transferred** (moved):

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;  // s1 was MOVED to s2

// println!("{}", s1); // ERROR! s1 is no longer valid
println!("{}", s2);    // OK
\`\`\`

This prevents **double-free** — a classic bug in C/C++.

## References (borrowing)

To use a value without transferring ownership, use **references**:

\`\`\`rust
fn calcular_tamanho(s: &String) -> usize {
    s.len()
    // s is just a reference — it is not dropped here
}

let s1 = String::from("hello");
let tamanho = calcular_tamanho(&s1); // borrows s1
println!("{} tem {} bytes", s1, tamanho); // s1 is still valid!
\`\`\`

### Immutable references (\`&T\`)

You can have **multiple immutable references** simultaneously:

\`\`\`rust
let s = String::from("Solana");
let r1 = &s;
let r2 = &s;
println!("{} e {}", r1, r2); // OK — multiple immutable refs
\`\`\`

### Mutable references (\`&mut T\`)

Only **one mutable reference** at a time:

\`\`\`rust
let mut s = String::from("hello");
let r1 = &mut s;
// let r2 = &mut s; // ERROR! cannot have two &mut at the same time
r1.push_str(" world");
println!("{}", r1);
\`\`\`

**Fundamental rule**: immutable references OR one mutable reference — never both.

## Clone and Copy

### Clone — explicit copy (heap)

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1.clone(); // deep copy
println!("{} e {}", s1, s2); // both valid
\`\`\`

### Copy — implicit copy (stack)

Simple types implement \`Copy\` and are copied automatically:

\`\`\`rust
let x: u64 = 42;
let y = x;  // copies, does not move
println!("{} e {}", x, y); // both valid

// Types that implement Copy:
// i8, i16, i32, i64, u8, u16, u32, u64
// f32, f64, bool, char
// Tuples of Copy types
\`\`\`

## Lifetimes (introduction)

Lifetimes ensure that references do not outlive the data they refer to:

\`\`\`rust
fn maior<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}
\`\`\`

The \`'a\` tells the compiler: "the returned reference lives at least as long as s1 and s2".

## Why does this matter for Solana?

On Solana, accounts are passed as references (\`&AccountInfo\`). Understanding borrowing is essential for:

- Reading account data (\`&account.data.borrow()\`)
- Modifying data (\`&mut account.data.borrow_mut()\`)
- Avoiding "already borrowed" errors in CPIs`,
    exerciseQuestion:
      "What happens when you assign a String to another variable in Rust?",
    exerciseOptions: [
      "The value is copied automatically",
      "Ownership is transferred (move) and the original variable becomes invalid",
      "Both variables point to the same data",
      "The compiler creates a reference automatically",
    ],
  },

  "rs-l4": {
    content: `# Structs and Enums

Structs and enums are the fundamental composite types in Rust. On Solana, they are used extensively to define **accounts**, **instructions** and **errors**.

## Structs

Structs group related data:

\`\`\`rust
// Definition
struct ContaSolana {
    pubkey: String,
    saldo: u64,
    executavel: bool,
}

// Instantiation
let conta = ContaSolana {
    pubkey: String::from("7nHfER..."),
    saldo: 1_000_000_000,
    executavel: false,
};

// Access
println!("Saldo: {} lamports", conta.saldo);
\`\`\`

### impl blocks

Methods and associated functions are defined in \`impl\` blocks:

\`\`\`rust
impl ContaSolana {
    // Associated function (constructor) — called with ::
    fn new(pubkey: String, saldo: u64) -> Self {
        Self {
            pubkey,
            saldo,
            executavel: false,
        }
    }

    // Method — receives &self
    fn saldo_em_sol(&self) -> f64 {
        self.saldo as f64 / 1_000_000_000.0
    }

    // Mutable method — receives &mut self
    fn depositar(&mut self, lamports: u64) {
        self.saldo += lamports;
    }
}

let mut conta = ContaSolana::new("7nHfER...".into(), 0);
conta.depositar(2_000_000_000);
println!("Saldo: {} SOL", conta.saldo_em_sol()); // 2.0
\`\`\`

### Structs in Anchor

On Solana with Anchor, structs define the account layout:

\`\`\`rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,  // 32 bytes
    pub xp: u64,           // 8 bytes
    pub level: u8,         // 1 byte
    pub name: String,      // 4 + len bytes
}
\`\`\`

## Enums

Enums represent a value that can be **one of several variants**:

\`\`\`rust
enum Dificuldade {
    Iniciante,
    Intermediario,
    Avancado,
}

let nivel = Dificuldade::Intermediario;
\`\`\`

### Enums with data

Variants can carry data:

\`\`\`rust
enum Instrucao {
    Transferir { destino: String, lamports: u64 },
    CriarConta(u64), // space in bytes
    FecharConta,
}

let ix = Instrucao::Transferir {
    destino: "9aE4...".into(),
    lamports: 500_000_000,
};
\`\`\`

## Option<T>

\`Option\` is a built-in enum for optional values (replaces \`null\`):

\`\`\`rust
enum Option<T> {
    Some(T),
    None,
}

let freeze_authority: Option<Pubkey> = None;
let mint_authority: Option<Pubkey> = Some(my_pubkey);

// Accessing
if let Some(auth) = mint_authority {
    println!("Authority: {}", auth);
}
\`\`\`

## Result<T, E>

\`Result\` is the standard enum for error handling:

\`\`\`rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Divisão por zero!"))
    } else {
        Ok(a / b)
    }
}

match dividir(10.0, 3.0) {
    Ok(resultado) => println!("Resultado: {}", resultado),
    Err(erro) => println!("Erro: {}", erro),
}
\`\`\`

On Solana, **all instruction functions return \`Result<()>\`**:

\`\`\`rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // logic...
    Ok(())
}
\`\`\``,
    exerciseQuestion:
      "Which Rust type replaces the concept of null found in other languages?",
    exerciseOptions: ["Result<T, E>", "Option<T>", "Null<T>", "Maybe<T>"],
  },

  "rs-l5": {
    content: `# Pattern Matching

Pattern matching is one of the most powerful features of Rust. It lets you destructure and compare values in an expressive and safe way.

## match

The \`match\` expression compares a value against several **patterns**:

\`\`\`rust
let nivel: u8 = 5;

let titulo = match nivel {
    0..=2 => "Iniciante",
    3..=5 => "Intermediário",
    6..=9 => "Avançado",
    10 => "Mestre",
    _ => "Desconhecido", // _ catches everything else
};

println!("Nível {}: {}", nivel, titulo);
\`\`\`

### Match with enums

\`\`\`rust
enum StatusTransacao {
    Pendente,
    Confirmada(u64),  // slot number
    Falhou(String),   // error message
}

let status = StatusTransacao::Confirmada(285_000_000);

match status {
    StatusTransacao::Pendente => println!("Aguardando..."),
    StatusTransacao::Confirmada(slot) => {
        println!("Confirmada no slot {}", slot);
    }
    StatusTransacao::Falhou(msg) => {
        println!("Falhou: {}", msg);
    }
}
\`\`\`

> **Important**: \`match\` in Rust is **exhaustive** — you must cover all possible cases or use \`_\` as a fallback.

### Match with Option and Result

\`\`\`rust
let saldo: Option<u64> = Some(1_000_000_000);

match saldo {
    Some(lamports) if lamports > 0 => {
        println!("Saldo: {} SOL", lamports as f64 / 1e9);
    }
    Some(_) => println!("Saldo zero"),
    None => println!("Conta não encontrada"),
}
\`\`\`

## if let

For when you only care about **one pattern**:

\`\`\`rust
let authority: Option<String> = Some("7nHfER...".into());

// Instead of a full match:
if let Some(auth) = authority {
    println!("Authority: {}", auth);
} else {
    println!("Sem authority");
}
\`\`\`

## while let

A loop that continues as long as the pattern matches:

\`\`\`rust
let mut stack: Vec<u64> = vec![1, 2, 3, 4, 5];

while let Some(valor) = stack.pop() {
    println!("Processando: {}", valor);
}
// Prints: 5, 4, 3, 2, 1
\`\`\`

## Destructuring

Destructure structs and tuples:

\`\`\`rust
struct TransferInfo {
    de: String,
    para: String,
    lamports: u64,
}

let tx = TransferInfo {
    de: "Alice".into(),
    para: "Bob".into(),
    lamports: 500_000_000,
};

// Destructuring in declaration
let TransferInfo { de, para, lamports } = tx;
println!("{} enviou {} lamports para {}", de, lamports, para);

// Tuple destructuring
let (x, y, z) = (1, 2, 3);
\`\`\`

## Loops and Iterators

\`\`\`rust
// for with range
for i in 0..10 {
    println!("Iteração {}", i);
}

// Iterators with closures
let numeros = vec![1, 2, 3, 4, 5];

let dobrados: Vec<u64> = numeros
    .iter()
    .map(|n| n * 2)
    .collect();
// [2, 4, 6, 8, 10]

let soma: u64 = numeros.iter().sum();
// 15

let pares: Vec<&u64> = numeros
    .iter()
    .filter(|n| *n % 2 == 0)
    .collect();
// [2, 4]
\`\`\`

Iterators are **lazy** — they do not execute until consumed (by \`collect\`, \`sum\`, \`for_each\`, etc).`,
    exerciseQuestion:
      "What happens if a match in Rust does not cover all possible cases?",
    exerciseOptions: [
      "It returns None automatically",
      "The compiler emits an error requiring all cases to be covered",
      "It executes the first arm by default",
      "It throws a runtime exception",
    ],
  },

  "rs-l6": {
    content: `# Traits and Generics

Traits define **shared behaviors** between types. Generics let you write code that works with **multiple types**. Together, they are the foundation of abstraction in Rust.

## Defining a trait

\`\`\`rust
trait Descritivel {
    fn descricao(&self) -> String;

    // Method with default implementation
    fn resumo(&self) -> String {
        format!("(Veja mais: {})", self.descricao())
    }
}
\`\`\`

## Implementing traits

\`\`\`rust
struct Curso {
    titulo: String,
    xp: u64,
}

impl Descritivel for Curso {
    fn descricao(&self) -> String {
        format!("{} ({} XP)", self.titulo, self.xp)
    }
    // resumo() uses the default implementation
}

let curso = Curso {
    titulo: "Rust para Solana".into(),
    xp: 280,
};
println!("{}", curso.descricao()); // "Rust para Solana (280 XP)"
println!("{}", curso.resumo());    // "(Veja mais: Rust para Solana (280 XP))"
\`\`\`

## Common standard library traits

\`\`\`rust
use std::fmt;

// Display — how the value appears with println!("{}")
impl fmt::Display for Curso {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Curso: {} | {} XP", self.titulo, self.xp)
    }
}

// Debug — format for debugging with {:?}
#[derive(Debug)]
struct Config {
    rpc_url: String,
    commitment: String,
}

let cfg = Config {
    rpc_url: "https://api.devnet.solana.com".into(),
    commitment: "confirmed".into(),
};
println!("{:?}", cfg);
// Config { rpc_url: "https://api.devnet.solana.com", commitment: "confirmed" }
\`\`\`

### Derive macros

Derive macros implement traits automatically:

\`\`\`rust
#[derive(Debug, Clone, PartialEq)]
struct Token {
    symbol: String,
    decimals: u8,
    supply: u64,
}
\`\`\`

In Anchor, derive macros are essential:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_deposited: u64,
}
\`\`\`

## Generics

Generics let you parameterize types:

\`\`\`rust
// Generic function
fn maior<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

let x = maior(10, 20);       // T = i32
let y = maior(3.14, 2.71);   // T = f64
\`\`\`

### Generic struct

\`\`\`rust
struct Resultado<T> {
    valor: T,
    slot: u64,
    timestamp: i64,
}

let saldo = Resultado {
    valor: 1_500_000_000u64,
    slot: 285_000_000,
    timestamp: 1700000000,
};

let nome = Resultado {
    valor: String::from("Solana Academy"),
    slot: 285_000_000,
    timestamp: 1700000000,
};
\`\`\`

## Trait bounds

Restrict which types can be used with generics:

\`\`\`rust
// Syntax with :
fn imprimir<T: fmt::Display>(valor: T) {
    println!("Valor: {}", valor);
}

// Syntax with where (more readable with multiple bounds)
fn processar<T>(item: T)
where
    T: fmt::Display + Clone + PartialOrd,
{
    let copia = item.clone();
    println!("Original: {}, Cópia: {}", item, copia);
}
\`\`\`

## Traits as parameters

\`\`\`rust
// Accepts any type that implements Descritivel
fn mostrar(item: &impl Descritivel) {
    println!("{}", item.descricao());
}

// Equivalent with trait bound
fn mostrar_v2<T: Descritivel>(item: &T) {
    println!("{}", item.descricao());
}
\`\`\`

Traits and generics are the foundation of the **Anchor framework**: macros like \`#[derive(Accounts)]\` generate trait implementations that perform automatic account validation.`,
    exerciseQuestion:
      "Which derive macro is used to automatically generate a debug representation for a struct?",
    exerciseOptions: [
      "#[derive(Display)]",
      "#[derive(Debug)]",
      "#[derive(ToString)]",
      "#[derive(Print)]",
    ],
  },

  "rs-l7": {
    content: `# Error Handling in Rust

Rust does not have exceptions. Instead, it uses the **Result<T, E>** type for recoverable errors and \`panic!\` for unrecoverable errors. This approach is fundamental for writing safe Solana programs.

## Result<T, E>

\`\`\`rust
use std::num::ParseIntError;

fn parse_lamports(input: &str) -> Result<u64, ParseIntError> {
    let lamports: u64 = input.parse()?;  // ? propagates the error
    Ok(lamports)
}

match parse_lamports("1000000000") {
    Ok(lamports) => println!("Lamports: {}", lamports),
    Err(e) => println!("Erro ao parsear: {}", e),
}
\`\`\`

## The ? operator

The \`?\` operator is **syntactic sugar** for propagating errors:

\`\`\`rust
// With ?
fn processar() -> Result<u64, String> {
    let valor = obter_saldo()?;  // returns Err if it fails
    let resultado = calcular(valor)?;
    Ok(resultado)
}

// Equivalent without ?
fn processar_verbose() -> Result<u64, String> {
    let valor = match obter_saldo() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    let resultado = match calcular(valor) {
        Ok(r) => r,
        Err(e) => return Err(e),
    };
    Ok(resultado)
}
\`\`\`

## Custom errors

For complex programs, define your own error types:

\`\`\`rust
use std::fmt;

#[derive(Debug)]
enum ProgramaErro {
    SaldoInsuficiente { necessario: u64, disponivel: u64 },
    ContaNaoEncontrada(String),
    NaoAutorizado,
    Overflow,
}

impl fmt::Display for ProgramaErro {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Self::SaldoInsuficiente { necessario, disponivel } => {
                write!(f, "Saldo insuficiente: necessário {} mas tem {}", necessario, disponivel)
            }
            Self::ContaNaoEncontrada(pk) => write!(f, "Conta não encontrada: {}", pk),
            Self::NaoAutorizado => write!(f, "Não autorizado"),
            Self::Overflow => write!(f, "Overflow aritmético"),
        }
    }
}

impl std::error::Error for ProgramaErro {}
\`\`\`

## thiserror (simplifying)

The \`thiserror\` crate generates Display and Error implementations automatically:

\`\`\`rust
use thiserror::Error;

#[derive(Error, Debug)]
enum ProgramaErro {
    #[error("Saldo insuficiente: necessário {necessario} mas tem {disponivel}")]
    SaldoInsuficiente { necessario: u64, disponivel: u64 },

    #[error("Conta não encontrada: {0}")]
    ContaNaoEncontrada(String),

    #[error("Não autorizado")]
    NaoAutorizado,

    #[error("Overflow aritmético")]
    Overflow,
}
\`\`\`

## Errors in Anchor

In Anchor, errors are defined with the \`#[error_code]\` macro:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("Saldo insuficiente para esta operação")]
    SaldoInsuficiente,
    #[msg("Não autorizado a executar esta ação")]
    NaoAutorizado,
    #[msg("Overflow no cálculo")]
    OverflowMatematico,
}

// Usage
pub fn sacar(ctx: Context<Sacar>, lamports: u64) -> Result<()> {
    require!(
        ctx.accounts.vault.saldo >= lamports,
        ErrorCode::SaldoInsuficiente
    );
    Ok(())
}
\`\`\`

## Chained error propagation

\`\`\`rust
fn transferir(de: &str, para: &str, valor: &str) -> Result<String, ProgramaErro> {
    let lamports: u64 = valor
        .parse()
        .map_err(|_| ProgramaErro::Overflow)?;

    let saldo = obter_saldo(de)
        .map_err(|_| ProgramaErro::ContaNaoEncontrada(de.to_string()))?;

    if saldo < lamports {
        return Err(ProgramaErro::SaldoInsuficiente {
            necessario: lamports,
            disponivel: saldo,
        });
    }

    Ok(format!("Transferido {} de {} para {}", lamports, de, para))
}
\`\`\`

The \`?\` operator combined with \`.map_err()\` lets you convert between error types elegantly.`,
    exerciseQuestion: "What does the ? operator do when it encounters an Err?",
    exerciseOptions: [
      "It converts the Err into None",
      "It causes an immediate panic!",
      "It returns the Err from the current function (propagates the error)",
      "It ignores the error and continues execution",
    ],
    challengePrompt:
      "Implement a validar_transferencia function in Rust that checks balance, authority and limits, returning custom errors with thiserror.",
  },

  // ── Course 6: PDAs and Accounts on Solana ─────────────────────

  "pda-l1": {
    content: `# The Account Model Revisited

On Solana, **everything is an account**. Programs, tokens, NFTs, user data — everything is stored in accounts. Understanding this model in depth is essential for working with PDAs.

## Structure of an account

Every account on Solana has the following fields:

\`\`\`
┌─────────────────────────────────────────┐
│  Account                                │
├─────────────────────────────────────────┤
│  lamports: u64        (balance in SOL)  │
│  data: Vec<u8>        (binary data)     │
│  owner: Pubkey        (owner program)   │
│  executable: bool     (is a program?)   │
│  rent_epoch: u64      (rent epoch)      │
└─────────────────────────────────────────┘
\`\`\`

### Detailing each field

- **lamports**: account balance in lamports (1 SOL = 10^9 lamports). Every account needs a minimum balance to exist.
- **data**: byte array that stores arbitrary data. For wallets, it is empty. For programs, it contains the bytecode. For data accounts, it contains serialized data.
- **owner**: the Pubkey of the **program** that controls this account. Only the owner can modify the \`data\` field and debit lamports.
- **executable**: flag indicating whether the account is an executable program.
- **rent_epoch**: internal rent control (generally ignored — most accounts are rent-exempt).

## Owner vs Authority

A concept that confuses many beginners:

\`\`\`
Owner (account field)  ≠  Authority (logical concept)
\`\`\`

- **Owner**: the program that controls the account (runtime field). E.g.: System Program, Token Program
- **Authority**: the public key authorized to perform operations — defined in the account data or instructions

\`\`\`
SOL Wallet:
  owner = System Program (11111111111111111111111111111111)
  authority = your public key (you control it)

Token Account:
  owner = Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
  authority = your public key (field in the data)
\`\`\`

## Rent and Rent Exemption

Accounts on Solana need to pay **rent** to occupy space on the blockchain. In practice, all accounts should be **rent-exempt**, depositing a minimum balance:

\`\`\`bash
# Check minimum rent for X bytes
solana rent 100
# Result: Rent per byte-year: 0.00000348 SOL
# Minimum balance for rent exemption: 0.00089088 SOL
\`\`\`

Approximate formula:

\`\`\`
rent_exempt_minimum = (128 + data_length) * 6.96e-6 SOL
\`\`\`

## Important limitations

- **Maximum size**: 10 MB per account (but most use < 10 KB)
- **Immutable after execution**: program accounts are immutable after deploy (except via upgrade authority)
- **Only the owner modifies data**: no other program can alter the data bytes
- **Anyone can credit**: any program can send lamports to an account
- **Only the owner debits**: only the owner program can withdraw lamports

## Viewing via CLI

\`\`\`bash
# View details of any account
solana account <ADDRESS>

# Output:
# Public Key: 7nHfER...
# Balance: 1.5 SOL
# Owner: 11111111111111111111111111111111
# Executable: false
# Rent Epoch: 361
\`\`\`

This deep understanding of the account model is the foundation for working with PDAs, which we will cover next.`,
    exerciseQuestion: "Who can modify the data field of an account on Solana?",
    exerciseOptions: [
      "Any program can modify any account",
      "Only the owner program of the account can modify its data",
      "Only the authority defined in the transaction",
      "The validator that processed the transaction",
    ],
  },

  "pda-l2": {
    content: `# Program Derived Addresses (PDAs)

PDAs are addresses **derived deterministically** from a program and a set of seeds. They are one of the most important concepts on Solana.

## What is a PDA?

A PDA is an address that:

1. Is derived from a **program ID** + **seeds** + **bump**
2. **Has no private key** — no one can sign directly
3. Is **deterministic** — same seeds + program = same address
4. Falls **outside the Ed25519 curve** (off-curve)

\`\`\`
PDA = hash(seeds, program_id, bump)
     where bump ensures the result is off the curve
\`\`\`

## Why do PDAs exist?

Without PDAs, Solana programs could not "own" accounts deterministically. PDAs solve:

- **Deterministic addresses**: given a program and seeds, the address is always the same
- **Programmatic authority**: the program can "sign" via PDA without a private key
- **Easy lookup**: anyone can derive the address knowing the seeds

## findProgramAddress

The main function for finding a PDA:

\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user_profile"),           // string seed
    userPubkey.toBuffer(),                 // pubkey seed
  ],
  programId                                // program
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);
\`\`\`

In Rust/Anchor:

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[
        b"user_profile",
        user.key().as_ref(),
    ],
    &program_id,
);
\`\`\`

## Seeds

Seeds are arbitrary bytes used as input to derive the PDA:

\`\`\`typescript
// String as seed
Buffer.from("vault")

// Pubkey as seed
ownerPubkey.toBuffer()

// Number as seed
new BN(42).toArrayLike(Buffer, 'le', 8) // u64 little-endian
\`\`\`

## What is the bump?

The bump is a number from 0 to 255 that ensures the derived address **is not on the Ed25519 curve**:

\`\`\`
For bump = 255:
  hash(seeds + [255] + program_id) → on curve? → YES → next
For bump = 254:
  hash(seeds + [254] + program_id) → on curve? → NO → FOUND!
\`\`\`

The **canonical bump** is the first bump found (highest value). \`findProgramAddress\` starts at 255 and decrements until it finds an off-curve address.

## Why off-curve?

If the address were on the Ed25519 curve, **a corresponding private key would theoretically exist**. This would be a security risk — someone could sign as if they were the program.

Off-curve PDAs guarantee that **only the program can sign** via \`invoke_signed\`.

## Visualization

\`\`\`
┌─ Program ID ─────────────────────────┐
│ Fg6PaFpoGXkYsidMpWTK6W2BeZ7FE...    │
│                                       │
│  Seeds: ["vault", user_pubkey]        │
│  Bump: 254                            │
│           │                           │
│           ▼                           │
│  PDA: 8xKf9J3dq2Vn7aP...            │
│  (deterministic address)              │
└───────────────────────────────────────┘
\`\`\`

## Key characteristics

- **Deterministic**: same seeds = same address, always
- **No private key**: impossible to sign directly
- **Unique per program**: the same seed generates different PDAs for different programs
- **Efficient for lookup**: derive the address on the client without querying the blockchain`,
    exerciseQuestion: "Why must PDAs on Solana be off the Ed25519 curve?",
    exerciseOptions: [
      "To save storage space",
      "To ensure no private key corresponds to the address, only the program can sign",
      "To make derivation computationally faster",
      "For compatibility with other blockchains",
    ],
  },

  "pda-l3": {
    content: `# Seeds and Determinism

Choosing the right seeds is one of the most important design decisions when architecting a Solana program. Bad seeds lead to collisions, inflexibility and bugs that are hard to diagnose.

## Types of seeds

### String seeds

\`\`\`rust
// Fixed prefix — identifies the TYPE of account
#[account(
    seeds = [b"vault"],
    bump,
)]
pub vault: Account<'info, Vault>,
\`\`\`

### Pubkey seeds

\`\`\`rust
// User pubkey — creates one account PER user
#[account(
    seeds = [b"profile", user.key().as_ref()],
    bump,
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

### Number seeds (u64, u8)

\`\`\`rust
// Numeric ID — useful for lists/sequences
let id: u64 = 42;
#[account(
    seeds = [b"post", &id.to_le_bytes()],
    bump,
)]
pub post: Account<'info, BlogPost>,
\`\`\`

### Combined seeds

\`\`\`rust
// Combination for maximum specificity
#[account(
    seeds = [
        b"enrollment",
        course_id.as_ref(),
        student.key().as_ref(),
    ],
    bump,
)]
pub enrollment: Account<'info, Enrollment>,
\`\`\`

## Ensuring uniqueness

The PDA address must be **unique** for each entity you want to represent. Consider:

\`\`\`
// BAD — all vaults would have the same address!
seeds = [b"vault"]

// GOOD — one vault per user
seeds = [b"vault", user.key().as_ref()]

// BETTER — one vault per user per token
seeds = [b"vault", user.key().as_ref(), mint.key().as_ref()]
\`\`\`

## Canonical bump

The **canonical bump** is the highest bump (closest to 255) that generates an off-curve address. It is the value returned by \`findProgramAddress\`:

\`\`\`typescript
const [pda, canonicalBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), userPubkey.toBuffer()],
  programId
);
// canonicalBump might be, for example, 253
\`\`\`

### Why always use the canonical bump?

\`\`\`
Bump 255: on curve (invalid)
Bump 254: on curve (invalid)
Bump 253: OFF-CURVE ← canonical bump ✓
Bump 252: off-curve (valid, but not canonical)
Bump 251: off-curve (valid, but not canonical)
...
\`\`\`

If you allow non-canonical bumps, the same "concept" can have **multiple addresses**. Anchor solves this automatically with the \`bump\` constraint:

\`\`\`rust
#[account(
    seeds = [b"vault", user.key().as_ref()],
    bump, // Anchor validates the canonical bump automatically
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Seed design patterns

### 1. Singleton account (one per program)

\`\`\`rust
seeds = [b"global_config"]
\`\`\`

### 2. One account per user

\`\`\`rust
seeds = [b"profile", user.key().as_ref()]
\`\`\`

### 3. N:M relationship (many-to-many)

\`\`\`rust
// Enrollment: student X in course Y
seeds = [b"enrollment", course_id.as_ref(), student.key().as_ref()]
\`\`\`

### 4. Sequential list

\`\`\`rust
// Post #42 by the author
seeds = [b"post", author.key().as_ref(), &post_id.to_le_bytes()]
\`\`\`

## Limitations

- **Maximum seed size**: 32 bytes per individual seed, up to 16 seeds
- **Variable strings**: be careful when using strings as seeds — \`"abc"\` and \`"abc "\` generate different PDAs
- **Case-sensitive**: \`"Vault"\` ≠ \`"vault"\`

Choosing seeds is like designing primary keys in a database — think about **uniqueness** and **accessibility** (who needs to derive this address?).`,
    exerciseQuestion:
      "Why is it important to always use the canonical bump when working with PDAs?",
    exerciseOptions: [
      "Because smaller bumps are more computationally efficient",
      "Because the canonical bump is always 255",
      "To ensure each concept has a single, deterministic PDA address",
      "Because the Solana runtime rejects non-canonical bumps",
    ],
  },

  "pda-l4": {
    content: `# Creating Accounts with PDAs

Now that we understand what PDAs are and how to choose seeds, let's learn how to **create accounts** at PDA addresses using the Anchor framework.

## The init constraint in Anchor

Anchor dramatically simplifies PDA account creation with the \`init\` constraint:

\`\`\`rust
#[derive(Accounts)]
pub struct CriarPerfil<'info> {
    #[account(
        init,
        payer = usuario,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", usuario.key().as_ref()],
        bump,
    )]
    pub perfil: Account<'info, UserProfile>,

    #[account(mut)]
    pub usuario: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### What init does under the hood:

1. Derives the PDA address from the seeds
2. Calculates the rent-exempt minimum
3. Makes a **CPI** to the System Program creating the account
4. Assigns the **owner** as the current program
5. Serializes the **discriminator** (8 bytes) into the data

## Calculating the space

The \`space\` field determines how many bytes the account will occupy. In Anchor:

\`\`\`rust
space = 8 + DataSize
         │
         └── Anchor discriminator (8 bytes, always required)
\`\`\`

### Size table

| Type | Size |
|---|---|
| bool | 1 byte |
| u8 / i8 | 1 byte |
| u16 / i16 | 2 bytes |
| u32 / i32 | 4 bytes |
| u64 / i64 | 8 bytes |
| u128 / i128 | 16 bytes |
| Pubkey | 32 bytes |
| String | 4 + length |
| Vec<T> | 4 + (n * sizeof(T)) |
| Option<T> | 1 + sizeof(T) |

### Calculation example

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,      // 32 bytes
    pub xp: u64,                // 8 bytes
    pub level: u8,              // 1 byte
    #[max_len(50)]
    pub name: String,           // 4 + 50 = 54 bytes
    pub created_at: i64,        // 8 bytes
}

// Total: 8 (discriminator) + 32 + 8 + 1 + 54 + 8 = 111 bytes
\`\`\`

With \`InitSpace\`, Anchor calculates automatically:

\`\`\`rust
space = 8 + UserProfile::INIT_SPACE
\`\`\`

## CPI to the System Program (without Anchor)

To understand what happens under the hood, here is manual creation via CPI:

\`\`\`rust
use solana_program::{
    system_instruction,
    program::invoke_signed,
};

// Create the instruction
let create_account_ix = system_instruction::create_account(
    payer.key,           // who pays
    pda.key,             // address of the new account
    rent_lamports,       // lamports for rent exemption
    space as u64,        // size in bytes
    program_id,          // owner of the new account
);

// Execute with the PDA seeds (invoke_signed)
invoke_signed(
    &create_account_ix,
    &[payer.clone(), pda.clone(), system_program.clone()],
    &[&[
        b"profile",
        user_key.as_ref(),
        &[bump],
    ]],
)?;
\`\`\`

## Payer and rent

The paying account (\`payer\`) must:

1. Be a **signer** of the transaction
2. Have enough SOL to cover the **rent-exempt minimum**
3. Be marked as \`mut\` (its balance will be debited)

\`\`\`rust
// Check rent on the client
const space = 111;
const rentExempt = await connection.getMinimumBalanceForRentExemption(space);
console.log(\`Rent-exempt: \${rentExempt / LAMPORTS_PER_SOL} SOL\`);
\`\`\`

## The init_if_needed constraint

To create the account only if it does not already exist:

\`\`\`rust
#[account(
    init_if_needed,
    payer = usuario,
    space = 8 + UserProfile::INIT_SPACE,
    seeds = [b"profile", usuario.key().as_ref()],
    bump,
)]
pub perfil: Account<'info, UserProfile>,
\`\`\`

> **Caution**: \`init_if_needed\` requires the \`init-if-needed\` feature flag in Cargo.toml and has security implications (the account can be reused). Use carefully and always validate existing data.`,
    exerciseQuestion:
      "How many bytes does the Anchor discriminator occupy at the beginning of each account?",
    exerciseOptions: ["4 bytes", "8 bytes", "16 bytes", "32 bytes"],
  },

  "pda-l5": {
    content: `# PDAs as Signers

One of the most powerful features of PDAs is the ability to "sign" transactions on behalf of the program. This allows programs to control accounts and execute operations autonomously.

## The concept

PDAs do not have a private key, so they cannot sign in the cryptographic sense. Instead, the Solana runtime allows a program to **prove** that a PDA belongs to it, using the seeds:

\`\`\`
Normal signature: private key → Ed25519 signature
PDA signature:    program + seeds + bump → proof of derivation
\`\`\`

## invoke_signed

The \`invoke_signed\` function allows the program to make a CPI (Cross-Program Invocation) "signing" as the PDA:

\`\`\`rust
use solana_program::program::invoke_signed;

// Transfer SOL from a PDA to a user
let transfer_ix = system_instruction::transfer(
    vault_pda.key,    // from: the PDA
    recipient.key,    // to: the recipient
    amount,           // amount in lamports
);

invoke_signed(
    &transfer_ix,
    &[vault_pda.clone(), recipient.clone(), system_program.clone()],
    &[&[
        b"vault",              // seed 1
        authority.key.as_ref(), // seed 2
        &[bump],               // bump
    ]],
)?;
\`\`\`

The runtime verifies:

1. Computes \`hash(seeds + bump + program_id)\`
2. Compares with the PDA address passed
3. If it matches, allows the operation as if the PDA had "signed"

## PDA as authority in Anchor

In Anchor, PDAs as signers are more ergonomic:

\`\`\`rust
#[derive(Accounts)]
pub struct Sacar<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn sacar(ctx: Context<Sacar>, amount: u64) -> Result<()> {
    // Transfer lamports from the vault PDA to the authority
    let vault = &ctx.accounts.vault;

    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.try_borrow_mut_lamports()? += amount;

    Ok(())
}
\`\`\`

## CPI with PDA signer in Anchor

For more complex CPIs (e.g., transferring tokens):

\`\`\`rust
use anchor_spl::token::{self, Transfer, Token};

pub fn transferir_tokens(ctx: Context<TransferirTokens>, amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"vault",
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(), // PDA signs
        },
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

## Pattern: Vault with PDA authority

A very common pattern in DeFi:

\`\`\`
┌──────────┐    deposits    ┌──────────────┐
│  User    │ ──────────────→│  Vault PDA   │
│          │                │  (holds SOL)  │
│          │ ←──────────────│              │
└──────────┘    withdraws   └──────────────┘
                             PDA signs the
                             withdrawal via
                             invoke_signed
\`\`\`

### Vault struct storing the bump

\`\`\`rust
#[account]
pub struct Vault {
    pub authority: Pubkey,  // who can withdraw
    pub bump: u8,           // bump for signing
    pub total: u64,         // total deposited
}
\`\`\`

> **Important tip**: always store the bump in the account to avoid recalculating it. This saves compute units and simplifies the code.

## Security

- Always validate that the **authority** is who it should be
- Store the bump in the account for efficiency and security
- Verify that the seeds match exactly what is expected
- Use Anchor constraints (\`has_one\`, \`constraint\`) for automatic validations`,
    exerciseQuestion:
      'How does a Solana program "sign" a transaction using a PDA?',
    exerciseOptions: [
      "Using the PDA private key stored in the program",
      "Via invoke_signed, proving to the runtime that the seeds correctly derive the PDA",
      "Asking the validator to sign on behalf of the program",
      "Using an external oracle to generate the signature",
    ],
  },

  "pda-l6": {
    content: `# On-Chain Hashmaps

Solana does not natively have an on-chain hashmap structure. However, by using PDAs cleverly, we can **simulate** hashmaps with O(1) lookup — without iteration!

## The concept

In a traditional hashmap:

\`\`\`
map[key] = value
\`\`\`

With PDAs on Solana:

\`\`\`
PDA(seeds=[prefix, key]) → account with the value
\`\`\`

The hashmap "key" is encoded in the **seeds**, and the "value" is stored in the PDA account data.

## Example: User profile

\`\`\`rust
// Conceptual hashmap: user_pubkey → UserProfile
// PDA: seeds = ["profile", user_pubkey]

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub xp: u64,
    pub level: u8,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct GetProfile<'info> {
    #[account(
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, UserProfile>,
    pub user: SystemAccount<'info>,
}
\`\`\`

Client lookup:

\`\`\`typescript
// O(1) — no iteration, no list search
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), userPubkey.toBuffer()],
  programId
);

const profile = await program.account.userProfile.fetch(profilePda);
\`\`\`

## Example: Token → price mapping

\`\`\`rust
// Hashmap: mint_pubkey → PriceData
#[account]
pub struct PriceData {
    pub mint: Pubkey,        // 32 bytes
    pub price_usd: u64,     // 8 bytes (cents)
    pub last_update: i64,   // 8 bytes
    pub bump: u8,            // 1 byte
}

// seeds = ["price", mint_pubkey]
\`\`\`

## Pattern: composite key

For N:M relationships, use multiple keys in the seeds:

\`\`\`rust
// Hashmap: (course, student) → Enrollment
#[account]
pub struct Enrollment {
    pub course: Pubkey,
    pub student: Pubkey,
    pub progress: u16,    // bitmap of completed lessons
    pub enrolled_at: i64,
    pub bump: u8,
}

// seeds = ["enrollment", course_pubkey, student_pubkey]
\`\`\`

\`\`\`typescript
// Check if a student is enrolled — O(1)
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("enrollment"),
    coursePubkey.toBuffer(),
    studentPubkey.toBuffer(),
  ],
  programId
);

try {
  const enrollment = await program.account.enrollment.fetch(enrollmentPda);
  console.log("Enrolled! Progress:", enrollment.progress);
} catch {
  console.log("Not enrolled");
}
\`\`\`

## Pattern: numeric key (indexed list)

\`\`\`rust
// Hashmap: (author, post_id) → BlogPost
#[account]
pub struct BlogPost {
    pub author: Pubkey,
    pub post_id: u64,
    pub title: String,
    pub content: String,
    pub bump: u8,
}

// seeds = ["post", author_pubkey, post_id_bytes]
\`\`\`

To iterate over posts, keep a **counter** in the profile:

\`\`\`rust
#[account]
pub struct AuthorProfile {
    pub authority: Pubkey,
    pub post_count: u64,   // post counter
    pub bump: u8,
}

// On the client, iterate:
for (let i = 0; i < author.postCount; i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("post"), authorPubkey.toBuffer(), new BN(i).toArrayLike(Buffer, 'le', 8)],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
}
\`\`\`

## Limitations and alternatives

- **No native iteration**: it is not possible to "list all keys" on-chain
- **Solution**: use \`getProgramAccounts\` on the client (with filters) or indexers like Helius DAS
- **Fixed size**: account space must be defined at creation — use \`realloc\` if needed
- **Cost**: each entry is a separate account (rent-exempt), costing ~0.002 SOL per typical entry`,
    exerciseQuestion: "How do PDAs simulate an on-chain hashmap on Solana?",
    exerciseOptions: [
      "By storing a Rust HashMap directly in the account data",
      "By using a special System Program account for lookup",
      "By encoding the hashmap key in the PDA seeds, making the address deterministic",
      "By using an off-chain indexing program to simulate the search",
    ],
  },

  "pda-l7": {
    content: `# Practical Exercise: On-Chain Blog

Let's build an **on-chain blog** using PDAs in Anchor! Each post will be a PDA account derived from the author and a sequential ID. We will also have operations to create and update posts.

## Architecture

\`\`\`
AuthorProfile PDA                BlogPost PDA
seeds: ["author", pubkey]       seeds: ["post", pubkey, id_bytes]
┌─────────────────────┐         ┌──────────────────────────┐
│ authority: Pubkey    │         │ author: Pubkey           │
│ post_count: u64      │         │ post_id: u64             │
│ bump: u8             │         │ title: String (max 50)   │
└─────────────────────┘         │ content: String (max 500)│
                                │ timestamp: i64           │
                                │ updated: bool            │
                                │ bump: u8                 │
                                └──────────────────────────┘
\`\`\`

## Instructions

### 1. initialize_author

Creates the author profile with \`post_count = 0\`:

\`\`\`rust
pub fn initialize_author(ctx: Context<InitializeAuthor>) -> Result<()> {
    let author = &mut ctx.accounts.author_profile;
    author.authority = ctx.accounts.user.key();
    author.post_count = 0;
    author.bump = ctx.bumps.author_profile;
    Ok(())
}
\`\`\`

### 2. create_post

Creates a new post and increments \`post_count\`:

\`\`\`rust
pub fn create_post(
    ctx: Context<CreatePost>,
    title: String,
    content: String,
) -> Result<()> {
    require!(title.len() <= 50, BlogError::TituloMuitoLongo);
    require!(content.len() <= 500, BlogError::ConteudoMuitoLongo);

    let post = &mut ctx.accounts.blog_post;
    let author = &mut ctx.accounts.author_profile;

    post.author = ctx.accounts.user.key();
    post.post_id = author.post_count;
    post.title = title;
    post.content = content;
    post.timestamp = Clock::get()?.unix_timestamp;
    post.updated = false;
    post.bump = ctx.bumps.blog_post;

    author.post_count += 1;
    Ok(())
}
\`\`\`

### 3. update_post

Updates the title and/or content of an existing post:

\`\`\`rust
pub fn update_post(
    ctx: Context<UpdatePost>,
    new_title: String,
    new_content: String,
) -> Result<()> {
    let post = &mut ctx.accounts.blog_post;
    post.title = new_title;
    post.content = new_content;
    post.updated = true;
    Ok(())
}
\`\`\`

## Account structs

\`\`\`rust
#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + BlogPost::INIT_SPACE,
        seeds = [
            b"post",
            user.key().as_ref(),
            &author_profile.post_count.to_le_bytes(),
        ],
        bump,
    )]
    pub blog_post: Account<'info, BlogPost>,

    #[account(
        mut,
        seeds = [b"author", user.key().as_ref()],
        bump = author_profile.bump,
        has_one = authority @ BlogError::NaoAutorizado,
    )]
    pub author_profile: Account<'info, AuthorProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Calculating the space

\`\`\`
BlogPost:
  discriminator: 8
  author (Pubkey): 32
  post_id (u64): 8
  title (String, max 50): 4 + 50 = 54
  content (String, max 500): 4 + 500 = 504
  timestamp (i64): 8
  updated (bool): 1
  bump (u8): 1
  Total: 8 + 32 + 8 + 54 + 504 + 8 + 1 + 1 = 616 bytes
\`\`\`

## Reading posts on the client

\`\`\`typescript
// List all posts by an author
for (let i = 0; i < authorProfile.postCount.toNumber(); i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("post"),
      authorPubkey.toBuffer(),
      new BN(i).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
  console.log(\`Post #\${i}: \${post.title}\`);
}
\`\`\``,
    exerciseQuestion:
      "In the on-chain blog, how do the BlogPost PDA seeds ensure uniqueness of each post?",
    exerciseOptions: [
      "Using only the post title as a seed",
      "Using the block timestamp as a seed",
      "Combining the author pubkey with the sequential post_id in the seeds",
      "Generating a random UUID as a seed",
    ],
    challengePrompt:
      "Complete the Anchor on-chain blog program: define the AuthorProfile and BlogPost structs, implement initialize_author and create_post with validations, and configure the custom errors.",
  },
});

// ═══════════════════════════════════════════════════════════════
// Spanish translations — Courses 4, 5, 6
// ═══════════════════════════════════════════════════════════════

registerLessonContent("es", {
  // ── Curso 4: Taller de Solana CLI ─────────────────────────────

  "cli-l1": {
    content: `# Instalando el Solana CLI

El **Solana CLI** es la herramienta oficial de línea de comandos para interactuar con la blockchain Solana. Con ella puedes crear carteras, enviar transacciones, hacer deploy de programas y mucho más.

## Instalación en macOS y Linux

La forma más sencilla es usando el script de instalación oficial de Anza (mantenedora del validador Agave):

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

Este script descarga los binarios precompilados y los instala en \`~/.local/share/solana/install/active_release/bin\`.

### Configurando el PATH

Después de la instalación, agrega el directorio a tu PATH. Edita tu \`~/.bashrc\`, \`~/.zshrc\` o equivalente:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Recarga la terminal:

\`\`\`bash
source ~/.zshrc   # o ~/.bashrc
\`\`\`

## Instalación en Windows

En Windows, abre **PowerShell** como administrador y ejecuta:

\`\`\`powershell
cmd /c "curl https://release.anza.xyz/stable/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\\solana-install-tmp\\solana-install-init.exe --create-dirs"
C:\\solana-install-tmp\\solana-install-init.exe stable
\`\`\`

Alternativamente, usa **WSL2** (Windows Subsystem for Linux) y sigue las instrucciones de Linux.

## Verificando la instalación

Confirma que todo funciona correctamente:

\`\`\`bash
solana --version
# solana-cli 1.18.x (src:xxxxxxx; feat:xxxxxxxxxx, client:Agave)
\`\`\`

Otros comandos útiles para verificar:

\`\`\`bash
solana-keygen --version
solana-test-validator --version
\`\`\`

## Actualizando

Para actualizar a la versión más reciente:

\`\`\`bash
solana-install update
\`\`\`

## Solución de problemas

- **Comando no encontrado**: verifica que el PATH esté configurado correctamente
- **Permiso denegado**: en Linux/macOS, no uses \`sudo\` — la instalación es en el directorio del usuario
- **Versión antigua**: ejecuta \`solana-install update\` para actualizar
- **WSL2 en Windows**: si tienes problemas con el instalador nativo, prefiere WSL2
- **Firewall/proxy**: el script necesita acceder a \`release.anza.xyz\` — verifica que tu firewall lo permita`,
    exerciseQuestion:
      "¿Qué comando verifica si el Solana CLI fue instalado correctamente?",
    exerciseOptions: [
      "solana check",
      "solana --version",
      "solana verify",
      "solana-install status",
    ],
  },

  "cli-l2": {
    content: `# Configurando la red

Solana tiene **tres redes principales** (clusters) y el CLI permite alternar entre ellas fácilmente.

## Clusters disponibles

| Cluster | URL | Uso |
|---|---|---|
| **Devnet** | \`https://api.devnet.solana.com\` | Desarrollo y pruebas |
| **Testnet** | \`https://api.testnet.solana.com\` | Pruebas de validadores |
| **Mainnet-beta** | \`https://api.mainnet-beta.solana.com\` | Producción |

## Configurando el cluster

Usa el comando \`solana config set\` con la flag \`-u\` (o \`--url\`):

\`\`\`bash
# Conectar a devnet (recomendado para desarrollo)
solana config set -u devnet

# Conectar a testnet
solana config set -u testnet

# Conectar a mainnet
solana config set -u mainnet-beta

# Usar URL completa
solana config set --url https://api.devnet.solana.com
\`\`\`

## RPCs personalizados

Los RPCs públicos de Solana tienen **rate limits** estrictos. Para desarrollo serio, usa un proveedor de RPC dedicado:

### Helius

\`\`\`bash
solana config set --url https://devnet.helius-rpc.com/?api-key=TU_API_KEY
\`\`\`

### QuickNode

\`\`\`bash
solana config set --url https://your-endpoint.solana-devnet.quiknode.pro/TOKEN/
\`\`\`

### Triton (vía Alchemy)

\`\`\`bash
solana config set --url https://solana-devnet.g.alchemy.com/v2/TU_KEY
\`\`\`

## Verificando la configuración actual

\`\`\`bash
solana config get
\`\`\`

Salida esperada:

\`\`\`
Config File: /home/user/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /home/user/.config/solana/id.json
Commitment: confirmed
\`\`\`

## Consejo: Localhost

Para pruebas locales, ejecuta el validador de prueba y configura:

\`\`\`bash
solana-test-validator  # en otra terminal
solana config set -u localhost
# URL será http://127.0.0.1:8899
\`\`\`

El validador local es **mucho más rápido** y no tiene rate limits — ideal para desarrollo iterativo.`,
    exerciseQuestion:
      "¿Qué cluster es el más recomendado para desarrollo y pruebas en Solana?",
    exerciseOptions: [
      "Mainnet-beta, ya que es el ambiente real",
      "Testnet, ya que es exclusiva para pruebas",
      "Devnet, ya que está diseñada para desarrollo con SOL gratis",
      "Localhost, ya que es la única opción gratuita",
    ],
  },

  "cli-l3": {
    content: `# Keypairs y Carteras

En Solana, toda cuenta se identifica por un **par de claves criptográficas** (keypair): una clave pública (dirección) y una clave privada (para firmar transacciones).

## Generando un nuevo keypair

\`\`\`bash
solana-keygen new
\`\`\`

Este comando:

1. Genera un par de claves Ed25519
2. Pide una **passphrase** (opcional, pero recomendada)
3. Muestra la **seed phrase** (12 o 24 palabras) — **¡anótala y guárdala de forma segura!**
4. Guarda el keypair en \`~/.config/solana/id.json\`

Salida esperada:

\`\`\`
Generating a new keypair
For added security, enter a BIP39 passphrase
NOTE! This passphrase improves security of the recovery seed phrase
BIP39 Passphrase (empty for none):
Wrote new keypair to /home/user/.config/solana/id.json
=============================================================
pubkey: 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
=============================================================
Save this seed phrase to recover your keypair:
word1 word2 word3 ... word12
=============================================================
\`\`\`

## Guardando en otro archivo

Usa la flag \`--outfile\` para generar keypairs en ubicaciones específicas:

\`\`\`bash
solana-keygen new --outfile ~/wallets/mi-cartera.json
solana-keygen new --outfile ./deploy-keypair.json
\`\`\`

## Direcciones vanity (personalizadas)

El comando \`grind\` permite generar direcciones que comienzan con un prefijo específico:

\`\`\`bash
# Generar dirección que comienza con "Sol"
solana-keygen grind --starts-with Sol:1

# Generar dirección que comienza con "ABC"
solana-keygen grind --starts-with ABC:1
\`\`\`

> **Atención**: cuanto más largo el prefijo, más tiempo toma. 3 caracteres puede tomar segundos, 5+ puede tomar horas.

## Mostrando la dirección pública

\`\`\`bash
# Dirección del keypair predeterminado
solana address

# Dirección de un archivo específico
solana address -k ~/wallets/mi-cartera.json

# Verificar keypair completo
solana-keygen verify <PUBKEY> ~/wallets/mi-cartera.json
\`\`\`

## Recuperando desde seed phrase

\`\`\`bash
solana-keygen recover --outfile ~/wallets/recovered.json
# Pega la seed phrase cuando se solicite
\`\`\`

## Buenas prácticas de seguridad

- **Nunca compartas** tu clave privada o seed phrase
- **Nunca hagas commit** de archivos \`.json\` de keypair en Git (agrégalos al \`.gitignore\`)
- Usa **passphrase** para agregar una capa extra de protección
- Para producción, considera **hardware wallets** (Ledger)
- Mantén **backups** de la seed phrase en un lugar seguro y offline
- Usa keypairs diferentes para **desarrollo** y **producción**`,
    exerciseQuestion:
      "¿Qué flag de solana-keygen new permite guardar el keypair en un archivo específico?",
    exerciseOptions: ["--file", "--output", "--outfile", "--save-to"],
  },

  "cli-l4": {
    content: `# Airdrop y Saldos

En la **devnet** y **testnet** de Solana, puedes solicitar SOL gratis para pruebas usando el **airdrop**. Esto es esencial para el desarrollo, ya que toda transacción requiere SOL para pagar las tarifas.

## Solicitando airdrop

\`\`\`bash
# Solicitar 2 SOL (predeterminado)
solana airdrop 2

# Solicitar 1 SOL
solana airdrop 1

# Airdrop a una dirección específica
solana airdrop 2 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
\`\`\`

> **Nota**: el airdrop solo funciona en **devnet** y **testnet**. En mainnet, necesitas comprar SOL.

## Verificando el saldo

\`\`\`bash
# Saldo del keypair predeterminado
solana balance

# Saldo de una dirección específica
solana balance 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7

# Saldo en lamports
solana balance --lamports
\`\`\`

## Lamports: la unidad más pequeña

Así como Bitcoin tiene satoshis y Ethereum tiene wei, Solana usa **lamports**:

| Unidad | Valor |
|---|---|
| 1 SOL | 1.000.000.000 lamports |
| 1 lamport | 0,000000001 SOL |

\`\`\`bash
# La constante en código
LAMPORTS_PER_SOL = 1_000_000_000
\`\`\`

En la práctica:

\`\`\`
2.5 SOL = 2_500_000_000 lamports
0.001 SOL = 1_000_000 lamports
Tarifa típica = 5_000 lamports = 0.000005 SOL
\`\`\`

## Rate limits del airdrop

El faucet público de devnet tiene límites:

- **Máximo por solicitud**: 2 SOL (en devnet) o 1 SOL (en testnet)
- **Cooldown**: puede haber espera entre solicitudes consecutivas
- **Basado en IP**: el rate limit es por dirección IP

### Alternativas cuando el faucet está congestionado

1. **Faucet web**: [faucet.solana.com](https://faucet.solana.com)
2. **Validador local**: \`solana-test-validator\` — SOL infinito, sin rate limits
3. **Programático**: usa \`connection.requestAirdrop()\` en el código

\`\`\`bash
# Si el airdrop falla, prueba con el validador local
solana-test-validator &
solana config set -u localhost
solana airdrop 100  # funciona sin límite en localhost
\`\`\`

## Verificando la cuenta completa

Para ver todos los detalles de una cuenta:

\`\`\`bash
solana account <DIRECCIÓN>
\`\`\`

Esto muestra: saldo, owner, tamaño de los datos, si es ejecutable, y el rent epoch.`,
    exerciseQuestion: "¿Cuántos lamports equivalen a 1 SOL?",
    exerciseOptions: [
      "1.000.000 (un millón)",
      "1.000.000.000 (mil millones)",
      "100.000.000 (cien millones)",
      "10.000.000.000 (diez mil millones)",
    ],
  },

  "cli-l5": {
    content: `# Transfiriendo SOL

Transferir SOL es una de las operaciones más fundamentales en la blockchain Solana. Vamos a aprender tanto por CLI como programáticamente.

## Transferencia vía CLI

El comando \`solana transfer\` envía SOL desde tu cartera predeterminada hacia otra dirección:

\`\`\`bash
# Sintaxis básica
solana transfer <DESTINATARIO> <CANTIDAD>

# Ejemplo: enviar 0.5 SOL
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5

# Con confirmación detallada
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5 --verbose
\`\`\`

## Verificando la transacción

Después de la transferencia, el CLI devuelve una **firma** (signature/txid):

\`\`\`bash
# Verificar estado de la transacción
solana confirm <SIGNATURE>

# Ver detalles completos
solana transaction-history <DIRECCIÓN>
\`\`\`

## Flags útiles

\`\`\`bash
# Usar keypair específico como remitente
solana transfer <DEST> 1 --keypair ~/wallets/otra-cartera.json

# Permitir el financiamiento del fee payer
solana transfer <DEST> 1 --allow-unfunded-recipient

# Transferir todo el SOL (dejando 0)
solana transfer <DEST> ALL
\`\`\`

## Transferencia programática (TypeScript)

Usando \`@solana/web3.js\`, la transferencia sigue estos pasos:

1. Crear una **Connection** con el cluster
2. Construir la **instrucción** vía \`SystemProgram.transfer\`
3. Agregar la instrucción a una **Transaction**
4. **Firmar y enviar** con \`sendAndConfirmTransaction\`

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

async function transferSOL() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sender = Keypair.generate();

  // Airdrop para el sender
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  const receiver = Keypair.generate();

  // Crear instrucción de transferencia
  const instruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  // Montar y enviar transacción
  const tx = new Transaction().add(instruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log('Transacción confirmada:', sig);
}
\`\`\`

## Entendiendo la firma

Cada transacción en Solana genera una **firma única** (base58, 88 caracteres). Esta firma sirve como:

- **Identificador único** de la transacción
- **Prueba criptográfica** de que el remitente la autorizó
- **Clave de búsqueda** en el Explorer`,
    exerciseQuestion:
      "¿Qué programa de Solana es responsable de las transferencias nativas de SOL?",
    exerciseOptions: [
      "Token Program",
      "System Program",
      "Associated Token Account Program",
      "Stake Program",
    ],
    challengePrompt:
      "Completa el script TypeScript que transfiere 0.5 SOL del sender al receiver en devnet e imprime la firma de la transacción.",
  },

  "cli-l6": {
    content: `# Explorando Transacciones

Después de enviar una transacción, es fundamental saber cómo **verificar, explorar y depurar** lo que ocurrió on-chain. Solana ofrece herramientas vía CLI e interfaces web.

## Confirmando transacciones vía CLI

\`\`\`bash
# Verificar si una transacción fue confirmada
solana confirm <SIGNATURE>

# Ejemplo
solana confirm 5VGR...abc123
# Retorna: Confirmed / Finalized / Not found
\`\`\`

Los niveles de confirmación en Solana:

- **processed**: recibida por el líder actual (~400ms)
- **confirmed**: votada por una supermayoría de validadores (~1s)
- **finalized**: 31+ slots después de confirmed — irreversible (~12s)

## Solana Explorer

El [Solana Explorer](https://explorer.solana.com) es la interfaz web oficial para explorar transacciones, cuentas y bloques.

### Buscando una transacción

1. Accede a [explorer.solana.com](https://explorer.solana.com)
2. Selecciona la red correcta (Devnet, Testnet o Mainnet)
3. Pega la **firma** de la transacción en la barra de búsqueda

### Información disponible

La página de una transacción muestra:

- **Estado**: Success o Failed
- **Slot y timestamp**: cuándo fue procesada
- **Fee**: tarifa pagada en lamports
- **Signers**: quién firmó la transacción
- **Instructions**: lista de instrucciones ejecutadas
- **Logs**: mensajes de log del programa
- **Accounts**: cuentas leídas y escritas

## Explorando cuentas vía CLI

\`\`\`bash
# Ver detalles de una cuenta
solana account <DIRECCIÓN>

# La salida incluye:
# - Balance (lamports y SOL)
# - Owner (programa dueño de la cuenta)
# - Data Length (bytes de datos almacenados)
# - Executable (si es un programa)
\`\`\`

## Historial de transacciones

\`\`\`bash
# Últimas transacciones de una dirección
solana transaction-history <DIRECCIÓN>

# Con límite
solana transaction-history <DIRECCIÓN> --limit 5
\`\`\`

## Logs de programas

Para ver los logs detallados de una transacción:

\`\`\`bash
solana logs             # stream de logs en tiempo real
solana logs <PROGRAMA>  # logs solo de un programa específico
\`\`\`

Ejemplo de log:

\`\`\`
Program 11111111111111111111111111111111 invoke [1]
Program 11111111111111111111111111111111 success
\`\`\`

## Exploradores alternativos

- **Solscan**: [solscan.io](https://solscan.io) — interfaz rica con analytics
- **SolanaFM**: [solana.fm](https://solana.fm) — decodificación avanzada de instrucciones
- **XRAY**: [xray.helius.xyz](https://xray.helius.xyz) — visualización detallada por Helius

Cada explorador tiene fortalezas — Solscan es excelente para tokens, SolanaFM para decodificar programas complejos, y XRAY para transacciones DeFi.`,
    exerciseQuestion:
      "¿Qué nivel de confirmación en Solana garantiza que la transacción es irreversible?",
    exerciseOptions: ["processed", "confirmed", "finalized", "committed"],
  },

  // ── Curso 5: Rust para Solana ─────────────────────────────────

  "rs-l1": {
    content: `# ¿Por qué Rust para Solana?

Rust es el lenguaje **principal** para escribir programas on-chain en Solana. Pero ¿por qué Solana Labs eligió Rust? Vamos a entender las razones técnicas y prácticas.

## Seguridad de memoria

Rust garantiza **seguridad de memoria en tiempo de compilación** — sin null pointers, sin buffer overflows, sin data races. Esto es **crítico** para smart contracts donde los bugs pueden costar millones:

\`\`\`rust
// Rust NO permite null pointers
// En su lugar, usa Option<T>
let valor: Option<u64> = Some(42);
let nenhum: Option<u64> = None;

// Estás OBLIGADO a manejar el None
match valor {
    Some(v) => println!("Valor: {}", v),
    None => println!("Sem valor"),
}
\`\`\`

## Rendimiento sin garbage collector

Rust no posee **garbage collector (GC)**. La memoria es gestionada por el sistema de **ownership** en tiempo de compilación:

- **Cero overhead**: sin pausas para GC (como en Go, Java o JavaScript)
- **Predecible**: tiempo de ejecución determinístico — esencial para blockchain
- **Eficiente**: control fino sobre la asignación y el diseño de memoria

\`\`\`
Linguagem    | GC?   | Performance | Segurança
-------------|-------|-------------|----------
C/C++        | Não   | Alta        | Baixa
Java/Go      | Sim   | Média       | Média
Rust         | Não   | Alta        | Alta ✓
JavaScript   | Sim   | Baixa       | Média
\`\`\`

## Comparación con otros lenguajes

### Rust vs Solidity

| Aspecto | Rust (Solana) | Solidity (Ethereum) |
|---|---|---|
| Modelo de ejecución | Programa on-chain reutilizable | Contrato con estado propio |
| Velocidad | ~65k TPS | ~15 TPS |
| Costo promedio | < $0.001 | $1 – $50+ |
| Ecosistema | Creciendo rápidamente | Maduro |

### Rust vs Move (Aptos/Sui)

Move es un lenguaje específico para blockchain, mientras que Rust es de **propósito general** — esto significa que:

- Más desarrolladores ya conocen Rust
- Bibliotecas y herramientas maduras (cargo, crates.io)
- Habilidades transferibles a otros proyectos

## El ecosistema Solana con Rust

En la práctica, los programas Solana en Rust usan el framework **Anchor** (a partir del nivel intermedio):

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Programa inicializado!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\`

## Conclusión

Rust ofrece la combinación ideal para blockchain: **seguridad + rendimiento + sin GC**. Aprender Rust es una inversión que va más allá de Solana — es uno de los lenguajes más queridos del mundo por 8 años consecutivos en el Stack Overflow Survey.`,
    exerciseQuestion:
      "¿Cuál es la principal ventaja de que Rust no tenga garbage collector para programas on-chain?",
    exerciseOptions: [
      "El código es más pequeño",
      "No necesita compilación",
      "Ejecución determinística sin pausas impredecibles",
      "Permite usar punteros nulos para optimización",
    ],
  },

  "rs-l2": {
    content: `# Variables y Tipos en Rust

Vamos a aprender los fundamentos de variables y tipos en Rust, que forman la base de todo programa Solana.

## Declarando variables

En Rust, las variables son **inmutables por defecto**:

\`\`\`rust
let x = 5;      // inmutable
// x = 10;      // ¡ERROR! no se puede reasignar

let mut y = 5;  // mutable
y = 10;         // OK
\`\`\`

Esta decisión de diseño fomenta la inmutabilidad, reduciendo bugs — especialmente importante en smart contracts.

## Tipos numéricos

Rust tiene tipos enteros con tamaño explícito:

\`\`\`rust
// Enteros con signo (signed)
let a: i8 = -128;       // -128 a 127
let b: i16 = -32768;    // -32768 a 32767
let c: i32 = 42;        // predeterminado para enteros
let d: i64 = 1_000_000; // guiones bajos para legibilidad

// Enteros sin signo (unsigned) — ¡muy usados en Solana!
let e: u8 = 255;
let f: u32 = 100_000;
let g: u64 = 1_000_000_000; // ¡los lamports son u64!
let h: u128 = 340_282_366_920_938_463_463;

// Punto flotante
let pi: f64 = 3.14159;
let taxa: f32 = 0.01;
\`\`\`

> **En Solana**: los saldos usan \`u64\` (lamports), los timestamps usan \`i64\`, y los cálculos de alta precisión usan \`u128\`.

## Strings

Rust tiene dos tipos principales de strings:

\`\`\`rust
// String — asignada en el heap, mutable
let mut nome = String::from("Solana");
nome.push_str(" é incrível!");

// &str — referencia a string (string slice), inmutable
let saudacao: &str = "Olá, mundo!";

// Conversión
let s: String = saudacao.to_string();
let slice: &str = &s;
\`\`\`

## Inferencia de tipos

El compilador de Rust generalmente infiere el tipo:

\`\`\`rust
let x = 42;           // infiere i32
let y = 3.14;         // infiere f64
let nome = "Solana";  // infiere &str
let ativo = true;     // infiere bool
\`\`\`

## Shadowing

Rust permite **redeclarar** una variable con el mismo nombre:

\`\`\`rust
let x = 5;
let x = x + 1;    // shadowing: x ahora es 6
let x = x * 2;    // x ahora es 12

// ¡Shadowing permite cambiar el tipo!
let spaces = "   ";        // &str
let spaces = spaces.len(); // usize — mismo nombre, tipo diferente
\`\`\`

## Constantes

Las constantes son **siempre inmutables** y exigen tipo explícito:

\`\`\`rust
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const MAX_ACCOUNTS: usize = 32;
const PROGRAM_NAME: &str = "meu_programa";
\`\`\`

Diferencias con \`let\`:

- Deben tener tipo explícito
- Deben inicializarse con un valor constante (sin llamadas a funciones)
- Convención: SCREAMING_SNAKE_CASE
- Alcance global o local

## Tuplas y Arrays

\`\`\`rust
// Tupla — tipos heterogéneos
let info: (u64, &str, bool) = (1_000_000, "SOL", true);
let saldo = info.0;  // 1_000_000

// Array — tamaño fijo, tipo homogéneo
let seeds: [u8; 4] = [1, 2, 3, 4];
let zeros = [0u8; 32]; // 32 bytes en cero — común en Solana
\`\`\``,
    exerciseQuestion:
      "¿Qué tipo numérico se usa para representar saldos en lamports en Solana?",
    exerciseOptions: ["i32", "f64", "u64", "u8"],
  },

  "rs-l3": {
    content: `# Ownership y Borrowing

El sistema de **ownership** es el concepto más único de Rust. Garantiza seguridad de memoria sin garbage collector — y entenderlo es esencial para programas Solana.

## Las tres reglas de ownership

1. Cada valor en Rust tiene **un único dueño** (owner)
2. Solo puede haber **un dueño a la vez**
3. Cuando el dueño sale del scope, el valor es **descartado** (dropped)

\`\`\`rust
{
    let s = String::from("hello"); // s es el dueño de "hello"
    // s es válido aquí
} // s sale del scope — la memoria se libera automáticamente
\`\`\`

## Move semantics

Cuando asignas un valor a otra variable, el ownership se **transfiere** (moved):

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;  // s1 fue MOVIDO a s2

// println!("{}", s1); // ¡ERROR! s1 ya no es válido
println!("{}", s2);    // OK
\`\`\`

Esto previene el **double-free** — un bug clásico en C/C++.

## Referencias (borrowing)

Para usar un valor sin transferir el ownership, usa **referencias**:

\`\`\`rust
fn calcular_tamanho(s: &String) -> usize {
    s.len()
    // s es solo una referencia — no se descarta aquí
}

let s1 = String::from("hello");
let tamanho = calcular_tamanho(&s1); // presta s1
println!("{} tem {} bytes", s1, tamanho); // ¡s1 sigue siendo válido!
\`\`\`

### Referencias inmutables (\`&T\`)

Puedes tener **múltiples referencias inmutables** simultáneamente:

\`\`\`rust
let s = String::from("Solana");
let r1 = &s;
let r2 = &s;
println!("{} e {}", r1, r2); // OK — múltiples refs inmutables
\`\`\`

### Referencias mutables (\`&mut T\`)

Solo **una referencia mutable** a la vez:

\`\`\`rust
let mut s = String::from("hello");
let r1 = &mut s;
// let r2 = &mut s; // ¡ERROR! no puede haber dos &mut al mismo tiempo
r1.push_str(" world");
println!("{}", r1);
\`\`\`

**Regla fundamental**: referencias inmutables O una referencia mutable — nunca ambas.

## Clone y Copy

### Clone — copia explícita (heap)

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1.clone(); // copia profunda
println!("{} e {}", s1, s2); // ambos válidos
\`\`\`

### Copy — copia implícita (stack)

Los tipos simples implementan \`Copy\` y se copian automáticamente:

\`\`\`rust
let x: u64 = 42;
let y = x;  // copia, no mueve
println!("{} e {}", x, y); // ambos válidos

// Tipos que implementan Copy:
// i8, i16, i32, i64, u8, u16, u32, u64
// f32, f64, bool, char
// Tuplas de tipos Copy
\`\`\`

## Lifetimes (introducción)

Los lifetimes garantizan que las referencias no vivan más que el dato al que se refieren:

\`\`\`rust
fn maior<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}
\`\`\`

El \`'a\` le dice al compilador: "la referencia retornada vive al menos tanto como s1 y s2".

## ¿Por qué esto importa para Solana?

En Solana, las cuentas se pasan como referencias (\`&AccountInfo\`). Entender borrowing es esencial para:

- Leer datos de cuentas (\`&account.data.borrow()\`)
- Modificar datos (\`&mut account.data.borrow_mut()\`)
- Evitar errores de "already borrowed" en CPIs`,
    exerciseQuestion:
      "¿Qué ocurre cuando asignas un String a otra variable en Rust?",
    exerciseOptions: [
      "El valor se copia automáticamente",
      "El ownership se transfiere (move) y la variable original se vuelve inválida",
      "Ambas variables apuntan al mismo dato",
      "El compilador crea una referencia automáticamente",
    ],
  },

  "rs-l4": {
    content: `# Structs y Enums

Structs y enums son los tipos compuestos fundamentales en Rust. En Solana, se usan extensivamente para definir **cuentas**, **instrucciones** y **errores**.

## Structs

Los structs agrupan datos relacionados:

\`\`\`rust
// Definición
struct ContaSolana {
    pubkey: String,
    saldo: u64,
    executavel: bool,
}

// Instanciación
let conta = ContaSolana {
    pubkey: String::from("7nHfER..."),
    saldo: 1_000_000_000,
    executavel: false,
};

// Acceso
println!("Saldo: {} lamports", conta.saldo);
\`\`\`

### Bloques impl

Los métodos y funciones asociadas se definen en bloques \`impl\`:

\`\`\`rust
impl ContaSolana {
    // Función asociada (constructor) — se llama con ::
    fn new(pubkey: String, saldo: u64) -> Self {
        Self {
            pubkey,
            saldo,
            executavel: false,
        }
    }

    // Método — recibe &self
    fn saldo_em_sol(&self) -> f64 {
        self.saldo as f64 / 1_000_000_000.0
    }

    // Método mutable — recibe &mut self
    fn depositar(&mut self, lamports: u64) {
        self.saldo += lamports;
    }
}

let mut conta = ContaSolana::new("7nHfER...".into(), 0);
conta.depositar(2_000_000_000);
println!("Saldo: {} SOL", conta.saldo_em_sol()); // 2.0
\`\`\`

### Structs en Anchor

En Solana con Anchor, los structs definen el layout de las cuentas:

\`\`\`rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,  // 32 bytes
    pub xp: u64,           // 8 bytes
    pub level: u8,         // 1 byte
    pub name: String,      // 4 + len bytes
}
\`\`\`

## Enums

Los enums representan un valor que puede ser **una de varias variantes**:

\`\`\`rust
enum Dificuldade {
    Iniciante,
    Intermediario,
    Avancado,
}

let nivel = Dificuldade::Intermediario;
\`\`\`

### Enums con datos

Las variantes pueden llevar datos:

\`\`\`rust
enum Instrucao {
    Transferir { destino: String, lamports: u64 },
    CriarConta(u64), // espacio en bytes
    FecharConta,
}

let ix = Instrucao::Transferir {
    destino: "9aE4...".into(),
    lamports: 500_000_000,
};
\`\`\`

## Option<T>

\`Option\` es un enum nativo para valores opcionales (reemplaza a \`null\`):

\`\`\`rust
enum Option<T> {
    Some(T),
    None,
}

let freeze_authority: Option<Pubkey> = None;
let mint_authority: Option<Pubkey> = Some(my_pubkey);

// Accediendo
if let Some(auth) = mint_authority {
    println!("Authority: {}", auth);
}
\`\`\`

## Result<T, E>

\`Result\` es el enum estándar para manejo de errores:

\`\`\`rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Divisão por zero!"))
    } else {
        Ok(a / b)
    }
}

match dividir(10.0, 3.0) {
    Ok(resultado) => println!("Resultado: {}", resultado),
    Err(erro) => println!("Erro: {}", erro),
}
\`\`\`

En Solana, **todas las funciones de instrucción retornan \`Result<()>\`**:

\`\`\`rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // lógica...
    Ok(())
}
\`\`\``,
    exerciseQuestion:
      "¿Qué tipo de Rust reemplaza el concepto de null encontrado en otros lenguajes?",
    exerciseOptions: ["Result<T, E>", "Option<T>", "Null<T>", "Maybe<T>"],
  },

  "rs-l5": {
    content: `# Pattern Matching

Pattern matching es una de las funcionalidades más poderosas de Rust. Permite desestructurar y comparar valores de forma expresiva y segura.

## match

La expresión \`match\` compara un valor contra varios **patterns**:

\`\`\`rust
let nivel: u8 = 5;

let titulo = match nivel {
    0..=2 => "Iniciante",
    3..=5 => "Intermediário",
    6..=9 => "Avançado",
    10 => "Mestre",
    _ => "Desconhecido", // _ captura todo lo demás
};

println!("Nível {}: {}", nivel, titulo);
\`\`\`

### Match con enums

\`\`\`rust
enum StatusTransacao {
    Pendente,
    Confirmada(u64),  // slot number
    Falhou(String),   // mensaje de error
}

let status = StatusTransacao::Confirmada(285_000_000);

match status {
    StatusTransacao::Pendente => println!("Aguardando..."),
    StatusTransacao::Confirmada(slot) => {
        println!("Confirmada no slot {}", slot);
    }
    StatusTransacao::Falhou(msg) => {
        println!("Falhou: {}", msg);
    }
}
\`\`\`

> **Importante**: \`match\` en Rust es **exhaustivo** — debes cubrir todos los casos posibles o usar \`_\` como fallback.

### Match con Option y Result

\`\`\`rust
let saldo: Option<u64> = Some(1_000_000_000);

match saldo {
    Some(lamports) if lamports > 0 => {
        println!("Saldo: {} SOL", lamports as f64 / 1e9);
    }
    Some(_) => println!("Saldo zero"),
    None => println!("Conta não encontrada"),
}
\`\`\`

## if let

Para cuando solo te interesa **un pattern**:

\`\`\`rust
let authority: Option<String> = Some("7nHfER...".into());

// En vez de un match completo:
if let Some(auth) = authority {
    println!("Authority: {}", auth);
} else {
    println!("Sem authority");
}
\`\`\`

## while let

Un loop que continúa mientras el pattern coincida:

\`\`\`rust
let mut stack: Vec<u64> = vec![1, 2, 3, 4, 5];

while let Some(valor) = stack.pop() {
    println!("Processando: {}", valor);
}
// Imprime: 5, 4, 3, 2, 1
\`\`\`

## Destructuring

Desestructurar structs y tuplas:

\`\`\`rust
struct TransferInfo {
    de: String,
    para: String,
    lamports: u64,
}

let tx = TransferInfo {
    de: "Alice".into(),
    para: "Bob".into(),
    lamports: 500_000_000,
};

// Destructuring en la declaración
let TransferInfo { de, para, lamports } = tx;
println!("{} enviou {} lamports para {}", de, lamports, para);

// Destructuring de tuplas
let (x, y, z) = (1, 2, 3);
\`\`\`

## Loops e Iteradores

\`\`\`rust
// for con range
for i in 0..10 {
    println!("Iteração {}", i);
}

// Iteradores con closures
let numeros = vec![1, 2, 3, 4, 5];

let dobrados: Vec<u64> = numeros
    .iter()
    .map(|n| n * 2)
    .collect();
// [2, 4, 6, 8, 10]

let soma: u64 = numeros.iter().sum();
// 15

let pares: Vec<&u64> = numeros
    .iter()
    .filter(|n| *n % 2 == 0)
    .collect();
// [2, 4]
\`\`\`

Los iteradores son **lazy** — no se ejecutan hasta que se consumen (por \`collect\`, \`sum\`, \`for_each\`, etc).`,
    exerciseQuestion:
      "¿Qué ocurre si un match en Rust no cubre todos los casos posibles?",
    exerciseOptions: [
      "Retorna None automáticamente",
      "El compilador emite un error exigiendo que todos los casos estén cubiertos",
      "Ejecuta el primer brazo por defecto",
      "Lanza una excepción en runtime",
    ],
  },

  "rs-l6": {
    content: `# Traits y Generics

Los traits definen **comportamientos compartidos** entre tipos. Los generics permiten escribir código que funciona con **múltiples tipos**. Juntos, son la base de la abstracción en Rust.

## Definiendo un trait

\`\`\`rust
trait Descritivel {
    fn descricao(&self) -> String;

    // Método con implementación por defecto
    fn resumo(&self) -> String {
        format!("(Veja mais: {})", self.descricao())
    }
}
\`\`\`

## Implementando traits

\`\`\`rust
struct Curso {
    titulo: String,
    xp: u64,
}

impl Descritivel for Curso {
    fn descricao(&self) -> String {
        format!("{} ({} XP)", self.titulo, self.xp)
    }
    // resumo() usa la implementación por defecto
}

let curso = Curso {
    titulo: "Rust para Solana".into(),
    xp: 280,
};
println!("{}", curso.descricao()); // "Rust para Solana (280 XP)"
println!("{}", curso.resumo());    // "(Veja mais: Rust para Solana (280 XP))"
\`\`\`

## Traits comunes de la standard library

\`\`\`rust
use std::fmt;

// Display — cómo aparece el valor con println!("{}")
impl fmt::Display for Curso {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Curso: {} | {} XP", self.titulo, self.xp)
    }
}

// Debug — formato para depuración con {:?}
#[derive(Debug)]
struct Config {
    rpc_url: String,
    commitment: String,
}

let cfg = Config {
    rpc_url: "https://api.devnet.solana.com".into(),
    commitment: "confirmed".into(),
};
println!("{:?}", cfg);
// Config { rpc_url: "https://api.devnet.solana.com", commitment: "confirmed" }
\`\`\`

### Derive macros

Las derive macros implementan traits automáticamente:

\`\`\`rust
#[derive(Debug, Clone, PartialEq)]
struct Token {
    symbol: String,
    decimals: u8,
    supply: u64,
}
\`\`\`

En Anchor, las derive macros son esenciales:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_deposited: u64,
}
\`\`\`

## Generics

Los generics permiten parametrizar tipos:

\`\`\`rust
// Función genérica
fn maior<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

let x = maior(10, 20);       // T = i32
let y = maior(3.14, 2.71);   // T = f64
\`\`\`

### Struct genérica

\`\`\`rust
struct Resultado<T> {
    valor: T,
    slot: u64,
    timestamp: i64,
}

let saldo = Resultado {
    valor: 1_500_000_000u64,
    slot: 285_000_000,
    timestamp: 1700000000,
};

let nome = Resultado {
    valor: String::from("Solana Academy"),
    slot: 285_000_000,
    timestamp: 1700000000,
};
\`\`\`

## Trait bounds

Restringen qué tipos pueden usarse con generics:

\`\`\`rust
// Sintaxis con :
fn imprimir<T: fmt::Display>(valor: T) {
    println!("Valor: {}", valor);
}

// Sintaxis con where (más legible con múltiples bounds)
fn processar<T>(item: T)
where
    T: fmt::Display + Clone + PartialOrd,
{
    let copia = item.clone();
    println!("Original: {}, Cópia: {}", item, copia);
}
\`\`\`

## Traits como parámetros

\`\`\`rust
// Recibe cualquier tipo que implemente Descritivel
fn mostrar(item: &impl Descritivel) {
    println!("{}", item.descricao());
}

// Equivalente con trait bound
fn mostrar_v2<T: Descritivel>(item: &T) {
    println!("{}", item.descricao());
}
\`\`\`

Traits y generics son la base del **Anchor framework**: macros como \`#[derive(Accounts)]\` generan implementaciones de traits que realizan validación automática de cuentas.`,
    exerciseQuestion:
      "¿Qué macro derive se usa para generar automáticamente una representación de debug para un struct?",
    exerciseOptions: [
      "#[derive(Display)]",
      "#[derive(Debug)]",
      "#[derive(ToString)]",
      "#[derive(Print)]",
    ],
  },

  "rs-l7": {
    content: `# Manejo de Errores en Rust

Rust no posee excepciones. En su lugar, usa el tipo **Result<T, E>** para errores recuperables y \`panic!\` para errores irrecuperables. Este enfoque es fundamental para programas Solana seguros.

## Result<T, E>

\`\`\`rust
use std::num::ParseIntError;

fn parse_lamports(input: &str) -> Result<u64, ParseIntError> {
    let lamports: u64 = input.parse()?;  // ? propaga el error
    Ok(lamports)
}

match parse_lamports("1000000000") {
    Ok(lamports) => println!("Lamports: {}", lamports),
    Err(e) => println!("Erro ao parsear: {}", e),
}
\`\`\`

## El operador ?

El operador \`?\` es **azúcar sintáctico** para propagar errores:

\`\`\`rust
// Con ?
fn processar() -> Result<u64, String> {
    let valor = obter_saldo()?;  // retorna Err si falla
    let resultado = calcular(valor)?;
    Ok(resultado)
}

// Equivalente sin ?
fn processar_verbose() -> Result<u64, String> {
    let valor = match obter_saldo() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    let resultado = match calcular(valor) {
        Ok(r) => r,
        Err(e) => return Err(e),
    };
    Ok(resultado)
}
\`\`\`

## Errores personalizados

Para programas complejos, define tus propios tipos de error:

\`\`\`rust
use std::fmt;

#[derive(Debug)]
enum ProgramaErro {
    SaldoInsuficiente { necessario: u64, disponivel: u64 },
    ContaNaoEncontrada(String),
    NaoAutorizado,
    Overflow,
}

impl fmt::Display for ProgramaErro {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Self::SaldoInsuficiente { necessario, disponivel } => {
                write!(f, "Saldo insuficiente: necessário {} mas tem {}", necessario, disponivel)
            }
            Self::ContaNaoEncontrada(pk) => write!(f, "Conta não encontrada: {}", pk),
            Self::NaoAutorizado => write!(f, "Não autorizado"),
            Self::Overflow => write!(f, "Overflow aritmético"),
        }
    }
}

impl std::error::Error for ProgramaErro {}
\`\`\`

## thiserror (simplificando)

La crate \`thiserror\` genera las implementaciones de Display y Error automáticamente:

\`\`\`rust
use thiserror::Error;

#[derive(Error, Debug)]
enum ProgramaErro {
    #[error("Saldo insuficiente: necessário {necessario} mas tem {disponivel}")]
    SaldoInsuficiente { necessario: u64, disponivel: u64 },

    #[error("Conta não encontrada: {0}")]
    ContaNaoEncontrada(String),

    #[error("Não autorizado")]
    NaoAutorizado,

    #[error("Overflow aritmético")]
    Overflow,
}
\`\`\`

## Errores en Anchor

En Anchor, los errores se definen con la macro \`#[error_code]\`:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("Saldo insuficiente para esta operação")]
    SaldoInsuficiente,
    #[msg("Não autorizado a executar esta ação")]
    NaoAutorizado,
    #[msg("Overflow no cálculo")]
    OverflowMatematico,
}

// Uso
pub fn sacar(ctx: Context<Sacar>, lamports: u64) -> Result<()> {
    require!(
        ctx.accounts.vault.saldo >= lamports,
        ErrorCode::SaldoInsuficiente
    );
    Ok(())
}
\`\`\`

## Propagación de errores en cadena

\`\`\`rust
fn transferir(de: &str, para: &str, valor: &str) -> Result<String, ProgramaErro> {
    let lamports: u64 = valor
        .parse()
        .map_err(|_| ProgramaErro::Overflow)?;

    let saldo = obter_saldo(de)
        .map_err(|_| ProgramaErro::ContaNaoEncontrada(de.to_string()))?;

    if saldo < lamports {
        return Err(ProgramaErro::SaldoInsuficiente {
            necessario: lamports,
            disponivel: saldo,
        });
    }

    Ok(format!("Transferido {} de {} para {}", lamports, de, para))
}
\`\`\`

El operador \`?\` combinado con \`.map_err()\` permite convertir entre tipos de error de forma elegante.`,
    exerciseQuestion: "¿Qué hace el operador ? cuando encuentra un Err?",
    exerciseOptions: [
      "Convierte el Err en None",
      "Causa un panic! inmediato",
      "Retorna el Err de la función actual (propaga el error)",
      "Ignora el error y continúa la ejecución",
    ],
    challengePrompt:
      "Implementa una función validar_transferencia en Rust que verifique saldo, autoridad y límites, retornando errores personalizados con thiserror.",
  },

  // ── Curso 6: PDAs y Cuentas en Solana ─────────────────────────

  "pda-l1": {
    content: `# El Modelo de Cuentas Revisitado

En Solana, **todo es una cuenta**. Programas, tokens, NFTs, datos de usuario — todo se almacena en cuentas. Entender este modelo en profundidad es esencial para trabajar con PDAs.

## Estructura de una cuenta

Toda cuenta en Solana posee los siguientes campos:

\`\`\`
┌─────────────────────────────────────────┐
│  Account                                │
├─────────────────────────────────────────┤
│  lamports: u64        (saldo en SOL)    │
│  data: Vec<u8>        (datos binarios)  │
│  owner: Pubkey        (programa dueño)  │
│  executable: bool     (¿es programa?)   │
│  rent_epoch: u64      (época de rent)   │
└─────────────────────────────────────────┘
\`\`\`

### Detallando cada campo

- **lamports**: saldo de la cuenta en lamports (1 SOL = 10^9 lamports). Toda cuenta necesita un saldo mínimo para existir.
- **data**: array de bytes que almacena datos arbitrarios. Para wallets, está vacío. Para programas, contiene el bytecode. Para cuentas de datos, contiene datos serializados.
- **owner**: la Pubkey del **programa** que controla esta cuenta. Solo el owner puede modificar el campo \`data\` y debitar lamports.
- **executable**: flag que indica si la cuenta es un programa ejecutable.
- **rent_epoch**: control interno de rent (generalmente ignorado — la mayoría de las cuentas son rent-exempt).

## Owner vs Authority

Un concepto que confunde a muchos principiantes:

\`\`\`
Owner (campo de la cuenta)  ≠  Authority (concepto lógico)
\`\`\`

- **Owner**: el programa que controla la cuenta (campo del runtime). Ej: System Program, Token Program
- **Authority**: la clave pública autorizada a ejecutar operaciones — definida en los datos de la cuenta o en las instrucciones

\`\`\`
Cartera SOL:
  owner = System Program (11111111111111111111111111111111)
  authority = tu clave pública (tú la controlas)

Token Account:
  owner = Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
  authority = tu clave pública (campo en los datos)
\`\`\`

## Rent y Rent Exemption

Las cuentas en Solana necesitan pagar **rent** para ocupar espacio en la blockchain. En la práctica, todas las cuentas deben ser **rent-exempt** (exentas), depositando un saldo mínimo:

\`\`\`bash
# Verificar rent mínimo para X bytes
solana rent 100
# Resultado: Rent per byte-year: 0.00000348 SOL
# Minimum balance for rent exemption: 0.00089088 SOL
\`\`\`

Fórmula aproximada:

\`\`\`
rent_exempt_minimum = (128 + data_length) * 6.96e-6 SOL
\`\`\`

## Limitaciones importantes

- **Tamaño máximo**: 10 MB por cuenta (pero la mayoría usa < 10 KB)
- **Inmutable después de la ejecución**: las cuentas de programa son inmutables después del deploy (excepto vía upgrade authority)
- **Solo el owner modifica data**: ningún otro programa puede alterar los bytes de data
- **Cualquiera puede acreditar**: cualquier programa puede enviar lamports a una cuenta
- **Solo el owner debita**: solo el programa owner puede retirar lamports

## Visualizando vía CLI

\`\`\`bash
# Ver detalles de cualquier cuenta
solana account <DIRECCIÓN>

# Salida:
# Public Key: 7nHfER...
# Balance: 1.5 SOL
# Owner: 11111111111111111111111111111111
# Executable: false
# Rent Epoch: 361
\`\`\`

Este entendimiento profundo del modelo de cuentas es el cimiento para trabajar con PDAs, que veremos a continuación.`,
    exerciseQuestion:
      "¿Quién puede modificar el campo data de una cuenta en Solana?",
    exerciseOptions: [
      "Cualquier programa puede modificar cualquier cuenta",
      "Solo el programa owner de la cuenta puede modificar sus datos",
      "Solo la authority definida en la transacción",
      "El validador que procesó la transacción",
    ],
  },

  "pda-l2": {
    content: `# Program Derived Addresses (PDAs)

Las PDAs son direcciones **derivadas de forma determinística** a partir de un programa y un conjunto de seeds. Son uno de los conceptos más importantes de Solana.

## ¿Qué es una PDA?

Una PDA es una dirección que:

1. Se deriva de un **program ID** + **seeds** + **bump**
2. **No posee clave privada** — nadie puede firmar directamente
3. Es **determinística** — mismas seeds + programa = misma dirección
4. Está **fuera de la curva Ed25519** (off-curve)

\`\`\`
PDA = hash(seeds, program_id, bump)
     donde bump garantiza que el resultado está fuera de la curva
\`\`\`

## ¿Por qué existen las PDAs?

Sin PDAs, los programas Solana no podrían "poseer" cuentas de forma determinística. Las PDAs resuelven:

- **Direcciones determinísticas**: dado un programa y seeds, la dirección es siempre la misma
- **Autoridad programática**: el programa puede "firmar" vía PDA sin clave privada
- **Lookup fácil**: cualquiera puede derivar la dirección conociendo las seeds

## findProgramAddress

La función principal para encontrar una PDA:

\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user_profile"),           // seed string
    userPubkey.toBuffer(),                 // seed pubkey
  ],
  programId                                // programa
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);
\`\`\`

En Rust/Anchor:

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[
        b"user_profile",
        user.key().as_ref(),
    ],
    &program_id,
);
\`\`\`

## Seeds (semillas)

Las seeds son bytes arbitrarios usados como entrada para derivar la PDA:

\`\`\`typescript
// String como seed
Buffer.from("vault")

// Pubkey como seed
ownerPubkey.toBuffer()

// Número como seed
new BN(42).toArrayLike(Buffer, 'le', 8) // u64 little-endian
\`\`\`

## ¿Qué es el bump?

El bump es un número de 0 a 255 que garantiza que la dirección derivada **no está en la curva Ed25519**:

\`\`\`
Para bump = 255:
  hash(seeds + [255] + program_id) → ¿en la curva? → SÍ → siguiente
Para bump = 254:
  hash(seeds + [254] + program_id) → ¿en la curva? → NO → ¡ENCONTRADO!
\`\`\`

El **canonical bump** es el primer bump encontrado (valor más alto). \`findProgramAddress\` comienza en 255 y decrementa hasta encontrar una dirección off-curve.

## ¿Por qué off-curve?

Si la dirección estuviera en la curva Ed25519, **teóricamente existiría una clave privada correspondiente**. Esto sería un riesgo de seguridad — alguien podría firmar como si fuera el programa.

Las PDAs off-curve garantizan que **solo el programa puede firmar** vía \`invoke_signed\`.

## Visualización

\`\`\`
┌─ Program ID ─────────────────────────┐
│ Fg6PaFpoGXkYsidMpWTK6W2BeZ7FE...    │
│                                       │
│  Seeds: ["vault", user_pubkey]        │
│  Bump: 254                            │
│           │                           │
│           ▼                           │
│  PDA: 8xKf9J3dq2Vn7aP...            │
│  (dirección determinística)           │
└───────────────────────────────────────┘
\`\`\`

## Características clave

- **Determinística**: mismas seeds = misma dirección, siempre
- **Sin clave privada**: imposible firmar directamente
- **Única por programa**: la misma seed genera PDAs diferentes para programas diferentes
- **Eficiente para lookup**: deriva la dirección en el client sin consultar la blockchain`,
    exerciseQuestion:
      "¿Por qué las PDAs en Solana deben estar fuera de la curva Ed25519?",
    exerciseOptions: [
      "Para ahorrar espacio de almacenamiento",
      "Para garantizar que ninguna clave privada corresponda a la dirección, solo el programa puede firmar",
      "Para que la derivación sea más rápida computacionalmente",
      "Para compatibilidad con otras blockchains",
    ],
  },

  "pda-l3": {
    content: `# Seeds y Determinismo

Elegir las seeds correctas es una de las decisiones de diseño más importantes al arquitectar un programa Solana. Seeds incorrectas llevan a colisiones, inflexibilidad y bugs difíciles de diagnosticar.

## Tipos de seeds

### Seeds de string

\`\`\`rust
// Prefijo fijo — identifica el TIPO de cuenta
#[account(
    seeds = [b"vault"],
    bump,
)]
pub vault: Account<'info, Vault>,
\`\`\`

### Seeds de Pubkey

\`\`\`rust
// Pubkey del usuario — crea una cuenta POR usuario
#[account(
    seeds = [b"profile", user.key().as_ref()],
    bump,
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

### Seeds numéricas (u64, u8)

\`\`\`rust
// ID numérico — útil para listas/secuencias
let id: u64 = 42;
#[account(
    seeds = [b"post", &id.to_le_bytes()],
    bump,
)]
pub post: Account<'info, BlogPost>,
\`\`\`

### Seeds combinadas

\`\`\`rust
// Combinación para máxima especificidad
#[account(
    seeds = [
        b"enrollment",
        course_id.as_ref(),
        student.key().as_ref(),
    ],
    bump,
)]
pub enrollment: Account<'info, Enrollment>,
\`\`\`

## Garantizando unicidad

La dirección PDA debe ser **única** para cada entidad que quieras representar. Considera:

\`\`\`
// MALO — ¡todos los vaults tendrían la misma dirección!
seeds = [b"vault"]

// BUENO — un vault por usuario
seeds = [b"vault", user.key().as_ref()]

// MEJOR — un vault por usuario por token
seeds = [b"vault", user.key().as_ref(), mint.key().as_ref()]
\`\`\`

## Canonical bump

El **canonical bump** es el mayor bump (más cercano a 255) que genera una dirección off-curve. Es el valor retornado por \`findProgramAddress\`:

\`\`\`typescript
const [pda, canonicalBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), userPubkey.toBuffer()],
  programId
);
// canonicalBump puede ser, por ejemplo, 253
\`\`\`

### ¿Por qué siempre usar el canonical bump?

\`\`\`
Bump 255: en la curva (inválido)
Bump 254: en la curva (inválido)
Bump 253: OFF-CURVE ← canonical bump ✓
Bump 252: off-curve (válido, pero no canónico)
Bump 251: off-curve (válido, pero no canónico)
...
\`\`\`

Si permites bumps no canónicos, el mismo "concepto" puede tener **múltiples direcciones**. Anchor resuelve esto automáticamente con la constraint \`bump\`:

\`\`\`rust
#[account(
    seeds = [b"vault", user.key().as_ref()],
    bump, // Anchor valida el canonical bump automáticamente
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Patrones de diseño para seeds

### 1. Cuenta singleton (una por programa)

\`\`\`rust
seeds = [b"global_config"]
\`\`\`

### 2. Una cuenta por usuario

\`\`\`rust
seeds = [b"profile", user.key().as_ref()]
\`\`\`

### 3. Relación N:M (muchos a muchos)

\`\`\`rust
// Matrícula: alumno X en curso Y
seeds = [b"enrollment", course_id.as_ref(), student.key().as_ref()]
\`\`\`

### 4. Lista secuencial

\`\`\`rust
// Post #42 del autor
seeds = [b"post", author.key().as_ref(), &post_id.to_le_bytes()]
\`\`\`

## Limitaciones

- **Tamaño máximo de seeds**: 32 bytes por seed individual, hasta 16 seeds
- **Strings variables**: cuidado al usar strings como seeds — \`"abc"\` y \`"abc "\` generan PDAs diferentes
- **Case-sensitive**: \`"Vault"\` ≠ \`"vault"\`

Elegir seeds es como diseñar claves primarias en una base de datos — piensa en la **unicidad** y la **accesibilidad** (¿quién necesita derivar esta dirección?).`,
    exerciseQuestion:
      "¿Por qué es importante usar siempre el canonical bump al trabajar con PDAs?",
    exerciseOptions: [
      "Porque bumps menores son más eficientes computacionalmente",
      "Porque el canonical bump es siempre 255",
      "Para garantizar que cada concepto tenga una única dirección PDA determinística",
      "Porque el runtime de Solana rechaza bumps no canónicos",
    ],
  },

  "pda-l4": {
    content: `# Creando Cuentas con PDAs

Ahora que entendemos qué son las PDAs y cómo elegir seeds, vamos a aprender a **crear cuentas** en direcciones PDA usando el framework Anchor.

## La constraint init en Anchor

Anchor simplifica drásticamente la creación de cuentas PDA con la constraint \`init\`:

\`\`\`rust
#[derive(Accounts)]
pub struct CriarPerfil<'info> {
    #[account(
        init,
        payer = usuario,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", usuario.key().as_ref()],
        bump,
    )]
    pub perfil: Account<'info, UserProfile>,

    #[account(mut)]
    pub usuario: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### Lo que init hace por debajo:

1. Deriva la dirección PDA a partir de las seeds
2. Calcula el rent-exempt mínimo
3. Hace una **CPI** al System Program creando la cuenta
4. Asigna el **owner** como el programa actual
5. Serializa el **discriminator** (8 bytes) en los datos

## Calculando el space

El campo \`space\` determina cuántos bytes ocupará la cuenta. En Anchor:

\`\`\`rust
space = 8 + TamañoDeLosDatos
         │
         └── discriminator de Anchor (8 bytes, siempre obligatorio)
\`\`\`

### Tabla de tamaños

| Tipo | Tamaño |
|---|---|
| bool | 1 byte |
| u8 / i8 | 1 byte |
| u16 / i16 | 2 bytes |
| u32 / i32 | 4 bytes |
| u64 / i64 | 8 bytes |
| u128 / i128 | 16 bytes |
| Pubkey | 32 bytes |
| String | 4 + longitud |
| Vec<T> | 4 + (n * sizeof(T)) |
| Option<T> | 1 + sizeof(T) |

### Ejemplo de cálculo

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,      // 32 bytes
    pub xp: u64,                // 8 bytes
    pub level: u8,              // 1 byte
    #[max_len(50)]
    pub name: String,           // 4 + 50 = 54 bytes
    pub created_at: i64,        // 8 bytes
}

// Total: 8 (discriminator) + 32 + 8 + 1 + 54 + 8 = 111 bytes
\`\`\`

Con \`InitSpace\`, Anchor calcula automáticamente:

\`\`\`rust
space = 8 + UserProfile::INIT_SPACE
\`\`\`

## CPI al System Program (sin Anchor)

Para entender lo que ocurre por debajo, aquí está la creación manual vía CPI:

\`\`\`rust
use solana_program::{
    system_instruction,
    program::invoke_signed,
};

// Crear la instrucción
let create_account_ix = system_instruction::create_account(
    payer.key,           // quién paga
    pda.key,             // dirección de la nueva cuenta
    rent_lamports,       // lamports para rent exemption
    space as u64,        // tamaño en bytes
    program_id,          // owner de la nueva cuenta
);

// Ejecutar con las seeds de la PDA (invoke_signed)
invoke_signed(
    &create_account_ix,
    &[payer.clone(), pda.clone(), system_program.clone()],
    &[&[
        b"profile",
        user_key.as_ref(),
        &[bump],
    ]],
)?;
\`\`\`

## Payer y rent

La cuenta que paga (\`payer\`) debe:

1. Ser un **signer** de la transacción
2. Tener SOL suficiente para cubrir el **rent-exempt minimum**
3. Estar marcada como \`mut\` (su saldo será debitado)

\`\`\`rust
// Verificar rent en el client
const space = 111;
const rentExempt = await connection.getMinimumBalanceForRentExemption(space);
console.log(\`Rent-exempt: \${rentExempt / LAMPORTS_PER_SOL} SOL\`);
\`\`\`

## Restricción init_if_needed

Para crear la cuenta solo si aún no existe:

\`\`\`rust
#[account(
    init_if_needed,
    payer = usuario,
    space = 8 + UserProfile::INIT_SPACE,
    seeds = [b"profile", usuario.key().as_ref()],
    bump,
)]
pub perfil: Account<'info, UserProfile>,
\`\`\`

> **Precaución**: \`init_if_needed\` requiere la feature flag \`init-if-needed\` en Cargo.toml y tiene implicaciones de seguridad (la cuenta puede ser reutilizada). Úsalo con cuidado y siempre valida los datos existentes.`,
    exerciseQuestion:
      "¿Cuántos bytes ocupa el discriminator de Anchor al inicio de cada cuenta?",
    exerciseOptions: ["4 bytes", "8 bytes", "16 bytes", "32 bytes"],
  },

  "pda-l5": {
    content: `# PDAs como Signers

Una de las funcionalidades más poderosas de las PDAs es la capacidad de "firmar" transacciones en nombre del programa. Esto permite que los programas controlen cuentas y ejecuten operaciones de forma autónoma.

## El concepto

Las PDAs no poseen clave privada, así que no pueden firmar en el sentido criptográfico. En su lugar, el runtime de Solana permite que un programa **demuestre** que una PDA le pertenece, usando las seeds:

\`\`\`
Firma normal: clave privada → firma Ed25519
Firma PDA:    programa + seeds + bump → prueba de derivación
\`\`\`

## invoke_signed

La función \`invoke_signed\` permite que el programa haga una CPI (Cross-Program Invocation) "firmando" como la PDA:

\`\`\`rust
use solana_program::program::invoke_signed;

// Transferir SOL de una PDA a un usuario
let transfer_ix = system_instruction::transfer(
    vault_pda.key,    // de: la PDA
    recipient.key,    // para: el destinatario
    amount,           // cantidad en lamports
);

invoke_signed(
    &transfer_ix,
    &[vault_pda.clone(), recipient.clone(), system_program.clone()],
    &[&[
        b"vault",              // seed 1
        authority.key.as_ref(), // seed 2
        &[bump],               // bump
    ]],
)?;
\`\`\`

El runtime verifica:

1. Calcula \`hash(seeds + bump + program_id)\`
2. Compara con la dirección de la PDA pasada
3. Si coincide, permite la operación como si la PDA hubiera "firmado"

## PDA como authority en Anchor

En Anchor, las PDAs como signers son más ergonómicas:

\`\`\`rust
#[derive(Accounts)]
pub struct Sacar<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn sacar(ctx: Context<Sacar>, amount: u64) -> Result<()> {
    // Transferir lamports de la vault PDA a la authority
    let vault = &ctx.accounts.vault;

    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.try_borrow_mut_lamports()? += amount;

    Ok(())
}
\`\`\`

## CPI con PDA signer en Anchor

Para CPIs más complejas (ej: transferir tokens):

\`\`\`rust
use anchor_spl::token::{self, Transfer, Token};

pub fn transferir_tokens(ctx: Context<TransferirTokens>, amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"vault",
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(), // PDA firma
        },
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

## Patrón: Vault con PDA authority

Un patrón muy común en DeFi:

\`\`\`
┌──────────┐    deposita    ┌──────────────┐
│  Usuario │ ──────────────→│  Vault PDA   │
│          │                │  (guarda SOL) │
│          │ ←──────────────│              │
└──────────┘    retira      └──────────────┘
                             PDA firma el
                             retiro vía
                             invoke_signed
\`\`\`

### Struct de la vault almacenando el bump

\`\`\`rust
#[account]
pub struct Vault {
    pub authority: Pubkey,  // quién puede retirar
    pub bump: u8,           // bump para firmar
    pub total: u64,         // total depositado
}
\`\`\`

> **Consejo importante**: siempre almacena el bump en la cuenta para evitar recalcularlo. Esto ahorra compute units y simplifica el código.

## Seguridad

- Siempre valida que la **authority** sea quien debería ser
- Almacena el bump en la cuenta para eficiencia y seguridad
- Verifica que las seeds correspondan exactamente a lo esperado
- Usa constraints de Anchor (\`has_one\`, \`constraint\`) para validaciones automáticas`,
    exerciseQuestion:
      '¿Cómo "firma" un programa Solana una transacción usando una PDA?',
    exerciseOptions: [
      "Usando la clave privada de la PDA almacenada en el programa",
      "Vía invoke_signed, demostrando al runtime que las seeds derivan correctamente la PDA",
      "Pidiendo al validador que firme en nombre del programa",
      "Usando un oráculo externo para generar la firma",
    ],
  },

  "pda-l6": {
    content: `# Hashmaps On-Chain

Solana no posee nativamente una estructura de hashmap on-chain. Sin embargo, usando PDAs de forma inteligente, podemos **simular** hashmaps con lookup O(1) — ¡sin iteración!

## El concepto

En un hashmap tradicional:

\`\`\`
map[clave] = valor
\`\`\`

Con PDAs en Solana:

\`\`\`
PDA(seeds=[prefijo, clave]) → cuenta con el valor
\`\`\`

La "clave" del hashmap se codifica en las **seeds**, y el "valor" se almacena en los datos de la cuenta PDA.

## Ejemplo: Perfil de usuario

\`\`\`rust
// Hashmap conceptual: user_pubkey → UserProfile
// PDA: seeds = ["profile", user_pubkey]

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub xp: u64,
    pub level: u8,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct GetProfile<'info> {
    #[account(
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, UserProfile>,
    pub user: SystemAccount<'info>,
}
\`\`\`

Lookup en el client:

\`\`\`typescript
// O(1) — sin iteración, sin búsqueda en lista
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), userPubkey.toBuffer()],
  programId
);

const profile = await program.account.userProfile.fetch(profilePda);
\`\`\`

## Ejemplo: Mapeo token → precio

\`\`\`rust
// Hashmap: mint_pubkey → PriceData
#[account]
pub struct PriceData {
    pub mint: Pubkey,        // 32 bytes
    pub price_usd: u64,     // 8 bytes (centavos)
    pub last_update: i64,   // 8 bytes
    pub bump: u8,            // 1 byte
}

// seeds = ["price", mint_pubkey]
\`\`\`

## Patrón: clave compuesta

Para relaciones N:M, usa múltiples claves en las seeds:

\`\`\`rust
// Hashmap: (curso, alumno) → Enrollment
#[account]
pub struct Enrollment {
    pub course: Pubkey,
    pub student: Pubkey,
    pub progress: u16,    // bitmap de lecciones completadas
    pub enrolled_at: i64,
    pub bump: u8,
}

// seeds = ["enrollment", course_pubkey, student_pubkey]
\`\`\`

\`\`\`typescript
// Verificar si el alumno está matriculado — O(1)
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("enrollment"),
    coursePubkey.toBuffer(),
    studentPubkey.toBuffer(),
  ],
  programId
);

try {
  const enrollment = await program.account.enrollment.fetch(enrollmentPda);
  console.log("¡Matriculado! Progreso:", enrollment.progress);
} catch {
  console.log("No matriculado");
}
\`\`\`

## Patrón: clave numérica (lista indexada)

\`\`\`rust
// Hashmap: (author, post_id) → BlogPost
#[account]
pub struct BlogPost {
    pub author: Pubkey,
    pub post_id: u64,
    pub title: String,
    pub content: String,
    pub bump: u8,
}

// seeds = ["post", author_pubkey, post_id_bytes]
\`\`\`

Para iterar sobre posts, mantén un **contador** en el perfil:

\`\`\`rust
#[account]
pub struct AuthorProfile {
    pub authority: Pubkey,
    pub post_count: u64,   // contador de posts
    pub bump: u8,
}

// En el client, iterar:
for (let i = 0; i < author.postCount; i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("post"), authorPubkey.toBuffer(), new BN(i).toArrayLike(Buffer, 'le', 8)],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
}
\`\`\`

## Limitaciones y alternativas

- **Sin iteración nativa**: no es posible "listar todas las claves" on-chain
- **Solución**: usa \`getProgramAccounts\` en el client (con filtros) o indexadores como Helius DAS
- **Tamaño fijo**: el espacio de la cuenta debe definirse en la creación — usa \`realloc\` si es necesario
- **Costo**: cada entrada es una cuenta separada (rent-exempt), lo que cuesta ~0.002 SOL por entrada típica`,
    exerciseQuestion: "¿Cómo simulan las PDAs un hashmap on-chain en Solana?",
    exerciseOptions: [
      "Almacenando un HashMap de Rust directamente en los datos de la cuenta",
      "Usando una cuenta especial del System Program para lookup",
      "Codificando la clave del hashmap en las seeds de la PDA, haciendo la dirección determinística",
      "Usando un programa de indexación off-chain para simular la búsqueda",
    ],
  },

  "pda-l7": {
    content: `# Ejercicio Práctico: Blog On-Chain

¡Vamos a construir un **blog on-chain** usando PDAs en Anchor! Cada post será una cuenta PDA derivada del autor y un ID secuencial. También tendremos operaciones para crear y actualizar posts.

## Arquitectura

\`\`\`
AuthorProfile PDA                BlogPost PDA
seeds: ["author", pubkey]       seeds: ["post", pubkey, id_bytes]
┌─────────────────────┐         ┌──────────────────────────┐
│ authority: Pubkey    │         │ author: Pubkey           │
│ post_count: u64      │         │ post_id: u64             │
│ bump: u8             │         │ title: String (max 50)   │
└─────────────────────┘         │ content: String (max 500)│
                                │ timestamp: i64           │
                                │ updated: bool            │
                                │ bump: u8                 │
                                └──────────────────────────┘
\`\`\`

## Instrucciones

### 1. initialize_author

Crea el perfil del autor con \`post_count = 0\`:

\`\`\`rust
pub fn initialize_author(ctx: Context<InitializeAuthor>) -> Result<()> {
    let author = &mut ctx.accounts.author_profile;
    author.authority = ctx.accounts.user.key();
    author.post_count = 0;
    author.bump = ctx.bumps.author_profile;
    Ok(())
}
\`\`\`

### 2. create_post

Crea un nuevo post e incrementa el \`post_count\`:

\`\`\`rust
pub fn create_post(
    ctx: Context<CreatePost>,
    title: String,
    content: String,
) -> Result<()> {
    require!(title.len() <= 50, BlogError::TituloMuitoLongo);
    require!(content.len() <= 500, BlogError::ConteudoMuitoLongo);

    let post = &mut ctx.accounts.blog_post;
    let author = &mut ctx.accounts.author_profile;

    post.author = ctx.accounts.user.key();
    post.post_id = author.post_count;
    post.title = title;
    post.content = content;
    post.timestamp = Clock::get()?.unix_timestamp;
    post.updated = false;
    post.bump = ctx.bumps.blog_post;

    author.post_count += 1;
    Ok(())
}
\`\`\`

### 3. update_post

Actualiza el título y/o contenido de un post existente:

\`\`\`rust
pub fn update_post(
    ctx: Context<UpdatePost>,
    new_title: String,
    new_content: String,
) -> Result<()> {
    let post = &mut ctx.accounts.blog_post;
    post.title = new_title;
    post.content = new_content;
    post.updated = true;
    Ok(())
}
\`\`\`

## Structs de cuentas

\`\`\`rust
#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + BlogPost::INIT_SPACE,
        seeds = [
            b"post",
            user.key().as_ref(),
            &author_profile.post_count.to_le_bytes(),
        ],
        bump,
    )]
    pub blog_post: Account<'info, BlogPost>,

    #[account(
        mut,
        seeds = [b"author", user.key().as_ref()],
        bump = author_profile.bump,
        has_one = authority @ BlogError::NaoAutorizado,
    )]
    pub author_profile: Account<'info, AuthorProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Calculando el space

\`\`\`
BlogPost:
  discriminator: 8
  author (Pubkey): 32
  post_id (u64): 8
  title (String, max 50): 4 + 50 = 54
  content (String, max 500): 4 + 500 = 504
  timestamp (i64): 8
  updated (bool): 1
  bump (u8): 1
  Total: 8 + 32 + 8 + 54 + 504 + 8 + 1 + 1 = 616 bytes
\`\`\`

## Leyendo posts en el client

\`\`\`typescript
// Listar todos los posts de un autor
for (let i = 0; i < authorProfile.postCount.toNumber(); i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("post"),
      authorPubkey.toBuffer(),
      new BN(i).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
  console.log(\`Post #\${i}: \${post.title}\`);
}
\`\`\``,
    exerciseQuestion:
      "En el blog on-chain, ¿cómo garantizan las seeds de la PDA del BlogPost la unicidad de cada post?",
    exerciseOptions: [
      "Usando solo el título del post como seed",
      "Usando el timestamp del bloque como seed",
      "Combinando la pubkey del autor con el post_id secuencial en las seeds",
      "Generando un UUID aleatorio como seed",
    ],
    challengePrompt:
      "Completa el programa Anchor de blog on-chain: define los structs AuthorProfile y BlogPost, implementa initialize_author y create_post con validaciones, y configura los errores personalizados.",
  },
});
