import { registerLessonContent } from "./courses-i18n";

// ═══════════════════════════════════════════════════════════════
// English (EN) translations — Courses 1-3
// ═══════════════════════════════════════════════════════════════

registerLessonContent("en", {
  // ── Course 1: Solana Fundamentals ───────────────────────────

  "sf-l1": {
    content: `# What is Solana?

Solana is a **high-performance** blockchain created by Anatoly Yakovenko in 2017 and officially launched in March 2020. It was designed from the ground up to solve the **blockchain trilemma**: scalability, security, and decentralization.

## Key Features

- **Throughput**: up to **65,000 transactions per second** (TPS), far above traditional blockchains
- **Latency**: confirmation time of approximately **400 milliseconds**
- **Cost**: transactions cost fractions of a cent (typically ~$0.00025)
- **Language**: programs (smart contracts) written in **Rust**, C, or C++

## Proof of History (PoH)

Solana's great innovation is **Proof of History**, a cryptographic clock that creates a verifiable sequence of events over time. This allows validators to agree on the **order of transactions** without needing to constantly communicate with each other.

\`\`\`
Bloco N -> Hash(Bloco N) -> Hash(Hash(Bloco N)) -> Bloco N+1
\`\`\`

Each hash serves as **proof that time has passed**, creating a historical record before consensus even takes place.

## Solana vs Ethereum

| Feature | Solana | Ethereum |
|---|---|---|
| TPS | ~65,000 | ~15-30 |
| Block time | ~400ms | ~12s |
| Average cost | ~$0.00025 | ~$1-50 |
| Language | Rust | Solidity |
| Consensus | PoH + Tower BFT | PoS (Casper) |

## Why Learn Solana?

1. **Growing ecosystem**: DeFi, NFTs, gaming, payments
2. **Developer experience**: mature tooling (Anchor, Solana CLI)
3. **Active community**: hackathons, grants, and accelerator programs
4. **Real performance**: ideal for applications that demand speed`,
    exerciseQuestion:
      "What is Solana's main innovation that enables high-performance transaction ordering?",
    exerciseOptions: [
      "Proof of Work (PoW)",
      "Proof of History (PoH)",
      "Proof of Stake (PoS)",
      "Sharding",
    ],
  },

  "sf-l2": {
    content: `# Solana Architecture

Solana has a unique architecture composed of **8 technological innovations** that work together to achieve high performance.

## Validators

**Validators** are the nodes that process transactions and maintain the state of the network. Anyone can run a validator, contributing to decentralization.

- **Leader**: the validator selected to produce blocks in a slot
- **Voter**: validators that vote to confirm blocks
- **RPC Nodes**: nodes that serve data to applications (do not vote)

## Clusters

A cluster is a set of validators working together. There are 3 main clusters:

- **Mainnet-beta**: main network (production)
- **Devnet**: development network (tokens with no real value)
- **Testnet**: network for testing protocol updates

## Slots and Epochs

- **Slot**: a period of ~400ms where a leader can produce a block
- **Epoch**: a set of **432,000 slots** (~2-3 days), at the end of which leader rotation and reward distribution occur

\`\`\`
Epoch 1: [Slot 0] [Slot 1] [Slot 2] ... [Slot 431.999]
Epoch 2: [Slot 432.000] [Slot 432.001] ...
\`\`\`

## Tower BFT

**Tower BFT** is Solana's consensus implementation, based on PBFT (Practical Byzantine Fault Tolerance) but optimized using PoH as a clock.

- Validators vote on chain forks
- Each vote has an increasing (exponential) **lockout**
- The older the vote, the more expensive it is to switch forks
- This drastically reduces the communication needed between validators

## Gulf Stream

**Gulf Stream** eliminates the traditional mempool. Instead of transactions waiting in a pool:

1. Clients send transactions directly to the **next leader**
2. Validators cache and forward transactions in advance
3. The leader already has transactions ready when its slot begins

This reduces confirmation latency and validator memory usage.

## Turbine

**Turbine** is the block propagation protocol, inspired by BitTorrent:

- Blocks are split into **small packets** (shreds)
- Each validator relays packets to neighbors
- Propagation happens in a **tree**, not broadcast`,
    exerciseQuestion: 'What is a "slot" in Solana\'s architecture?',
    exerciseOptions: [
      "A type of account that stores tokens",
      "The ~400ms period where a leader can produce a block",
      "An on-chain program that validates transactions",
      "The public address of a validator",
    ],
  },

  "sf-l3": {
    content: `# Accounts and the Account Model

In Solana, **everything is an account**. Unlike UTXO-based blockchains (like Bitcoin), Solana uses an account model similar to a database.

## Account Structure

Every account on Solana has the following fields:

\`\`\`rust
pub struct Account {
    pub lamports: u64,        // saldo em lamports (1 SOL = 1 bilhão de lamports)
    pub data: Vec<u8>,        // dados arbitrários (bytes)
    pub owner: Pubkey,        // programa que controla esta conta
    pub executable: bool,     // se é um programa executável
    pub rent_epoch: u64,      // próxima epoch para cobrança de rent
}
\`\`\`

## Fundamental Concepts

### Owner

- Every account has an **owner** — the program that can modify its data
- By default, new accounts are owned by the **System Program**
- Only the owner can debit lamports and modify data
- Any account can **credit** lamports to another account

### Lamports

- **1 SOL = 1,000,000,000 lamports** (10^9)
- Lamports are the atomic unit of value on Solana
- Every account must maintain a minimum balance to pay **rent**

### Rent

Rent is the cost of keeping data stored on the blockchain:

- Accounts with sufficient balance are **rent-exempt**
- The minimum for rent-exemption depends on the **data size**
- Formula: ~0.00089088 SOL per byte per year (2-year reserve)

\`\`\`bash
# Calcular rent-exemption para 100 bytes
solana rent 100
# Resultado: Rent-exempt minimum: 0.00144768 SOL
\`\`\`

### Data

- The \`data\` field stores arbitrary bytes
- For **program accounts**: contains compiled BPF bytecode
- For **data accounts**: stores serialized state (Borsh, JSON, etc.)

## Common Account Types

| Type | Owner | Usage |
|---|---|---|
| Wallet | System Program | Store SOL |
| Token Mint | Token Program | Define a token type |
| Token Account | Token Program | A user's token balance |
| Program | BPF Loader | Executable code |
| PDA | Any program | Program-controlled data |

## Program Derived Addresses (PDAs)

PDAs are addresses **derived deterministically** from seeds and a program ID:

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed"), userPubkey.toBuffer()],
  programId
);
\`\`\`

- They have no private key (cannot sign)
- They are controlled exclusively by the program that derived them
- They are fundamental for storing on-chain state`,
    exerciseQuestion:
      "Which field of a Solana account determines which program can modify its data?",
    exerciseOptions: ["lamports", "data", "owner", "rent_epoch"],
  },

  "sf-l4": {
    content: `# Transactions and Instructions

A **transaction** is the atomic unit of state change on Solana. Each transaction contains one or more **instructions** that are executed sequentially.

## Anatomy of a Transaction

\`\`\`typescript
interface Transaction {
  signatures: Signature[];       // assinaturas dos signatários
  message: {
    header: MessageHeader;       // contagem de signatários
    accountKeys: PublicKey[];    // todas as contas envolvidas
    recentBlockhash: string;    // hash recente para expiração
    instructions: Instruction[]; // lista de instruções
  };
}
\`\`\`

### Main Components

1. **Signatures**: each signer signs the message hash with Ed25519
2. **Account Keys**: ordered list of all referenced accounts
3. **Recent Blockhash**: a recent hash (~60s validity) that prevents replay attacks
4. **Instructions**: the operations to be executed

## Instructions

Each instruction specifies:

\`\`\`typescript
interface Instruction {
  programId: PublicKey;           // programa a ser invocado
  keys: AccountMeta[];            // contas necessárias
  data: Buffer;                   // dados serializados para o programa
}

interface AccountMeta {
  pubkey: PublicKey;
  isSigner: boolean;              // precisa assinar?
  isWritable: boolean;            // será modificada?
}
\`\`\`

## Signers

- The **fee payer** is always the first signer
- Signers prove authorization for operations (e.g., transferring SOL)
- A transaction can have **multiple signers**

## Recent Blockhash

- Serves as a **nonce** to prevent transaction replay
- Expires in approximately **60 seconds** (~150 slots)
- If the transaction is not processed in time, it is discarded
- Alternative: **Durable Nonces** for transactions that need more time

## Example: SOL Transfer

\`\`\`typescript
import {
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver,
    lamports: 1_000_000_000, // 1 SOL
  })
);

const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender] // signatários
);
\`\`\`

## Important Limits

- Maximum transaction size: **1232 bytes**
- Maximum accounts per transaction: **64**
- Default compute units: **200,000** (can request up to 1.4M)
- Maximum instructions: no fixed limit (limited by size)

## Lifecycle

1. Client creates and signs the transaction
2. Transaction is sent to an RPC node
3. RPC forwards to the current leader (Gulf Stream)
4. Leader verifies signatures and executes instructions
5. If all instructions succeed, state is committed
6. Transaction is propagated and voted on by validators`,
    exerciseQuestion:
      'What is the purpose of the "recent blockhash" in a Solana transaction?',
    exerciseOptions: [
      "To identify the program that will be executed",
      "To prevent replay attacks and define the temporal validity of the transaction",
      "To store the fee payer's balance",
      "To encrypt the transaction data",
    ],
  },

  "sf-l5": {
    content: `# On-Chain Programs

In Solana, "smart contracts" are called **programs**. They are executable code stored in special accounts on the blockchain.

## Programs vs Smart Contracts

Unlike other blockchains, Solana programs are **stateless**:

- The **code** is separate from the **data**
- Programs receive accounts as parameters and operate on them
- This enables parallelization: transactions that touch different accounts run in parallel

## BPF / SBF

Solana programs are compiled to **SBF** (Solana Bytecode Format, formerly eBPF):

\`\`\`
Código Rust → Compilador → Bytecode SBF → Deploy na blockchain
\`\`\`

- Deterministic and safe execution in a sandbox
- Runtime validates memory and compute limits
- Programs can be **upgradeable** or **immutable**

## Native Programs (Built-in)

Solana comes with several essential native programs:

### System Program
- **ID**: \`11111111111111111111111111111111\`
- Creates new accounts
- Transfers SOL
- Assigns ownership to other programs

### Token Program (SPL Token)
- **ID**: \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Creates and manages fungible tokens
- Mint, transfer, burn, freeze

### Token-2022 (Token Extensions)
- **ID**: \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`
- Extended version with features like transfer fees, confidential transfers

### Associated Token Account Program
- **ID**: \`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL\`
- Derives deterministic addresses for token accounts

### Metaplex Token Metadata
- Manages token and NFT metadata (name, symbol, URI)

## Anatomy of a Program

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,        // ID do programa
    accounts: &[AccountInfo],    // contas passadas pela instrução
    instruction_data: &[u8],     // dados da instrução
) -> ProgramResult {
    // Lógica do programa aqui
    Ok(())
}
\`\`\`

## Deploy and Upgrades

- Programs are deployed with \`solana program deploy\`
- By default, programs are **upgradeable** (the upgrade authority can update them)
- The upgrade authority can be renounced, making the program **immutable**
- The bytecode is stored in separate program accounts (program data account)

## Cross-Program Invocations (CPIs)

Programs can call other programs:

\`\`\`rust
// Invocar System Program para transferir SOL
invoke(
    &system_instruction::transfer(from, to, amount),
    &[from_info, to_info, system_program_info],
)?;
\`\`\`

This enables composability — the foundation of DeFi!`,
    exerciseQuestion: 'Why are Solana programs called "stateless"?',
    exerciseOptions: [
      "Because they cannot be updated after deployment",
      "Because code is separate from data — programs receive accounts as parameters",
      "Because they cannot interact with other programs",
      "Because they do not need compilation",
    ],
  },

  "sf-l6": {
    content: `# Solana CLI in Practice

Let's get hands-on and use the **Solana CLI** to interact with the blockchain.

## Installation

### macOS / Linux

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

Add to PATH:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Verify the installation:

\`\`\`bash
solana --version
# solana-cli 1.18.x
\`\`\`

## Configuration

Connect to **devnet** (development network):

\`\`\`bash
solana config set --url devnet
# or the shorthand:
solana config set -u d
\`\`\`

Verify the configuration:

\`\`\`bash
solana config get
\`\`\`

## Creating a Keypair

\`\`\`bash
solana-keygen new --outfile ~/my-keypair.json
# Gera uma nova chave pública/privada
\`\`\`

View your address:

\`\`\`bash
solana address
\`\`\`

## Airdrop (Free SOL on devnet)

\`\`\`bash
solana airdrop 2
# Solicita 2 SOL na devnet
\`\`\`

Check your balance:

\`\`\`bash
solana balance
# 2 SOL
\`\`\`

## Exploring the Blockchain

\`\`\`bash
# Ver informações de uma conta
solana account <ENDERECO>

# Ver uma transação
solana confirm <SIGNATURE>

# Ver informações do cluster
solana cluster-version
\`\`\`

## Challenge

In the editor beside, complete the script that uses the Solana CLI to: create a keypair, request an airdrop, and check the balance.`,
    exerciseQuestion:
      "Which Solana CLI command is used to request free SOL on devnet?",
    exerciseOptions: [
      "solana transfer",
      "solana airdrop",
      "solana mint",
      "solana request",
    ],
    challengePrompt:
      "Complete the script that creates a keypair, requests an airdrop of 2 SOL on devnet, and checks the balance.",
  },

  "sf-l7": {
    content: `# Your First Transaction

Now let's create and send a **SOL transfer** on devnet using the \`@solana/web3.js\` library.

## Concepts Reviewed

To send a transaction, we need:

1. **Connection**: connection to an RPC node
2. **Keypair**: sender's key (to sign)
3. **Transaction**: object containing the instructions
4. **Instruction**: the operation (SOL transfer)

## Step by Step

### 1. Import dependencies

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
\`\`\`

### 2. Create the transfer instruction

\`\`\`typescript
const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: new PublicKey('ENDERECO_DESTINO'),
  lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
});
\`\`\`

### 3. Build and send the transaction

\`\`\`typescript
const tx = new Transaction().add(instruction);
const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender]
);
console.log('Transação confirmada:', signature);
\`\`\`

### 4. Verify on the Explorer

Visit: \`https://explorer.solana.com/tx/SIGNATURE?cluster=devnet\`

## Challenge

Complete the code in the editor to send 0.5 SOL from one wallet to another on devnet.`,
    exerciseQuestion:
      "Which native Solana program is responsible for SOL transfers?",
    exerciseOptions: [
      "Token Program",
      "Associated Token Account Program",
      "System Program",
      "BPF Loader",
    ],
    challengePrompt:
      "Send a transfer of 0.5 SOL from the sender to the receiver on devnet.",
  },

  // ── Course 2: DeFi Developer ────────────────────────────────

  "df-l1": {
    content: `# Introduction to DeFi

**DeFi** (Decentralized Finance) is the ecosystem of financial applications built on blockchains, without traditional intermediaries like banks.

## What is DeFi?

DeFi allows anyone in the world to access financial services using just a crypto wallet:

- **Lending and borrowing** without a bank (e.g., Solend, MarginFi)
- **Token swaps** without an exchange (e.g., Jupiter, Raydium)
- **Yield** on deposited assets (yield farming)
- **Decentralized stablecoins** (e.g., UXD)

## Total Value Locked (TVL)

**TVL** is the main DeFi metric — the total value of assets deposited in protocols:

\`\`\`
TVL do Solana DeFi: ~$5-10 bilhões (varia com mercado)
Principais protocolos: Jupiter, Raydium, Marinade, Jito
\`\`\`

You can track it at [DefiLlama](https://defillama.com/chain/Solana).

## Yield Farming

Yield farming is the practice of depositing assets in protocols to earn returns:

1. **Providing liquidity** to pools (LP tokens)
2. **Staking** native tokens
3. **Lending** — lending assets and earning interest
4. **Incentives** in protocol tokens

### Example Flow

\`\`\`
1. Depositar SOL + USDC em pool Raydium
2. Receber LP tokens representando sua posição
3. Fazer stake dos LP tokens para ganhar recompensas
4. Colher (harvest) recompensas periodicamente
\`\`\`

## Liquidity

**Liquidity** is the ease of swapping assets without significantly impacting the price:

- **Liquidity pools**: reserves of token pairs in smart contracts
- **Liquidity Providers (LPs)**: users who deposit tokens into pools
- **Impermanent Loss**: risk of temporary loss compared to HODLing

## DeFi Risks

- **Smart contract risk**: code bugs can drain funds
- **Oracle manipulation**: manipulated prices can cause incorrect liquidations
- **Impermanent loss**: pool imbalance
- **Rug pulls**: malicious projects that run away with funds

## Why Solana for DeFi?

| Advantage | Impact |
|---|---|
| Low fees (~$0.00025) | Frequent operations become viable |
| High speed (~400ms) | Fast arbitrage and liquidations |
| Composability | CPIs enable flash loans in 1 tx |
| On-chain orderbooks | Phoenix, OpenBook — impossible on slow chains |`,
    exerciseQuestion: "What does TVL mean in the context of DeFi?",
    exerciseOptions: [
      "Token Value Listing — the listing price of a token",
      "Total Value Locked — the total value of assets deposited in DeFi protocols",
      "Transaction Validation Layer — the transaction validation layer",
      "Token Verified Liquidity — verified liquidity of a token",
    ],
  },

  "df-l2": {
    content: `# SPL Token: Creating Your Token

The **SPL Token** is the token standard on Solana, equivalent to ERC-20 on Ethereum. Let's understand how to create and manage tokens.

## Fundamental Concepts

### Mint Account

The **Mint** is the account that defines a token type:

\`\`\`rust
pub struct Mint {
    pub mint_authority: Option<Pubkey>,  // quem pode cunhar novos tokens
    pub supply: u64,                      // total em circulação
    pub decimals: u8,                     // casas decimais (ex: 6 para USDC)
    pub is_initialized: bool,
    pub freeze_authority: Option<Pubkey>, // quem pode congelar contas
}
\`\`\`

### Decimals

- **SOL**: 9 decimals (1 SOL = 1,000,000,000 lamports)
- **USDC**: 6 decimals (1 USDC = 1,000,000 units)
- **NFTs**: 0 decimals and supply of 1

### Token Account

Each holder needs a **Token Account** for each token type:

\`\`\`rust
pub struct TokenAccount {
    pub mint: Pubkey,        // qual token
    pub owner: Pubkey,       // dono da conta
    pub amount: u64,         // saldo
    pub delegate: Option<Pubkey>,
    pub state: AccountState,
    pub is_native: Option<u64>,
    pub delegated_amount: u64,
    pub close_authority: Option<Pubkey>,
}
\`\`\`

## Creating a Token via CLI

\`\`\`bash
# 1. Criar o mint
spl-token create-token
# Resultado: Creating token AbC123...

# 2. Criar token account para receber
spl-token create-account AbC123...
# Resultado: Creating account XyZ789...

# 3. Cunhar 1000 tokens
spl-token mint AbC123... 1000
# Resultado: Minting 1000 tokens

# 4. Verificar saldo
spl-token balance AbC123...
# 1000
\`\`\`

## Creating via TypeScript

\`\`\`typescript
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

// 1. Criar mint
const mint = await createMint(
  connection,
  payer,           // quem paga o rent
  mintAuthority,   // quem pode cunhar
  freezeAuthority, // quem pode congelar (ou null)
  6               // decimais
);

// 2. Criar token account
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, owner.publicKey
);

// 3. Cunhar tokens
await mintTo(
  connection, payer, mint, tokenAccount.address,
  mintAuthority, 1000 * 10 ** 6 // 1000 tokens com 6 decimais
);
\`\`\`

## Token Metadata (Metaplex)

To give your token a name, symbol, and image:

\`\`\`typescript
const metadata = {
  name: "Meu Token",
  symbol: "MTK",
  uri: "https://arweave.net/metadata.json", // JSON com imagem
  sellerFeeBasisPoints: 0,
  creators: null,
};
\`\`\`

The URI points to an off-chain JSON containing the token's image and description.`,
    exerciseQuestion:
      'What is the purpose of the "decimals" field in an SPL Token Mint account?',
    exerciseOptions: [
      "It defines the maximum number of tokens that can be minted",
      "It defines the token's precision — how many decimal places it has",
      "It defines the initial price of the token in SOL",
      "It defines how many accounts can hold the token",
    ],
  },

  "df-l3": {
    content: `# Token Accounts and Associated Token Accounts (ATAs)

Understand how Solana manages token balances and why ATAs are so important.

## The Problem

On Solana, each token needs a **separate account** to store the balance. A wallet can have dozens of token accounts:

\`\`\`
Wallet (System Account)
├── Token Account 1 (USDC)
├── Token Account 2 (RAY)
├── Token Account 3 (mSOL)
└── Token Account 4 (JitoSOL)
\`\`\`

But how do you find someone's token account if there can be multiple for the same token?

## Associated Token Accounts (ATAs)

The solution is the **Associated Token Account Program**, which **deterministically derives** a unique address for each (wallet + mint) pair:

\`\`\`typescript
// Derivação da ATA
const ata = PublicKey.findProgramAddressSync(
  [
    walletAddress.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintAddress.toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID
);
\`\`\`

### Advantages of ATAs

1. **Deterministic**: given a wallet and mint, the address is always the same
2. **Unambiguous**: each wallet has exactly 1 ATA per token
3. **Automatic creation**: can be created by anyone (the sender pays)
4. **Universal standard**: all wallets and protocols use ATAs

## PDA (Program Derived Address)

The ATA is a type of **PDA** — an address derived from seeds with no private key:

\`\`\`
Seeds: [wallet_pubkey, token_program_id, mint_pubkey]
        ↓
PDA = SHA256(seeds + program_id + "ProgramDerivedAddress")
        ↓
ATA Address (sem chave privada!)
\`\`\`

## Creating ATAs

\`\`\`typescript
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

// Opção 1: apenas derivar o endereço
const ataAddress = await getAssociatedTokenAddress(mint, owner);

// Opção 2: criar se não existir
const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,   // quem paga o rent
  mint,    // mint do token
  owner    // dono da ATA
);
\`\`\`

## Token Account vs ATA

| Aspect | Token Account | ATA |
|---|---|---|
| Address | Random | Derived (deterministic) |
| Quantity per mint | Multiple | Exactly 1 per wallet |
| Discovery | Must search | Can calculate offline |
| Standard | Generic | Universally adopted |

## Costs

- Creating an ATA costs ~0.00204 SOL (rent-exempt)
- The **sender** typically pays for creating the recipient's ATA
- ATAs can be **closed** to recover the rent`,
    exerciseQuestion:
      "Why do Associated Token Accounts (ATAs) exist on Solana?",
    exerciseOptions: [
      "To enable faster transfers between wallets",
      "To ensure a deterministic and unique address for each wallet + mint pair",
      "To reduce the cost of creating token accounts",
      "To allow tokens to have multiple owners",
    ],
  },

  "df-l4": {
    content: `# Swaps and Liquidity Pools

**AMMs** (Automated Market Makers) are the foundation of DeFi — they allow token swaps without a centralized orderbook.

## What is an AMM?

An AMM is a smart contract that maintains **reserves of two tokens** and allows swaps using a mathematical formula:

\`\`\`
Pool SOL/USDC:
├── Reserva SOL: 1.000 SOL
└── Reserva USDC: 100.000 USDC
→ Preço implícito: 1 SOL = 100 USDC
\`\`\`

## Constant Product Formula (x * y = k)

The most common formula (used by Raydium, Orca):

\`\`\`
x * y = k

Onde:
  x = reserva do token A
  y = reserva do token B
  k = constante (produto)
\`\`\`

### Swap Example

\`\`\`
Estado inicial: x=1000 SOL, y=100000 USDC, k=100.000.000

Usuário quer comprar SOL com 1000 USDC:
  y_new = 100000 + 1000 = 101000
  x_new = k / y_new = 100000000 / 101000 = 990.099
  SOL recebido = 1000 - 990.099 = 9.901 SOL

Preço efetivo: 1000/9.901 ≈ 101.01 USDC/SOL
Preço spot era: 100 USDC/SOL
→ Slippage de ~1%
\`\`\`

## Slippage

**Slippage** is the difference between the expected price and the executed price:

- Large swaps in small pools lead to **high slippage**
- Most protocols allow setting a **slippage tolerance** (e.g., 0.5%)
- If slippage exceeds the tolerance, the transaction **reverts**

\`\`\`typescript
// Definindo slippage de 1%
const slippageBps = 100; // 100 basis points = 1%
const minAmountOut = expectedAmount * (10000 - slippageBps) / 10000;
\`\`\`

## Concentrated Liquidity (CLMM)

Advanced pools (Orca Whirlpools, Raydium CLMM) allow LPs to concentrate liquidity within specific **price ranges**:

\`\`\`
LP tradicional:  |████████████████████████████| (liquidez espalhada)
LP concentrada:  |        ████████████        | (liquidez focada)
                         ↑ preço atual
\`\`\`

**Advantage**: greater capital efficiency (more fees with less capital).

## Liquidity Providers (LPs)

To provide liquidity:

1. Deposit **both tokens** of the pair in the correct ratio
2. Receive **LP tokens** representing your position
3. Earn **fees** proportional to your share
4. Risk: **impermanent loss** if prices diverge

## AMMs on Solana

| Protocol | Type | Highlight |
|---|---|---|
| Raydium | CPMM + CLMM | Highest TVL, integrated with OpenBook |
| Orca | CLMM (Whirlpools) | User-friendly UX, efficient |
| Meteora | DLMM | Dynamic liquidity, zero slippage in ranges |
| Phoenix | Orderbook | On-chain order book, tight spreads |`,
    exerciseQuestion:
      "In the constant product formula (x * y = k), what happens when a user makes a large swap in a small pool?",
    exerciseOptions: [
      "The token price decreases",
      "The constant k changes to accommodate the swap",
      "Slippage is high — the effective price diverges significantly from the spot price",
      "The transaction is automatically canceled",
    ],
  },

  "df-l5": {
    content: `# Integrating with Jupiter

**Jupiter** is the leading swap aggregator on Solana. It finds the best route across dozens of DEXs to get the best price.

## Why Use Jupiter?

Instead of integrating individually with Raydium, Orca, Meteora, etc., Jupiter:

- **Aggregates routes** from 20+ DEXs
- Finds the **best price** automatically
- Supports **split routes** (splits the swap across multiple pools)
- Handles **intermediate tokens** (e.g., SOL -> mSOL -> USDC)

## Jupiter API v6

### 1. Get Quote

\`\`\`typescript
const quoteUrl = 'https://quote-api.jup.ag/v6/quote';
const params = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000', // 1 SOL em lamports
  slippageBps: '50',    // 0.5% slippage
});

const quoteResponse = await fetch(\`\${quoteUrl}?\${params}\`);
const quote = await quoteResponse.json();

console.log('Melhor rota:', quote.routePlan);
console.log('Output estimado:', quote.outAmount);
\`\`\`

### 2. Get Transaction to Sign

\`\`\`typescript
const swapUrl = 'https://quote-api.jup.ag/v6/swap';
const swapResponse = await fetch(swapUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
  }),
});

const { swapTransaction } = await swapResponse.json();
\`\`\`

### 3. Sign and Send

\`\`\`typescript
import { VersionedTransaction } from '@solana/web3.js';

const txBuf = Buffer.from(swapTransaction, 'base64');
const transaction = VersionedTransaction.deserialize(txBuf);

// Assinar com a wallet
transaction.sign([wallet]);

// Enviar
const txId = await connection.sendRawTransaction(
  transaction.serialize()
);
await connection.confirmTransaction(txId);
console.log('Swap executado:', txId);
\`\`\`

## Jupiter SDK (@jup-ag/api)

To simplify integration, there is the official SDK:

\`\`\`typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiter = createJupiterApiClient();

// Quote
const quote = await jupiter.quoteGet({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1_000_000_000,
  slippageBps: 50,
});

// Swap
const swap = await jupiter.swapPost({
  swapRequest: {
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
  },
});
\`\`\`

## Integration Tips

- Always use **slippage tolerance** (50-100 bps is reasonable)
- Check **priceImpactPct** in the quote response
- Use **wrapAndUnwrapSol: true** to handle wrapped SOL automatically
- Jupiter also supports **DCA** (Dollar Cost Average) and **Limit Orders**`,
    exerciseQuestion:
      "What is the main advantage of using Jupiter instead of integrating directly with a specific DEX?",
    exerciseOptions: [
      "Jupiter charges lower fees than other DEXs",
      "Jupiter aggregates routes from multiple DEXs to find the best price",
      "Jupiter allows creating new tokens automatically",
      "Jupiter only works on mainnet, ensuring security",
    ],
  },

  "df-l6": {
    content: `# Yield Farming and Staking

Learn how to generate returns on your assets in the Solana DeFi ecosystem.

## SOL Staking

Staking is the simplest way to generate yield: you delegate SOL to a validator and receive rewards.

### Native Staking

\`\`\`bash
# Criar stake account e delegar
solana create-stake-account stake-keypair.json 100  # 100 SOL
solana delegate-stake stake-keypair.json <VALIDATOR_VOTE_PUBKEY>

# Verificar status
solana stake-account stake-keypair.json
\`\`\`

- **APY**: ~6-8% per year
- **Lockup**: must wait 1 epoch (~2 days) to deactivate
- **Risk**: minimal (only risk of validator downtime)

## Liquid Staking

**Liquid staking** solves the lockup problem: you receive a **derivative token** that you can use in DeFi while still earning staking rewards.

### Main Liquid Staking Tokens (LSTs)

| Token | Protocol | Feature |
|---|---|---|
| mSOL | Marinade | Oldest, high liquidity |
| jitoSOL | Jito | Includes MEV rewards |
| bSOL | BlazeStake | Decentralized stake distribution |
| hSOL | Helius | Staking via Helius validators |

### How It Works

\`\`\`
1. Deposite 100 SOL no Marinade
2. Receba ~95.5 mSOL (taxa de câmbio cresce com rewards)
3. Use mSOL em DeFi (pool SOL/mSOL, colateral, etc.)
4. Quando quiser, troque mSOL → SOL (resgate)
\`\`\`

The mSOL/SOL exchange rate **grows continuously** because rewards are accumulated in the price.

## Yield Farming

Yield farming combines multiple strategies to maximize returns:

### 1. Providing Liquidity (LP)

\`\`\`
Depositar SOL + USDC em pool Raydium
→ Receber LP tokens
→ Ganhar fees de trading (~0.25% por swap)
→ APY depende do volume de trading
\`\`\`

### 2. LP Token Staking

\`\`\`
LP tokens do par SOL/USDC
→ Stake em farm do Raydium
→ Ganhar tokens RAY como recompensa
→ APR adicional sobre as fees
\`\`\`

### 3. Leveraged Farming

\`\`\`
Depositar colateral (ex: SOL)
→ Emprestar mais tokens (alavancagem)
→ Fornecer liquidez com valor ampliado
→ Maior yield, mas maior risco de liquidação
\`\`\`

## Calculating APY vs APR

\`\`\`
APR (Annual Percentage Rate) = rendimento simples
APY (Annual Percentage Yield) = com reinvestimento (compound)

APY = (1 + APR/n)^n - 1

Exemplo: APR de 20%, compound diário (n=365):
APY = (1 + 0.20/365)^365 - 1 = 22.13%
\`\`\`

## Risks

- **Impermanent Loss**: price variation between the tokens in the pair
- **Smart contract risk**: bugs can drain pools
- **Unsustainable yields**: very high APYs are usually temporary
- **Liquidation**: in leveraged farming`,
    exerciseQuestion:
      "What is the main advantage of liquid staking (like mSOL or jitoSOL) compared to native SOL staking?",
    exerciseOptions: [
      "Liquid staking offers a higher APY than native staking",
      "Liquid staking has no risk at all",
      "You receive a derivative token that can be used in DeFi while you continue earning staking rewards",
      "Liquid staking does not require validators",
    ],
  },

  "df-l7": {
    content: `# Price Oracles

**Oracles** are systems that bring external data to the blockchain. In DeFi, price oracles are fundamental for lending, liquidations, and derivatives.

## The Oracle Problem

Blockchains are **deterministic** — they cannot natively access external data. How do you know the price of SOL in USD?

\`\`\`
Mundo real: SOL = $150 USD
                   ↓ como trazer?
Blockchain: precisa do preço para calcular colateral
\`\`\`

## Pyth Network

**Pyth** is the dominant oracle on Solana, with **high-frequency** data provided by market makers and exchanges.

### Features

- **Update frequency**: every ~400ms (every slot!)
- **Sources**: 90+ data providers (exchanges, market makers)
- **Confidence interval**: each price comes with a confidence range
- **Cross-chain**: available on 30+ chains

### Integrating with Pyth

\`\`\`typescript
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';

// Feed ID do SOL/USD
const SOL_USD_FEED = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Obter preço
const priceUpdate = await pythSolanaReceiver.fetchPriceUpdate([SOL_USD_FEED]);

// Ler preço on-chain em um programa
const price = priceUpdate.price; // ex: 15000000000 (com exponent -8)
const expo = priceUpdate.exponent; // -8
const priceUSD = price * 10 ** expo; // 150.00
\`\`\`

### Using in Anchor

\`\`\`rust
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

#[derive(Accounts)]
pub struct CheckPrice<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn check_price(ctx: Context<CheckPrice>) -> Result<()> {
    let price_update = &ctx.accounts.price_update;
    let price = price_update.get_price_no_older_than(
        &Clock::get()?,
        60, // max age em segundos
        &SOL_USD_FEED_ID,
    )?;
    msg!("SOL price: {} x 10^{}", price.price, price.exponent);
    Ok(())
}
\`\`\`

## Switchboard

**Switchboard** is another popular, more configurable oracle:

- Supports **custom data** (not just prices)
- **Verifiable Random Function (VRF)** for on-chain randomness
- Configurable oracle queues

### Use Cases

\`\`\`
Switchboard:
├── Preços de ativos
├── Dados climáticos
├── Resultados esportivos
├── Números aleatórios (VRF)
└── Qualquer dado off-chain
\`\`\`

## Oracle Security

Best practices when using oracles:

1. **Check staleness**: reject prices that are too old
2. **Use confidence interval**: Pyth provides \`confidence\` alongside the price
3. **Multiple sources**: combine Pyth + Switchboard if possible
4. **TWAP**: use time-weighted average price to reduce manipulation

\`\`\`rust
// Verificar que o preço não está stale
require!(
    price.publish_time > clock.unix_timestamp - MAX_STALENESS,
    ErrorCode::StalePriceFeed
);

// Verificar confiança (confidence deve ser < 1% do preço)
require!(
    price.confidence < price.price.unsigned_abs() / 100,
    ErrorCode::PriceConfidenceTooWide
);
\`\`\``,
    exerciseQuestion:
      'Why is it important to check the "staleness" (age) of an oracle price in a DeFi protocol?',
    exerciseOptions: [
      "To ensure the oracle is charging the correct fees",
      "To avoid using outdated prices that could cause incorrect liquidations or manipulation",
      "To verify whether the oracle is Pyth or Switchboard",
      "To correctly calculate the transaction gas cost",
    ],
  },

  "df-l8": {
    content: `# Building a DeFi Vault

Let's build a **simple vault** in Anchor — a program that accepts SOL deposits and allows withdrawals by the owner.

## What is a Vault?

A vault is a smart contract that:

1. **Accepts deposits** of tokens from multiple users
2. **Tracks balances** individually
3. **Allows withdrawals** only by the original depositor
4. Optionally: applies **yield strategies** on the deposits

## Architecture

\`\`\`
VaultState (PDA)
├── authority: Pubkey       // admin do vault
├── total_deposits: u64     // total depositado
└── bump: u8               // PDA bump

UserDeposit (PDA por usuário)
├── user: Pubkey
├── amount: u64
└── deposited_at: i64
\`\`\`

## Program Instructions

### 1. Initialize — create the vault
### 2. Deposit — deposit SOL into the vault
### 3. Withdraw — withdraw SOL from the vault

## Applied Concepts

- **PDAs**: for the vault state and per-user deposits
- **CPI**: SOL transfer via System Program
- **Seeds**: deterministic account derivation
- **Constraints**: authority and balance validation

## Challenge

Complete the Anchor program in the editor beside. You need to:

1. Define the \`VaultState\` and \`UserDeposit\` structs
2. Implement the \`deposit\` instruction
3. Implement the \`withdraw\` instruction with balance validation`,
    exerciseQuestion:
      "In a DeFi vault on Solana, what is the best way to store each user's individual balance?",
    exerciseOptions: [
      "In a global variable in the program",
      "In a PDA derived from the program seeds and the user's address",
      "In the user's wallet data field",
      "In an off-chain JSON file",
    ],
    challengePrompt:
      "Complete the Anchor program for a vault that accepts SOL deposits and withdrawals, tracking per-user balances via PDAs.",
  },

  // ── Course 3: Full Stack dApp ───────────────────────────────

  "fs-l1": {
    content: `# Environment Setup

Before building dApps on Solana, we need to set up our complete development environment.

## Prerequisites

### 1. Rust

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verificar
rustc --version
cargo --version
\`\`\`

### 2. Solana CLI

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configurar devnet
solana config set -u devnet
solana-keygen new  # gerar keypair se não tiver
solana airdrop 5   # SOL para testes
\`\`\`

### 3. Node.js and Yarn

\`\`\`bash
# Node.js 18+
node --version  # v18.x ou superior

# Yarn
npm install -g yarn
\`\`\`

### 4. Anchor CLI

\`\`\`bash
# Instalar via cargo
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Verificar
anchor --version
\`\`\`

## Creating an Anchor Project

\`\`\`bash
anchor init minha-dapp
cd minha-dapp
\`\`\`

## Project Structure

\`\`\`
minha-dapp/
├── Anchor.toml          # Configuração do Anchor
├── Cargo.toml           # Workspace Rust
├── programs/
│   └── minha-dapp/
│       ├── Cargo.toml   # Dependências do programa
│       └── src/
│           └── lib.rs   # Código do programa
├── tests/
│   └── minha-dapp.ts    # Testes em TypeScript
├── app/                 # Frontend (opcional)
├── migrations/
│   └── deploy.ts        # Script de deploy
└── target/              # Build artifacts
\`\`\`

## Anchor.toml

\`\`\`toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
minha_dapp = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
\`\`\`

## Building and Testing

\`\`\`bash
# Build
anchor build

# Ver program ID gerado
solana address -k target/deploy/minha_dapp-keypair.json

# Rodar testes
anchor test
\`\`\`

## IDL (Interface Definition Language)

After building, Anchor generates an **IDL** at \`target/idl/minha_dapp.json\` — the interface that the frontend uses to interact with the program.`,
    exerciseQuestion:
      "Which file defines the interface (IDL) that the frontend uses to interact with an Anchor program?",
    exerciseOptions: [
      "Anchor.toml",
      "programs/src/lib.rs",
      "target/idl/<program_name>.json",
      "tests/<program_name>.ts",
    ],
  },

  "fs-l2": {
    content: `# Anchor: Declaring Programs and Accounts

**Anchor** is the most popular framework for developing Solana programs. It abstracts Solana's complexity using Rust macros.

## Basic Program Structure

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let minha_conta = &mut ctx.accounts.minha_conta;
        minha_conta.data = data;
        minha_conta.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub data: u64,
    pub authority: Pubkey,
}
\`\`\`

## \`#[program]\` — The Main Module

- Defines the program's **entrypoint**
- Each public function is an **instruction**
- Receives \`Context<T>\` as its first parameter
- Additional parameters are the **instruction data**

## \`#[derive(Accounts)]\` — Account Validation

The most powerful Anchor macro. It defines which accounts the instruction expects and how to validate them:

### Account Types

| Type | Usage |
|---|---|
| \`Account<'info, T>\` | Typed account, deserialized automatically |
| \`Signer<'info>\` | Account that must sign the transaction |
| \`Program<'info, T>\` | Reference to a program (e.g., System) |
| \`SystemAccount<'info>\` | System account (wallet) |
| \`UncheckedAccount<'info>\` | Account without verification (use with caution) |

### Common Constraints

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    // Deve assinar a transação
    pub authority: Signer<'info>,

    // Inicializa nova conta, paga por authority
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub nova_conta: Account<'info, MinhaConta>,

    // Conta mutável existente
    #[account(mut)]
    pub conta_existente: Account<'info, MinhaConta>,

    // Conta com PDA (seeds + bump)
    #[account(
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, ConfigConta>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## \`#[account]\` — Data Definition

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub authority: Pubkey,   // 32 bytes
    pub counter: u64,        // 8 bytes
    pub is_active: bool,     // 1 byte
    #[max_len(50)]
    pub name: String,        // 4 + 50 bytes
}
\`\`\`

### Space Calculation

- **Discriminator**: 8 bytes (account hash, added automatically)
- **Pubkey**: 32 bytes
- **u64/i64**: 8 bytes
- **u32/i32**: 4 bytes
- **bool**: 1 byte
- **String**: 4 (length) + max_len bytes
- **Vec<T>**: 4 (length) + max_len * sizeof(T)
- **Option<T>**: 1 + sizeof(T)

\`\`\`rust
// Space total = 8 (disc) + 32 (Pubkey) + 8 (u64) + 1 (bool) + 4+50 (String)
space = 8 + 32 + 8 + 1 + 54 = 103
// Ou use InitSpace para calcular automaticamente!
space = 8 + MinhaConta::INIT_SPACE
\`\`\`

## Init with PDA

\`\`\`rust
#[account(
    init,
    payer = authority,
    space = 8 + MinhaConta::INIT_SPACE,
    seeds = [b"user-data", authority.key().as_ref()],
    bump,
)]
pub user_data: Account<'info, MinhaConta>,
\`\`\`

Anchor automatically:
1. Derives the PDA with the seeds
2. Creates the account via System Program CPI
3. Assigns the owner to your program`,
    exerciseQuestion:
      "In Anchor, what does the attribute #[account(init, payer = authority, space = ...)] do in an Accounts struct?",
    exerciseOptions: [
      "Reads data from an existing account",
      "Transfers tokens between accounts",
      "Creates and initializes a new account, defining who pays the rent and the allocated size",
      "Deletes an existing account",
    ],
  },

  "fs-l3": {
    content: `# Anchor: Instructions and Validation

Learn to write robust instructions with data validation and error handling in Anchor.

## Custom Errors

Define errors specific to your program:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("O counter já atingiu o valor máximo")]
    MaxCounterReached,
    #[msg("Apenas a authority pode executar esta ação")]
    Unauthorized,
    #[msg("Valor inválido: deve ser maior que zero")]
    InvalidValue,
    #[msg("Conta já foi inicializada")]
    AlreadyInitialized,
}
\`\`\`

### Using Errors

\`\`\`rust
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;

    require!(counter.count < 1000, ErrorCode::MaxCounterReached);

    counter.count += 1;
    Ok(())
}
\`\`\`

## Constraint: \`has_one\`

Verifies that a field on the account equals another account passed in:

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    pub authority: Signer<'info>,

    // Verifica que counter.authority == authority.key()
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub counter: Account<'info, Counter>,
}
\`\`\`

Equivalent to:
\`\`\`rust
require_keys_eq!(counter.authority, authority.key(), ErrorCode::Unauthorized);
\`\`\`

## Constraint: \`seeds\` and \`bump\`

To validate and derive PDAs:

\`\`\`rust
#[derive(Accounts)]
pub struct ReadConfig<'info> {
    pub user: Signer<'info>,

    // Valida que config é o PDA correto para este user
    #[account(
        seeds = [b"config", user.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, UserConfig>,
}
\`\`\`

### Dynamic Seeds

\`\`\`rust
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGame<'info> {
    pub player: Signer<'info>,

    #[account(
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump,
    )]
    pub game: Account<'info, Game>,

    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Constraint: \`constraint\`

Arbitrary custom validations:

\`\`\`rust
#[account(
    mut,
    constraint = vault.amount >= withdrawal_amount @ ErrorCode::InsufficientFunds,
    constraint = vault.is_active @ ErrorCode::VaultInactive,
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Constraint: \`close\`

Close an account and return the rent:

\`\`\`rust
#[derive(Accounts)]
pub struct CloseAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Fecha a conta e envia lamports para authority
    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
}
\`\`\`

## Constraint: \`realloc\`

Resize an account (increase or decrease data):

\`\`\`rust
#[account(
    mut,
    realloc = 8 + 32 + 4 + new_name.len(),
    realloc::payer = authority,
    realloc::zero = false,
)]
pub profile: Account<'info, Profile>,
\`\`\`

## Complete Pattern

\`\`\`rust
#[program]
pub mod meu_app {
    use super::*;

    pub fn create_post(ctx: Context<CreatePost>, title: String, body: String) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(!body.is_empty(), ErrorCode::EmptyBody);

        let post = &mut ctx.accounts.post;
        post.author = ctx.accounts.author.key();
        post.title = title;
        post.body = body;
        post.created_at = Clock::get()?.unix_timestamp;
        post.bump = ctx.bumps.post;
        Ok(())
    }
}
\`\`\``,
    exerciseQuestion:
      'In Anchor, what does the constraint "has_one = authority" verify on an account?',
    exerciseOptions: [
      "That the account was created by the System Program",
      'That the "authority" field of the account equals the key of the "authority" account passed in the instruction',
      "That the account has sufficient lamport balance",
      "That the account is a valid PDA",
    ],
  },

  "fs-l4": {
    content: `# Testing with Anchor

Tests are **essential** in Solana development. Anchor makes it easy with TypeScript integration and local simulation.

## anchor test

The \`anchor test\` command does everything automatically:

1. Compiles the program (\`anchor build\`)
2. Starts a local validator (\`solana-test-validator\`)
3. Deploys the program
4. Runs the TypeScript tests
5. Shuts down the validator

\`\`\`bash
anchor test
# Ou, se o validador já está rodando:
anchor test --skip-local-validator
\`\`\`

## Test Structure

\`\`\`typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { MeuPrograma } from '../target/types/meu_programa';
import { expect } from 'chai';

describe('meu-programa', () => {
  // Configurar provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MeuPrograma as Program<MeuPrograma>;
  const authority = provider.wallet;

  it('Inicializa o counter', async () => {
    // Derivar PDA
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    // Executar instrução
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('TX:', tx);

    // Verificar estado
    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(0);
    expect(counterAccount.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
  });

  it('Incrementa o counter', async () => {
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .increment()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
      })
      .rpc();

    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(1);
  });

  it('Falha ao incrementar com authority errada', async () => {
    const fakeUser = anchor.web3.Keypair.generate();

    // Airdrop SOL para o fake user
    const airdropSig = await provider.connection.requestAirdrop(
      fakeUser.publicKey, 1e9
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .increment()
        .accounts({
          authority: fakeUser.publicKey,
          counter: counterPda,
        })
        .signers([fakeUser])
        .rpc();
      expect.fail('Deveria ter falhado');
    } catch (err) {
      expect(err.error.errorCode.code).to.equal('Unauthorized');
    }
  });
});
\`\`\`

## Bankrun — Fast Tests

**Bankrun** (\`solana-bankrun\`) is a faster alternative to the local validator:

\`\`\`typescript
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';

const context = await startAnchor('.', [], []);
const provider = new BankrunProvider(context);
anchor.setProvider(provider);
\`\`\`

Bankrun advantages:
- **10-100x faster** than solana-test-validator
- No need to run a validator
- Full control over state (time travel, set accounts)
- Ideal for **integration tests**

## Tips for Good Tests

1. **Test happy paths and error paths** — verify that errors are thrown correctly
2. **Use derived PDAs** — don't use random accounts
3. **Verify final state** — fetch accounts and compare values
4. **Test permissions** — verify that unauthorized users are rejected
5. **Test edge cases** — zero values, overflow, duplicate accounts

## Debugging

\`\`\`rust
// No programa — logs aparecem nos testes
msg!("Counter value: {}", counter.count);

// Em TypeScript — ver logs da transação
const tx = await program.methods.increment().accounts({...}).rpc();
const txDetails = await provider.connection.getTransaction(tx);
console.log(txDetails.meta.logMessages);
\`\`\``,
    exerciseQuestion:
      "What is the main advantage of Bankrun (solana-bankrun) compared to solana-test-validator for testing?",
    exerciseOptions: [
      "Bankrun supports mainnet deployment",
      "Bankrun is 10-100x faster because it doesn't need to run a full validator",
      "Bankrun only supports Rust tests",
      "Bankrun is the only one that supports Anchor programs",
    ],
  },

  "fs-l5": {
    content: `# Frontend with React and Wallet Adapter

Connect your Solana program to a React frontend using the **Solana Wallet Adapter**.

## Installation

\`\`\`bash
npm install @solana/web3.js @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets \\
  @solana/wallet-adapter-base
\`\`\`

## Provider Setup

\`\`\`tsx
// src/providers/WalletProvider.tsx
import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export const AppWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
\`\`\`

## Connect Wallet Button

\`\`\`tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Navbar() {
  return (
    <nav>
      <h1>Minha dApp</h1>
      <WalletMultiButton />
    </nav>
  );
}
\`\`\`

The \`WalletMultiButton\` automatically:
- Shows a modal with available wallets
- Connects/disconnects
- Displays a truncated address when connected

## Useful Hooks

\`\`\`tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function MeuComponente() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();

  if (!connected) {
    return <p>Conecte sua wallet para continuar</p>;
  }

  return <p>Conectado: {publicKey?.toBase58()}</p>;
}
\`\`\`

### useConnection

- \`connection\`: \`Connection\` instance for making RPC calls

### useWallet

- \`publicKey\`: connected user's public key
- \`connected\`: boolean indicating if connected
- \`signTransaction\`: function to sign transactions
- \`signAllTransactions\`: sign multiple transactions
- \`sendTransaction\`: sign and send
- \`disconnect\`: disconnect wallet

## Sending a Transaction

\`\`\`tsx
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

function SendSOL() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleSend = async () => {
    if (!publicKey) return;

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey('DESTINO...'),
        lamports: 0.1 * LAMPORTS_PER_SOL,
      })
    );

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');
    alert('Enviado! ' + signature);
  };

  return <button onClick={handleSend}>Enviar 0.1 SOL</button>;
}
\`\`\`

## Checking Balance

\`\`\`tsx
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function Balance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  return <p>Saldo: {balance.toFixed(4)} SOL</p>;
}
\`\`\``,
    exerciseQuestion:
      "Which @solana/wallet-adapter-react hook provides access to the connected user's publicKey?",
    exerciseOptions: ["useConnection", "useWallet", "useAnchor", "useSolana"],
  },

  "fs-l6": {
    content: `# Frontend <-> Program Interaction

Learn to use the **IDL** generated by Anchor to interact with your program directly from the React frontend.

## What is the IDL?

The **IDL** (Interface Definition Language) is a JSON that describes your program:

- Available instructions
- Accounts expected by each instruction
- Data types (structs, enums)
- Custom errors

\`\`\`json
{
  "version": "0.1.0",
  "name": "counter",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "counter", "isMut": true, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Counter",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "count", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
        ]
      }
    }
  ]
}
\`\`\`

## Setting Up the Program Client

\`\`\`typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../target/idl/counter.json';
import type { Counter } from '../target/types/counter';

function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program<Counter>(
    idl as Counter,
    provider
  );
}
\`\`\`

## Reading Data (Fetch Accounts)

\`\`\`typescript
function CounterDisplay() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!program || !publicKey) return;

    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), publicKey.toBuffer()],
      program.programId
    );

    // Fetch a conta tipada
    program.account.counter.fetch(counterPda)
      .then((account) => {
        setCount(account.count.toNumber());
      })
      .catch(console.error);
  }, [program, publicKey]);

  return <h2>Counter: {count}</h2>;
}
\`\`\`

## Sending Instructions

\`\`\`typescript
function IncrementButton() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleIncrement = async () => {
    if (!program || !publicKey) return;

    setLoading(true);
    try {
      const [counterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('counter'), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .increment()
        .accounts({
          authority: publicKey,
          counter: counterPda,
        })
        .rpc();

      console.log('TX confirmada:', tx);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleIncrement} disabled={loading}>
      {loading ? 'Enviando...' : 'Incrementar'}
    </button>
  );
}
\`\`\`

## Listening to Account Changes

\`\`\`typescript
useEffect(() => {
  if (!program || !publicKey) return;

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter'), publicKey.toBuffer()],
    program.programId
  );

  // Subscribe para mudanças em tempo real
  const subscriptionId = program.account.counter.subscribe(counterPda)
    .on('change', (account) => {
      setCount(account.count.toNumber());
    });

  return () => {
    // Cleanup
    program.account.counter.unsubscribe(subscriptionId);
  };
}, [program, publicKey]);
\`\`\`

## Error Handling

\`\`\`typescript
import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.increment().accounts({...}).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    console.log('Erro do programa:', err.error.errorMessage);
    console.log('Código:', err.error.errorCode.code);
    // Ex: "O counter já atingiu o valor máximo"
  } else {
    console.log('Erro de rede:', err);
  }
}
\`\`\``,
    exerciseQuestion:
      "How does the React frontend know which instructions and accounts an Anchor program expects?",
    exerciseOptions: [
      "The frontend reads the Rust code directly",
      "Through the IDL (Interface Definition Language) generated by Anchor during the build",
      "The frontend needs to make an RPC call to the program to discover them",
      "The developer must manually rewrite the interfaces in TypeScript",
    ],
  },

  "fs-l7": {
    content: `# Deploying to Devnet and Mainnet

Learn the complete process of deploying Solana programs, from devnet to mainnet.

## Deploying to Devnet

### 1. Build

\`\`\`bash
anchor build
\`\`\`

### 2. Check Program ID

\`\`\`bash
# O program ID é derivado do keypair em target/deploy/
solana address -k target/deploy/meu_programa-keypair.json
# Ex: 7nE4RfQmH2tLm7gQxkV3Pq...
\`\`\`

Update the \`declare_id!\` in \`lib.rs\` and the \`Anchor.toml\` with this ID.

### 3. Deploy

\`\`\`bash
# Garantir que está na devnet
solana config set -u devnet

# Garantir que tem SOL
solana balance
solana airdrop 5  # se precisar

# Deploy
anchor deploy

# Ou especificando o cluster:
anchor deploy --provider.cluster devnet
\`\`\`

### 4. Verify

\`\`\`bash
solana program show <PROGRAM_ID>
# Program Id: 7nE4RfQmH2tLm7gQxkV3Pq...
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Data Length: 245760 (0x3c000) bytes
# Balance: 1.70981 SOL
# Authority: <SEU_WALLET>
# Last Deployed In Slot: 123456789
# Upgradeable
\`\`\`

## Deploying to Mainnet

### Pre-Mainnet Checklist

1. **Tests passing** — \`anchor test\` green
2. **Audit** — code reviewed (ideally by third parties)
3. **Program authority** — decide who controls upgrades
4. **IDL published** — so that explorers show readable instructions

### Process

\`\`\`bash
# Mudar para mainnet
solana config set -u mainnet-beta

# Verificar saldo (precisa de ~3 SOL para deploy)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet

# Publicar IDL (opcional, para Anchor Explorer)
anchor idl init <PROGRAM_ID> --filepath target/idl/meu_programa.json
\`\`\`

## Program Upgrades

Anchor programs are **upgradeable** by default:

\`\`\`bash
# Fazer alterações no código...
anchor build

# Deploy da atualização
anchor upgrade target/deploy/meu_programa.so --program-id <PROGRAM_ID>

# Ou via Anchor:
anchor deploy --program-id <PROGRAM_ID>
\`\`\`

### Upgrade Security

The **upgrade authority** is the wallet that can update the program:

\`\`\`bash
# Ver authority atual
solana program show <PROGRAM_ID>

# Transferir authority para multisig
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <MULTISIG_ADDRESS>

# Tornar imutável (IRREVERSÍVEL!)
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

## Deploy Best Practices

### 1. Multisig Authority
Use **Squads** to manage upgrades via multisig:
- Multiple signatures required for upgrade
- Timelock (waiting period before execution)
- Transparency for users

### 2. Program Verification
Use **Solana Verify** to prove that the on-chain code matches the source code:

\`\`\`bash
solana-verify verify-from-repo \\
  --program-id <PROGRAM_ID> \\
  https://github.com/user/repo
\`\`\`

### 3. Buffer Accounts

For large deploys, use buffer accounts:

\`\`\`bash
# Criar buffer
solana program write-buffer target/deploy/meu_programa.so

# Deploy do buffer
solana program deploy --buffer <BUFFER_ADDRESS>
\`\`\`

### 4. Deploy Cost

| Cluster | Estimated Cost |
|---|---|
| Devnet | Free (airdrop) |
| Mainnet | ~2-5 SOL (depends on program size) |

The cost is proportional to the **bytecode size** (rent-exempt for the program data account).`,
    exerciseQuestion:
      'What happens when you run "solana program set-upgrade-authority <ID> --final"?',
    exerciseOptions: [
      "The program is deleted from the blockchain",
      "The authority is transferred to the System Program",
      "The program becomes immutable — nobody can update it anymore (irreversible)",
      "The program is temporarily paused",
    ],
  },

  "fs-l8": {
    content: `# Final Project: Complete dApp

It's time to build a **complete dApp** from scratch: Anchor program + React frontend + wallet adapter. We'll create a **Counter dApp**.

## Overview

The dApp we'll build:

- **Anchor Program**: Counter with initialize, increment, and decrement
- **React Frontend**: interface to interact with the program
- **Wallet Adapter**: connect Phantom/Solflare
- **Deploy**: functional on devnet

## Architecture

\`\`\`
┌─────────────────────────┐
│    Frontend (React)      │
│  ┌───────────────────┐  │
│  │  Wallet Adapter    │  │
│  │  (Phantom, etc.)   │  │
│  └────────┬──────────┘  │
│           │              │
│  ┌────────▼──────────┐  │
│  │  Program Client    │  │
│  │  (IDL + Anchor)    │  │
│  └────────┬──────────┘  │
└───────────┼──────────────┘
            │ RPC
┌───────────▼──────────────┐
│  Programa Solana (Anchor) │
│  ┌───────────────────┐   │
│  │  initialize()      │   │
│  │  increment()       │   │
│  │  decrement()       │   │
│  └───────────────────┘   │
│  ┌───────────────────┐   │
│  │  Counter (PDA)     │   │
│  │  - count: u64      │   │
│  │  - authority: Pk   │   │
│  │  - bump: u8        │   │
│  └───────────────────┘   │
└───────────────────────────┘
\`\`\`

## What You Need to Implement

### Program (Rust/Anchor)

1. **initialize**: create the counter PDA with count=0
2. **increment**: add 1 to count (authority only)
3. **decrement**: subtract 1 from count (authority only, minimum 0)

### Frontend (React/TypeScript)

1. Connect wallet button
2. Display current counter value
3. Increment and decrement buttons
4. Loading state during transactions
5. Friendly error messages

## Challenge

In the editor beside, complete the Anchor Counter program. The frontend will be built as an extension of this exercise.`,
    exerciseQuestion:
      "What is the correct sequence for building and publishing a full-stack dApp on Solana?",
    exerciseOptions: [
      "Frontend first, then the program, then tests",
      "Deploy to mainnet first, then tests, then frontend",
      "Anchor Program -> Tests -> Frontend with Wallet Adapter -> Deploy",
      "Tests first, then program, then frontend",
    ],
    challengePrompt:
      "Complete the Anchor program for a Counter dApp with initialize, increment, and decrement instructions. The counter should use a PDA, have authority control, and not allow decrement below 0.",
  },
});

// ═══════════════════════════════════════════════════════════════
// Spanish (ES) translations — Courses 1-3
// ═══════════════════════════════════════════════════════════════

registerLessonContent("es", {
  // ── Curso 1: Fundamentos de Solana ──────────────────────────

  "sf-l1": {
    content: `# ¿Qué es Solana?

Solana es una blockchain de **alto rendimiento** creada por Anatoly Yakovenko en 2017 y lanzada oficialmente en marzo de 2020. Fue diseñada desde cero para resolver el **trilema de la blockchain**: escalabilidad, seguridad y descentralización.

## Características Principales

- **Throughput**: hasta **65.000 transacciones por segundo** (TPS), muy por encima de blockchains tradicionales
- **Latencia**: tiempo de confirmación de aproximadamente **400 milisegundos**
- **Costo**: las transacciones cuestan fracciones de centavo (generalmente ~$0.00025)
- **Lenguaje**: programas (smart contracts) escritos en **Rust**, C o C++

## Proof of History (PoH)

La gran innovación de Solana es el **Proof of History**, un reloj criptográfico que crea una secuencia verificable de eventos en el tiempo. Esto permite que los validadores acuerden sobre el **orden de las transacciones** sin necesidad de comunicarse constantemente entre sí.

\`\`\`
Bloco N -> Hash(Bloco N) -> Hash(Hash(Bloco N)) -> Bloco N+1
\`\`\`

Cada hash sirve como **prueba de que el tiempo ha pasado**, creando un registro histórico antes incluso del consenso.

## Solana vs Ethereum

| Característica | Solana | Ethereum |
|---|---|---|
| TPS | ~65.000 | ~15-30 |
| Tiempo de bloque | ~400ms | ~12s |
| Costo promedio | ~$0.00025 | ~$1-50 |
| Lenguaje | Rust | Solidity |
| Consenso | PoH + Tower BFT | PoS (Casper) |

## ¿Por qué aprender Solana?

1. **Ecosistema en crecimiento**: DeFi, NFTs, gaming, pagos
2. **Experiencia de desarrollador**: herramientas maduras (Anchor, Solana CLI)
3. **Comunidad activa**: hackathons, grants y programas de aceleración
4. **Rendimiento real**: ideal para aplicaciones que exigen velocidad`,
    exerciseQuestion:
      "¿Cuál es la principal innovación de Solana que permite alto rendimiento en el ordenamiento de transacciones?",
    exerciseOptions: [
      "Proof of Work (PoW)",
      "Proof of History (PoH)",
      "Proof of Stake (PoS)",
      "Sharding",
    ],
  },

  "sf-l2": {
    content: `# Arquitectura de Solana

Solana posee una arquitectura única compuesta por **8 innovaciones tecnológicas** que trabajan juntas para alcanzar alto rendimiento.

## Validadores

Los **validadores** son los nodos que procesan transacciones y mantienen el estado de la red. Cualquier persona puede ejecutar un validador, contribuyendo a la descentralización.

- **Leader**: el validador seleccionado para producir bloques en un slot
- **Voter**: validadores que votan para confirmar bloques
- **RPC Nodes**: nodos que sirven datos a las aplicaciones (no votan)

## Clusters

Un cluster es un conjunto de validadores trabajando juntos. Existen 3 clusters principales:

- **Mainnet-beta**: red principal (producción)
- **Devnet**: red de desarrollo (tokens sin valor real)
- **Testnet**: red para probar actualizaciones del protocolo

## Slots y Epochs

- **Slot**: período de ~400ms donde un leader puede producir un bloque
- **Epoch**: conjunto de **432.000 slots** (~2-3 días), al final del cual ocurre la rotación de leaders y la distribución de recompensas

\`\`\`
Epoch 1: [Slot 0] [Slot 1] [Slot 2] ... [Slot 431.999]
Epoch 2: [Slot 432.000] [Slot 432.001] ...
\`\`\`

## Tower BFT

**Tower BFT** es la implementación de consenso de Solana, basada en PBFT (Practical Byzantine Fault Tolerance), pero optimizada usando PoH como reloj.

- Los validadores votan en forks de la chain
- Cada voto tiene un **lockout** creciente (exponencial)
- Cuanto más antiguo el voto, más caro es cambiar de fork
- Esto reduce drásticamente la comunicación necesaria entre validadores

## Gulf Stream

**Gulf Stream** elimina el mempool tradicional. En vez de que las transacciones esperen en un pool:

1. Los clientes envían transacciones directamente al **próximo leader**
2. Los validadores cachean y reenvían transacciones anticipadamente
3. El leader ya tiene transacciones listas cuando comienza su slot

Esto reduce la latencia de confirmación y el uso de memoria de los validadores.

## Turbine

**Turbine** es el protocolo de propagación de bloques, inspirado en BitTorrent:

- Los bloques se dividen en **paquetes pequeños** (shreds)
- Cada validador reenvía paquetes a sus vecinos
- La propagación ocurre en **árbol**, no por broadcast`,
    exerciseQuestion: '¿Qué es un "slot" en la arquitectura de Solana?',
    exerciseOptions: [
      "Un tipo de cuenta que almacena tokens",
      "El período de ~400ms donde un leader puede producir un bloque",
      "Un programa on-chain que valida transacciones",
      "La dirección pública de un validador",
    ],
  },

  "sf-l3": {
    content: `# Cuentas y el Modelo de Cuentas

En Solana, **todo es una cuenta**. A diferencia de blockchains basadas en UTXO (como Bitcoin), Solana usa un modelo de cuentas similar a una base de datos.

## Estructura de una Cuenta

Toda cuenta en Solana posee los siguientes campos:

\`\`\`rust
pub struct Account {
    pub lamports: u64,        // saldo em lamports (1 SOL = 1 bilhão de lamports)
    pub data: Vec<u8>,        // dados arbitrários (bytes)
    pub owner: Pubkey,        // programa que controla esta conta
    pub executable: bool,     // se é um programa executável
    pub rent_epoch: u64,      // próxima epoch para cobrança de rent
}
\`\`\`

## Conceptos Fundamentales

### Owner (Propietario)

- Cada cuenta tiene un **owner** — el programa que puede modificar sus datos
- Por defecto, las cuentas nuevas son propiedad del **System Program**
- Solo el owner puede debitar lamports y modificar data
- Cualquier cuenta puede **acreditar** lamports a otra cuenta

### Lamports

- **1 SOL = 1.000.000.000 lamports** (10^9)
- Los lamports son la unidad atómica de valor en Solana
- Toda cuenta necesita mantener un saldo mínimo para pagar **rent**

### Rent (Alquiler)

El rent es el costo de mantener datos almacenados en la blockchain:

- Las cuentas con saldo suficiente quedan **rent-exempt** (exentas)
- El mínimo para rent-exemption depende del **tamaño de los datos**
- Fórmula: ~0.00089088 SOL por byte por año (reserva de 2 años)

\`\`\`bash
# Calcular rent-exemption para 100 bytes
solana rent 100
# Resultado: Rent-exempt minimum: 0.00144768 SOL
\`\`\`

### Data (Datos)

- El campo \`data\` almacena bytes arbitrarios
- Para **cuentas de programa**: contiene el bytecode BPF compilado
- Para **cuentas de datos**: almacenan estado serializado (Borsh, JSON, etc.)

## Tipos Comunes de Cuentas

| Tipo | Owner | Uso |
|---|---|---|
| Wallet | System Program | Almacenar SOL |
| Token Mint | Token Program | Definir un tipo de token |
| Token Account | Token Program | Saldo de tokens de un usuario |
| Program | BPF Loader | Código ejecutable |
| PDA | Cualquier programa | Datos controlados por programa |

## Program Derived Addresses (PDAs)

Las PDAs son direcciones **derivadas determinísticamente** a partir de seeds y un program ID:

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed"), userPubkey.toBuffer()],
  programId
);
\`\`\`

- No poseen clave privada (no pueden firmar)
- Son controladas exclusivamente por el programa que las derivó
- Son fundamentales para almacenar estado on-chain`,
    exerciseQuestion:
      "¿Qué campo de la cuenta Solana determina qué programa puede modificar sus datos?",
    exerciseOptions: ["lamports", "data", "owner", "rent_epoch"],
  },

  "sf-l4": {
    content: `# Transacciones e Instrucciones

Una **transacción** es la unidad atómica de cambio de estado en Solana. Cada transacción contiene una o más **instrucciones** que se ejecutan secuencialmente.

## Anatomía de una Transacción

\`\`\`typescript
interface Transaction {
  signatures: Signature[];       // assinaturas dos signatários
  message: {
    header: MessageHeader;       // contagem de signatários
    accountKeys: PublicKey[];    // todas as contas envolvidas
    recentBlockhash: string;    // hash recente para expiração
    instructions: Instruction[]; // lista de instruções
  };
}
\`\`\`

### Componentes Principales

1. **Signatures**: cada firmante firma el hash del mensaje con Ed25519
2. **Account Keys**: lista ordenada de todas las cuentas referenciadas
3. **Recent Blockhash**: hash reciente (~60s de validez) que previene replay attacks
4. **Instructions**: las operaciones a ejecutar

## Instrucciones

Cada instrucción especifica:

\`\`\`typescript
interface Instruction {
  programId: PublicKey;           // programa a ser invocado
  keys: AccountMeta[];            // contas necessárias
  data: Buffer;                   // dados serializados para o programa
}

interface AccountMeta {
  pubkey: PublicKey;
  isSigner: boolean;              // precisa assinar?
  isWritable: boolean;            // será modificada?
}
\`\`\`

## Firmantes (Signers)

- El **fee payer** siempre es el primer firmante
- Los firmantes prueban la autorización para operaciones (ej: transferir SOL)
- Una transacción puede tener **múltiples firmantes**

## Recent Blockhash

- Sirve como **nonce** para evitar el replay de transacciones
- Expira en aproximadamente **60 segundos** (~150 slots)
- Si la transacción no se procesa a tiempo, se descarta
- Alternativa: **Durable Nonces** para transacciones que necesitan más tiempo

## Ejemplo: Transferencia de SOL

\`\`\`typescript
import {
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver,
    lamports: 1_000_000_000, // 1 SOL
  })
);

const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender] // signatários
);
\`\`\`

## Límites Importantes

- Tamaño máximo de la transacción: **1232 bytes**
- Máximo de cuentas por transacción: **64**
- Compute units por defecto: **200.000** (puede pedir hasta 1.4M)
- Máximo de instrucciones: sin límite fijo (limitado por el tamaño)

## Ciclo de Vida

1. El cliente crea y firma la transacción
2. La transacción se envía a un nodo RPC
3. El RPC la reenvía al leader actual (Gulf Stream)
4. El leader verifica firmas y ejecuta instrucciones
5. Si todas las instrucciones tienen éxito, el estado se confirma
6. La transacción se propaga y es votada por los validadores`,
    exerciseQuestion:
      '¿Para qué sirve el "recent blockhash" en una transacción Solana?',
    exerciseOptions: [
      "Identificar el programa que será ejecutado",
      "Prevenir replay attacks y definir la validez temporal de la transacción",
      "Almacenar el saldo del fee payer",
      "Encriptar los datos de la transacción",
    ],
  },

  "sf-l5": {
    content: `# Programas On-Chain

En Solana, los "smart contracts" se llaman **programas**. Son código ejecutable almacenado en cuentas especiales de la blockchain.

## Programas vs Smart Contracts

A diferencia de otras blockchains, en Solana los programas son **stateless** (sin estado):

- El **código** está separado de los **datos**
- Los programas reciben cuentas como parámetros y operan sobre ellas
- Esto permite la paralelización: transacciones que tocan cuentas diferentes se ejecutan en paralelo

## BPF / SBF

Los programas Solana se compilan a **SBF** (Solana Bytecode Format, antes eBPF):

\`\`\`
Código Rust → Compilador → Bytecode SBF → Deploy na blockchain
\`\`\`

- Ejecución determinística y segura en sandbox
- El runtime valida límites de memoria y compute
- Los programas pueden ser **upgradeable** o **inmutables**

## Programas Nativos (Built-in)

Solana viene con varios programas nativos esenciales:

### System Program
- **ID**: \`11111111111111111111111111111111\`
- Crea nuevas cuentas
- Transfiere SOL
- Asigna ownership a otros programas

### Token Program (SPL Token)
- **ID**: \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Crea y administra tokens fungibles
- Mint, transfer, burn, freeze

### Token-2022 (Token Extensions)
- **ID**: \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`
- Versión extendida con funcionalidades como transfer fees, confidential transfers

### Associated Token Account Program
- **ID**: \`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL\`
- Deriva direcciones determinísticas para token accounts

### Metaplex Token Metadata
- Administra metadatos de tokens y NFTs (nombre, símbolo, URI)

## Anatomía de un Programa

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,        // ID do programa
    accounts: &[AccountInfo],    // contas passadas pela instrução
    instruction_data: &[u8],     // dados da instrução
) -> ProgramResult {
    // Lógica do programa aqui
    Ok(())
}
\`\`\`

## Deploy y Upgrades

- Los programas se despliegan con \`solana program deploy\`
- Por defecto, los programas son **upgradeable** (la upgrade authority puede actualizarlos)
- La upgrade authority puede renunciar, haciendo el programa **inmutable**
- El bytecode se almacena en cuentas de programa separadas (program data account)

## Cross-Program Invocations (CPIs)

Los programas pueden llamar a otros programas:

\`\`\`rust
// Invocar System Program para transferir SOL
invoke(
    &system_instruction::transfer(from, to, amount),
    &[from_info, to_info, system_program_info],
)?;
\`\`\`

¡Esto permite la composabilidad — la base del DeFi!`,
    exerciseQuestion:
      '¿Por qué los programas Solana se llaman "stateless" (sin estado)?',
    exerciseOptions: [
      "Porque no pueden ser actualizados después del deploy",
      "Porque el código está separado de los datos — los programas reciben cuentas como parámetros",
      "Porque no pueden interactuar con otros programas",
      "Porque no necesitan compilación",
    ],
  },

  "sf-l6": {
    content: `# Solana CLI en Práctica

Vamos a ponernos manos a la obra y usar el **Solana CLI** para interactuar con la blockchain.

## Instalación

### macOS / Linux

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

Agregar al PATH:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Verificar la instalación:

\`\`\`bash
solana --version
# solana-cli 1.18.x
\`\`\`

## Configuración

Conectarse a la **devnet** (red de desarrollo):

\`\`\`bash
solana config set --url devnet
# o el shorthand:
solana config set -u d
\`\`\`

Verificar la configuración:

\`\`\`bash
solana config get
\`\`\`

## Creando un Keypair

\`\`\`bash
solana-keygen new --outfile ~/my-keypair.json
# Gera uma nova chave pública/privada
\`\`\`

Ver tu dirección:

\`\`\`bash
solana address
\`\`\`

## Airdrop (SOL gratuito en devnet)

\`\`\`bash
solana airdrop 2
# Solicita 2 SOL na devnet
\`\`\`

Verificar el saldo:

\`\`\`bash
solana balance
# 2 SOL
\`\`\`

## Explorando la Blockchain

\`\`\`bash
# Ver informações de uma conta
solana account <ENDERECO>

# Ver uma transação
solana confirm <SIGNATURE>

# Ver informações do cluster
solana cluster-version
\`\`\`

## Desafío

En el editor al lado, completa el script que usa el Solana CLI para: crear un keypair, solicitar airdrop y verificar el saldo.`,
    exerciseQuestion:
      "¿Qué comando del Solana CLI se usa para solicitar SOL gratuito en la devnet?",
    exerciseOptions: [
      "solana transfer",
      "solana airdrop",
      "solana mint",
      "solana request",
    ],
    challengePrompt:
      "Completa el script que crea un keypair, solicita airdrop de 2 SOL en la devnet y verifica el saldo.",
  },

  "sf-l7": {
    content: `# Tu Primera Transacción

Ahora vamos a crear y enviar una **transferencia de SOL** en la devnet usando la biblioteca \`@solana/web3.js\`.

## Conceptos Revisados

Para enviar una transacción, necesitamos:

1. **Connection**: conexión con un nodo RPC
2. **Keypair**: clave del remitente (para firmar)
3. **Transaction**: objeto que contiene las instrucciones
4. **Instruction**: la operación (transferencia de SOL)

## Paso a Paso

### 1. Importar dependencias

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
\`\`\`

### 2. Crear la instrucción de transferencia

\`\`\`typescript
const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: new PublicKey('ENDERECO_DESTINO'),
  lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
});
\`\`\`

### 3. Armar y enviar la transacción

\`\`\`typescript
const tx = new Transaction().add(instruction);
const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender]
);
console.log('Transação confirmada:', signature);
\`\`\`

### 4. Verificar en el Explorer

Accede a: \`https://explorer.solana.com/tx/SIGNATURE?cluster=devnet\`

## Desafío

Completa el código en el editor para enviar 0.5 SOL de una cartera a otra en la devnet.`,
    exerciseQuestion:
      "¿Qué programa nativo de Solana es responsable de las transferencias de SOL?",
    exerciseOptions: [
      "Token Program",
      "Associated Token Account Program",
      "System Program",
      "BPF Loader",
    ],
    challengePrompt:
      "Envía una transferencia de 0.5 SOL del sender al receiver en la devnet.",
  },

  // ── Curso 2: DeFi Developer ─────────────────────────────────

  "df-l1": {
    content: `# Introducción al DeFi

**DeFi** (Finanzas Descentralizadas) es el ecosistema de aplicaciones financieras construidas sobre blockchains, sin intermediarios tradicionales como bancos.

## ¿Qué es DeFi?

DeFi permite que cualquier persona en el mundo acceda a servicios financieros usando solo una cartera crypto:

- **Préstamos y financiamientos** sin banco (ej: Solend, MarginFi)
- **Intercambio de tokens** sin exchange (ej: Jupiter, Raydium)
- **Rendimientos** sobre activos depositados (yield farming)
- **Stablecoins** descentralizadas (ej: UXD)

## Total Value Locked (TVL)

El **TVL** es la métrica principal del DeFi — el valor total de activos depositados en protocolos:

\`\`\`
TVL do Solana DeFi: ~$5-10 bilhões (varia com mercado)
Principais protocolos: Jupiter, Raydium, Marinade, Jito
\`\`\`

Puedes seguirlo en [DefiLlama](https://defillama.com/chain/Solana).

## Yield Farming

Yield farming es la práctica de depositar activos en protocolos para ganar rendimientos:

1. **Proveer liquidez** a pools (LP tokens)
2. **Staking** de tokens nativos
3. **Lending** — prestar activos y recibir intereses
4. **Incentivos** en tokens del protocolo

### Ejemplo de Flujo

\`\`\`
1. Depositar SOL + USDC em pool Raydium
2. Receber LP tokens representando sua posição
3. Fazer stake dos LP tokens para ganhar recompensas
4. Colher (harvest) recompensas periodicamente
\`\`\`

## Liquidez

**Liquidez** es la facilidad de intercambiar activos sin un impacto significativo en el precio:

- **Pools de liquidez**: reservas de pares de tokens en smart contracts
- **Liquidity Providers (LPs)**: usuarios que depositan tokens en los pools
- **Impermanent Loss**: riesgo de pérdida temporal comparado con HODL

## Riesgos del DeFi

- **Smart contract risk**: bugs en el código pueden drenar fondos
- **Manipulación de oráculos**: precios manipulados pueden causar liquidaciones
- **Impermanent loss**: desbalanceo de pools
- **Rug pulls**: proyectos maliciosos que huyen con los fondos

## ¿Por qué Solana para DeFi?

| Ventaja | Impacto |
|---|---|
| Bajas comisiones (~$0.00025) | Operaciones frecuentes son viables |
| Alta velocidad (~400ms) | Arbitraje y liquidaciones rápidas |
| Composabilidad | CPIs permiten flash loans en 1 tx |
| Orderbooks on-chain | Phoenix, OpenBook — imposible en chains lentas |`,
    exerciseQuestion: "¿Qué significa TVL en el contexto de DeFi?",
    exerciseOptions: [
      "Token Value Listing — el precio de listado de un token",
      "Total Value Locked — el valor total de activos depositados en protocolos DeFi",
      "Transaction Validation Layer — la capa de validación de transacciones",
      "Token Verified Liquidity — liquidez verificada de un token",
    ],
  },

  "df-l2": {
    content: `# SPL Token: Creando Tu Token

El **SPL Token** es el estándar de tokens en Solana, equivalente al ERC-20 en Ethereum. Vamos a entender cómo crear y administrar tokens.

## Conceptos Fundamentales

### Mint Account

El **Mint** es la cuenta que define un tipo de token:

\`\`\`rust
pub struct Mint {
    pub mint_authority: Option<Pubkey>,  // quem pode cunhar novos tokens
    pub supply: u64,                      // total em circulação
    pub decimals: u8,                     // casas decimais (ex: 6 para USDC)
    pub is_initialized: bool,
    pub freeze_authority: Option<Pubkey>, // quem pode congelar contas
}
\`\`\`

### Decimals

- **SOL**: 9 decimales (1 SOL = 1.000.000.000 lamports)
- **USDC**: 6 decimales (1 USDC = 1.000.000 unidades)
- **NFTs**: 0 decimales y supply de 1

### Token Account

Cada titular necesita una **Token Account** para cada tipo de token:

\`\`\`rust
pub struct TokenAccount {
    pub mint: Pubkey,        // qual token
    pub owner: Pubkey,       // dono da conta
    pub amount: u64,         // saldo
    pub delegate: Option<Pubkey>,
    pub state: AccountState,
    pub is_native: Option<u64>,
    pub delegated_amount: u64,
    pub close_authority: Option<Pubkey>,
}
\`\`\`

## Creando un Token vía CLI

\`\`\`bash
# 1. Criar o mint
spl-token create-token
# Resultado: Creating token AbC123...

# 2. Criar token account para receber
spl-token create-account AbC123...
# Resultado: Creating account XyZ789...

# 3. Cunhar 1000 tokens
spl-token mint AbC123... 1000
# Resultado: Minting 1000 tokens

# 4. Verificar saldo
spl-token balance AbC123...
# 1000
\`\`\`

## Creando vía TypeScript

\`\`\`typescript
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

// 1. Criar mint
const mint = await createMint(
  connection,
  payer,           // quem paga o rent
  mintAuthority,   // quem pode cunhar
  freezeAuthority, // quem pode congelar (ou null)
  6               // decimais
);

// 2. Criar token account
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, owner.publicKey
);

// 3. Cunhar tokens
await mintTo(
  connection, payer, mint, tokenAccount.address,
  mintAuthority, 1000 * 10 ** 6 // 1000 tokens com 6 decimais
);
\`\`\`

## Token Metadata (Metaplex)

Para darle nombre, símbolo e imagen a tu token:

\`\`\`typescript
const metadata = {
  name: "Meu Token",
  symbol: "MTK",
  uri: "https://arweave.net/metadata.json", // JSON com imagem
  sellerFeeBasisPoints: 0,
  creators: null,
};
\`\`\`

El URI apunta a un JSON off-chain con la imagen y descripción del token.`,
    exerciseQuestion:
      '¿Cuál es la función del campo "decimals" en una Mint account de SPL Token?',
    exerciseOptions: [
      "Define el número máximo de tokens que pueden ser acuñados",
      "Define la precisión del token — cuántas casas decimales posee",
      "Define el precio inicial del token en SOL",
      "Define cuántas cuentas pueden poseer el token",
    ],
  },

  "df-l3": {
    content: `# Token Accounts y Associated Token Accounts (ATAs)

Entiende cómo Solana gestiona los saldos de tokens y por qué las ATAs son tan importantes.

## El Problema

En Solana, cada token necesita una **cuenta separada** para almacenar el saldo. Una wallet puede tener decenas de token accounts:

\`\`\`
Wallet (System Account)
├── Token Account 1 (USDC)
├── Token Account 2 (RAY)
├── Token Account 3 (mSOL)
└── Token Account 4 (JitoSOL)
\`\`\`

Pero, ¿cómo encontrar la token account de alguien si pueden existir varias para el mismo token?

## Associated Token Accounts (ATAs)

La solución es el **Associated Token Account Program**, que **deriva determinísticamente** una dirección única para cada par (wallet + mint):

\`\`\`typescript
// Derivação da ATA
const ata = PublicKey.findProgramAddressSync(
  [
    walletAddress.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintAddress.toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID
);
\`\`\`

### Ventajas de las ATAs

1. **Determinístico**: dado un wallet y mint, la dirección siempre es la misma
2. **Sin ambigüedad**: cada wallet tiene exactamente 1 ATA por token
3. **Creación automática**: puede ser creada por cualquier persona (quien envía paga)
4. **Estándar universal**: todas las carteras y protocolos usan ATAs

## PDA (Program Derived Address)

La ATA es un tipo de **PDA** — dirección derivada de seeds sin clave privada:

\`\`\`
Seeds: [wallet_pubkey, token_program_id, mint_pubkey]
        ↓
PDA = SHA256(seeds + program_id + "ProgramDerivedAddress")
        ↓
ATA Address (sem chave privada!)
\`\`\`

## Creando ATAs

\`\`\`typescript
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

// Opção 1: apenas derivar o endereço
const ataAddress = await getAssociatedTokenAddress(mint, owner);

// Opção 2: criar se não existir
const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,   // quem paga o rent
  mint,    // mint do token
  owner    // dono da ATA
);
\`\`\`

## Token Account vs ATA

| Aspecto | Token Account | ATA |
|---|---|---|
| Dirección | Aleatoria | Derivada (determinística) |
| Cantidad por mint | Múltiples | Exactamente 1 por wallet |
| Descubrimiento | Necesita buscar | Se puede calcular offline |
| Estándar | Genérico | Universalmente adoptado |

## Costos

- Crear una ATA cuesta ~0.00204 SOL (rent-exempt)
- El **remitente** generalmente paga la creación de la ATA del destinatario
- Las ATAs pueden ser **cerradas** para recuperar el rent`,
    exerciseQuestion:
      "¿Por qué existen las Associated Token Accounts (ATAs) en Solana?",
    exerciseOptions: [
      "Para permitir transferencias más rápidas entre wallets",
      "Para garantizar una dirección determinística y única para cada par wallet + mint",
      "Para reducir el costo de creación de token accounts",
      "Para permitir que los tokens tengan múltiples dueños",
    ],
  },

  "df-l4": {
    content: `# Swaps y Pools de Liquidez

Los **AMMs** (Automated Market Makers) son la base del DeFi — permiten intercambiar tokens sin un orderbook centralizado.

## ¿Qué es un AMM?

Un AMM es un smart contract que mantiene **reservas de dos tokens** y permite intercambios usando una fórmula matemática:

\`\`\`
Pool SOL/USDC:
├── Reserva SOL: 1.000 SOL
└── Reserva USDC: 100.000 USDC
→ Preço implícito: 1 SOL = 100 USDC
\`\`\`

## Constant Product Formula (x * y = k)

La fórmula más común (usada por Raydium, Orca):

\`\`\`
x * y = k

Onde:
  x = reserva do token A
  y = reserva do token B
  k = constante (produto)
\`\`\`

### Ejemplo de Swap

\`\`\`
Estado inicial: x=1000 SOL, y=100000 USDC, k=100.000.000

Usuário quer comprar SOL com 1000 USDC:
  y_new = 100000 + 1000 = 101000
  x_new = k / y_new = 100000000 / 101000 = 990.099
  SOL recebido = 1000 - 990.099 = 9.901 SOL

Preço efetivo: 1000/9.901 ≈ 101.01 USDC/SOL
Preço spot era: 100 USDC/SOL
→ Slippage de ~1%
\`\`\`

## Slippage

**Slippage** es la diferencia entre el precio esperado y el precio ejecutado:

- Swaps grandes en pools pequeños generan **alto slippage**
- La mayoría de los protocolos permiten definir un **slippage tolerance** (ej: 0.5%)
- Si el slippage excede la tolerancia, la transacción **revierte**

\`\`\`typescript
// Definindo slippage de 1%
const slippageBps = 100; // 100 basis points = 1%
const minAmountOut = expectedAmount * (10000 - slippageBps) / 10000;
\`\`\`

## Concentrated Liquidity (CLMM)

Los pools avanzados (Orca Whirlpools, Raydium CLMM) permiten que los LPs concentren liquidez en **rangos de precio** específicos:

\`\`\`
LP tradicional:  |████████████████████████████| (liquidez espalhada)
LP concentrada:  |        ████████████        | (liquidez focada)
                         ↑ preço atual
\`\`\`

**Ventaja**: mayor eficiencia de capital (más fees con menos capital).

## Liquidity Providers (LPs)

Para proveer liquidez:

1. Deposite **ambos tokens** del par en la proporción correcta
2. Reciba **LP tokens** representando su posición
3. Gane **fees** proporcionales a su participación
4. Riesgo: **impermanent loss** si los precios divergen

## AMMs en Solana

| Protocolo | Tipo | Destacado |
|---|---|---|
| Raydium | CPMM + CLMM | Mayor TVL, integrado con OpenBook |
| Orca | CLMM (Whirlpools) | UX amigable, eficiente |
| Meteora | DLMM | Liquidez dinámica, zero slippage en rangos |
| Phoenix | Orderbook | Order book on-chain, spreads bajos |`,
    exerciseQuestion:
      "En la fórmula constant product (x * y = k), ¿qué sucede cuando un usuario hace un swap grande en un pool pequeño?",
    exerciseOptions: [
      "El precio del token disminuye",
      "La constante k cambia para acomodar el swap",
      "El slippage es alto — el precio efectivo diverge mucho del precio spot",
      "La transacción se cancela automáticamente",
    ],
  },

  "df-l5": {
    content: `# Integrando con Jupiter

**Jupiter** es el principal agregador de swap de Solana. Encuentra la mejor ruta entre decenas de DEXs para obtener el mejor precio.

## ¿Por qué usar Jupiter?

En vez de integrar individualmente con Raydium, Orca, Meteora, etc., Jupiter:

- **Agrega rutas** de 20+ DEXs
- Encuentra el **mejor precio** automáticamente
- Soporta **split routes** (divide el swap entre múltiples pools)
- Maneja **tokens intermedios** (ej: SOL -> mSOL -> USDC)

## Jupiter API v6

### 1. Obtener Cotización (Quote)

\`\`\`typescript
const quoteUrl = 'https://quote-api.jup.ag/v6/quote';
const params = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000', // 1 SOL em lamports
  slippageBps: '50',    // 0.5% slippage
});

const quoteResponse = await fetch(\`\${quoteUrl}?\${params}\`);
const quote = await quoteResponse.json();

console.log('Melhor rota:', quote.routePlan);
console.log('Output estimado:', quote.outAmount);
\`\`\`

### 2. Obtener Transacción para Firmar

\`\`\`typescript
const swapUrl = 'https://quote-api.jup.ag/v6/swap';
const swapResponse = await fetch(swapUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
  }),
});

const { swapTransaction } = await swapResponse.json();
\`\`\`

### 3. Firmar y Enviar

\`\`\`typescript
import { VersionedTransaction } from '@solana/web3.js';

const txBuf = Buffer.from(swapTransaction, 'base64');
const transaction = VersionedTransaction.deserialize(txBuf);

// Assinar com a wallet
transaction.sign([wallet]);

// Enviar
const txId = await connection.sendRawTransaction(
  transaction.serialize()
);
await connection.confirmTransaction(txId);
console.log('Swap executado:', txId);
\`\`\`

## Jupiter SDK (@jup-ag/api)

Para facilitar la integración, existe el SDK oficial:

\`\`\`typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiter = createJupiterApiClient();

// Quote
const quote = await jupiter.quoteGet({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1_000_000_000,
  slippageBps: 50,
});

// Swap
const swap = await jupiter.swapPost({
  swapRequest: {
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
  },
});
\`\`\`

## Consejos de Integración

- Siempre use **slippage tolerance** (50-100 bps es razonable)
- Verifique **priceImpactPct** en la respuesta del quote
- Use **wrapAndUnwrapSol: true** para manejar wrapped SOL automáticamente
- Jupiter también soporta **DCA** (Dollar Cost Average) y **Limit Orders**`,
    exerciseQuestion:
      "¿Cuál es la principal ventaja de usar Jupiter en vez de integrar directamente con un DEX específico?",
    exerciseOptions: [
      "Jupiter cobra comisiones más bajas que otros DEXs",
      "Jupiter agrega rutas de múltiples DEXs para encontrar el mejor precio",
      "Jupiter permite crear nuevos tokens automáticamente",
      "Jupiter funciona solo en mainnet, garantizando seguridad",
    ],
  },

  "df-l6": {
    content: `# Yield Farming y Staking

Aprende cómo generar rendimientos con tus activos en el ecosistema Solana DeFi.

## Staking de SOL

El staking es la forma más simple de generar yield: delegas SOL a un validador y recibes recompensas.

### Staking Nativo

\`\`\`bash
# Criar stake account e delegar
solana create-stake-account stake-keypair.json 100  # 100 SOL
solana delegate-stake stake-keypair.json <VALIDATOR_VOTE_PUBKEY>

# Verificar status
solana stake-account stake-keypair.json
\`\`\`

- **APY**: ~6-8% anual
- **Lockup**: hay que esperar 1 epoch (~2 días) para desactivar
- **Riesgo**: mínimo (solo riesgo de downtime del validador)

## Liquid Staking

El **liquid staking** resuelve el problema del lockup: recibes un **token derivativo** que puedes usar en DeFi mientras sigues ganando staking rewards.

### Principales Liquid Staking Tokens (LSTs)

| Token | Protocolo | Característica |
|---|---|---|
| mSOL | Marinade | Más antiguo, gran liquidez |
| jitoSOL | Jito | Incluye MEV rewards |
| bSOL | BlazeStake | Distribución de stake descentralizada |
| hSOL | Helius | Staking vía validadores Helius |

### Cómo Funciona

\`\`\`
1. Deposite 100 SOL no Marinade
2. Receba ~95.5 mSOL (taxa de câmbio cresce com rewards)
3. Use mSOL em DeFi (pool SOL/mSOL, colateral, etc.)
4. Quando quiser, troque mSOL → SOL (resgate)
\`\`\`

La tasa de cambio mSOL/SOL **crece continuamente** porque las rewards se acumulan en el precio.

## Yield Farming

El yield farming combina múltiples estrategias para maximizar retornos:

### 1. Proveer Liquidez (LP)

\`\`\`
Depositar SOL + USDC em pool Raydium
→ Receber LP tokens
→ Ganhar fees de trading (~0.25% por swap)
→ APY depende do volume de trading
\`\`\`

### 2. Staking de LP tokens

\`\`\`
LP tokens do par SOL/USDC
→ Stake em farm do Raydium
→ Ganhar tokens RAY como recompensa
→ APR adicional sobre as fees
\`\`\`

### 3. Farming Apalancado

\`\`\`
Depositar colateral (ex: SOL)
→ Emprestar mais tokens (alavancagem)
→ Fornecer liquidez com valor ampliado
→ Maior yield, mas maior risco de liquidação
\`\`\`

## Calculando APY vs APR

\`\`\`
APR (Annual Percentage Rate) = rendimento simples
APY (Annual Percentage Yield) = com reinvestimento (compound)

APY = (1 + APR/n)^n - 1

Exemplo: APR de 20%, compound diário (n=365):
APY = (1 + 0.20/365)^365 - 1 = 22.13%
\`\`\`

## Riesgos

- **Impermanent Loss**: variación de precio entre los tokens del par
- **Smart contract risk**: bugs pueden drenar pools
- **Rendimientos insostenibles**: APYs muy altos generalmente son temporales
- **Liquidación**: en farming apalancado`,
    exerciseQuestion:
      "¿Cuál es la principal ventaja del liquid staking (como mSOL o jitoSOL) en relación al staking nativo de SOL?",
    exerciseOptions: [
      "El liquid staking ofrece un APY más alto que el staking nativo",
      "El liquid staking no tiene ningún riesgo",
      "Recibes un token derivativo que puede ser usado en DeFi mientras continúas ganando staking rewards",
      "El liquid staking no necesita validadores",
    ],
  },

  "df-l7": {
    content: `# Oráculos de Precio

Los **oráculos** son sistemas que traen datos del mundo externo a la blockchain. En DeFi, los oráculos de precio son fundamentales para lending, liquidaciones y derivativos.

## El Problema del Oráculo

Las blockchains son **determinísticas** — no pueden acceder a datos externos de forma nativa. ¿Cómo saber el precio del SOL en USD?

\`\`\`
Mundo real: SOL = $150 USD
                   ↓ como trazer?
Blockchain: precisa do preço para calcular colateral
\`\`\`

## Pyth Network

**Pyth** es el oráculo dominante en Solana, con datos de **alta frecuencia** proporcionados por market makers y exchanges.

### Características

- **Actualización**: cada ~400ms (¡cada slot!)
- **Fuentes**: 90+ proveedores de datos (exchanges, market makers)
- **Intervalo de confianza**: cada precio viene con un rango de confianza
- **Cross-chain**: disponible en 30+ chains

### Integrando con Pyth

\`\`\`typescript
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';

// Feed ID do SOL/USD
const SOL_USD_FEED = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Obter preço
const priceUpdate = await pythSolanaReceiver.fetchPriceUpdate([SOL_USD_FEED]);

// Ler preço on-chain em um programa
const price = priceUpdate.price; // ex: 15000000000 (com exponent -8)
const expo = priceUpdate.exponent; // -8
const priceUSD = price * 10 ** expo; // 150.00
\`\`\`

### Usando en Anchor

\`\`\`rust
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

#[derive(Accounts)]
pub struct CheckPrice<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn check_price(ctx: Context<CheckPrice>) -> Result<()> {
    let price_update = &ctx.accounts.price_update;
    let price = price_update.get_price_no_older_than(
        &Clock::get()?,
        60, // max age em segundos
        &SOL_USD_FEED_ID,
    )?;
    msg!("SOL price: {} x 10^{}", price.price, price.exponent);
    Ok(())
}
\`\`\`

## Switchboard

**Switchboard** es otro oráculo popular, más configurable:

- Soporta **datos personalizados** (no solo precios)
- **Verifiable Random Function (VRF)** para aleatoriedad on-chain
- Colas de oracle configurables

### Casos de Uso

\`\`\`
Switchboard:
├── Preços de ativos
├── Dados climáticos
├── Resultados esportivos
├── Números aleatórios (VRF)
└── Qualquer dado off-chain
\`\`\`

## Seguridad con Oráculos

Buenas prácticas al usar oráculos:

1. **Verificar staleness**: rechazar precios demasiado antiguos
2. **Usar intervalo de confianza**: Pyth proporciona \`confidence\` junto al precio
3. **Múltiples fuentes**: combinar Pyth + Switchboard si es posible
4. **TWAP**: usar precio promedio ponderado por tiempo para reducir manipulación

\`\`\`rust
// Verificar que o preço não está stale
require!(
    price.publish_time > clock.unix_timestamp - MAX_STALENESS,
    ErrorCode::StalePriceFeed
);

// Verificar confiança (confidence deve ser < 1% do preço)
require!(
    price.confidence < price.price.unsigned_abs() / 100,
    ErrorCode::PriceConfidenceTooWide
);
\`\`\``,
    exerciseQuestion:
      '¿Por qué es importante verificar la "staleness" (antigüedad) de un precio de oráculo en un protocolo DeFi?',
    exerciseOptions: [
      "Para garantizar que el oráculo está cobrando las comisiones correctas",
      "Para evitar usar precios desactualizados que pueden causar liquidaciones incorrectas o manipulación",
      "Para verificar si el oráculo es de Pyth o Switchboard",
      "Para calcular correctamente el gas cost de la transacción",
    ],
  },

  "df-l8": {
    content: `# Construyendo un Vault DeFi

Vamos a construir un **vault simple** en Anchor — un programa que acepta depósitos de SOL y permite retiros por el propietario.

## ¿Qué es un Vault?

Un vault es un smart contract que:

1. **Acepta depósitos** de tokens de múltiples usuarios
2. **Rastrea saldos** individualmente
3. **Permite retiros** solo por el depositante original
4. Opcionalmente: aplica **estrategias de yield** sobre los depósitos

## Arquitectura

\`\`\`
VaultState (PDA)
├── authority: Pubkey       // admin do vault
├── total_deposits: u64     // total depositado
└── bump: u8               // PDA bump

UserDeposit (PDA por usuário)
├── user: Pubkey
├── amount: u64
└── deposited_at: i64
\`\`\`

## Instrucciones del Programa

### 1. Initialize — crear el vault
### 2. Deposit — depositar SOL en el vault
### 3. Withdraw — retirar SOL del vault

## Conceptos Aplicados

- **PDAs**: para el vault state y depósitos por usuario
- **CPI**: transferencia de SOL vía System Program
- **Seeds**: derivación de cuentas determinísticas
- **Constraints**: validación de autoridad y saldos

## Desafío

Completa el programa Anchor en el editor al lado. Necesitas:

1. Definir las structs \`VaultState\` y \`UserDeposit\`
2. Implementar la instrucción \`deposit\`
3. Implementar la instrucción \`withdraw\` con validación de saldo`,
    exerciseQuestion:
      "En un vault DeFi en Solana, ¿cuál es la mejor forma de almacenar el saldo individual de cada usuario?",
    exerciseOptions: [
      "En una variable global en el programa",
      "En un PDA derivado de las seeds del programa y la dirección del usuario",
      "En el campo data de la wallet del usuario",
      "En un archivo JSON off-chain",
    ],
    challengePrompt:
      "Completa el programa Anchor para un vault que acepta depósitos y retiros de SOL, rastreando saldos por usuario vía PDAs.",
  },

  // ── Curso 3: dApp Full Stack ────────────────────────────────

  "fs-l1": {
    content: `# Configuración del Entorno

Antes de construir dApps en Solana, necesitamos configurar nuestro entorno de desarrollo completo.

## Prerequisitos

### 1. Rust

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verificar
rustc --version
cargo --version
\`\`\`

### 2. Solana CLI

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configurar devnet
solana config set -u devnet
solana-keygen new  # gerar keypair se não tiver
solana airdrop 5   # SOL para testes
\`\`\`

### 3. Node.js y Yarn

\`\`\`bash
# Node.js 18+
node --version  # v18.x ou superior

# Yarn
npm install -g yarn
\`\`\`

### 4. Anchor CLI

\`\`\`bash
# Instalar via cargo
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Verificar
anchor --version
\`\`\`

## Creando un Proyecto Anchor

\`\`\`bash
anchor init minha-dapp
cd minha-dapp
\`\`\`

## Estructura del Proyecto

\`\`\`
minha-dapp/
├── Anchor.toml          # Configuração do Anchor
├── Cargo.toml           # Workspace Rust
├── programs/
│   └── minha-dapp/
│       ├── Cargo.toml   # Dependências do programa
│       └── src/
│           └── lib.rs   # Código do programa
├── tests/
│   └── minha-dapp.ts    # Testes em TypeScript
├── app/                 # Frontend (opcional)
├── migrations/
│   └── deploy.ts        # Script de deploy
└── target/              # Build artifacts
\`\`\`

## Anchor.toml

\`\`\`toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
minha_dapp = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
\`\`\`

## Compilando y Testeando

\`\`\`bash
# Build
anchor build

# Ver program ID gerado
solana address -k target/deploy/minha_dapp-keypair.json

# Rodar testes
anchor test
\`\`\`

## IDL (Interface Definition Language)

Después del build, Anchor genera un **IDL** en \`target/idl/minha_dapp.json\` — la interfaz que el frontend usa para interactuar con el programa.`,
    exerciseQuestion:
      "¿Qué archivo define la interfaz (IDL) que el frontend usa para interactuar con un programa Anchor?",
    exerciseOptions: [
      "Anchor.toml",
      "programs/src/lib.rs",
      "target/idl/<nombre_programa>.json",
      "tests/<nombre_programa>.ts",
    ],
  },

  "fs-l2": {
    content: `# Anchor: Declarar Programa y Cuentas

**Anchor** es el framework más popular para desarrollo de programas Solana. Abstrae la complejidad de Solana usando macros Rust.

## Estructura Básica de un Programa

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let minha_conta = &mut ctx.accounts.minha_conta;
        minha_conta.data = data;
        minha_conta.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub data: u64,
    pub authority: Pubkey,
}
\`\`\`

## \`#[program]\` — El Módulo Principal

- Define el **entrypoint** del programa
- Cada función pública es una **instrucción**
- Recibe \`Context<T>\` como primer parámetro
- Los parámetros adicionales son los **instruction data**

## \`#[derive(Accounts)]\` — Validación de Cuentas

El macro más poderoso de Anchor. Define qué cuentas espera la instrucción y cómo validarlas:

### Tipos de Cuenta

| Tipo | Uso |
|---|---|
| \`Account<'info, T>\` | Cuenta tipada, deserializada automáticamente |
| \`Signer<'info>\` | Cuenta que debe firmar la transacción |
| \`Program<'info, T>\` | Referencia a un programa (ej: System) |
| \`SystemAccount<'info>\` | Cuenta del sistema (wallet) |
| \`UncheckedAccount<'info>\` | Cuenta sin verificación (usar con cuidado) |

### Constraints Comunes

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    // Deve assinar a transação
    pub authority: Signer<'info>,

    // Inicializa nova conta, paga por authority
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub nova_conta: Account<'info, MinhaConta>,

    // Conta mutável existente
    #[account(mut)]
    pub conta_existente: Account<'info, MinhaConta>,

    // Conta com PDA (seeds + bump)
    #[account(
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, ConfigConta>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## \`#[account]\` — Definición de Datos

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub authority: Pubkey,   // 32 bytes
    pub counter: u64,        // 8 bytes
    pub is_active: bool,     // 1 byte
    #[max_len(50)]
    pub name: String,        // 4 + 50 bytes
}
\`\`\`

### Cálculo de Space

- **Discriminator**: 8 bytes (hash de la cuenta, añadido automáticamente)
- **Pubkey**: 32 bytes
- **u64/i64**: 8 bytes
- **u32/i32**: 4 bytes
- **bool**: 1 byte
- **String**: 4 (length) + max_len bytes
- **Vec<T>**: 4 (length) + max_len * sizeof(T)
- **Option<T>**: 1 + sizeof(T)

\`\`\`rust
// Space total = 8 (disc) + 32 (Pubkey) + 8 (u64) + 1 (bool) + 4+50 (String)
space = 8 + 32 + 8 + 1 + 54 = 103
// Ou use InitSpace para calcular automaticamente!
space = 8 + MinhaConta::INIT_SPACE
\`\`\`

## Init con PDA

\`\`\`rust
#[account(
    init,
    payer = authority,
    space = 8 + MinhaConta::INIT_SPACE,
    seeds = [b"user-data", authority.key().as_ref()],
    bump,
)]
pub user_data: Account<'info, MinhaConta>,
\`\`\`

Anchor automáticamente:
1. Deriva el PDA con las seeds
2. Crea la cuenta vía System Program CPI
3. Asigna el owner a tu programa`,
    exerciseQuestion:
      "En Anchor, ¿para qué sirve el atributo #[account(init, payer = authority, space = ...)] en una struct de Accounts?",
    exerciseOptions: [
      "Para leer datos de una cuenta existente",
      "Para transferir tokens entre cuentas",
      "Para crear e inicializar una nueva cuenta, definiendo quién paga el rent y el tamaño asignado",
      "Para eliminar una cuenta existente",
    ],
  },

  "fs-l3": {
    content: `# Anchor: Instrucciones y Validación

Aprende a escribir instrucciones robustas con validación de datos y manejo de errores en Anchor.

## Errores Personalizados

Define errores específicos de tu programa:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("O counter já atingiu o valor máximo")]
    MaxCounterReached,
    #[msg("Apenas a authority pode executar esta ação")]
    Unauthorized,
    #[msg("Valor inválido: deve ser maior que zero")]
    InvalidValue,
    #[msg("Conta já foi inicializada")]
    AlreadyInitialized,
}
\`\`\`

### Usando Errores

\`\`\`rust
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;

    require!(counter.count < 1000, ErrorCode::MaxCounterReached);

    counter.count += 1;
    Ok(())
}
\`\`\`

## Constraint: \`has_one\`

Verifica que un campo de la cuenta sea igual a otra cuenta pasada:

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    pub authority: Signer<'info>,

    // Verifica que counter.authority == authority.key()
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub counter: Account<'info, Counter>,
}
\`\`\`

Equivale a:
\`\`\`rust
require_keys_eq!(counter.authority, authority.key(), ErrorCode::Unauthorized);
\`\`\`

## Constraint: \`seeds\` y \`bump\`

Para validar y derivar PDAs:

\`\`\`rust
#[derive(Accounts)]
pub struct ReadConfig<'info> {
    pub user: Signer<'info>,

    // Valida que config é o PDA correto para este user
    #[account(
        seeds = [b"config", user.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, UserConfig>,
}
\`\`\`

### Seeds Dinámicos

\`\`\`rust
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGame<'info> {
    pub player: Signer<'info>,

    #[account(
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump,
    )]
    pub game: Account<'info, Game>,

    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Constraint: \`constraint\`

Validaciones personalizadas arbitrarias:

\`\`\`rust
#[account(
    mut,
    constraint = vault.amount >= withdrawal_amount @ ErrorCode::InsufficientFunds,
    constraint = vault.is_active @ ErrorCode::VaultInactive,
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Constraint: \`close\`

Cerrar una cuenta y devolver el rent:

\`\`\`rust
#[derive(Accounts)]
pub struct CloseAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Fecha a conta e envia lamports para authority
    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
}
\`\`\`

## Constraint: \`realloc\`

Redimensionar una cuenta (aumentar o disminuir datos):

\`\`\`rust
#[account(
    mut,
    realloc = 8 + 32 + 4 + new_name.len(),
    realloc::payer = authority,
    realloc::zero = false,
)]
pub profile: Account<'info, Profile>,
\`\`\`

## Patrón Completo

\`\`\`rust
#[program]
pub mod meu_app {
    use super::*;

    pub fn create_post(ctx: Context<CreatePost>, title: String, body: String) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(!body.is_empty(), ErrorCode::EmptyBody);

        let post = &mut ctx.accounts.post;
        post.author = ctx.accounts.author.key();
        post.title = title;
        post.body = body;
        post.created_at = Clock::get()?.unix_timestamp;
        post.bump = ctx.bumps.post;
        Ok(())
    }
}
\`\`\``,
    exerciseQuestion:
      'En Anchor, ¿qué verifica el constraint "has_one = authority" en una cuenta?',
    exerciseOptions: [
      "Que la cuenta fue creada por el System Program",
      'Que el campo "authority" de la cuenta es igual a la key de la cuenta "authority" pasada en la instrucción',
      "Que la cuenta posee saldo suficiente en lamports",
      "Que la cuenta es un PDA válido",
    ],
  },

  "fs-l4": {
    content: `# Pruebas con Anchor

Las pruebas son **esenciales** en el desarrollo Solana. Anchor lo facilita con integración TypeScript y simulación local.

## anchor test

El comando \`anchor test\` hace todo automáticamente:

1. Compila el programa (\`anchor build\`)
2. Inicia un validador local (\`solana-test-validator\`)
3. Despliega el programa
4. Ejecuta las pruebas TypeScript
5. Apaga el validador

\`\`\`bash
anchor test
# Ou, se o validador já está rodando:
anchor test --skip-local-validator
\`\`\`

## Estructura de una Prueba

\`\`\`typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { MeuPrograma } from '../target/types/meu_programa';
import { expect } from 'chai';

describe('meu-programa', () => {
  // Configurar provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MeuPrograma as Program<MeuPrograma>;
  const authority = provider.wallet;

  it('Inicializa o counter', async () => {
    // Derivar PDA
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    // Executar instrução
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('TX:', tx);

    // Verificar estado
    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(0);
    expect(counterAccount.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
  });

  it('Incrementa o counter', async () => {
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .increment()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
      })
      .rpc();

    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(1);
  });

  it('Falha ao incrementar com authority errada', async () => {
    const fakeUser = anchor.web3.Keypair.generate();

    // Airdrop SOL para o fake user
    const airdropSig = await provider.connection.requestAirdrop(
      fakeUser.publicKey, 1e9
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .increment()
        .accounts({
          authority: fakeUser.publicKey,
          counter: counterPda,
        })
        .signers([fakeUser])
        .rpc();
      expect.fail('Deveria ter falhado');
    } catch (err) {
      expect(err.error.errorCode.code).to.equal('Unauthorized');
    }
  });
});
\`\`\`

## Bankrun — Pruebas Rápidas

**Bankrun** (\`solana-bankrun\`) es una alternativa más rápida al validador local:

\`\`\`typescript
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';

const context = await startAnchor('.', [], []);
const provider = new BankrunProvider(context);
anchor.setProvider(provider);
\`\`\`

Ventajas de Bankrun:
- **10-100x más rápido** que solana-test-validator
- Sin necesidad de ejecutar un validador
- Control total sobre el estado (time travel, set accounts)
- Ideal para **pruebas de integración**

## Consejos para Buenas Pruebas

1. **Prueba happy paths y error paths** — verifica que los errores se lanzan correctamente
2. **Usa PDAs derivados** — no uses cuentas aleatorias
3. **Verifica el estado final** — fetch accounts y compara valores
4. **Prueba permisos** — verifica que usuarios no autorizados sean rechazados
5. **Prueba edge cases** — valores cero, overflow, cuentas duplicadas

## Debugging

\`\`\`rust
// No programa — logs aparecem nos testes
msg!("Counter value: {}", counter.count);

// Em TypeScript — ver logs da transação
const tx = await program.methods.increment().accounts({...}).rpc();
const txDetails = await provider.connection.getTransaction(tx);
console.log(txDetails.meta.logMessages);
\`\`\``,
    exerciseQuestion:
      "¿Cuál es la principal ventaja de Bankrun (solana-bankrun) en relación a solana-test-validator para pruebas?",
    exerciseOptions: [
      "Bankrun soporta deploy en mainnet",
      "Bankrun es 10-100x más rápido ya que no necesita ejecutar un validador completo",
      "Bankrun permite pruebas solo en Rust",
      "Bankrun es el único que soporta programas Anchor",
    ],
  },

  "fs-l5": {
    content: `# Frontend con React y Wallet Adapter

Conecta tu programa Solana a un frontend React usando el **Solana Wallet Adapter**.

## Instalación

\`\`\`bash
npm install @solana/web3.js @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets \\
  @solana/wallet-adapter-base
\`\`\`

## Configuración del Provider

\`\`\`tsx
// src/providers/WalletProvider.tsx
import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export const AppWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
\`\`\`

## Botón de Conectar Wallet

\`\`\`tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Navbar() {
  return (
    <nav>
      <h1>Minha dApp</h1>
      <WalletMultiButton />
    </nav>
  );
}
\`\`\`

El \`WalletMultiButton\` automáticamente:
- Muestra un modal con wallets disponibles
- Conecta/desconecta
- Muestra la dirección truncada cuando está conectado

## Hooks Útiles

\`\`\`tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function MeuComponente() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();

  if (!connected) {
    return <p>Conecte sua wallet para continuar</p>;
  }

  return <p>Conectado: {publicKey?.toBase58()}</p>;
}
\`\`\`

### useConnection

- \`connection\`: instancia de \`Connection\` para hacer llamadas RPC

### useWallet

- \`publicKey\`: clave pública del usuario conectado
- \`connected\`: boolean indicando si está conectado
- \`signTransaction\`: función para firmar transacciones
- \`signAllTransactions\`: firmar múltiples transacciones
- \`sendTransaction\`: firmar y enviar
- \`disconnect\`: desconectar wallet

## Enviando una Transacción

\`\`\`tsx
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

function SendSOL() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleSend = async () => {
    if (!publicKey) return;

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey('DESTINO...'),
        lamports: 0.1 * LAMPORTS_PER_SOL,
      })
    );

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');
    alert('Enviado! ' + signature);
  };

  return <button onClick={handleSend}>Enviar 0.1 SOL</button>;
}
\`\`\`

## Verificando Saldo

\`\`\`tsx
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function Balance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  return <p>Saldo: {balance.toFixed(4)} SOL</p>;
}
\`\`\``,
    exerciseQuestion:
      "¿Qué hook de @solana/wallet-adapter-react proporciona acceso al publicKey del usuario conectado?",
    exerciseOptions: ["useConnection", "useWallet", "useAnchor", "useSolana"],
  },

  "fs-l6": {
    content: `# Interacción Frontend <-> Programa

Aprende a usar el **IDL** generado por Anchor para interactuar con tu programa directamente desde el frontend React.

## ¿Qué es el IDL?

El **IDL** (Interface Definition Language) es un JSON que describe tu programa:

- Instrucciones disponibles
- Cuentas esperadas por cada instrucción
- Tipos de datos (structs, enums)
- Errores personalizados

\`\`\`json
{
  "version": "0.1.0",
  "name": "counter",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "counter", "isMut": true, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Counter",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "count", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
        ]
      }
    }
  ]
}
\`\`\`

## Configurando el Program Client

\`\`\`typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../target/idl/counter.json';
import type { Counter } from '../target/types/counter';

function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program<Counter>(
    idl as Counter,
    provider
  );
}
\`\`\`

## Leyendo Datos (Fetch Accounts)

\`\`\`typescript
function CounterDisplay() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!program || !publicKey) return;

    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), publicKey.toBuffer()],
      program.programId
    );

    // Fetch a conta tipada
    program.account.counter.fetch(counterPda)
      .then((account) => {
        setCount(account.count.toNumber());
      })
      .catch(console.error);
  }, [program, publicKey]);

  return <h2>Counter: {count}</h2>;
}
\`\`\`

## Enviando Instrucciones

\`\`\`typescript
function IncrementButton() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleIncrement = async () => {
    if (!program || !publicKey) return;

    setLoading(true);
    try {
      const [counterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('counter'), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .increment()
        .accounts({
          authority: publicKey,
          counter: counterPda,
        })
        .rpc();

      console.log('TX confirmada:', tx);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleIncrement} disabled={loading}>
      {loading ? 'Enviando...' : 'Incrementar'}
    </button>
  );
}
\`\`\`

## Escuchando Cambios en Cuentas

\`\`\`typescript
useEffect(() => {
  if (!program || !publicKey) return;

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter'), publicKey.toBuffer()],
    program.programId
  );

  // Subscribe para mudanças em tempo real
  const subscriptionId = program.account.counter.subscribe(counterPda)
    .on('change', (account) => {
      setCount(account.count.toNumber());
    });

  return () => {
    // Cleanup
    program.account.counter.unsubscribe(subscriptionId);
  };
}, [program, publicKey]);
\`\`\`

## Manejo de Errores

\`\`\`typescript
import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.increment().accounts({...}).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    console.log('Erro do programa:', err.error.errorMessage);
    console.log('Código:', err.error.errorCode.code);
    // Ex: "O counter já atingiu o valor máximo"
  } else {
    console.log('Erro de rede:', err);
  }
}
\`\`\``,
    exerciseQuestion:
      "¿Cómo sabe el frontend React qué instrucciones y cuentas espera un programa Anchor?",
    exerciseOptions: [
      "El frontend lee el código Rust directamente",
      "A través del IDL (Interface Definition Language) generado por Anchor en el build",
      "El frontend necesita hacer una llamada RPC al programa para descubrirlo",
      "El desarrollador necesita reescribir las interfaces manualmente en TypeScript",
    ],
  },

  "fs-l7": {
    content: `# Deploy a Devnet y Mainnet

Aprende el proceso completo de deploy de programas Solana, desde devnet hasta mainnet.

## Deploy en Devnet

### 1. Build

\`\`\`bash
anchor build
\`\`\`

### 2. Verificar Program ID

\`\`\`bash
# O program ID é derivado do keypair em target/deploy/
solana address -k target/deploy/meu_programa-keypair.json
# Ex: 7nE4RfQmH2tLm7gQxkV3Pq...
\`\`\`

Actualiza el \`declare_id!\` en \`lib.rs\` y el \`Anchor.toml\` con este ID.

### 3. Deploy

\`\`\`bash
# Garantir que está na devnet
solana config set -u devnet

# Garantir que tem SOL
solana balance
solana airdrop 5  # se precisar

# Deploy
anchor deploy

# Ou especificando o cluster:
anchor deploy --provider.cluster devnet
\`\`\`

### 4. Verificar

\`\`\`bash
solana program show <PROGRAM_ID>
# Program Id: 7nE4RfQmH2tLm7gQxkV3Pq...
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Data Length: 245760 (0x3c000) bytes
# Balance: 1.70981 SOL
# Authority: <SEU_WALLET>
# Last Deployed In Slot: 123456789
# Upgradeable
\`\`\`

## Deploy en Mainnet

### Checklist Pre-Mainnet

1. **Pruebas pasando** — \`anchor test\` en verde
2. **Auditoría** — código revisado (idealmente por terceros)
3. **Program authority** — decidir quién controla los upgrades
4. **IDL publicado** — para que los explorers muestren instrucciones legibles

### Proceso

\`\`\`bash
# Mudar para mainnet
solana config set -u mainnet-beta

# Verificar saldo (precisa de ~3 SOL para deploy)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet

# Publicar IDL (opcional, para Anchor Explorer)
anchor idl init <PROGRAM_ID> --filepath target/idl/meu_programa.json
\`\`\`

## Upgrades de Programas

Los programas Anchor son **upgradeable** por defecto:

\`\`\`bash
# Fazer alterações no código...
anchor build

# Deploy da atualização
anchor upgrade target/deploy/meu_programa.so --program-id <PROGRAM_ID>

# Ou via Anchor:
anchor deploy --program-id <PROGRAM_ID>
\`\`\`

### Seguridad del Upgrade

La **upgrade authority** es la wallet que puede actualizar el programa:

\`\`\`bash
# Ver authority atual
solana program show <PROGRAM_ID>

# Transferir authority para multisig
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <MULTISIG_ADDRESS>

# Tornar imutável (IRREVERSÍVEL!)
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

## Buenas Prácticas de Deploy

### 1. Multisig Authority
Usa **Squads** para gestionar upgrades vía multisig:
- Múltiples firmas necesarias para upgrade
- Timelock (período de espera antes de ejecutar)
- Transparencia para los usuarios

### 2. Verificación de Programa
Usa **Solana Verify** para probar que el código on-chain corresponde al código fuente:

\`\`\`bash
solana-verify verify-from-repo \\
  --program-id <PROGRAM_ID> \\
  https://github.com/user/repo
\`\`\`

### 3. Buffer Accounts

Para deploys grandes, usa buffer accounts:

\`\`\`bash
# Criar buffer
solana program write-buffer target/deploy/meu_programa.so

# Deploy do buffer
solana program deploy --buffer <BUFFER_ADDRESS>
\`\`\`

### 4. Costo de Deploy

| Cluster | Costo Estimado |
|---|---|
| Devnet | Gratuito (airdrop) |
| Mainnet | ~2-5 SOL (depende del tamaño del programa) |

El costo es proporcional al **tamaño del bytecode** (rent-exempt para la program data account).`,
    exerciseQuestion:
      '¿Qué sucede cuando ejecutas "solana program set-upgrade-authority <ID> --final"?',
    exerciseOptions: [
      "El programa se elimina de la blockchain",
      "La authority se transfiere al System Program",
      "El programa se vuelve inmutable — nadie más puede actualizarlo (irreversible)",
      "El programa se pausa temporalmente",
    ],
  },

  "fs-l8": {
    content: `# Proyecto Final: dApp Completa

Llegó la hora de construir una **dApp completa** desde cero: programa Anchor + frontend React + wallet adapter. Vamos a crear un **Counter dApp**.

## Visión General

La dApp que vamos a construir:

- **Programa Anchor**: Counter con initialize, increment y decrement
- **Frontend React**: interfaz para interactuar con el programa
- **Wallet Adapter**: conectar Phantom/Solflare
- **Deploy**: funcional en devnet

## Arquitectura

\`\`\`
┌─────────────────────────┐
│    Frontend (React)      │
│  ┌───────────────────┐  │
│  │  Wallet Adapter    │  │
│  │  (Phantom, etc.)   │  │
│  └────────┬──────────┘  │
│           │              │
│  ┌────────▼──────────┐  │
│  │  Program Client    │  │
│  │  (IDL + Anchor)    │  │
│  └────────┬──────────┘  │
└───────────┼──────────────┘
            │ RPC
┌───────────▼──────────────┐
│  Programa Solana (Anchor) │
│  ┌───────────────────┐   │
│  │  initialize()      │   │
│  │  increment()       │   │
│  │  decrement()       │   │
│  └───────────────────┘   │
│  ┌───────────────────┐   │
│  │  Counter (PDA)     │   │
│  │  - count: u64      │   │
│  │  - authority: Pk   │   │
│  │  - bump: u8        │   │
│  └───────────────────┘   │
└───────────────────────────┘
\`\`\`

## Lo que Necesitas Implementar

### Programa (Rust/Anchor)

1. **initialize**: crear el PDA del counter con count=0
2. **increment**: sumar 1 al count (solo authority)
3. **decrement**: restar 1 del count (solo authority, mínimo 0)

### Frontend (React/TypeScript)

1. Botón de conectar wallet
2. Mostrar el valor actual del counter
3. Botones de increment y decrement
4. Estado de loading durante transacciones
5. Mensajes de error amigables

## Desafío

En el editor al lado, completa el programa Anchor del Counter. El frontend será construido como extensión de este ejercicio.`,
    exerciseQuestion:
      "¿Cuál es la secuencia correcta para construir y publicar una dApp full-stack en Solana?",
    exerciseOptions: [
      "Frontend primero, después el programa, después pruebas",
      "Deploy en mainnet primero, después pruebas, después frontend",
      "Programa Anchor -> Pruebas -> Frontend con Wallet Adapter -> Deploy",
      "Pruebas primero, después programa, después frontend",
    ],
    challengePrompt:
      "Completa el programa Anchor de un Counter dApp con instrucciones initialize, increment y decrement. El counter debe usar PDA, tener control de authority y no permitir decrement por debajo de 0.",
  },
});
