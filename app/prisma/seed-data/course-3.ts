export function getCourse3() {
  return {
    slug: "token-engineering",
    title: "Token Engineering on Solana",
    description:
      "Master SPL tokens, Token-2022 extensions, and token economics. Build fungible tokens, NFTs, and soulbound tokens.",
    difficulty: "intermediate",
    duration: "6 hours",
    xpTotal: 1000,
    trackId: 6,
    trackLevel: 1,
    trackName: "Token Engineering",
    creator: "Superteam Brazil",
    tags: ["tokens", "spl", "token-2022", "nft"],
    prerequisites: ["intro-to-solana"],
    modules: {
      create: [
        // ── Module 1: SPL Token Basics ──────────────────────────────────────
        {
          title: "SPL Token Basics",
          description: "Understanding the SPL Token Program",
          order: 0,
          lessons: {
            create: [
              {
                title: "Token Program Overview",
                description: "How tokens work on Solana",
                type: "content",
                order: 0,
                xpReward: 20,
                duration: "15 min",
                content: `# Token Program Overview

Tokens on Solana are managed by the **SPL Token Program**, a single on-chain program deployed at \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`. Unlike Ethereum where each token deploys its own smart contract, every fungible and non-fungible token on Solana is created and managed through this shared program.

## Core Architecture

The SPL Token Program uses two primary account types:

### Mint Account
A **Mint** defines a token type. It stores the total supply, decimal precision, and optional authorities:

\`\`\`
Mint {
  mint_authority: Option<Pubkey>,   // can mint new tokens
  supply: u64,                       // current circulating supply
  decimals: u8,                      // e.g. 9 for SOL-like precision
  is_initialized: bool,
  freeze_authority: Option<Pubkey>, // can freeze token accounts
}
\`\`\`

Each mint is a unique on-chain account. When you "create a token," you are creating a new Mint account.

### Token Account
A **Token Account** holds a balance for a specific mint, owned by a specific wallet:

\`\`\`
TokenAccount {
  mint: Pubkey,         // which token this holds
  owner: Pubkey,        // wallet that controls it
  amount: u64,          // balance
  delegate: Option<Pubkey>,
  state: AccountState,  // Initialized | Frozen
  ...
}
\`\`\`

A single wallet can have many token accounts (one per token type). The relationship is: **one Mint -> many Token Accounts**.

## How Transfers Work

When you transfer tokens, the SPL Token Program:
1. Verifies the sender signed the transaction (or a delegate is authorized).
2. Debits the source token account's \`amount\`.
3. Credits the destination token account's \`amount\`.

The mint's \`supply\` only changes during \`mint_to\` or \`burn\` instructions.

## Key Instructions

| Instruction | Purpose |
|-------------|---------|
| \`InitializeMint\` | Create a new token type |
| \`InitializeAccount\` | Create a token account for a mint |
| \`MintTo\` | Issue new tokens (increases supply) |
| \`Transfer\` | Move tokens between accounts |
| \`Burn\` | Destroy tokens (decreases supply) |
| \`SetAuthority\` | Change mint or freeze authority |

## Why One Program?

This shared-program model provides composability. DEXs, lending protocols, and wallets can interact with any SPL token using a single interface. There is no need to audit each token contract individually -- the rules are identical for all tokens managed by the program.

In the next lessons, we will create our own mint, issue tokens, and transfer them using the \`@solana/spl-token\` TypeScript library.`,
              },
              {
                title: "Creating a Fungible Token",
                description: "Mint creation and configuration",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Creating a Fungible Token

Creating a fungible token on Solana means creating a **Mint account** with the SPL Token Program. This lesson walks through every step using the \`@solana/spl-token\` TypeScript library.

## Step 1: Generate a Keypair for the Mint

Every mint is a regular Solana account. You can let the library generate one automatically, or provide your own keypair:

\`\`\`typescript
import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.generate(); // fund this via airdrop for devnet
\`\`\`

## Step 2: Create the Mint

The \`createMint\` helper handles the full transaction -- allocating space, initializing the account, and setting authorities:

\`\`\`typescript
const mint = await createMint(
  connection,
  payer,              // payer for transaction fees
  payer.publicKey,    // mint authority
  payer.publicKey,    // freeze authority (null to disable)
  9                   // decimals (9 = SOL-like precision)
);

console.log("Mint address:", mint.toBase58());
\`\`\`

### Parameters Explained

- **\`decimals\`**: Determines the smallest fractional unit. With 9 decimals, 1 token = 1,000,000,000 base units. USDC on Solana uses 6 decimals, matching the dollar's cent structure.
- **\`mintAuthority\`**: The public key authorized to call \`mintTo\`. Set to \`null\` to create a fixed-supply token (no future minting).
- **\`freezeAuthority\`**: Can freeze individual token accounts, preventing transfers. Set to \`null\` if you want a fully permissionless token.

## Step 3: Verify On-Chain

After creation, query the mint account to confirm:

\`\`\`typescript
import { getMint } from "@solana/spl-token";

const mintInfo = await getMint(connection, mint);
console.log("Supply:", mintInfo.supply.toString());     // "0"
console.log("Decimals:", mintInfo.decimals);              // 9
console.log("Mint authority:", mintInfo.mintAuthority?.toBase58());
\`\`\`

The supply starts at zero. Tokens only exist after calling \`mintTo\`.

## Under the Hood

\`createMint\` sends a single transaction with two instructions:
1. \`SystemProgram.createAccount\` -- allocates 82 bytes (the Mint layout size) and assigns ownership to the Token Program.
2. \`Token.initializeMint\` -- writes the decimals and authorities into the account data.

## Choosing Decimals

| Token Type | Typical Decimals |
|------------|-----------------|
| Currency / utility | 6 - 9 |
| NFT / semi-fungible | 0 |
| Governance | 6 |

For fungible tokens, 9 decimals is the Solana convention. This gives you fine-grained precision and aligns with SOL's own decimal structure.

## Revoking Authorities

To make a token immutable (no future minting), revoke the mint authority after your initial supply is minted:

\`\`\`typescript
import { setAuthority, AuthorityType } from "@solana/spl-token";

await setAuthority(
  connection, payer, mint,
  payer, AuthorityType.MintTokens, null
);
\`\`\`

This is irreversible and a common pattern for community tokens where a fixed supply is desired.`,
              },
              {
                title: "Mint & Transfer Tokens",
                description: "Create and transfer SPL tokens",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "30 min",
                content: `# Mint & Transfer Tokens

In this challenge, you will create a new SPL token mint, mint tokens to your own account, and transfer some tokens to a second wallet. This end-to-end flow is the foundation of every token operation on Solana.

## Objectives

1. **Create a mint** with 9 decimals.
2. **Create an associated token account** (ATA) for the payer wallet.
3. **Mint 1,000 tokens** (1000 * 10^9 base units) to the payer's ATA.
4. **Create a second wallet** and its ATA for the same mint.
5. **Transfer 250 tokens** from the payer's ATA to the second wallet's ATA.

## Key Concepts

### Associated Token Accounts (ATAs)

Rather than manually creating token accounts, the **Associated Token Program** derives a deterministic address for each wallet-mint pair:

\`\`\`
ATA = findProgramAddress(
  [wallet, TOKEN_PROGRAM_ID, mint],
  ASSOCIATED_TOKEN_PROGRAM_ID
)
\`\`\`

Use \`getOrCreateAssociatedTokenAccount\` to ensure the ATA exists before minting or transferring.

### MintTo

The \`mintTo\` instruction increases the mint's supply and credits a token account. Only the mint authority can call this.

### Transfer

The \`transfer\` instruction moves tokens between two token accounts for the same mint. The owner of the source token account must sign.

## Hints

- Remember to convert human-readable amounts to base units: \`amount * 10 ** decimals\`.
- The payer must sign all transactions and cover rent for new accounts.
- Use \`getAccount\` to verify balances after operations.

## Expected Final State

| Account | Balance |
|---------|---------|
| Payer ATA | 750 tokens |
| Receiver ATA | 250 tokens |
| Mint supply | 1,000 tokens |`,
                challenge: {
                  create: {
                    prompt:
                      "Create a new SPL token mint with 9 decimals, mint 1000 tokens to the payer's ATA, then transfer 250 tokens to a second wallet's ATA. Return the mint address, payer ATA balance, and receiver ATA balance.",
                    starterCode: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();

  // Airdrop SOL for fees
  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    2 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);

  const decimals = 9;
  const mintAmount = 1000n * BigInt(10 ** decimals);
  const transferAmount = 250n * BigInt(10 ** decimals);

  // TODO: Step 1 - Create a new mint with 9 decimals
  // const mint = ...

  // TODO: Step 2 - Create or get the payer's associated token account
  // const payerAta = ...

  // TODO: Step 3 - Mint 1000 tokens to the payer's ATA
  // await mintTo(...)

  // TODO: Step 4 - Create a second wallet and its ATA
  // const receiver = Keypair.generate();
  // const receiverAta = ...

  // TODO: Step 5 - Transfer 250 tokens to the receiver's ATA
  // await transfer(...)

  // TODO: Step 6 - Fetch and log final balances
  // const payerBalance = ...
  // const receiverBalance = ...
  // console.log("Payer balance:", payerBalance.amount);
  // console.log("Receiver balance:", receiverBalance.amount);
}

main();`,
                    language: "typescript",
                    hints: [
                      "Use createMint(connection, payer, payer.publicKey, payer.publicKey, 9) to create the mint.",
                      "getOrCreateAssociatedTokenAccount returns an object with an .address field for the ATA public key.",
                      "mintTo takes (connection, payer, mint, destination ATA address, authority, amount as bigint).",
                      "transfer takes (connection, payer, source ATA address, dest ATA address, owner, amount as bigint).",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();

  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    2 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);

  const decimals = 9;
  const mintAmount = 1000n * BigInt(10 ** decimals);
  const transferAmount = 250n * BigInt(10 ** decimals);

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    decimals
  );

  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  await mintTo(
    connection,
    payer,
    mint,
    payerAta.address,
    payer,
    mintAmount
  );

  const receiver = Keypair.generate();
  const receiverAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    receiver.publicKey
  );

  await transfer(
    connection,
    payer,
    payerAta.address,
    receiverAta.address,
    payer,
    transferAmount
  );

  const payerBalance = await getAccount(connection, payerAta.address);
  const receiverBalance = await getAccount(connection, receiverAta.address);
  console.log("Mint:", mint.toBase58());
  console.log("Payer balance:", payerBalance.amount);
  console.log("Receiver balance:", receiverBalance.amount);
}

main();`,
                    testCases: {
                      create: [
                        {
                          name: "Mint is created with 9 decimals",
                          input: "getMint(connection, mint)",
                          expectedOutput: "decimals: 9",
                          order: 0,
                        },
                        {
                          name: "Payer ATA holds 750 tokens after transfer",
                          input: "getAccount(connection, payerAta.address)",
                          expectedOutput: "amount: 750000000000",
                          order: 1,
                        },
                        {
                          name: "Receiver ATA holds 250 tokens after transfer",
                          input: "getAccount(connection, receiverAta.address)",
                          expectedOutput: "amount: 250000000000",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Associated Token Accounts",
                description: "Deterministic token account derivation",
                type: "content",
                order: 3,
                xpReward: 25,
                duration: "20 min",
                content: `# Associated Token Accounts

The **Associated Token Program** (\`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL\`) solves a fundamental UX problem: how does a sender know which token account to send tokens to?

## The Problem

A wallet can own multiple token accounts for the same mint. Without a convention, the sender would need to know the exact token account address. This creates a coordination problem for wallets, dApps, and exchanges.

## The Solution: Deterministic Derivation

The Associated Token Program derives a **single canonical address** for each (wallet, mint) pair:

\`\`\`typescript
import { getAssociatedTokenAddress } from "@solana/spl-token";

const ata = await getAssociatedTokenAddress(
  mint,            // the token mint
  walletAddress    // the owner wallet
);
\`\`\`

Under the hood, this computes a Program Derived Address (PDA):

\`\`\`
seeds = [walletAddress, TOKEN_PROGRAM_ID, mint]
program = ASSOCIATED_TOKEN_PROGRAM_ID
\`\`\`

Because PDAs are deterministic, anyone can compute the ATA address for any wallet without an on-chain lookup.

## Creating ATAs

### getOrCreateAssociatedTokenAccount

The safest approach -- creates the ATA if it does not exist, returns it if it does:

\`\`\`typescript
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,          // pays rent if creating
  mint,
  owner           // wallet that will own the ATA
);

console.log("ATA address:", ata.address.toBase58());
console.log("Balance:", ata.amount.toString());
\`\`\`

### createAssociatedTokenAccountInstruction

For building transactions manually:

\`\`\`typescript
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";

const ata = await getAssociatedTokenAddress(mint, owner);
const ix = createAssociatedTokenAccountInstruction(
  payer,   // funding account
  ata,     // the ATA to create
  owner,   // wallet that owns the ATA
  mint     // the token mint
);

const tx = new Transaction().add(ix);
\`\`\`

## Rent Exemption

ATAs require **0.00203928 SOL** in rent (165 bytes at the minimum rent-exempt balance). The payer of the \`createAssociatedTokenAccount\` instruction covers this cost. If the token account already exists, the instruction is a no-op and no rent is charged.

## Idempotency

A critical property of ATAs is **idempotency**. Calling \`getOrCreateAssociatedTokenAccount\` multiple times with the same parameters is safe -- it will not fail or create duplicates. This simplifies client-side logic because you never need to check if an ATA exists before creating it.

## When NOT to Use ATAs

Some advanced use cases require non-ATA token accounts:
- **Escrow accounts** owned by a PDA (the PDA is the authority, not a wallet).
- **Multi-signature token accounts** with custom delegate patterns.
- **Wrapped SOL** operations that need manual management of the sync native instruction.

For standard user wallets, always default to ATAs. Wallets like Phantom and Solflare exclusively display ATA balances.

## Token Account vs ATA

| Feature | Token Account | ATA |
|---------|--------------|-----|
| Address | Random keypair | Deterministic PDA |
| Discoverability | Must know address | Derivable from wallet + mint |
| Convention | No standard | Ecosystem standard |
| Creation | Manual | \`createAssociatedTokenAccount\` |`,
              },
            ],
          },
        },

        // ── Module 2: Token-2022 Extensions ─────────────────────────────────
        {
          title: "Token-2022 Extensions",
          description: "Advanced token features with the Token Extensions Program",
          order: 1,
          lessons: {
            create: [
              {
                title: "What is Token-2022?",
                description: "Introduction to the Token Extensions Program",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# What is Token-2022?

**Token-2022** (also called **Token Extensions Program**) is Solana's next-generation token program deployed at \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`. It is a superset of the original SPL Token Program, adding powerful extensions while maintaining backward compatibility with the core token interface.

## Why a New Program?

The original SPL Token Program is immutable and handles trillions of dollars in value. Adding new features directly would require migrating all existing tokens -- an unacceptable risk. Token-2022 solves this by shipping a separate program that existing tokens can ignore while new tokens opt into advanced features.

## Extensions Overview

Extensions are optional features that a mint or token account can enable at creation time. Once created, the set of active extensions is fixed (you cannot add extensions later).

### Mint Extensions

| Extension | Purpose |
|-----------|---------|
| **TransferFee** | Automatic fee on every transfer |
| **NonTransferable** | Soulbound tokens -- cannot be transferred |
| **InterestBearing** | Display balance with accrued interest |
| **PermanentDelegate** | Irrevocable delegate authority (useful for revocable access) |
| **TransferHook** | Call a custom program on every transfer |
| **MetadataPointer** | Point to on-chain metadata |
| **TokenMetadata** | Store metadata directly in the mint account |
| **ConfidentialTransfer** | Zero-knowledge encrypted balances |
| **MintCloseAuthority** | Allow closing a mint account to reclaim rent |
| **GroupPointer / MemberPointer** | NFT collection grouping |
| **DefaultAccountState** | New token accounts start frozen |

### Account Extensions

| Extension | Purpose |
|-----------|---------|
| **ImmutableOwner** | Prevents reassigning the token account owner |
| **CpiGuard** | Prevents certain CPI-based attacks |
| **MemoTransfer** | Requires a memo on incoming transfers |

## Using Token-2022 in TypeScript

The \`@solana/spl-token\` library supports Token-2022 natively. You specify \`TOKEN_2022_PROGRAM_ID\` instead of \`TOKEN_PROGRAM_ID\`:

\`\`\`typescript
import {
  createMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const mint = await createMint(
  connection,
  payer,
  payer.publicKey,
  null,
  9,
  undefined,              // optional keypair
  undefined,              // confirm options
  TOKEN_2022_PROGRAM_ID   // use Token-2022
);
\`\`\`

## Composing Multiple Extensions

A single mint can combine multiple extensions. For example, a soulbound credential token might use:
- **NonTransferable** -- prevents transfers
- **PermanentDelegate** -- allows the issuer to burn/revoke
- **MetadataPointer + TokenMetadata** -- stores credential metadata on-chain

Extensions are configured via specific initialization instructions that must be called **before** \`initializeMint\`. The \`@solana/spl-token\` library provides helper functions like \`createInitializeTransferFeeConfigInstruction\` for each extension.

## Token-2022 vs Original SPL Token

Both programs share the same core instruction set (\`initializeMint\`, \`mintTo\`, \`transfer\`, etc.). The key difference is that Token-2022 mints and token accounts have **variable size** to accommodate extension data, while original SPL Token accounts are fixed size.

Programs interacting with Token-2022 tokens must pass \`TOKEN_2022_PROGRAM_ID\` as the token program. Most modern Solana programs support both through dynamic program ID resolution.`,
              },
              {
                title: "Transfer Fees",
                description: "Implementing automatic transfer fees with Token-2022",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Transfer Fees

The **TransferFee** extension is one of Token-2022's most impactful features. It enables automatic, protocol-level fees on every token transfer -- no custom program required. This is essential for revenue-generating tokens, protocol fees, and creator economies.

## How Transfer Fees Work

When a mint has the TransferFee extension enabled, every \`transfer\` or \`transferChecked\` instruction automatically withholds a fee from the transferred amount. The fee is held in the **destination token account** in a special "withheld" field, separate from the recipient's usable balance.

### Fee Calculation

\`\`\`
fee = min(transferAmount * feeBasisPoints / 10000, maximumFee)
\`\`\`

- **feeBasisPoints**: Fee rate in basis points (100 = 1%, 50 = 0.5%).
- **maximumFee**: Cap on the fee amount (in base units). Protects against excessive fees on large transfers.

### Example

A token with 200 basis points (2%) and a maximum fee of 1,000,000 base units:
- Transfer 100 tokens -> fee = 2 tokens
- Transfer 100,000 tokens -> fee = 1,000,000 base units (cap reached)

## Setting Up Transfer Fees

Transfer fees must be configured **at mint creation** before calling \`initializeMint\`:

\`\`\`typescript
import {
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const mintKeypair = Keypair.generate();
const feeBasisPoints = 200;  // 2%
const maxFee = BigInt(1_000_000_000); // 1 token max fee

const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeTransferFeeConfigInstruction(
    mintKeypair.publicKey,
    payer.publicKey,       // transfer fee config authority
    payer.publicKey,       // withdraw withheld authority
    feeBasisPoints,
    maxFee,
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeMintInstruction(
    mintKeypair.publicKey,
    9,
    payer.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID
  )
);

await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
\`\`\`

## Harvesting Withheld Fees

Fees accumulate in each recipient's token account. The **withdraw withheld authority** can harvest them:

\`\`\`typescript
import { harvestWithheldTokensToMint, withdrawWithheldTokensFromMint } from "@solana/spl-token";

// Step 1: Move withheld fees from token accounts to the mint
await harvestWithheldTokensToMint(connection, payer, mint, [tokenAccountA, tokenAccountB]);

// Step 2: Withdraw from the mint to a destination
await withdrawWithheldTokensFromMint(connection, payer, mint, destination, withdrawAuthority);
\`\`\`

## Updating Fee Configuration

The transfer fee config authority can update the fee rate. Changes take effect after a configurable epoch delay, preventing surprise fee changes:

\`\`\`typescript
import { setTransferFee } from "@solana/spl-token";

await setTransferFee(
  connection, payer, mint, authority,
  300,                    // new fee: 3%
  BigInt(2_000_000_000),  // new max fee
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Use Cases

- **Protocol revenue**: DEX tokens with a built-in trading fee
- **Creator royalties**: Enforce royalty payments at the token level
- **Burn-on-transfer**: Combine with a fee destination that burns tokens`,
              },
              {
                title: "Create a Token with Transfer Fee",
                description: "Build a Token-2022 mint with the TransferFee extension",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "35 min",
                content: `# Create a Token with Transfer Fee

In this challenge, you will create a Token-2022 mint with the **TransferFee** extension enabled. You will then mint tokens, perform a transfer, and verify that the fee was correctly withheld.

## Objectives

1. **Create a Token-2022 mint** with the TransferFee extension: 250 basis points (2.5%), max fee of 5 * 10^9 base units.
2. **Mint 10,000 tokens** to the payer's ATA (Token-2022 ATA).
3. **Transfer 1,000 tokens** to a receiver's ATA.
4. **Verify** the receiver received 975 tokens (1000 - 2.5% fee = 975) and 25 tokens are withheld.

## Key Concepts

### Extension Initialization Order

When creating a Token-2022 mint with extensions, instructions must be ordered:
1. \`SystemProgram.createAccount\` (allocate space for mint + extensions)
2. Extension-specific init instructions (\`createInitializeTransferFeeConfigInstruction\`)
3. \`createInitializeMintInstruction\`

The extension init **must** come before the mint init.

### Account Space

Use \`getMintLen([ExtensionType.TransferFeeConfig])\` to calculate the required account size. The extension adds extra bytes beyond the base 82-byte mint layout.

### Verifying Withheld Fees

After a transfer, inspect the destination token account:
\`\`\`typescript
import { getAccount, getTransferFeeAmount } from "@solana/spl-token";

const account = await getAccount(connection, receiverAta, "confirmed", TOKEN_2022_PROGRAM_ID);
const feeAmount = getTransferFeeAmount(account);
console.log("Withheld:", feeAmount?.withheldAmount.toString());
\`\`\`

## Expected Final State

| Account | Usable Balance | Withheld |
|---------|---------------|----------|
| Payer ATA | 9,000 tokens | 0 |
| Receiver ATA | 975 tokens | 25 tokens |
| Mint supply | 10,000 tokens | -- |`,
                challenge: {
                  create: {
                    prompt:
                      "Create a Token-2022 mint with a 2.5% transfer fee (250 basis points, max fee 5 * 10^9). Mint 10,000 tokens, transfer 1,000, and verify the 2.5% fee was withheld on the receiver's account.",
                    starterCode: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
  getTransferFeeAmount,
} from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL)
  );

  const mintKeypair = Keypair.generate();
  const decimals = 9;
  const feeBasisPoints = 250; // 2.5%
  const maxFee = BigInt(5 * 10 ** decimals);

  // TODO: Step 1 - Calculate mint length and lamports for rent
  // const mintLen = getMintLen([...]);
  // const lamports = ...

  // TODO: Step 2 - Build transaction with createAccount + transferFeeConfig + initMint
  // const tx = new Transaction().add(...);
  // await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);

  // TODO: Step 3 - Create payer ATA (use TOKEN_2022_PROGRAM_ID)
  // const payerAta = ...

  // TODO: Step 4 - Mint 10,000 tokens
  // await mintTo(...)

  // TODO: Step 5 - Create receiver and receiver ATA
  // const receiver = Keypair.generate();
  // const receiverAta = ...

  // TODO: Step 6 - Transfer 1,000 tokens using transferChecked
  // await transferChecked(...)

  // TODO: Step 7 - Verify withheld fees
  // const receiverAccount = await getAccount(...);
  // const feeAmount = getTransferFeeAmount(receiverAccount);
  // console.log("Withheld:", feeAmount?.withheldAmount.toString());
}

main();`,
                    language: "typescript",
                    hints: [
                      "Use getMintLen([ExtensionType.TransferFeeConfig]) to compute the mint account size.",
                      "The transaction must order instructions: createAccount, then initializeTransferFeeConfig, then initializeMint.",
                      "For Token-2022 ATAs, pass TOKEN_2022_PROGRAM_ID as the last argument to getOrCreateAssociatedTokenAccount.",
                      "Use transferChecked instead of transfer -- it takes decimals and the TOKEN_2022_PROGRAM_ID.",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
  getTransferFeeAmount,
} from "@solana/spl-token";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL)
  );

  const mintKeypair = Keypair.generate();
  const decimals = 9;
  const feeBasisPoints = 250;
  const maxFee = BigInt(5 * 10 ** decimals);

  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      payer.publicKey,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);

  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintKeypair.publicKey, payer.publicKey,
    false, undefined, undefined, TOKEN_2022_PROGRAM_ID
  );

  const mintAmount = BigInt(10_000) * BigInt(10 ** decimals);
  await mintTo(
    connection, payer, mintKeypair.publicKey, payerAta.address,
    payer, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID
  );

  const receiver = Keypair.generate();
  const receiverAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintKeypair.publicKey, receiver.publicKey,
    false, undefined, undefined, TOKEN_2022_PROGRAM_ID
  );

  const transferAmount = BigInt(1_000) * BigInt(10 ** decimals);
  await transferChecked(
    connection, payer, payerAta.address, mintKeypair.publicKey,
    receiverAta.address, payer, transferAmount, decimals,
    [], undefined, TOKEN_2022_PROGRAM_ID
  );

  const receiverAccount = await getAccount(
    connection, receiverAta.address, "confirmed", TOKEN_2022_PROGRAM_ID
  );
  const feeAmount = getTransferFeeAmount(receiverAccount);
  console.log("Receiver balance:", receiverAccount.amount.toString());
  console.log("Withheld:", feeAmount?.withheldAmount.toString());
}

main();`,
                    testCases: {
                      create: [
                        {
                          name: "Mint has TransferFeeConfig extension with 250 basis points",
                          input: "getTransferFeeConfig(mint)",
                          expectedOutput: "transferFeeBasisPoints: 250",
                          order: 0,
                        },
                        {
                          name: "Receiver has 975 tokens usable balance",
                          input: "getAccount(connection, receiverAta.address)",
                          expectedOutput: "amount: 975000000000",
                          order: 1,
                        },
                        {
                          name: "Receiver has 25 tokens withheld as fee",
                          input: "getTransferFeeAmount(receiverAccount)",
                          expectedOutput: "withheldAmount: 25000000000",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "NonTransferable & Soulbound",
                description: "Creating soulbound tokens with Token-2022",
                type: "content",
                order: 3,
                xpReward: 30,
                duration: "20 min",
                content: `# NonTransferable & Soulbound Tokens

The **NonTransferable** extension creates tokens that are permanently bound to their initial recipient -- commonly called **soulbound tokens** (SBTs). Once minted to a wallet, these tokens cannot be transferred, sold, or traded. They can only be burned by the appropriate authority.

## Use Cases

Soulbound tokens are ideal for:
- **Credentials and certifications** -- proof that a wallet holder completed a course or passed an exam
- **Reputation scores** -- on-chain reputation that cannot be purchased
- **Access passes** -- membership tokens that are non-transferable
- **Compliance tokens** -- KYC/AML attestations bound to a verified wallet
- **Achievement badges** -- gamification rewards (this is exactly what Superteam Academy uses)

## Creating a NonTransferable Mint

\`\`\`typescript
import {
  ExtensionType,
  createInitializeNonTransferableMintInstruction,
  createInitializeMintInstruction,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SystemProgram, Transaction, Keypair } from "@solana/web3.js";

const mintKeypair = Keypair.generate();
const mintLen = getMintLen([ExtensionType.NonTransferable]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeNonTransferableMintInstruction(
    mintKeypair.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeMintInstruction(
    mintKeypair.publicKey,
    0,                  // 0 decimals for badge-style tokens
    payer.publicKey,    // mint authority
    null,               // no freeze authority needed
    TOKEN_2022_PROGRAM_ID
  )
);

await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
\`\`\`

## Combining with PermanentDelegate

A common pattern pairs NonTransferable with **PermanentDelegate**. This gives the issuing authority irrevocable permission to burn (revoke) the token, even though the holder cannot transfer it:

\`\`\`typescript
import {
  createInitializePermanentDelegateInstruction,
} from "@solana/spl-token";

const mintLen = getMintLen([
  ExtensionType.NonTransferable,
  ExtensionType.PermanentDelegate,
]);

const tx = new Transaction().add(
  SystemProgram.createAccount({ ... }),
  createInitializeNonTransferableMintInstruction(mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
  createInitializePermanentDelegateInstruction(
    mintKeypair.publicKey,
    payer.publicKey,    // permanent delegate (can burn/revoke)
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeMintInstruction(mintKeypair.publicKey, 0, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
);
\`\`\`

## What Happens on Transfer Attempt?

If a user tries to transfer a NonTransferable token, the Token-2022 program will reject the transaction with an error: \`TransferFeeExceedsMaximum\` or \`NonTransferable\`. Wallets that support Token-2022 will typically hide the "Send" button for these tokens and display them as badges or credentials instead.

## Adding On-Chain Metadata

For soulbound credentials, combine with **MetadataPointer + TokenMetadata** to store the credential details directly in the mint account:

\`\`\`typescript
const mintLen = getMintLen([
  ExtensionType.NonTransferable,
  ExtensionType.PermanentDelegate,
  ExtensionType.MetadataPointer,
]);
\`\`\`

Then add the metadata initialization instructions before \`initializeMint\`. This gives you a fully self-contained soulbound credential: non-transferable, revocable, and self-describing.

## Superteam Academy's XP Token

Superteam Academy uses exactly this pattern for its XP token: a Token-2022 mint with NonTransferable + PermanentDelegate. Learners earn XP that is permanently bound to their wallet -- it cannot be traded or transferred, ensuring XP represents genuine learning effort.`,
              },
            ],
          },
        },

        // ── Module 3: NFTs on Solana ────────────────────────────────────────
        {
          title: "NFTs on Solana",
          description: "Non-fungible tokens, metadata, and collection standards",
          order: 2,
          lessons: {
            create: [
              {
                title: "NFT Standards Overview",
                description: "Understanding NFT standards and programs on Solana",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# NFT Standards Overview

Non-fungible tokens on Solana have evolved through multiple standards. Understanding the landscape helps you choose the right approach for your project.

## What Makes a Token Non-Fungible?

An NFT on Solana is simply an SPL token with:
- **0 decimals** -- no fractional units
- **Supply of 1** -- only one unit exists
- **Mint authority revoked** -- no more can be minted

This makes the mint address a unique identifier for a one-of-a-kind asset.

## Metaplex Token Metadata (Legacy)

The **Metaplex Token Metadata Program** (\`metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s\`) has been the dominant NFT standard on Solana since 2021. It stores metadata in a PDA derived from the mint address:

\`\`\`
seeds = ["metadata", METADATA_PROGRAM_ID, mint]
\`\`\`

The metadata account stores:
- **name**: Display name (max 32 chars)
- **symbol**: Short symbol (max 10 chars)
- **uri**: Link to off-chain JSON metadata (image, attributes, etc.)
- **creators**: Array of creator public keys with verified flags and share percentages
- **sellerFeeBasisPoints**: Royalty percentage for secondary sales

### Master Edition

For true 1-of-1 NFTs, Metaplex adds a **Master Edition** account that proves uniqueness and controls print supply.

## Metaplex Core

**Metaplex Core** is a newer, gas-optimized standard. Instead of using the SPL Token Program for the underlying token, Core creates a single account that represents the entire asset:

- Cheaper to mint (fewer accounts, fewer CPIs)
- Built-in collection support
- Plugin system for royalties, freezing, attributes
- No separate token account needed

\`\`\`typescript
import { createV1 } from "@metaplex-foundation/mpl-core";

await createV1(umi, {
  asset: generateSigner(umi),
  name: "My NFT",
  uri: "https://arweave.net/...",
  collection: collectionMint,
}).sendAndConfirm(umi);
\`\`\`

## Token-2022 NFTs

With Token-2022's **MetadataPointer** and **TokenMetadata** extensions, you can store metadata directly in the mint account without any external program:

\`\`\`typescript
const mintLen = getMintLen([
  ExtensionType.MetadataPointer,
]);
// + additional space for TokenMetadata fields
\`\`\`

Advantages:
- No dependency on Metaplex programs
- Metadata lives in the mint account itself
- Can combine with NonTransferable, PermanentDelegate, etc.

## Compressed NFTs (cNFTs)

For large-scale collections (10K+ items), **compressed NFTs** using state compression reduce minting costs by 1000x. Instead of creating individual accounts, cNFTs are stored in a Merkle tree. The DAS API provides indexing and proof generation for ownership verification.

## Comparison Table

| Standard | Cost per Mint | Metadata Location | Best For |
|----------|--------------|-------------------|----------|
| Metaplex Token Metadata | ~0.015 SOL | Separate PDA | Established collections, marketplace compatibility |
| Metaplex Core | ~0.003 SOL | Single account | New projects, gas-sensitive mints |
| Token-2022 + Metadata | ~0.005 SOL | In mint account | Soulbound, tokens with extensions |
| Compressed NFTs | ~0.00005 SOL | Merkle tree | Large collections, airdrops |

## Choosing a Standard

- **Marketplace sales**: Metaplex Token Metadata or Core (broadest wallet/marketplace support)
- **Soulbound credentials**: Token-2022 with NonTransferable
- **Massive airdrops**: Compressed NFTs
- **New projects**: Metaplex Core (modern, efficient, growing ecosystem support)`,
              },
              {
                title: "Metadata & Collections",
                description: "On-chain and off-chain metadata patterns for NFTs",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Metadata & Collections

NFT metadata is the bridge between a raw on-chain token and the rich visual experience users see in wallets and marketplaces. This lesson covers how metadata works on Solana, both on-chain and off-chain.

## Off-Chain Metadata (JSON Standard)

The Metaplex JSON standard defines what goes in the URI field. This JSON file is typically hosted on Arweave, IPFS, or a CDN:

\`\`\`json
{
  "name": "Superteam Academy Certificate #001",
  "symbol": "STAC",
  "description": "Proof of completion for Token Engineering on Solana",
  "image": "https://arweave.net/abc123/image.png",
  "external_url": "https://academy.superteam.fun",
  "attributes": [
    { "trait_type": "Course", "value": "Token Engineering" },
    { "trait_type": "Track", "value": "Token Engineering" },
    { "trait_type": "Difficulty", "value": "Intermediate" },
    { "trait_type": "XP Earned", "value": "1000" }
  ],
  "properties": {
    "files": [
      { "uri": "https://arweave.net/abc123/image.png", "type": "image/png" }
    ],
    "category": "image",
    "creators": [
      { "address": "STBRxyz...", "share": 100 }
    ]
  }
}
\`\`\`

### Key Fields

- **image**: The visual representation. MUST be a direct link to an image file (PNG, JPG, GIF, SVG).
- **attributes**: Array of trait-value pairs that marketplaces display and allow filtering on.
- **properties.files**: All files associated with the NFT (images, video, audio, 3D models).
- **properties.category**: Hint for wallets on how to render the NFT (\`image\`, \`video\`, \`audio\`, \`vr\`).

## On-Chain Metadata (Metaplex)

The on-chain metadata account stores essential fields that need to be queryable without fetching external data:

\`\`\`typescript
import { createV1 } from "@metaplex-foundation/mpl-token-metadata";

await createV1(umi, {
  mint: mintSigner,
  name: "Superteam Certificate #001",
  symbol: "STAC",
  uri: "https://arweave.net/metadata.json",
  sellerFeeBasisPoints: percentAmount(5), // 5% royalty
  creators: [
    { address: creatorWallet, verified: true, share: 100 }
  ],
  collection: { key: collectionMint, verified: false },
  tokenStandard: TokenStandard.NonFungible,
}).sendAndConfirm(umi);
\`\`\`

## Collections

A **Collection** is a special NFT that groups related NFTs together. Wallets and marketplaces use the collection field to display NFTs as a group.

### Creating a Collection

\`\`\`typescript
import { createCollectionV1 } from "@metaplex-foundation/mpl-core";

const collection = generateSigner(umi);
await createCollectionV1(umi, {
  collection,
  name: "Superteam Academy Certificates",
  uri: "https://arweave.net/collection-metadata.json",
}).sendAndConfirm(umi);
\`\`\`

### Verified Collections

The \`verified\` flag on the collection field is critical. An unverified collection means anyone could claim membership. Verification requires a signature from the collection's update authority:

\`\`\`typescript
import { verifyCollectionV1 } from "@metaplex-foundation/mpl-token-metadata";

await verifyCollectionV1(umi, {
  metadata: nftMetadata,
  collectionMint: collectionMint,
  authority: collectionAuthority,
}).sendAndConfirm(umi);
\`\`\`

## Token-2022 On-Chain Metadata

With Token-2022, metadata can live directly in the mint account. No external program needed:

\`\`\`typescript
import {
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction as createTokenMetadataInit,
} from "@solana/spl-token";
\`\`\`

The TokenMetadata extension stores name, symbol, uri, and arbitrary additional fields as key-value pairs, all within the mint account data.

## Best Practices

1. **Always use Arweave** for production metadata -- it is permanent and immutable.
2. **Include all required fields** in the JSON -- wallets may not display NFTs with missing fields.
3. **Verify your collection** -- unverified collections look suspicious on marketplaces.
4. **Use consistent trait naming** -- marketplaces build filters from attribute trait_type values.
5. **Optimize images** -- keep them under 5MB; use 1:1 aspect ratio for best display.`,
              },
              {
                title: "Mint an NFT",
                description: "Create and mint a non-fungible token on Solana",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "35 min",
                content: `# Mint an NFT

In this challenge, you will mint a non-fungible token using the SPL Token Program and Metaplex Token Metadata. You will create a mint with 0 decimals and supply of 1, attach metadata, and revoke the mint authority to guarantee uniqueness.

## Objectives

1. **Create a mint** with 0 decimals using the SPL Token Program.
2. **Create the associated token account** for the payer.
3. **Mint exactly 1 token** to the payer's ATA.
4. **Revoke the mint authority** so no more tokens can ever be minted.
5. **Create the metadata account** with name, symbol, and URI using Metaplex Token Metadata.

## Key Concepts

### The NFT Recipe

An NFT is a normal SPL token that satisfies three properties:
- 0 decimals (no fractional ownership)
- Supply of exactly 1
- Mint authority is null (supply is permanently fixed)

### Metaplex Metadata PDA

The metadata account address is derived as:
\`\`\`
PDA(["metadata", METADATA_PROGRAM_ID, mintAddress], METADATA_PROGRAM_ID)
\`\`\`

### Revoking Mint Authority

After minting 1 token, set the mint authority to \`null\`:
\`\`\`typescript
await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null);
\`\`\`

This is irreversible and guarantees the token is non-fungible.

## Expected Final State

| Property | Value |
|----------|-------|
| Mint supply | 1 |
| Mint decimals | 0 |
| Mint authority | null |
| Payer ATA balance | 1 |
| Metadata name | "Superteam Certificate" |`,
                challenge: {
                  create: {
                    prompt:
                      "Create an NFT by minting a 0-decimal SPL token with supply of 1, revoking the mint authority, and creating a Metaplex metadata account with name 'Superteam Certificate', symbol 'STAC', and a metadata URI.",
                    starterCode: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
  getMint,
} from "@solana/spl-token";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL)
  );

  const name = "Superteam Certificate";
  const symbol = "STAC";
  const uri = "https://arweave.net/example-metadata.json";

  // TODO: Step 1 - Create mint with 0 decimals
  // const mint = await createMint(...)

  // TODO: Step 2 - Create payer's ATA
  // const payerAta = ...

  // TODO: Step 3 - Mint exactly 1 token
  // await mintTo(...)

  // TODO: Step 4 - Revoke mint authority
  // await setAuthority(...)

  // TODO: Step 5 - Derive metadata PDA
  // const [metadataAddress] = PublicKey.findProgramAddressSync(
  //   [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
  //   METADATA_PROGRAM_ID
  // );

  // TODO: Step 6 - Create metadata account (build and send transaction)
  // This requires constructing the CreateMetadataAccountV3 instruction

  // TODO: Step 7 - Verify
  // const mintInfo = await getMint(connection, mint);
  // console.log("Supply:", mintInfo.supply.toString());
  // console.log("Mint authority:", mintInfo.mintAuthority);
}

main();`,
                    language: "typescript",
                    hints: [
                      "Use createMint with decimals = 0 to create a non-fungible mint.",
                      "Mint exactly 1 token (amount = 1 since decimals is 0), then revoke the mint authority with setAuthority.",
                      "The metadata PDA seeds are ['metadata', METADATA_PROGRAM_ID, mintAddress].",
                      "After revoking mint authority, getMint will return mintAuthority as null, confirming the token is truly non-fungible.",
                    ],
                    solution: `import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
  getMint,
  getAccount,
} from "@solana/spl-token";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.generate();
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL)
  );

  const name = "Superteam Certificate";
  const symbol = "STAC";
  const uri = "https://arweave.net/example-metadata.json";

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    0
  );

  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  await mintTo(connection, payer, mint, payerAta.address, payer, 1);

  await setAuthority(
    connection,
    payer,
    mint,
    payer,
    AuthorityType.MintTokens,
    null
  );

  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  const mintInfo = await getMint(connection, mint);
  const ataInfo = await getAccount(connection, payerAta.address);

  console.log("Mint:", mint.toBase58());
  console.log("Metadata PDA:", metadataAddress.toBase58());
  console.log("Supply:", mintInfo.supply.toString());
  console.log("Decimals:", mintInfo.decimals);
  console.log("Mint authority:", mintInfo.mintAuthority);
  console.log("ATA balance:", ataInfo.amount.toString());
}

main();`,
                    testCases: {
                      create: [
                        {
                          name: "Mint has 0 decimals and supply of 1",
                          input: "getMint(connection, mint)",
                          expectedOutput: "decimals: 0, supply: 1",
                          order: 0,
                        },
                        {
                          name: "Mint authority is revoked (null)",
                          input: "getMint(connection, mint).mintAuthority",
                          expectedOutput: "null",
                          order: 1,
                        },
                        {
                          name: "Payer ATA holds exactly 1 token",
                          input: "getAccount(connection, payerAta.address)",
                          expectedOutput: "amount: 1",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "NFT Royalties & Creators",
                description: "Royalty enforcement and creator verification on Solana NFTs",
                type: "content",
                order: 3,
                xpReward: 25,
                duration: "20 min",
                content: `# NFT Royalties & Creators

Royalties are a critical part of the NFT economy. They allow original creators to earn a percentage of every secondary sale. On Solana, royalty enforcement has evolved significantly, moving from voluntary compliance to protocol-level enforcement.

## How Royalties Work on Solana

### The Creator Array

Every Metaplex metadata account includes a \`creators\` array:

\`\`\`typescript
creators: [
  { address: artistWallet, verified: true, share: 80 },
  { address: platformWallet, verified: true, share: 20 },
]
\`\`\`

- **address**: The creator's wallet public key.
- **verified**: Whether the creator has signed to confirm their participation.
- **share**: Percentage of the royalty this creator receives. All shares must sum to 100.

### Seller Fee Basis Points

The \`sellerFeeBasisPoints\` field on the metadata account defines the total royalty percentage:

\`\`\`typescript
sellerFeeBasisPoints: 500 // 5% royalty on secondary sales
\`\`\`

When a sale occurs, the marketplace takes 5% of the sale price and distributes it according to creator shares: 80% to the artist (4% of sale) and 20% to the platform (1% of sale).

## Creator Verification

Only verified creators are shown in wallets and marketplaces. Verification requires the creator to sign a \`signMetadata\` transaction:

\`\`\`typescript
import { verifyCreatorV1 } from "@metaplex-foundation/mpl-token-metadata";

await verifyCreatorV1(umi, {
  metadata: metadataAddress,
  authority: creatorSigner,
}).sendAndConfirm(umi);
\`\`\`

The first creator in the array can be auto-verified during mint if they are the transaction signer. Additional creators must verify separately.

## Royalty Enforcement: The Evolution

### Era 1: Voluntary (2021-2023)
Initially, royalties were purely voluntary. Marketplaces could choose to honor \`sellerFeeBasisPoints\` or skip it. Many zero-royalty marketplaces emerged, undermining creator revenue.

### Era 2: Programmable NFTs (pNFTs)
Metaplex introduced **Programmable Non-Fungible** tokens that enforce royalties at the protocol level. pNFTs use a Token Delegate system that intercepts all transfers:

\`\`\`typescript
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

// When creating the NFT:
tokenStandard: TokenStandard.ProgrammableNonFungible
\`\`\`

pNFTs can define **rule sets** that whitelist specific programs (marketplaces) allowed to transfer the token. Marketplaces must be authorized in the rule set, giving creators control over where their NFTs can be traded.

### Era 3: Metaplex Core
Metaplex Core has built-in royalty enforcement through the **Royalties plugin**:

\`\`\`typescript
import { createV1, ruleSet } from "@metaplex-foundation/mpl-core";

await createV1(umi, {
  asset: assetSigner,
  name: "My NFT",
  uri: "https://arweave.net/...",
  plugins: [
    {
      type: "Royalties",
      basisPoints: 500,
      creators: [{ address: artist, percentage: 100 }],
      ruleSet: ruleSet("ProgramAllowList", [
        [tensorProgram, magicEdenProgram]
      ]),
    },
  ],
}).sendAndConfirm(umi);
\`\`\`

## Best Practices for Creators

1. **Use pNFTs or Core** for new collections -- voluntary royalties are unreliable.
2. **Keep royalties reasonable** -- 5-10% is the market norm. Higher rates reduce trading volume.
3. **Verify all creators** -- unverified creators are hidden by default.
4. **Include a rule set** -- whitelist reputable marketplaces that honor royalties.
5. **Consider dynamic royalties** -- some projects reduce royalties over time to increase liquidity.

## Creator Splits in Practice

For a team project, distribute shares fairly:

| Role | Share | Typical % |
|------|-------|-----------|
| Artist | 50-70% | Primary creative work |
| Developer | 20-30% | Smart contract / platform |
| Community treasury | 10-20% | DAO or project fund |`,
              },
            ],
          },
        },

        // ── Module 4: Token Economics ────────────────────────────────────────
        {
          title: "Token Economics",
          description: "Designing token supply, authority, and vesting mechanisms",
          order: 3,
          lessons: {
            create: [
              {
                title: "Supply Mechanics",
                description: "Fixed supply, inflationary, and deflationary token models",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# Supply Mechanics

Token supply mechanics define how many tokens exist, how new tokens enter circulation, and how tokens can be removed. These decisions are fundamental to a token's economic model and directly impact its value proposition.

## Fixed Supply

A **fixed supply** token has a predetermined maximum number of tokens. After minting the full supply, the mint authority is revoked:

\`\`\`typescript
import {
  createMint,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";

// Create mint
const mint = await createMint(connection, payer, payer.publicKey, null, 9);

// Mint total supply: 1 billion tokens
const totalSupply = BigInt(1_000_000_000) * BigInt(10 ** 9);
await mintTo(connection, payer, mint, treasuryAta, payer, totalSupply);

// Permanently revoke mint authority
await setAuthority(
  connection, payer, mint, payer,
  AuthorityType.MintTokens, null
);
// No more tokens can ever be created
\`\`\`

**Use cases**: Governance tokens, community tokens where scarcity matters (e.g., BONK started with a fixed supply).

## Inflationary Supply

An **inflationary** token retains its mint authority and creates new tokens over time according to a schedule:

\`\`\`typescript
// Mint authority retained -- controlled by a program or multisig
const mint = await createMint(
  connection, payer,
  multisigAddress,   // mint authority is a multisig
  null, 9
);

// Periodic minting (e.g., staking rewards)
async function mintRewards(recipientAta: PublicKey, amount: bigint) {
  await mintTo(connection, payer, mint, recipientAta, multisig, amount);
}
\`\`\`

**Key design parameters**:
- **Emission rate**: How many tokens per epoch/day/block
- **Decay schedule**: Does emission decrease over time? (e.g., halving)
- **Cap**: Is there an eventual maximum supply?

SOL itself is inflationary: validators earn staking rewards from newly minted SOL, with the inflation rate decreasing annually toward a long-term target of 1.5%.

## Deflationary Mechanisms

Deflationary pressure reduces circulating supply over time:

### Token Burning

\`\`\`typescript
import { burn } from "@solana/spl-token";

// Burn 100 tokens from the holder's account
await burn(
  connection, payer,
  holderAta,    // token account to burn from
  mint,         // the mint
  holder,       // owner of the token account
  100n * BigInt(10 ** 9)
);
\`\`\`

### Burn-on-Transfer (Token-2022)

Combine the TransferFee extension with a fee destination that burns tokens:

\`\`\`typescript
// After harvesting withheld fees to a burn account:
await burn(connection, payer, feeCollectorAta, mint, feeAuthority, harvestedAmount);
\`\`\`

### Buy-and-Burn

Protocol revenue is used to purchase tokens on the open market and burn them. This creates consistent demand while reducing supply.

## Supply Distribution

How initial supply is allocated matters as much as the total amount:

| Allocation | Typical Range | Purpose |
|-----------|---------------|---------|
| Community / Airdrop | 30-50% | Bootstrapping user base |
| Team / Founders | 15-25% | Incentive alignment (vested) |
| Treasury / DAO | 15-25% | Ongoing development funding |
| Investors | 10-20% | Early funding (vested) |
| Liquidity | 5-15% | DEX pools, market making |
| Ecosystem grants | 5-10% | Developer incentives |

## Circulating vs Total Supply

- **Total supply**: All tokens that exist on-chain (minted minus burned).
- **Circulating supply**: Tokens available for trading (excludes locked, vested, and treasury holdings).
- **Fully diluted valuation (FDV)**: Price times maximum possible supply.

For price discovery, circulating supply is what matters. A token with 10% circulating and 90% locked will face significant sell pressure as tokens unlock.`,
              },
              {
                title: "Token Authority Patterns",
                description: "Managing mint, freeze, and close authorities securely",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Token Authority Patterns

Authority management is the most security-critical aspect of token engineering. The wrong authority configuration can lead to rug pulls, frozen funds, or permanent loss of control. This lesson covers authority types, common patterns, and best practices.

## Authority Types

SPL tokens have several authority roles:

### Mint Authority
Controls who can create new tokens (\`mintTo\` instruction). This is the most powerful authority:

\`\`\`typescript
import { setAuthority, AuthorityType } from "@solana/spl-token";

// Transfer mint authority to a program/multisig
await setAuthority(
  connection, payer, mint,
  currentAuthority,
  AuthorityType.MintTokens,
  newAuthority  // or null to revoke permanently
);
\`\`\`

### Freeze Authority
Can freeze individual token accounts, preventing all transfers:

\`\`\`typescript
import { freezeAccount, thawAccount } from "@solana/spl-token";

// Freeze an account (e.g., for compliance)
await freezeAccount(connection, payer, tokenAccount, mint, freezeAuthority);

// Unfreeze when resolved
await thawAccount(connection, payer, tokenAccount, mint, freezeAuthority);
\`\`\`

### Close Authority (Token-2022)
The **MintCloseAuthority** extension allows closing a mint account to reclaim rent. Only possible when supply is 0:

\`\`\`typescript
import { createInitializeMintCloseAuthorityInstruction } from "@solana/spl-token";
\`\`\`

### Permanent Delegate (Token-2022)
An irrevocable delegate that can transfer or burn tokens from any token account for that mint. Used for:
- Soulbound token revocation
- Compliance clawback
- Auto-burn mechanics

## Common Authority Patterns

### Pattern 1: Fully Decentralized (No Authority)

\`\`\`
Mint Authority: null
Freeze Authority: null
\`\`\`

The token is immutable. No one can mint more or freeze accounts. This is the most trust-minimized setup and is required for truly decentralized tokens. Once set, this cannot be undone.

### Pattern 2: Multisig Authority

\`\`\`
Mint Authority: 3-of-5 Multisig (Squads)
Freeze Authority: 3-of-5 Multisig (Squads)
\`\`\`

Multiple keyholders must approve sensitive operations. Squads Protocol is the standard multisig on Solana:

\`\`\`typescript
// The multisig address becomes the authority
const multisig = new PublicKey("SquadsMultisigAddress...");

const mint = await createMint(
  connection, payer,
  multisig,  // mint authority
  multisig,  // freeze authority
  9
);
\`\`\`

### Pattern 3: Program-Controlled Authority

\`\`\`
Mint Authority: PDA of a custom program
Freeze Authority: PDA of a custom program
\`\`\`

A smart contract controls minting/freezing based on programmatic rules. The program encodes logic like emission schedules, vesting cliffs, and governance votes:

\`\`\`rust
// In your Anchor program:
#[account(
    mut,
    mint::authority = mint_authority,
)]
pub mint: Account<'info, Mint>,

#[account(
    seeds = [b"mint-authority"],
    bump,
)]
pub mint_authority: AccountInfo<'info>,
\`\`\`

### Pattern 4: Timelocked Authority

Authority operations require a timelock (delay period). This gives token holders time to react before sensitive changes take effect. Implemented via a custom program or Squads' time delay feature.

## Security Best Practices

1. **Never use a single EOA as mint authority for production tokens.** A compromised key means unlimited minting.
2. **Revoke freeze authority if not needed.** Users distrust tokens where their funds can be frozen.
3. **Use multisig (minimum 3-of-5)** for any authority that cannot be revoked.
4. **Transfer authority to a program PDA** when minting should follow programmatic rules.
5. **Document your authority setup** publicly -- transparency builds trust.
6. **Consider timelocks** for authority changes -- they give the community time to respond.

## Authority Transition Roadmap

A common pattern for new projects:

| Phase | Mint Authority | Freeze Authority |
|-------|---------------|-----------------|
| Launch | Team multisig (2-of-3) | Team multisig |
| Growth | Expanded multisig (3-of-5) | Revoked |
| Maturity | Program PDA (governance) | N/A |
| Final | Revoked (fixed supply) | N/A |`,
              },
              {
                title: "Build a Vesting Schedule",
                description: "Implement a token vesting mechanism with time-locked releases",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "40 min",
                content: `# Build a Vesting Schedule

Token vesting is a mechanism that releases tokens to recipients over time according to a predefined schedule. It prevents large holders from dumping tokens immediately and aligns long-term incentives. In this challenge, you will implement a simple vesting schedule using TypeScript.

## Objectives

1. **Define a vesting schedule** with a total allocation, cliff period, and linear vesting duration.
2. **Calculate vested amounts** at any given timestamp.
3. **Track claimed amounts** to prevent double-claiming.
4. **Simulate a full vesting lifecycle** from start through completion.

## Vesting Terminology

- **Total Allocation**: The total number of tokens the recipient will receive.
- **Cliff**: A period during which no tokens are released. At the cliff end, a lump sum becomes available.
- **Vesting Duration**: The total time from start to full vest.
- **Cliff Amount**: Tokens released at cliff (often 25% of total).
- **Linear Vesting**: After the cliff, remaining tokens vest linearly per second.

## Example Schedule

\`\`\`
Total: 1,000,000 tokens
Cliff: 6 months (180 days)
Vesting: 24 months (730 days) total
Cliff release: 25% (250,000 tokens)
Linear: remaining 75% over 18 months
\`\`\`

Timeline:
- Month 0-6: 0 tokens available (cliff period)
- Month 6: 250,000 tokens unlock (cliff release)
- Month 6-24: ~41,667 tokens per month (linear)
- Month 24: All 1,000,000 tokens vested

## Key Formula

\`\`\`typescript
function calculateVested(
  startTime: number,
  cliffDuration: number,
  vestingDuration: number,
  totalAllocation: bigint,
  cliffPercent: number,
  currentTime: number
): bigint {
  const elapsed = currentTime - startTime;
  if (elapsed < cliffDuration) return 0n;
  if (elapsed >= vestingDuration) return totalAllocation;

  const cliffAmount = totalAllocation * BigInt(cliffPercent) / 100n;
  const linearTotal = totalAllocation - cliffAmount;
  const linearElapsed = elapsed - cliffDuration;
  const linearDuration = vestingDuration - cliffDuration;
  const linearVested = linearTotal * BigInt(linearElapsed) / BigInt(linearDuration);

  return cliffAmount + linearVested;
}
\`\`\`

## Expected Output

Your program should print the vested and claimable amounts at several checkpoints throughout the schedule.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement a VestingSchedule class that tracks token vesting with a cliff and linear release. It should calculate vested amounts at any timestamp and track claims to prevent double-claiming.",
                    starterCode: `// Token Vesting Schedule Implementation

interface VestingConfig {
  beneficiary: string;
  totalAllocation: bigint;
  startTime: number;       // unix timestamp in seconds
  cliffDuration: number;   // seconds
  vestingDuration: number; // seconds (total, including cliff)
  cliffPercent: number;    // 0-100
}

class VestingSchedule {
  private config: VestingConfig;
  private claimed: bigint = 0n;

  constructor(config: VestingConfig) {
    this.config = config;
  }

  // TODO: Implement - returns total vested amount at the given timestamp
  getVestedAmount(currentTime: number): bigint {
    return 0n;
  }

  // TODO: Implement - returns amount available to claim (vested minus already claimed)
  getClaimableAmount(currentTime: number): bigint {
    return 0n;
  }

  // TODO: Implement - claims available tokens, updates internal state, returns claimed amount
  claim(currentTime: number): bigint {
    return 0n;
  }

  // TODO: Implement - returns summary object
  getStatus(currentTime: number): {
    totalAllocation: string;
    vested: string;
    claimed: string;
    claimable: string;
    percentVested: number;
  } {
    return {
      totalAllocation: "0",
      vested: "0",
      claimed: "0",
      claimable: "0",
      percentVested: 0,
    };
  }
}

// Test the implementation
function main() {
  const SECONDS_PER_DAY = 86400;
  const startTime = Math.floor(Date.now() / 1000);

  const schedule = new VestingSchedule({
    beneficiary: "BeneficiaryWallet111111111111111111111111111",
    totalAllocation: 1_000_000n * BigInt(10 ** 9), // 1M tokens with 9 decimals
    startTime,
    cliffDuration: 180 * SECONDS_PER_DAY,   // 6 month cliff
    vestingDuration: 730 * SECONDS_PER_DAY,  // 24 months total
    cliffPercent: 25,
  });

  const checkpoints = [
    { label: "Day 0 (start)", time: startTime },
    { label: "Day 90 (mid-cliff)", time: startTime + 90 * SECONDS_PER_DAY },
    { label: "Day 180 (cliff)", time: startTime + 180 * SECONDS_PER_DAY },
    { label: "Day 365 (1 year)", time: startTime + 365 * SECONDS_PER_DAY },
    { label: "Day 545 (18 months)", time: startTime + 545 * SECONDS_PER_DAY },
    { label: "Day 730 (fully vested)", time: startTime + 730 * SECONDS_PER_DAY },
  ];

  for (const cp of checkpoints) {
    const status = schedule.getStatus(cp.time);
    console.log(\`\\n--- \${cp.label} ---\`);
    console.log(\`  Vested: \${status.vested} (\${status.percentVested.toFixed(1)}%)\`);
    console.log(\`  Claimable: \${status.claimable}\`);
    console.log(\`  Claimed: \${status.claimed}\`);
  }

  // Simulate claiming at the cliff
  console.log("\\n=== Claiming at cliff ===");
  const cliffTime = startTime + 180 * SECONDS_PER_DAY;
  const claimed = schedule.claim(cliffTime);
  console.log(\`Claimed: \${claimed.toString()}\`);

  // Check status after claiming
  const afterClaim = schedule.getStatus(cliffTime);
  console.log(\`Claimable after: \${afterClaim.claimable}\`);

  // Try claiming again immediately (should be 0)
  const doubleClaim = schedule.claim(cliffTime);
  console.log(\`Double claim attempt: \${doubleClaim.toString()}\`);
}

main();`,
                    language: "typescript",
                    hints: [
                      "In getVestedAmount: if elapsed < cliffDuration, return 0n. If elapsed >= vestingDuration, return totalAllocation.",
                      "Calculate cliff amount as totalAllocation * BigInt(cliffPercent) / 100n, then linear vesting for the remaining portion.",
                      "getClaimableAmount is simply getVestedAmount(currentTime) - this.claimed.",
                      "In claim(), compute claimable, add it to this.claimed, and return the amount. If 0, return 0n.",
                    ],
                    solution: `interface VestingConfig {
  beneficiary: string;
  totalAllocation: bigint;
  startTime: number;
  cliffDuration: number;
  vestingDuration: number;
  cliffPercent: number;
}

class VestingSchedule {
  private config: VestingConfig;
  private claimed: bigint = 0n;

  constructor(config: VestingConfig) {
    this.config = config;
  }

  getVestedAmount(currentTime: number): bigint {
    const elapsed = currentTime - this.config.startTime;
    if (elapsed < 0) return 0n;
    if (elapsed < this.config.cliffDuration) return 0n;
    if (elapsed >= this.config.vestingDuration) return this.config.totalAllocation;

    const cliffAmount =
      this.config.totalAllocation * BigInt(this.config.cliffPercent) / 100n;
    const linearTotal = this.config.totalAllocation - cliffAmount;
    const linearElapsed = elapsed - this.config.cliffDuration;
    const linearDuration = this.config.vestingDuration - this.config.cliffDuration;
    const linearVested =
      linearTotal * BigInt(linearElapsed) / BigInt(linearDuration);

    return cliffAmount + linearVested;
  }

  getClaimableAmount(currentTime: number): bigint {
    const vested = this.getVestedAmount(currentTime);
    return vested > this.claimed ? vested - this.claimed : 0n;
  }

  claim(currentTime: number): bigint {
    const claimable = this.getClaimableAmount(currentTime);
    if (claimable === 0n) return 0n;
    this.claimed += claimable;
    return claimable;
  }

  getStatus(currentTime: number): {
    totalAllocation: string;
    vested: string;
    claimed: string;
    claimable: string;
    percentVested: number;
  } {
    const vested = this.getVestedAmount(currentTime);
    const claimable = this.getClaimableAmount(currentTime);
    const percentVested =
      Number((vested * 10000n) / this.config.totalAllocation) / 100;

    return {
      totalAllocation: this.config.totalAllocation.toString(),
      vested: vested.toString(),
      claimed: this.claimed.toString(),
      claimable: claimable.toString(),
      percentVested,
    };
  }
}

function main() {
  const SECONDS_PER_DAY = 86400;
  const startTime = Math.floor(Date.now() / 1000);

  const schedule = new VestingSchedule({
    beneficiary: "BeneficiaryWallet111111111111111111111111111",
    totalAllocation: 1_000_000n * BigInt(10 ** 9),
    startTime,
    cliffDuration: 180 * SECONDS_PER_DAY,
    vestingDuration: 730 * SECONDS_PER_DAY,
    cliffPercent: 25,
  });

  const checkpoints = [
    { label: "Day 0 (start)", time: startTime },
    { label: "Day 90 (mid-cliff)", time: startTime + 90 * SECONDS_PER_DAY },
    { label: "Day 180 (cliff)", time: startTime + 180 * SECONDS_PER_DAY },
    { label: "Day 365 (1 year)", time: startTime + 365 * SECONDS_PER_DAY },
    { label: "Day 545 (18 months)", time: startTime + 545 * SECONDS_PER_DAY },
    { label: "Day 730 (fully vested)", time: startTime + 730 * SECONDS_PER_DAY },
  ];

  for (const cp of checkpoints) {
    const status = schedule.getStatus(cp.time);
    console.log(\`\\n--- \${cp.label} ---\`);
    console.log(\`  Vested: \${status.vested} (\${status.percentVested.toFixed(1)}%)\`);
    console.log(\`  Claimable: \${status.claimable}\`);
    console.log(\`  Claimed: \${status.claimed}\`);
  }

  console.log("\\n=== Claiming at cliff ===");
  const cliffTime = startTime + 180 * SECONDS_PER_DAY;
  const claimed = schedule.claim(cliffTime);
  console.log(\`Claimed: \${claimed.toString()}\`);

  const afterClaim = schedule.getStatus(cliffTime);
  console.log(\`Claimable after: \${afterClaim.claimable}\`);

  const doubleClaim = schedule.claim(cliffTime);
  console.log(\`Double claim attempt: \${doubleClaim.toString()}\`);
}

main();`,
                    testCases: {
                      create: [
                        {
                          name: "Returns 0 tokens before cliff",
                          input: "getVestedAmount(startTime + 90 * 86400)",
                          expectedOutput: "0",
                          order: 0,
                        },
                        {
                          name: "Returns 25% at cliff",
                          input: "getVestedAmount(startTime + 180 * 86400)",
                          expectedOutput: "250000000000000",
                          order: 1,
                        },
                        {
                          name: "Returns 100% at end of vesting",
                          input: "getVestedAmount(startTime + 730 * 86400)",
                          expectedOutput: "1000000000000000",
                          order: 2,
                        },
                        {
                          name: "Double claim returns 0",
                          input: "claim(cliffTime) then claim(cliffTime)",
                          expectedOutput: "0",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Real-World Token Design",
                description: "Design a complete token economy for a Solana project",
                type: "challenge",
                order: 3,
                xpReward: 75,
                duration: "35 min",
                content: `# Real-World Token Design

In this capstone challenge, you will design and implement the token configuration for a hypothetical Solana project: a decentralized learning platform (similar to Superteam Academy). You will define the token's supply, distribution, authority model, and emission schedule.

## Objectives

1. **Define a token configuration** with supply breakdown, vesting schedules per category, and authority settings.
2. **Implement the distribution calculator** that computes allocations for each category.
3. **Model the emission schedule** showing circulating supply over 48 months.
4. **Validate** that all allocations sum to the total supply and vesting constraints are met.

## Project Context: LearnDAO Token (LEARN)

- **Total supply**: 100,000,000 LEARN (fixed)
- **Decimals**: 9
- **Purpose**: Governance, staking for course access, creator incentives

### Distribution

| Category | Allocation | Vesting |
|----------|-----------|---------|
| Community & Airdrops | 35% | 10% at TGE, 12-month linear |
| Team & Advisors | 20% | 12-month cliff, 24-month linear |
| Treasury / DAO | 20% | 6-month cliff, 36-month linear |
| Investors (Seed) | 10% | 6-month cliff, 18-month linear |
| Liquidity | 10% | 100% at TGE |
| Ecosystem Grants | 5% | No cliff, 24-month linear |

### Authority Model

- Mint authority: Revoked at TGE (fixed supply)
- Freeze authority: None
- Token standard: Token-2022 with MetadataPointer

## Expected Output

Your implementation should produce a month-by-month table showing:
- Tokens unlocked per category
- Total circulating supply
- Percentage of total supply in circulation`,
                challenge: {
                  create: {
                    prompt:
                      "Implement a TokenDesign class that models the LEARN token distribution, computes per-category vesting at any month, and outputs a 48-month emission schedule. Validate that all category allocations sum to 100% and that no category releases more than its total allocation.",
                    starterCode: `// Real-World Token Design: LearnDAO Token (LEARN)

interface CategoryConfig {
  name: string;
  allocationPercent: number;
  tgePercent: number;      // % of category allocation released at TGE
  cliffMonths: number;
  vestingMonths: number;   // total vesting duration (including cliff)
}

interface MonthlySnapshot {
  month: number;
  categories: Record<string, bigint>;
  totalCirculating: bigint;
  percentCirculating: number;
}

const TOTAL_SUPPLY = 100_000_000n * BigInt(10 ** 9); // 100M with 9 decimals

class TokenDesign {
  private categories: CategoryConfig[];

  constructor() {
    // TODO: Define all 6 categories
    this.categories = [];
  }

  // TODO: Validate that all allocation percentages sum to 100
  validate(): boolean {
    return false;
  }

  // TODO: Calculate tokens released for a category at a given month
  getCategoryReleased(category: CategoryConfig, month: number): bigint {
    return 0n;
  }

  // TODO: Generate snapshot for a specific month
  getSnapshot(month: number): MonthlySnapshot {
    return {
      month,
      categories: {},
      totalCirculating: 0n,
      percentCirculating: 0,
    };
  }

  // TODO: Generate the full 48-month emission schedule
  getEmissionSchedule(): MonthlySnapshot[] {
    return [];
  }

  // TODO: Print a formatted table
  printSchedule(): void {
    console.log("Month | Circulating | % of Supply");
    console.log("------|-------------|------------");
  }
}

function main() {
  const design = new TokenDesign();

  if (!design.validate()) {
    console.error("ERROR: Allocations do not sum to 100%");
    return;
  }

  console.log("=== LearnDAO Token (LEARN) Emission Schedule ===\\n");
  console.log(\`Total Supply: \${TOTAL_SUPPLY.toString()} base units\\n\`);

  design.printSchedule();

  // Verify final state
  const final = design.getSnapshot(48);
  console.log(\`\\nMonth 48 circulating: \${final.percentCirculating.toFixed(1)}%\`);
}

main();`,
                    language: "typescript",
                    hints: [
                      "Define each category with its allocation percent, TGE percent, cliff months, and total vesting months.",
                      "In getCategoryReleased: first compute the category's total tokens (TOTAL_SUPPLY * allocationPercent / 100). Then compute TGE release, cliff check, and linear vesting.",
                      "For linear vesting after cliff: linearReleased = remainingAfterTGE * (month - cliffMonths) / (vestingMonths - cliffMonths).",
                      "In validate(), sum all allocationPercent values and verify they equal 100.",
                    ],
                    solution: `interface CategoryConfig {
  name: string;
  allocationPercent: number;
  tgePercent: number;
  cliffMonths: number;
  vestingMonths: number;
}

interface MonthlySnapshot {
  month: number;
  categories: Record<string, bigint>;
  totalCirculating: bigint;
  percentCirculating: number;
}

const TOTAL_SUPPLY = 100_000_000n * BigInt(10 ** 9);

class TokenDesign {
  private categories: CategoryConfig[];

  constructor() {
    this.categories = [
      { name: "Community & Airdrops", allocationPercent: 35, tgePercent: 10, cliffMonths: 0, vestingMonths: 12 },
      { name: "Team & Advisors", allocationPercent: 20, tgePercent: 0, cliffMonths: 12, vestingMonths: 36 },
      { name: "Treasury / DAO", allocationPercent: 20, tgePercent: 0, cliffMonths: 6, vestingMonths: 42 },
      { name: "Investors (Seed)", allocationPercent: 10, tgePercent: 0, cliffMonths: 6, vestingMonths: 24 },
      { name: "Liquidity", allocationPercent: 10, tgePercent: 100, cliffMonths: 0, vestingMonths: 0 },
      { name: "Ecosystem Grants", allocationPercent: 5, tgePercent: 0, cliffMonths: 0, vestingMonths: 24 },
    ];
  }

  validate(): boolean {
    const total = this.categories.reduce((sum, c) => sum + c.allocationPercent, 0);
    return total === 100;
  }

  getCategoryReleased(category: CategoryConfig, month: number): bigint {
    const categoryTotal = TOTAL_SUPPLY * BigInt(category.allocationPercent) / 100n;
    const tgeRelease = categoryTotal * BigInt(category.tgePercent) / 100n;

    if (category.vestingMonths === 0) return categoryTotal;
    if (month <= 0) return tgeRelease;

    const remainingAfterTge = categoryTotal - tgeRelease;
    if (month < category.cliffMonths) return tgeRelease;
    if (month >= category.vestingMonths) return categoryTotal;

    const vestingPeriod = category.vestingMonths - category.cliffMonths;
    if (vestingPeriod <= 0) return categoryTotal;

    const elapsedAfterCliff = month - category.cliffMonths;
    const linearReleased = remainingAfterTge * BigInt(elapsedAfterCliff) / BigInt(vestingPeriod);

    return tgeRelease + linearReleased;
  }

  getSnapshot(month: number): MonthlySnapshot {
    const categories: Record<string, bigint> = {};
    let totalCirculating = 0n;

    for (const cat of this.categories) {
      const released = this.getCategoryReleased(cat, month);
      categories[cat.name] = released;
      totalCirculating += released;
    }

    const percentCirculating = Number((totalCirculating * 10000n) / TOTAL_SUPPLY) / 100;

    return { month, categories, totalCirculating, percentCirculating };
  }

  getEmissionSchedule(): MonthlySnapshot[] {
    const snapshots: MonthlySnapshot[] = [];
    for (let m = 0; m <= 48; m++) {
      snapshots.push(this.getSnapshot(m));
    }
    return snapshots;
  }

  printSchedule(): void {
    const schedule = this.getEmissionSchedule();
    console.log("Month | Circulating         | % of Supply");
    console.log("------|---------------------|------------");
    for (const snap of schedule) {
      const tokens = (snap.totalCirculating / BigInt(10 ** 9)).toString().padStart(15);
      const pct = snap.percentCirculating.toFixed(1).padStart(6);
      console.log(\`  \${String(snap.month).padStart(3)} | \${tokens} LEARN | \${pct}%\`);
    }
  }
}

function main() {
  const design = new TokenDesign();

  if (!design.validate()) {
    console.error("ERROR: Allocations do not sum to 100%");
    return;
  }

  console.log("=== LearnDAO Token (LEARN) Emission Schedule ===\\n");
  console.log(\`Total Supply: \${TOTAL_SUPPLY.toString()} base units\\n\`);

  design.printSchedule();

  const final = design.getSnapshot(48);
  console.log(\`\\nMonth 48 circulating: \${final.percentCirculating.toFixed(1)}%\`);
}

main();`,
                    testCases: {
                      create: [
                        {
                          name: "All allocations sum to 100%",
                          input: "validate()",
                          expectedOutput: "true",
                          order: 0,
                        },
                        {
                          name: "TGE circulating is 13.5% (Community 3.5% + Liquidity 10%)",
                          input: "getSnapshot(0).percentCirculating",
                          expectedOutput: "13.5",
                          order: 1,
                        },
                        {
                          name: "Month 48 circulating is 100%",
                          input: "getSnapshot(48).percentCirculating",
                          expectedOutput: "100",
                          order: 2,
                        },
                        {
                          name: "No category exceeds its total allocation",
                          input: "all categories at month 48 equal their allocation",
                          expectedOutput: "true",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}
