export function getAdvancedAnchorPatternsCourse() {
  return {
    slug: "advanced-anchor-patterns",
    title: "Advanced Anchor Patterns",
    description:
      "Deep-dive into PDA architecture, cross-program invocations, SPL Token integration, advanced constraints, and production testing patterns for Anchor programs.",
    difficulty: "intermediate",
    duration: "8 hours",
    xpTotal: 775,
    trackId: 1,
    trackLevel: 2,
    trackName: "Anchor",
    creator: "Superteam Brazil",
    tags: ["anchor", "pdas", "cpi", "rust", "spl-token", "testing"],
    prerequisites: ["anchor-fundamentals"],
    modules: {
      create: [
        // ────────────────────────────────────────────────────────────────────
        // Module 1: PDA Mastery
        // ────────────────────────────────────────────────────────────────────
        {
          title: "PDA Mastery",
          description:
            "Design, derive, and use Program Derived Addresses as the backbone of complex on-chain state machines.",
          order: 0,
          lessons: {
            create: [
              // Lesson 1.1 — PDA Architecture Patterns (content)
              {
                title: "PDA Architecture Patterns",
                description:
                  "Design on-chain state machines using PDAs as deterministic addresses",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# PDA Architecture Patterns

Program Derived Addresses (PDAs) are the backbone of complex Solana programs. They give you deterministic, program-controlled addresses that no private key can sign for — enabling programs to act as custodians of funds and authority.

## The PDA Derivation Formula

\`\`\`
PDA = find_program_address(seeds, program_id)
    = hash(seeds..., program_id, nonce) where hash is not on the Ed25519 curve
\`\`\`

The nonce (bump) is the largest value (starting from 255) that produces a point off the Ed25519 curve — making the address impossible to sign for with a private key.

\`\`\`rust
// On-chain derivation
let seeds = &[b"vault", mint.key().as_ref(), &[bump]];
let vault_pda = Pubkey::create_program_address(seeds, &program_id)?;

// Or find_program_address (off-chain, returns bump automatically)
let (vault_pda, bump) = Pubkey::find_program_address(
    &[b"vault", mint.key().as_ref()],
    &program_id,
);
\`\`\`

## PDA as Singleton State

Use a single PDA per program entity when there is only one instance:

\`\`\`rust
// Global config — one per program
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub xp_mint: Pubkey,
    pub total_courses: u32,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],  // ← singleton: no variable seeds
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## PDA as Per-User State

Use user-specific seeds to give each wallet its own account:

\`\`\`rust
// One enrollment per (learner, course) pair
#[account]
#[derive(InitSpace)]
pub struct Enrollment {
    pub learner: Pubkey,
    pub course_id: u32,
    pub xp_earned: u64,
    pub completed_at: Option<i64>,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct EnrollInCourse<'info> {
    #[account(
        init,
        payer = learner,
        space = 8 + Enrollment::INIT_SPACE,
        seeds = [b"enrollment", learner.key().as_ref(), course_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## PDA Hierarchy: Parent → Child

Complex programs need hierarchical state:

\`\`\`
Global State
    └── Course (seeds: ["course", course_id])
            └── Module (seeds: ["module", course.key, module_order])
                    └── Lesson (seeds: ["lesson", module.key, lesson_order])
                            └── Completion (seeds: ["completion", lesson.key, learner])
\`\`\`

\`\`\`rust
// Lesson PDA — parented to module
#[derive(Accounts)]
pub struct CreateLesson<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Lesson::INIT_SPACE,
        seeds = [
            b"lesson",
            module.key().as_ref(),
            &lesson_order.to_le_bytes(),
        ],
        bump,
    )]
    pub lesson: Account<'info, Lesson>,

    pub module: Account<'info, Module>,   // parent reference in seeds

    #[account(seeds = [b"course", &course_id.to_le_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,   // grandparent, validated

    #[account(mut, constraint = course.authority == authority.key())]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## PDA Seed Design Principles

| Principle | Good | Bad |
|-----------|------|-----|
| Deterministic | Use fixed strings + pubkeys | Use timestamps (non-deterministic) |
| Canonical | One seed set per logical entity | Multiple seed paths to same entity |
| Collision-resistant | Include all discriminating fields | Omit user key (all users share one PDA) |
| Storable | Store bump in account | Recompute bump every instruction |

Always store the canonical bump in the account:

\`\`\`rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.config.bump = ctx.bumps.config; // store it!
    Ok(())
}

// Later, verify cheaply without find_program_address
#[account(seeds = [b"config"], bump = config.bump)]
pub config: Account<'info, Config>,
\`\`\`

In the next lesson, we'll look at associated PDAs and authority delegation patterns.`,
              },

              // Lesson 1.2 — Associated PDAs and Authority Patterns (content)
              {
                title: "Associated PDAs and Authority Patterns",
                description:
                  "PDA-as-signer, authority delegation, and token vault patterns",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Associated PDAs and Authority Patterns

PDAs are special because programs can sign for them — enabling programs to control tokens, lamports, and other program accounts without private keys.

## PDA Signing with invoke_signed

When a program needs to sign an instruction as a PDA, it uses \`invoke_signed\`:

\`\`\`rust
use solana_program::program::invoke_signed;

let seeds = &[b"vault", mint.key().as_ref(), &[vault_bump]];
let signer_seeds = &[seeds.as_slice()];

invoke_signed(
    &spl_token::instruction::transfer(
        &spl_token::id(),
        &vault_token_account.key(),
        &recipient_token_account.key(),
        &vault_pda.key(), // authority = PDA
        &[],
        amount,
    )?,
    &[
        vault_token_account.to_account_info(),
        recipient_token_account.to_account_info(),
        vault_pda.to_account_info(),
        token_program.to_account_info(),
    ],
    signer_seeds, // PDA signs!
)?;
\`\`\`

In Anchor, this is simpler with CPI Contexts:

\`\`\`rust
let seeds = &[b"vault", mint.key().as_ref(), &[ctx.accounts.vault.bump]];
let signer_seeds = &[seeds.as_slice()];

token::transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    ),
    amount,
)?;
\`\`\`

## Token Vault Pattern

A PDA-controlled token vault is the foundation of DeFi on Solana:

\`\`\`rust
//
// Vault architecture:
//
//  User ──deposit──► VaultTokenAccount
//                          │
//                    controlled by VaultState PDA
//                          │
//  User ◄──withdraw── VaultTokenAccount
//

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,     // who can withdraw
    pub mint: Pubkey,          // which token this vault holds
    pub deposited: u64,        // total deposited (accounting)
    pub bump: u8,              // vault PDA bump
    pub token_account_bump: u8, // vault token account bump
}

#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault, // ← PDA controls the token account
        seeds = [b"vault_token", mint.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
\`\`\`

## Authority Delegation

Programs often need a tiered authority model:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub super_authority: Pubkey,  // multisig — can do everything
    pub admin: Pubkey,            // can add courses, update fees
    pub backend_signer: Pubkey,   // can sign lesson completions (rotatable)
    pub bump: u8,
}

// Delegate to admin for routine operations
#[derive(Accounts)]
pub struct AddCourse<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(constraint = config.admin == admin.key() @ AcademyError::Unauthorized)]
    pub admin: Signer<'info>,
    // ...
}

// Require multisig for critical operations
#[derive(Accounts)]
pub struct UpdateSuperAuthority<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.super_authority == super_authority.key() @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    pub super_authority: Signer<'info>,
}
\`\`\`

## Associated Token Account Pattern

For per-user token accounts, use Associated Token Accounts (ATAs):

\`\`\`rust
#[derive(Accounts)]
pub struct IssueXp<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = xp_mint,
        associated_token::authority = learner,
    )]
    pub learner_xp_ata: Account<'info, TokenAccount>,

    pub xp_mint: Account<'info, Mint>,

    /// CHECK: learner is just the recipient address
    pub learner: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
\`\`\`

ATAs are deterministic: \`find_associated_token_address(wallet, mint)\` gives the same address every time, which makes them easy to derive client-side without storing the address on-chain.`,
              },

              // Lesson 1.3 — Challenge: Escrow Protocol (challenge, typescript)
              {
                title: "Challenge: Escrow Protocol",
                description:
                  "Build the client-side logic for a PDA-backed token escrow",
                type: "challenge",
                order: 2,
                xpReward: 100,
                duration: "40 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      'Implement the client-side logic for a PDA-backed token escrow protocol. You are given a deployed Anchor program with the following IDL structure:\n\n```ts\n// Program ID: EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n// Escrow PDA seeds: ["escrow", maker.publicKey, Buffer.from([escrowId])]\n```\n\nWrite three TypeScript functions:\n1. `deriveEscrowPda(maker: PublicKey, escrowId: number, programId: PublicKey): [PublicKey, number]` — returns `[pda, bump]`\n2. `buildCreateEscrowTx(params: CreateEscrowParams): Transaction` — builds a transaction to create an escrow\n3. `buildCancelEscrowTx(params: CancelEscrowParams): Transaction` — builds a transaction to cancel (refund) an escrow\n\nSee the type definitions in the starter code.',
                    starterCode: `import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";

export interface CreateEscrowParams {
  maker: PublicKey;
  escrowId: number;
  depositMint: PublicKey;
  receiveMint: PublicKey;
  depositAmount: bigint;
  receiveAmount: bigint;
  programId: PublicKey;
  tokenProgramId: PublicKey;
}

export interface CancelEscrowParams {
  maker: PublicKey;
  escrowId: number;
  escrowPda: PublicKey;
  vaultTokenAccount: PublicKey;
  makerDepositAta: PublicKey;
  programId: PublicKey;
  tokenProgramId: PublicKey;
}

/**
 * Derive the escrow PDA and its bump.
 * Seeds: ["escrow", maker_pubkey_bytes, [escrowId]]
 */
export function deriveEscrowPda(
  maker: PublicKey,
  escrowId: number,
  programId: PublicKey
): [PublicKey, number] {
  // TODO: Use PublicKey.findProgramAddressSync with the correct seeds
  // Seed order: [Buffer.from("escrow"), maker.toBuffer(), Buffer.from([escrowId])]
}

/**
 * Build an unsigned transaction to initialize an escrow.
 * The instruction discriminator for "create_escrow" is [0xA1, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF].
 * Instruction data layout (after discriminator):
 *   escrowId:      u8    (1 byte)
 *   depositAmount: u64   (8 bytes, little-endian)
 *   receiveAmount: u64   (8 bytes, little-endian)
 */
export function buildCreateEscrowTx(params: CreateEscrowParams): Transaction {
  const [escrowPda] = deriveEscrowPda(params.maker, params.escrowId, params.programId);

  // TODO: Build instruction data buffer (17 bytes total after discriminator)
  // TODO: Create TransactionInstruction with accounts in correct order:
  //   { pubkey: params.maker, isSigner: true, isWritable: true }
  //   { pubkey: escrowPda, isSigner: false, isWritable: true }
  //   { pubkey: params.depositMint, isSigner: false, isWritable: false }
  //   { pubkey: params.receiveMint, isSigner: false, isWritable: false }
  //   { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  //   { pubkey: params.tokenProgramId, isSigner: false, isWritable: false }
  // TODO: Return a new Transaction containing the instruction
}

/**
 * Build an unsigned transaction to cancel an existing escrow.
 * The instruction discriminator for "cancel_escrow" is [0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10].
 * Instruction data: only the 8-byte discriminator (no extra args).
 */
export function buildCancelEscrowTx(params: CancelEscrowParams): Transaction {
  // TODO: Build instruction with discriminator only
  // TODO: Accounts in correct order:
  //   maker (signer, writable)
  //   escrowPda (writable)
  //   vaultTokenAccount (writable)
  //   makerDepositAta (writable)
  //   tokenProgramId (read-only)
  // TODO: Return new Transaction with this instruction
}`,
                    language: "typescript",
                    hints: [
                      "For `deriveEscrowPda`, use `PublicKey.findProgramAddressSync([Buffer.from('escrow'), maker.toBuffer(), Buffer.from([escrowId])], programId)`.",
                      "Build the data buffer with `Buffer.alloc(25)` (8 discriminator + 1 escrowId + 8 depositAmount + 8 receiveAmount), then use `buf.writeBigUInt64LE(amount, offset)` for the u64 fields.",
                      "For cancel, the instruction data is just the 8-byte discriminator: `Buffer.from([0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10])`.",
                      "Remember `new Transaction().add(instruction)` — the Transaction constructor takes no instructions, you add them with `.add()`.",
                    ],
                    solution: `import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";

export function deriveEscrowPda(
  maker: PublicKey,
  escrowId: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), maker.toBuffer(), Buffer.from([escrowId])],
    programId
  );
}

export function buildCreateEscrowTx(params: CreateEscrowParams): Transaction {
  const [escrowPda] = deriveEscrowPda(params.maker, params.escrowId, params.programId);

  const discriminator = Buffer.from([0xA1, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF]);
  const data = Buffer.alloc(25);
  discriminator.copy(data, 0);
  data.writeUInt8(params.escrowId, 8);
  data.writeBigUInt64LE(params.depositAmount, 9);
  data.writeBigUInt64LE(params.receiveAmount, 17);

  const instruction = new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.maker, isSigner: true, isWritable: true },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.depositMint, isSigner: false, isWritable: false },
      { pubkey: params.receiveMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: params.tokenProgramId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return new Transaction().add(instruction);
}

export function buildCancelEscrowTx(params: CancelEscrowParams): Transaction {
  const data = Buffer.from([0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10]);

  const instruction = new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.maker, isSigner: true, isWritable: true },
      { pubkey: params.escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.makerDepositAta, isSigner: false, isWritable: true },
      { pubkey: params.tokenProgramId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return new Transaction().add(instruction);
}`,
                    testCases: {
                      create: [
                        {
                          name: "deriveEscrowPda returns valid off-curve address",
                          input:
                            "deriveEscrowPda(new PublicKey('11111111111111111111111111111112'), 0, new PublicKey('EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'))",
                          expectedOutput:
                            "Array [PublicKey, number] where bump is 0–255",
                          order: 0,
                        },
                        {
                          name: "buildCreateEscrowTx produces 1 instruction",
                          input:
                            "buildCreateEscrowTx(params).instructions.length",
                          expectedOutput: "1",
                          order: 1,
                        },
                        {
                          name: "buildCreateEscrowTx instruction data is 25 bytes",
                          input:
                            "buildCreateEscrowTx(params).instructions[0].data.length",
                          expectedOutput: "25",
                          order: 2,
                        },
                        {
                          name: "buildCancelEscrowTx instruction data is 8 bytes",
                          input:
                            "buildCancelEscrowTx(params).instructions[0].data.length",
                          expectedOutput: "8",
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

        // ────────────────────────────────────────────────────────────────────
        // Module 2: Cross-Program Invocations
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Cross-Program Invocations",
          description:
            "Call other Solana programs from your program — the foundation of composable DeFi protocols.",
          order: 1,
          lessons: {
            create: [
              // Lesson 2.1 — CPI Architecture (content)
              {
                title: "CPI Architecture",
                description:
                  "How cross-program invocations work under the hood in the Solana runtime",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "25 min",
                content: `# CPI Architecture

Cross-Program Invocations (CPIs) allow your Solana program to call instructions on other programs. This is the mechanism behind token transfers, NFT minting, and all composable DeFi protocols on Solana.

## The CPI Model

\`\`\`
Your Program ──CPI──► Token Program ──CPI──► (no further CPIs)
    │
    └──CPI──► System Program (account creation)
\`\`\`

Key constraints:
- **Depth limit:** Maximum 4 levels of nested CPIs
- **Compute budget:** Shared across the entire call stack — CPIs consume CU from your budget
- **Account access:** CPI can only access accounts passed to the top-level transaction
- **PDA signing:** Programs can sign for PDAs derived from their program ID

## invoke vs invoke_signed

The Solana runtime provides two primitives:

\`\`\`rust
// invoke — for regular instructions (no PDA signing required)
pub fn invoke(
    instruction: &Instruction,
    account_infos: &[AccountInfo],
) -> ProgramResult

// invoke_signed — when your program signs as a PDA
pub fn invoke_signed(
    instruction: &Instruction,
    account_infos: &[AccountInfo],
    signers_seeds: &[&[&[u8]]],  // ← seeds that derive your PDA signer
) -> ProgramResult
\`\`\`

## Raw CPI Example: SOL Transfer

\`\`\`rust
use solana_program::{
    program::invoke,
    system_instruction,
};

pub fn transfer_sol(
    from: &AccountInfo,
    to: &AccountInfo,
    lamports: u64,
    system_program: &AccountInfo,
) -> ProgramResult {
    invoke(
        &system_instruction::transfer(from.key, to.key, lamports),
        &[from.clone(), to.clone(), system_program.clone()],
    )
}
\`\`\`

## CPI Security Rules

The runtime enforces strict rules on CPIs:

\`\`\`rust
// Rule 1: The callee can only write to accounts that were marked writable
// Rule 2: The callee can only sign for keys that were signers in the caller
// Rule 3: The callee cannot escalate privileges — only de-escalate

// Example: If your top-level tx has signer A, you can CPI with A as signer.
// But you cannot CPI with B as signer unless B also signed the top-level tx
// (exception: PDAs derived from your program ID).
\`\`\`

## CPI Data Flow

\`\`\`
Transaction
│
├── Instruction (your program)
│       │
│       ├── AccountInfo[0] = wallet (signer)
│       ├── AccountInfo[1] = token_account (writable)
│       └── AccountInfo[2] = token_program
│
└── CPI ──► Token Program
            │
            ├── AccountInfo[1] = token_account (writable, same object)
            └── AccountInfo[0] = wallet (same signer flag)
\`\`\`

All accounts are passed by reference — modifications made in a CPI are immediately visible to the caller when the CPI returns.

## Reload After CPI

\`\`\`rust
// IMPORTANT: If a CPI modifies an account you hold a reference to,
// reload the account data after the CPI

let vault = &ctx.accounts.vault;

// CPI that modifies vault token account
token::transfer(cpi_ctx, amount)?;

// Reload vault to see updated balance
ctx.accounts.vault.reload()?;

// Now vault.amount reflects the post-CPI balance
let new_amount = ctx.accounts.vault.amount;
\`\`\`

## Compute Unit Costs

\`\`\`
Operation                  Approximate CU cost
──────────────────────────────────────────────
invoke() overhead          ~1,000 CU
Token transfer CPI         ~4,000 CU
SPL token account create   ~2,000 CU
Ed25519 signature verify   ~13,000 CU
sha256 hash (32 bytes)     ~85 CU
\`\`\`

Request additional compute budget for CPI-heavy instructions:

\`\`\`typescript
// Client-side
const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
  units: 400_000,
});
const tx = new Transaction().add(modifyComputeUnits).add(yourInstruction);
\`\`\`

In the next lesson, we'll use Anchor's CPI Interface to make this ergonomic.`,
              },

              // Lesson 2.2 — Anchor CPI Interface (content)
              {
                title: "Anchor CPI Interface",
                description:
                  "Using Anchor's type-safe CPI wrappers for clean cross-program calls",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Anchor CPI Interface

Anchor provides type-safe CPI wrappers for common Solana programs — eliminating manual instruction building and account list construction. The \`anchor_spl\` crate is the primary source of these wrappers.

## CpiContext

The \`CpiContext\` struct bundles the accounts needed for a CPI call:

\`\`\`rust
pub struct CpiContext<'a, 'b, 'c, 'info, T> {
    pub accounts: T,                        // typed accounts struct
    pub remaining_accounts: Vec<AccountInfo<'info>>,
    pub program: AccountInfo<'info>,        // target program
    pub signer_seeds: &'a [&'b [&'c [u8]]], // PDA signing seeds (if any)
}

// Constructor without PDA signing
CpiContext::new(program_account_info, accounts)

// Constructor with PDA signing
CpiContext::new_with_signer(program_account_info, accounts, signer_seeds)
\`\`\`

## Token Transfer CPI

\`\`\`rust
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub fn withdraw_from_vault(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault_bump = ctx.accounts.vault.bump;
    let mint_key = ctx.accounts.mint.key();

    // Signer seeds for the vault PDA
    let seeds = &[b"vault".as_ref(), mint_key.as_ref(), &[vault_bump]];
    let signer_seeds = &[seeds.as_slice()];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(), // PDA signs
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", mint.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault_token", mint.key().as_ref()],
        bump = vault.token_account_bump,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(constraint = user.key() == vault.authority)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
\`\`\`

## Mint CPI (Minting New Tokens)

\`\`\`rust
use anchor_spl::token::{self, Mint, MintTo};

pub fn mint_xp(ctx: Context<MintXp>, amount: u64) -> Result<()> {
    let config_bump = ctx.accounts.config.bump;

    let seeds = &[b"config".as_ref(), &[config_bump]];
    let signer_seeds = &[seeds.as_slice()];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.xp_mint.to_account_info(),
                to: ctx.accounts.learner_xp_ata.to_account_info(),
                authority: ctx.accounts.config.to_account_info(), // config PDA is mint authority
            },
            signer_seeds,
        ),
        amount,
    )?;

    emit!(XpMinted {
        learner: ctx.accounts.learner.key(),
        amount,
    });

    Ok(())
}
\`\`\`

## System Program CPI

\`\`\`rust
use anchor_lang::system_program::{self, CreateAccount, Transfer};

// Create a new account
system_program::create_account(
    CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        CreateAccount {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.new_account.to_account_info(),
        },
    ),
    lamports,      // rent
    space as u64,  // data size
    &program_id,   // owner
)?;

// Transfer SOL
system_program::transfer(
    CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
    ),
    lamports,
)?;
\`\`\`

## Error Handling in CPIs

CPI errors propagate as \`ProgramError\` — wrap them with \`?:

\`\`\`rust
token::transfer(cpi_ctx, amount)
    .map_err(|e| {
        msg!("Token transfer CPI failed: {:?}", e);
        AcademyError::TransferFailed
    })?;
\`\`\`

In the next lesson, we'll specifically cover SPL Token CPIs for real-world token programs.`,
              },

              // Lesson 2.3 — SPL Token CPIs in Practice (content)
              {
                title: "SPL Token CPIs in Practice",
                description:
                  "Token-2022, burn, close, and freeze operations via CPI",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# SPL Token CPIs in Practice

The SPL Token program and its successor Token-2022 are the most frequently called programs via CPI on Solana. This lesson covers the full range of token operations you'll need for production programs.

## Token vs Token-2022

\`\`\`rust
// Token (original, SPL)
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::token;

// Token-2022 (extensions: NonTransferable, PermanentDelegate, etc.)
use anchor_spl::token_2022::{Token2022, self as token_2022};
use anchor_spl::token_interface::{TokenAccount, Mint}; // interface works for both
\`\`\`

For new programs, prefer Token-2022's \`token_interface\` types — they work with both token programs.

## Complete Token Operations

### Approve (delegate spending)

\`\`\`rust
use anchor_spl::token::{self, Approve};

token::approve(
    CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Approve {
            to: ctx.accounts.source.to_account_info(),
            delegate: ctx.accounts.escrow_pda.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    ),
    amount,
)?;
\`\`\`

### Burn Tokens

\`\`\`rust
use anchor_spl::token::{self, Burn};

token::burn(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.xp_mint.to_account_info(),
            from: ctx.accounts.user_xp_ata.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        },
        signer_seeds,
    ),
    amount,
)?;
\`\`\`

### Close Token Account (reclaim rent)

\`\`\`rust
use anchor_spl::token::{self, CloseAccount};

token::close_account(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault_token_account.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    ),
)?;
\`\`\`

### Freeze / Thaw Account

\`\`\`rust
use anchor_spl::token::{self, FreezeAccount, ThawAccount};

// Freeze (soulbound credential — cannot be transferred while frozen)
token::freeze_account(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        FreezeAccount {
            account: ctx.accounts.credential_ata.to_account_info(),
            mint: ctx.accounts.credential_mint.to_account_info(),
            authority: ctx.accounts.config.to_account_info(), // freeze authority
        },
        signer_seeds,
    ),
)?;
\`\`\`

## Token-2022 Extensions via CPI

\`\`\`rust
// NonTransferable extension — token cannot be transferred (soulbound)
use anchor_spl::token_2022_extensions::non_transferable;

// This extension is set at mint creation time, not via CPI:
#[account(
    init,
    payer = authority,
    mint::decimals = 0,
    mint::authority = config,
    extensions::non_transferable::enable = true,
    seeds = [b"xp_mint"],
    bump,
)]
pub xp_mint: InterfaceAccount<'info, Mint>,
\`\`\`

## Real Pattern: Soulbound XP Token

This is how Superteam Academy issues XP — NonTransferable Token-2022:

\`\`\`rust
// 1. Create NonTransferable mint (at program setup)
// 2. On lesson complete: mint to learner's ATA
// 3. Learner cannot transfer — XP stays with wallet

pub fn complete_lesson(ctx: Context<CompleteLesson>, lesson_id: u32) -> Result<()> {
    let config = &ctx.accounts.config;

    // Validate lesson and enrollment...

    let seeds = &[b"config".as_ref(), &[config.bump]];
    let signer_seeds = &[seeds.as_slice()];

    // Mint XP tokens (config PDA is the mint authority)
    token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::MintTo {
                mint: ctx.accounts.xp_mint.to_account_info(),
                to: ctx.accounts.learner_xp_ata.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            signer_seeds,
        ),
        ctx.accounts.lesson.xp_reward,
    )?;

    // Mark lesson complete in enrollment
    ctx.accounts.enrollment.xp_earned = ctx.accounts.enrollment
        .xp_earned
        .checked_add(ctx.accounts.lesson.xp_reward)
        .ok_or(AcademyError::Overflow)?;

    emit!(LessonCompleted {
        learner: ctx.accounts.learner.key(),
        lesson_id,
        xp_awarded: ctx.accounts.lesson.xp_reward,
    });

    Ok(())
}
\`\`\`

In the next lesson, you'll implement a token staking program that puts all these CPI patterns together.`,
              },

              // Lesson 2.4 — Challenge: Token Staking (challenge, typescript)
              {
                title: "Challenge: Token Staking",
                description:
                  "Build the client for a token staking program using PDAs and CPIs",
                type: "challenge",
                order: 3,
                xpReward: 120,
                duration: "45 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      'Build the client-side logic for a token staking program. The program allows users to stake SPL tokens in a PDA vault and earn rewards over time.\n\nThe deployed program has these accounts:\n- `StakingPool` PDA: seeds `["pool", mint_pubkey]`\n- `StakeRecord` PDA: seeds `["stake", pool_pubkey, staker_pubkey]`\n\nWrite these TypeScript functions:\n1. `getStakingPoolAddress(mint: PublicKey, programId: PublicKey): PublicKey` — derive pool PDA\n2. `getStakeRecordAddress(pool: PublicKey, staker: PublicKey, programId: PublicKey): PublicKey` — derive stake record PDA\n3. `calculatePendingRewards(stakedAmount: bigint, stakedAt: number, rewardRateBps: number, currentTimestamp: number): bigint` — calculate accrued rewards\n4. `buildStakeTx(params: StakeParams): TransactionInstruction` — build stake instruction',
                    starterCode: `import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export interface StakeParams {
  staker: PublicKey;
  stakerTokenAccount: PublicKey;
  poolVaultTokenAccount: PublicKey;
  stakingPool: PublicKey;
  stakeRecord: PublicKey;
  mint: PublicKey;
  amount: bigint;
  programId: PublicKey;
  tokenProgramId: PublicKey;
}

// Discriminator for "stake" instruction
const STAKE_DISCRIMINATOR = Buffer.from([0x05, 0x27, 0x7b, 0x61, 0x7f, 0x9f, 0x42, 0x22]);

/**
 * Derive the staking pool PDA address.
 * Seeds: ["pool", mint_pubkey_bytes]
 */
export function getStakingPoolAddress(
  mint: PublicKey,
  programId: PublicKey
): PublicKey {
  // TODO: Use findProgramAddressSync and return only the address (not bump)
}

/**
 * Derive the stake record PDA for a specific staker in a pool.
 * Seeds: ["stake", pool_pubkey_bytes, staker_pubkey_bytes]
 */
export function getStakeRecordAddress(
  pool: PublicKey,
  staker: PublicKey,
  programId: PublicKey
): PublicKey {
  // TODO: Derive and return only the PDA address
}

/**
 * Calculate pending staking rewards.
 * Formula: stakedAmount * rewardRateBps / 10_000 * elapsedSeconds / 31_536_000 (seconds per year)
 * Returns rewards as bigint (truncated, no decimals)
 *
 * @param stakedAmount - Amount of tokens staked (raw, no decimals)
 * @param stakedAt - Unix timestamp when staking started (seconds)
 * @param rewardRateBps - Annual reward rate in basis points (e.g. 1000 = 10% APR)
 * @param currentTimestamp - Current unix timestamp (seconds)
 */
export function calculatePendingRewards(
  stakedAmount: bigint,
  stakedAt: number,
  rewardRateBps: number,
  currentTimestamp: number
): bigint {
  // TODO: Calculate elapsed seconds (currentTimestamp - stakedAt)
  // TODO: Apply formula: stakedAmount * rewardRateBps * elapsedSeconds / (10_000 * 31_536_000)
  // Note: Use BigInt arithmetic throughout to avoid precision loss
}

/**
 * Build a stake instruction.
 * Instruction data: 8-byte discriminator + 8-byte amount (u64 LE)
 */
export function buildStakeTx(params: StakeParams): TransactionInstruction {
  // TODO: Build 16-byte data buffer
  // TODO: Create and return TransactionInstruction with correct accounts
}`,
                    language: "typescript",
                    hints: [
                      "For `getStakingPoolAddress`: `return PublicKey.findProgramAddressSync([Buffer.from('pool'), mint.toBuffer()], programId)[0];`",
                      "For `calculatePendingRewards`, convert everything to BigInt: `const elapsed = BigInt(currentTimestamp - stakedAt); const SECONDS_PER_YEAR = 31_536_000n;` then apply the formula.",
                      "For `buildStakeTx`, the data is `Buffer.concat([STAKE_DISCRIMINATOR, amountBuf])` where `amountBuf = Buffer.alloc(8); amountBuf.writeBigUInt64LE(params.amount, 0);`.",
                      "The accounts array for stake should be: staker (signer, writable), stakerTokenAccount (writable), poolVaultTokenAccount (writable), stakingPool (writable), stakeRecord (writable), mint (read), tokenProgramId (read).",
                    ],
                    solution: `import { PublicKey, TransactionInstruction } from "@solana/web3.js";

const STAKE_DISCRIMINATOR = Buffer.from([0x05, 0x27, 0x7b, 0x61, 0x7f, 0x9f, 0x42, 0x22]);

export function getStakingPoolAddress(mint: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), mint.toBuffer()],
    programId
  )[0];
}

export function getStakeRecordAddress(pool: PublicKey, staker: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), pool.toBuffer(), staker.toBuffer()],
    programId
  )[0];
}

export function calculatePendingRewards(
  stakedAmount: bigint,
  stakedAt: number,
  rewardRateBps: number,
  currentTimestamp: number
): bigint {
  const elapsed = BigInt(Math.max(0, currentTimestamp - stakedAt));
  const SECONDS_PER_YEAR = 31_536_000n;
  const BPS_DENOMINATOR = 10_000n;
  return (stakedAmount * BigInt(rewardRateBps) * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
}

export function buildStakeTx(params: StakeParams): TransactionInstruction {
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(params.amount, 0);
  const data = Buffer.concat([STAKE_DISCRIMINATOR, amountBuf]);

  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: params.staker, isSigner: true, isWritable: true },
      { pubkey: params.stakerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.poolVaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.stakingPool, isSigner: false, isWritable: true },
      { pubkey: params.stakeRecord, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.tokenProgramId, isSigner: false, isWritable: false },
    ],
    data,
  });
}`,
                    testCases: {
                      create: [
                        {
                          name: "getStakingPoolAddress is deterministic",
                          input:
                            "getStakingPoolAddress(mint, programId) called twice returns same address",
                          expectedOutput:
                            "Both calls return identical PublicKey",
                          order: 0,
                        },
                        {
                          name: "calculatePendingRewards: 10% APR for 1 year on 1000 tokens",
                          input:
                            "calculatePendingRewards(1000n, 0, 1000, 31536000)",
                          expectedOutput: "100n",
                          order: 1,
                        },
                        {
                          name: "calculatePendingRewards: 0 seconds elapsed = 0 rewards",
                          input:
                            "calculatePendingRewards(1000000n, 1000, 500, 1000)",
                          expectedOutput: "0n",
                          order: 2,
                        },
                        {
                          name: "buildStakeTx instruction data is 16 bytes",
                          input: "buildStakeTx(params).data.length",
                          expectedOutput: "16",
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

        // ────────────────────────────────────────────────────────────────────
        // Module 3: Advanced Constraints and Account Management
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Advanced Constraints and Account Management",
          description:
            "Anchor's constraint system, account lifecycle management, and safe state migration patterns.",
          order: 2,
          lessons: {
            create: [
              // Lesson 3.1 — Custom Constraints and Seeds (content)
              {
                title: "Custom Constraints and Seeds",
                description:
                  "Using Anchor's constraint DSL to express complex account validation rules",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "20 min",
                content: `# Custom Constraints and Seeds

Anchor's \`#[account(...)]\` attribute language is a powerful DSL for expressing account validation rules declaratively. Well-crafted constraints eliminate entire classes of vulnerabilities.

## Built-in Constraints Reference

\`\`\`rust
#[account(
    // Initialization
    init,                                // create account (fails if exists)
    init_if_needed,                      // create or load
    payer = some_signer,                 // who pays rent
    space = 8 + MyAccount::INIT_SPACE,   // how many bytes to allocate

    // PDA verification
    seeds = [b"prefix", key.as_ref()],   // derive PDA
    bump,                                // find+store bump
    bump = stored_bump,                  // verify with stored bump (cheaper)

    // Ownership and type
    owner = some_program_id,             // account.owner == value
    executable,                          // account is a program

    // Mutability
    mut,                                 // account must be writable

    // Key comparison
    address = expected_pubkey,           // account.key == value

    // Relation constraints
    has_one = field_name,                // account.field_name == ctx.accounts.field_name.key()
    constraint = expr @ ErrorCode,       // arbitrary boolean expression

    // Closing
    close = destination,                 // transfer lamports + clear data on exit
    zero,                                // assert all data bytes are zero
)]
\`\`\`

## has_one: The Most Common Relation Constraint

\`has_one\` checks that a stored pubkey matches the corresponding account:

\`\`\`rust
// Config stores: config.fee_recipient = PublicKey
// has_one verifies: config.fee_recipient == ctx.accounts.fee_recipient.key()

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = fee_recipient @ AcademyError::InvalidFeeRecipient,
        has_one = admin @ AcademyError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub fee_recipient: SystemAccount<'info>, // verified by has_one above

    pub admin: Signer<'info>, // verified by has_one above
}
\`\`\`

## constraint: Arbitrary Validation

For rules that don't fit built-in constraints:

\`\`\`rust
#[derive(Accounts)]
pub struct CompleteLesson<'info> {
    #[account(
        mut,
        seeds = [b"enrollment", learner.key().as_ref(), &enrollment.course_id.to_le_bytes()],
        bump = enrollment.bump,
        constraint = enrollment.is_active @ AcademyError::EnrollmentInactive,
        constraint = !lesson_completion.exists @ AcademyError::LessonAlreadyCompleted,
        constraint = clock.unix_timestamp <= enrollment.deadline
            @ AcademyError::EnrollmentExpired,
    )]
    pub enrollment: Account<'info, Enrollment>,

    pub lesson_completion: Account<'info, LessonCompletion>,

    pub clock: Sysvar<'info, Clock>,

    pub learner: Signer<'info>,
}
\`\`\`

## Seed Derivation with Dynamic Values

\`\`\`rust
// Seeds can include instruction arguments via the seeds::program workaround
// More commonly: use stored IDs in seeds

#[derive(Accounts)]
#[instruction(course_id: u32, lesson_order: u8)]
pub struct CreateLesson<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Lesson::INIT_SPACE,
        seeds = [
            b"lesson",
            course_id.to_le_bytes().as_ref(),
            &[lesson_order],
        ],
        bump,
    )]
    pub lesson: Account<'info, Lesson>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Realloc: Resizing Existing Accounts

\`\`\`rust
// When an account needs more space after creation
#[derive(Accounts)]
pub struct AddCourseModule<'info> {
    #[account(
        mut,
        realloc = 8 + Course::INIT_SPACE + (course.module_count as usize + 1) * ModuleRef::SIZE,
        realloc::payer = authority,
        realloc::zero = false, // don't zero new bytes (faster; initialize manually)
        seeds = [b"course", &course.id.to_le_bytes()],
        bump = course.bump,
        has_one = authority,
    )]
    pub course: Account<'info, Course>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Common Vulnerability: Missing Constraints

\`\`\`rust
// VULNERABLE: no ownership check, no signer check
#[derive(Accounts)]
pub struct Vulnerable<'info> {
    pub target: AccountInfo<'info>, // anyone can pass any account here!
}

// SAFE: explicit constraints on every account
#[derive(Accounts)]
pub struct Safe<'info> {
    #[account(
        mut,
        owner = crate::ID,       // must be owned by this program
        has_one = authority,     // authority field must match
    )]
    pub target: Account<'info, MyAccount>,

    pub authority: Signer<'info>,
}
\`\`\`

Always specify the minimum necessary constraints. The more explicit the constraints, the smaller the attack surface.`,
              },

              // Lesson 3.2 — Account Closures and Cleanup (content)
              {
                title: "Account Closures and Cleanup",
                description:
                  "Safely closing accounts, reclaiming rent, and avoiding revival attacks",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "20 min",
                content: `# Account Closures and Cleanup

Proper account lifecycle management is critical for both security and gas efficiency. Accounts that are no longer needed should be closed to reclaim rent — but closures must be done carefully to avoid security vulnerabilities.

## The close Constraint

Anchor's \`close = destination\` constraint handles account closure atomically:

\`\`\`rust
#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
    #[account(
        mut,
        close = learner,                    // transfers all lamports to learner
        seeds = [
            b"enrollment",
            learner.key().as_ref(),
            &enrollment.course_id.to_le_bytes(),
        ],
        bump = enrollment.bump,
        has_one = learner,
        constraint = enrollment.completed_at.is_some() @ AcademyError::CourseNotCompleted,
    )]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: SystemAccount<'info>,

    pub authority: Signer<'info>, // admin or learner
}
\`\`\`

What \`close\` does:
1. Transfers all lamports from the account to \`destination\`
2. Sets the account's lamport balance to 0
3. Writes all zeros to the account's data
4. Sets the account's owner to the system program

This happens in the account constraint processing, before your instruction handler runs.

## The Account Revival Attack

A dangerous pattern where an attacker resends lamports to a closed account to "revive" it:

\`\`\`
1. Your program closes AccountX (zeroes data, transfers lamports)
2. Transaction ends
3. Attacker sends lamports to AccountX (now owned by system program)
4. Next transaction: AccountX has lamports but zeroed data
5. Your program allocates it again — data is in unknown state
\`\`\`

Anchor's \`close\` constraint mitigates this by setting owner to system program, making reallocation by your program require explicit \`init\` (which checks the account is truly new).

## Manual Closure Pattern (Raw Programs)

\`\`\`rust
// In raw Solana programs without Anchor:
fn close_account<'info>(
    account_to_close: &AccountInfo<'info>,
    destination: &AccountInfo<'info>,
) -> ProgramResult {
    // Transfer all lamports
    let dest_lamports = destination.lamports();
    **destination.try_borrow_mut_lamports()? =
        dest_lamports.checked_add(account_to_close.lamports())
            .ok_or(ProgramError::InvalidInstructionData)?;
    **account_to_close.try_borrow_mut_lamports()? = 0;

    // Zero the data
    let mut data = account_to_close.try_borrow_mut_data()?;
    for byte in data.iter_mut() {
        *byte = 0;
    }

    // Transfer ownership to system program
    account_to_close.assign(&system_program::id());

    Ok(())
}
\`\`\`

## Batch Closures

When closing many accounts, CU costs add up. Use Anchor's \`close\` on multiple accounts in one instruction:

\`\`\`rust
#[derive(Accounts)]
pub struct CleanupExpiredEnrollments<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [...], bump = enrollment_1.bump,
        constraint = is_expired(&enrollment_1) @ AcademyError::NotExpired,
    )]
    pub enrollment_1: Account<'info, Enrollment>,

    #[account(
        mut,
        close = authority,
        seeds = [...], bump = enrollment_2.bump,
        constraint = is_expired(&enrollment_2) @ AcademyError::NotExpired,
    )]
    pub enrollment_2: Account<'info, Enrollment>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
\`\`\`

## Rent-Exempt Balance

Every account must maintain a minimum lamport balance to be rent-exempt. Calculate it client-side:

\`\`\`typescript
const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(space);
// For space = 50 bytes: roughly 1,113,440 lamports = 0.001 SOL
\`\`\`

When creating accounts, always fund them with at least this amount. Anchor handles this automatically with \`init\` + \`payer\`.

## State Migration via Realloc

When you need to add fields to an existing account type:

\`\`\`rust
// Version 1: original schema
#[account]
pub struct Profile { pub xp: u64, pub bump: u8 }

// Version 2: add username field
#[account]
#[derive(InitSpace)]
pub struct ProfileV2 {
    pub xp: u64,
    pub bump: u8,
    #[max_len(32)]
    pub username: String, // new field
}

// Migration instruction: realloc + initialize new field
pub fn migrate_profile(ctx: Context<MigrateProfile>) -> Result<()> {
    // After realloc constraint runs, account has new space
    // Initialize the new field
    ctx.accounts.profile.username = String::new();
    Ok(())
}
\`\`\``,
              },

              // Lesson 3.3 — Challenge: Upgradeable State Account (challenge, rust)
              {
                title: "Challenge: Upgradeable State Account",
                description:
                  "Implement a versioned on-chain account with safe migration logic",
                type: "challenge",
                order: 2,
                xpReward: 120,
                duration: "40 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      "Implement an upgradeable user profile system. You must support both reading v1 profiles and migrating them to v2 without data loss.\n\nV1 Profile (existing, 8+41 bytes):\n- `authority: Pubkey` — owner\n- `xp: u64` — XP balance\n- `bump: u8` — PDA bump\n\nV2 Profile (new, 8+75 bytes):\n- `authority: Pubkey` — owner\n- `xp: u64` — XP balance  \n- `bump: u8` — PDA bump\n- `version: u8` — schema version (must be 2 after migration)\n- `username: [u8; 32]` — null-padded UTF-8 username\n\nWrite the Anchor program with:\n1. `initialize_v2(ctx, username: [u8; 32])` — creates a new v2 profile\n2. `migrate_v1_to_v2(ctx, username: [u8; 32])` — reallocates and upgrades a v1 profile\n3. `update_username(ctx, username: [u8; 32])` — updates username on a v2 profile",
                    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod profile {
    use super::*;

    /// Create a new v2 profile.
    pub fn initialize_v2(ctx: Context<InitializeV2>, username: [u8; 32]) -> Result<()> {
        // TODO: Initialize all fields of profile_v2
        // TODO: Set version = 2
        Ok(())
    }

    /// Migrate an existing v1 profile to v2 format.
    /// The realloc constraint handles the account resizing.
    pub fn migrate_v1_to_v2(ctx: Context<MigrateV1ToV2>, username: [u8; 32]) -> Result<()> {
        // TODO: Read the xp and authority from the v1 account
        // Note: After realloc, the account is larger but the data struct
        // is now ProfileV2 (Anchor re-deserializes)
        // TODO: Set version = 2, username = username arg
        Ok(())
    }

    /// Update the username on a v2 profile.
    pub fn update_username(ctx: Context<UpdateUsername>, username: [u8; 32]) -> Result<()> {
        // TODO: Validate version == 2
        // TODO: Set profile_v2.username = username
        Ok(())
    }
}

// ── Account Structs ──────────────────────────────────────────────────────────

#[account]
pub struct ProfileV1 {
    pub authority: Pubkey, // 32 bytes
    pub xp: u64,           // 8 bytes
    pub bump: u8,          // 1 byte
}

#[account]
#[derive(InitSpace)]
pub struct ProfileV2 {
    pub authority: Pubkey, // 32 bytes
    pub xp: u64,           // 8 bytes
    pub bump: u8,          // 1 byte
    pub version: u8,       // 1 byte
    pub username: [u8; 32], // 32 bytes
}

// ── Context Structs ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeV2<'info> {
    // TODO: profile_v2 PDA with seeds [b"profile", authority.key]
    //       init, payer = authority, space = 8 + ProfileV2::INIT_SPACE

    // TODO: authority (mutable signer)

    // TODO: system_program
}

#[derive(Accounts)]
pub struct MigrateV1ToV2<'info> {
    // TODO: profile_v2 account — must already exist as a v1 profile
    //   Use realloc to resize from 8+41 to 8+ProfileV2::INIT_SPACE
    //   realloc::payer = authority, realloc::zero = true

    // TODO: authority (mutable signer, must match profile.authority)

    // TODO: system_program
}

#[derive(Accounts)]
pub struct UpdateUsername<'info> {
    // TODO: profile_v2 (mutable, must be owned by authority)
    // TODO: authority (signer)
}

// ── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum ProfileError {
    #[msg("Profile is not version 2 — migrate first")]
    NotV2,
    #[msg("Unauthorized: signer is not the profile authority")]
    Unauthorized,
}`,
                    language: "rust",
                    hints: [
                      'For `InitializeV2`, use `seeds = [b"profile", authority.key().as_ref()], bump` and store `ctx.bumps.profile_v2` in the account.',
                      "For `MigrateV1ToV2`, use `realloc = 8 + ProfileV2::INIT_SPACE, realloc::payer = authority, realloc::zero = true` — then in the handler, the account is automatically re-interpreted as `ProfileV2`.",
                      "In `migrate_v1_to_v2`, you can set fields directly since the account is typed as `Account<'info, ProfileV2>` — Anchor re-deserializes after realloc.",
                      "For `update_username`, add `constraint = profile_v2.version == 2 @ ProfileError::NotV2` to the account constraint, or check it in the handler body.",
                    ],
                    solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod profile {
    use super::*;

    pub fn initialize_v2(ctx: Context<InitializeV2>, username: [u8; 32]) -> Result<()> {
        let p = &mut ctx.accounts.profile_v2;
        p.authority = ctx.accounts.authority.key();
        p.xp = 0;
        p.bump = ctx.bumps.profile_v2;
        p.version = 2;
        p.username = username;
        Ok(())
    }

    pub fn migrate_v1_to_v2(ctx: Context<MigrateV1ToV2>, username: [u8; 32]) -> Result<()> {
        let p = &mut ctx.accounts.profile_v2;
        // authority and xp are already in the account data (preserved by realloc)
        p.version = 2;
        p.username = username;
        Ok(())
    }

    pub fn update_username(ctx: Context<UpdateUsername>, username: [u8; 32]) -> Result<()> {
        let p = &mut ctx.accounts.profile_v2;
        require!(p.version == 2, ProfileError::NotV2);
        p.username = username;
        Ok(())
    }
}

#[account]
pub struct ProfileV1 {
    pub authority: Pubkey,
    pub xp: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ProfileV2 {
    pub authority: Pubkey,
    pub xp: u64,
    pub bump: u8,
    pub version: u8,
    pub username: [u8; 32],
}

#[derive(Accounts)]
pub struct InitializeV2<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProfileV2::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump,
    )]
    pub profile_v2: Account<'info, ProfileV2>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MigrateV1ToV2<'info> {
    #[account(
        mut,
        realloc = 8 + ProfileV2::INIT_SPACE,
        realloc::payer = authority,
        realloc::zero = true,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile_v2.bump,
        has_one = authority @ ProfileError::Unauthorized,
    )]
    pub profile_v2: Account<'info, ProfileV2>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUsername<'info> {
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile_v2.bump,
        has_one = authority @ ProfileError::Unauthorized,
    )]
    pub profile_v2: Account<'info, ProfileV2>,

    pub authority: Signer<'info>,
}

#[error_code]
pub enum ProfileError {
    #[msg("Profile is not version 2 — migrate first")]
    NotV2,
    #[msg("Unauthorized: signer is not the profile authority")]
    Unauthorized,
}`,
                    testCases: {
                      create: [
                        {
                          name: "initialize_v2 sets version to 2",
                          input: "initialize_v2(ctx, [0u8; 32])",
                          expectedOutput: "profile_v2.version == 2",
                          order: 0,
                        },
                        {
                          name: "initialize_v2 stores xp = 0",
                          input: "initialize_v2(ctx, [0u8; 32])",
                          expectedOutput: "profile_v2.xp == 0",
                          order: 1,
                        },
                        {
                          name: "update_username fails on v1 profile",
                          input:
                            "update_username(ctx) on account with version = 0",
                          expectedOutput: "Error: ProfileError::NotV2",
                          order: 2,
                        },
                        {
                          name: "migrate_v1_to_v2 preserves xp balance",
                          input:
                            "migrate_v1_to_v2(ctx) on profile with xp = 500",
                          expectedOutput:
                            "profile_v2.xp == 500 after migration",
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

        // ────────────────────────────────────────────────────────────────────
        // Module 4: Testing and Production Readiness
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Testing and Production Readiness",
          description:
            "Testing strategies, verifiable builds, and IDL management for production-grade Anchor programs.",
          order: 3,
          lessons: {
            create: [
              // Lesson 4.1 — Testing Patterns with Anchor (content)
              {
                title: "Testing Patterns with Anchor",
                description:
                  "Unit tests, integration tests, and fuzz testing for Anchor programs",
                type: "content",
                order: 0,
                xpReward: 40,
                duration: "30 min",
                content: `# Testing Patterns with Anchor

Production Solana programs require comprehensive test coverage. A bug that slips to mainnet is expensive — real money is at stake. Anchor supports multiple testing strategies, each complementary.

## Test Pyramid

\`\`\`
                    ┌─────────────┐
                    │  E2E Tests  │  Slowest, most realistic
                    │ (devnet/ts) │
                    └──────┬──────┘
                    ┌──────┴──────┐
                    │ Integration │  Medium speed, real runtime
                    │  (LiteSVM)  │
                    └──────┬──────┘
                    ┌──────┴──────┐
                    │  Unit Tests │  Fastest, isolated logic
                    │  (Rust)     │
                    └─────────────┘
\`\`\`

## Rust Unit Tests

Test pure logic functions in isolation:

\`\`\`rust
// programs/academy/src/utils.rs
pub fn calculate_xp_reward(base_xp: u64, streak_multiplier: u16) -> Option<u64> {
    let multiplier = streak_multiplier as u64;
    base_xp.checked_mul(multiplier)?.checked_div(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xp_reward_normal() {
        assert_eq!(calculate_xp_reward(100, 110), Some(110)); // 10% bonus
    }

    #[test]
    fn test_xp_reward_no_streak() {
        assert_eq!(calculate_xp_reward(100, 100), Some(100)); // no bonus
    }

    #[test]
    fn test_xp_reward_overflow() {
        assert_eq!(calculate_xp_reward(u64::MAX, 200), None);
    }

    #[test]
    fn test_xp_reward_zero_base() {
        assert_eq!(calculate_xp_reward(0, 150), Some(0));
    }
}
\`\`\`

Run with: \`cargo test -p onchain-academy\`

## TypeScript Integration Tests (LiteSVM / Bankrun)

\`\`\`typescript
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program, BN } from "@coral-xyz/anchor";

describe("Counter", () => {
  let context: ProgramTestContext;
  let program: Program<Counter>;
  let authority: Keypair;

  before(async () => {
    authority = Keypair.generate();
    context = await startAnchor(".", [], [
      { address: authority.publicKey, info: { lamports: 10 * LAMPORTS_PER_SOL, ... } }
    ]);
    const provider = new BankrunProvider(context);
    program = new Program(IDL, provider);
  });

  it("initializes counter at zero", async () => {
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), authority.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.initialize()
      .accounts({ counter: counterPda, authority: authority.publicKey })
      .signers([authority])
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    assert.equal(account.count.toNumber(), 0);
    assert.ok(account.authority.equals(authority.publicKey));
  });

  it("increments counter", async () => {
    await program.methods.increment()
      .accounts({ counter: counterPda, authority: authority.publicKey })
      .signers([authority])
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    assert.equal(account.count.toNumber(), 1);
  });

  it("rejects unauthorized increment", async () => {
    const attacker = Keypair.generate();
    try {
      await program.methods.increment()
        .accounts({ counter: counterPda, authority: attacker.publicKey })
        .signers([attacker])
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.include(e.message, "ConstraintHasOne");
    }
  });
});
\`\`\`

## Testing Error Cases

\`\`\`typescript
// Test that specific Anchor errors are thrown
import { AnchorError } from "@coral-xyz/anchor";

it("fails with InsufficientXp", async () => {
  try {
    await program.methods.purchaseCourse()
      .accounts({ ... })
      .rpc();
    assert.fail();
  } catch (e) {
    if (e instanceof AnchorError) {
      assert.equal(e.error.errorCode.code, "InsufficientXp");
      assert.equal(e.error.errorCode.number, 6020); // your enum index + 6000
    }
  }
});
\`\`\`

## Fuzz Testing with Trident

\`\`\`rust
// trident-tests/fuzz_tests/fuzz_0/fuzz_instructions.rs
use trident_client::fuzzing::*;

#[derive(Arbitrary, Debug)]
pub struct IncrementData {
    // Empty — increment takes no args
}

impl FuzzInstruction for Increment {
    type IxAccounts = IncrementAccounts;
    type IxData = IncrementData;

    fn get_accounts(
        &self,
        client: &mut impl FuzzClient,
        fuzz_accounts: &mut FuzzAccounts,
    ) -> Result<(Vec<Keypair>, Vec<AccountMeta>), FuzzingError> {
        // Return random accounts — Trident will try to find inputs that panic
        let authority = fuzz_accounts.authority.get_or_create_account(
            self.accounts.authority,
            client,
            10 * LAMPORTS_PER_SOL,
        );
        // ...
        Ok((signers, account_metas))
    }
}
\`\`\`

## Test Coverage Checklist

\`\`\`
✓ Happy path: all instructions succeed with valid inputs
✓ Auth errors: wrong signer, wrong authority
✓ Arithmetic: overflow, underflow, zero inputs
✓ Account errors: wrong owner, wrong PDA seeds, uninitialized
✓ Ordering: instructions called out of order
✓ Timing: expired deadlines, future timestamps
✓ Reentrancy: same account passed twice
✓ Boundary values: u64::MAX, 0, 1
\`\`\``,
              },

              // Lesson 4.2 — Verifiable Builds and IDL Management (content)
              {
                title: "Verifiable Builds and IDL Management",
                description:
                  "Producing on-chain-verifiable builds and managing program IDLs",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Verifiable Builds and IDL Management

Before deploying to mainnet, you must ensure your compiled binary matches your source code — and that your IDL is accurate and published on-chain. These steps build user trust and enable ecosystem tooling.

## Verifiable Builds

Anchor's verifiable builds use a locked Docker environment to guarantee the same source always produces the same binary:

\`\`\`bash
# Install Docker (required for verifiable builds)
# Then:

anchor build --verifiable

# This:
# 1. Pulls the correct Rust + Anchor Docker image
# 2. Builds inside the container with locked dependencies
# 3. Outputs a reproducible .so binary
# 4. Writes a build metadata file to target/
\`\`\`

## Verifying a Deployed Program

After deploying a verifiable build, anyone can verify it:

\`\`\`bash
anchor verify <PROGRAM_ID> --provider.cluster mainnet

# Output:
# Fetching program from cluster...
# Hashing source code...
# Comparing hashes...
# ✓ Binary matches source code at commit <hash>
\`\`\`

This is powered by \`solana verify\` / OtterSec's verification service at https://verify.osec.io.

## IDL: The Interface Definition Language

Every Anchor program generates a JSON IDL describing its instructions, accounts, types, and errors:

\`\`\`json
{
  "version": "0.1.0",
  "name": "counter",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "counter", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "increment",
      "accounts": [...],
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
          { "name": "authority", "type": "publicKey" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "Overflow", "msg": "Arithmetic overflow" }
  ]
}
\`\`\`

## Publishing the IDL On-Chain

\`\`\`bash
# Deploy IDL to program's data account
anchor idl init --filepath target/idl/counter.json <PROGRAM_ID>

# Update IDL after program upgrade
anchor idl upgrade --filepath target/idl/counter.json <PROGRAM_ID>

# Fetch published IDL
anchor idl fetch <PROGRAM_ID> --out target/idl/fetched.json
\`\`\`

Publishing the IDL enables:
- **Explorer UI**: Solscan/Solana Explorer shows decoded instructions
- **Client generation**: \`anchor codegen\` produces TypeScript types
- **Ecosystem tooling**: Squads, Realms, and other tools can decode your program's txs

## IDL Versioning Strategy

\`\`\`
v1.0.0 ── Initial deployment
   │
   ├── v1.1.0 ── Add new instruction (backward compatible)
   │              └── Safe: new instruction, old clients still work
   │
   ├── v1.2.0 ── Add field to account (requires realloc migration)
   │              └── Careful: existing accounts need migration instruction
   │
   └── v2.0.0 ── Breaking change (new program ID)
                  └── Required for: changing existing account layouts,
                      removing instructions, changing discriminators
\`\`\`

## Program Upgrade Process

Solana programs can be upgraded if the upgrade authority is set:

\`\`\`bash
# Deploy upgrade
anchor upgrade target/deploy/counter.so --program-id <PROGRAM_ID>

# Freeze the program (makes it immutable — cannot be upgraded)
solana program set-upgrade-authority <PROGRAM_ID> --final

# Transfer upgrade authority to Squads multisig
solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <SQUADS_PDA>
\`\`\`

For production programs, always use a multisig as the upgrade authority — a single private key is a single point of failure.

## Pre-Mainnet Checklist

\`\`\`
□ Rust unit tests: all passing (cargo test)
□ TypeScript integration tests: all passing (anchor test)
□ Fuzz tests: run for at least 24 hours (trident fuzz)
□ Security audit: completed by external auditor
□ Verifiable build: anchor build --verifiable succeeds
□ IDL published: anchor idl init
□ Upgrade authority: transferred to multisig
□ Devnet testing: real transactions, 7+ days
□ Compute budget: measured for all instructions (< 80% of limit)
□ AI slop removed: code review complete
\`\`\``,
              },

              // Lesson 4.3 — Challenge: Integration Test Suite (challenge, typescript)
              {
                title: "Challenge: Integration Test Suite",
                description:
                  "Write a complete integration test suite for a staking program",
                type: "challenge",
                order: 2,
                xpReward: 125,
                duration: "50 min",
                content: null,
                challenge: {
                  create: {
                    prompt:
                      "Write a complete integration test suite for a simple token staking program using the Mocha/Chai testing framework. The program has two instructions:\n\n1. `stake(amount: BN)` — moves tokens from user's ATA to vault, records stake\n2. `unstake()` — returns tokens from vault to user's ATA, closes stake record\n\nYou are given a `program` object (Anchor Program) and helper functions. Write test cases that cover:\n1. Happy path: stake succeeds and deducts from user balance\n2. Happy path: unstake succeeds and returns tokens\n3. Error: staking zero tokens fails\n4. Error: staking more than balance fails\n5. Error: unstaking when no stake exists fails\n\nUse `assert` from Chai. Helper `getTokenBalance(ata: PublicKey): Promise<bigint>` is provided.",
                    starterCode: `import { assert } from "chai";
import { BN, AnchorError } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// These are provided by the test harness:
declare const program: any;     // Anchor program instance
declare const mint: PublicKey;  // the SPL token mint
declare const user: Keypair;    // funded user keypair
declare const getTokenBalance: (ata: PublicKey) => Promise<bigint>;

describe("Staking Program", () => {
  let userAta: PublicKey;
  let vaultAta: PublicKey;
  let stakingPool: PublicKey;
  let stakeRecord: PublicKey;

  before(async () => {
    // Derive all required addresses
    userAta = await getAssociatedTokenAddress(mint, user.publicKey);
    // TODO: Derive vaultAta, stakingPool, stakeRecord PDAs
    // stakingPool seeds: ["pool", mint]
    // stakeRecord seeds: ["stake", stakingPool, user.publicKey]
    // vaultAta: associated token address of stakingPool for mint
  });

  // ── Test 1: Happy Path Stake ──────────────────────────────────────────────
  it("stakes tokens and deducts from user balance", async () => {
    // TODO: Record userAta balance before staking
    // TODO: Call program.methods.stake(new BN(1000)).accounts({...}).signers([user]).rpc()
    // TODO: Record userAta balance after staking
    // TODO: Assert balance decreased by 1000
    // TODO: Assert vaultAta balance increased by 1000
  });

  // ── Test 2: Happy Path Unstake ───────────────────────────────────────────
  it("unstakes tokens and returns them to user", async () => {
    // TODO: Record userAta balance before unstaking
    // TODO: Call program.methods.unstake().accounts({...}).signers([user]).rpc()
    // TODO: Assert userAta balance returned to original
    // TODO: Assert vaultAta balance is 0
  });

  // ── Test 3: Error - Zero Stake ────────────────────────────────────────────
  it("fails when staking zero tokens", async () => {
    // TODO: Expect program.methods.stake(new BN(0)) to throw AnchorError
    // TODO: Assert error code is "ZeroAmount" (or whatever the program uses)
  });

  // ── Test 4: Error - Insufficient Balance ─────────────────────────────────
  it("fails when staking more than balance", async () => {
    // TODO: Get current user balance
    // TODO: Attempt to stake balance + 1
    // TODO: Expect error with code "InsufficientFunds"
  });

  // ── Test 5: Error - No Stake Record ──────────────────────────────────────
  it("fails to unstake when no stake exists", async () => {
    const noStakeUser = Keypair.generate();
    // TODO: Attempt unstake with a user who never staked
    // TODO: Expect AccountNotInitialized or similar error
  });
});`,
                    language: "typescript",
                    hints: [
                      "For PDA derivation in `before()`: use `PublicKey.findProgramAddressSync([Buffer.from('pool'), mint.toBuffer()], program.programId)[0]` for stakingPool.",
                      "To test error cases, wrap in try/catch: `try { await ...; assert.fail('should throw'); } catch (e) { assert.ok(e instanceof AnchorError); assert.equal(e.error.errorCode.code, 'ZeroAmount'); }`",
                      "For balance checks, `getTokenBalance` returns `bigint` — use `===` for comparison or convert with `Number()` for `assert.equal`.",
                      "In the unstake test, you can chain it after the stake test to avoid re-staking: Mocha tests run sequentially, so state persists across `it()` blocks in the same `describe()`.",
                    ],
                    solution: `import { assert } from "chai";
import { BN, AnchorError } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

declare const program: any;
declare const mint: PublicKey;
declare const user: Keypair;
declare const getTokenBalance: (ata: PublicKey) => Promise<bigint>;

describe("Staking Program", () => {
  let userAta: PublicKey;
  let vaultAta: PublicKey;
  let stakingPool: PublicKey;
  let stakeRecord: PublicKey;

  before(async () => {
    userAta = await getAssociatedTokenAddress(mint, user.publicKey);

    [stakingPool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mint.toBuffer()],
      program.programId
    );
    [stakeRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), stakingPool.toBuffer(), user.publicKey.toBuffer()],
      program.programId
    );
    vaultAta = await getAssociatedTokenAddress(mint, stakingPool, true);
  });

  it("stakes tokens and deducts from user balance", async () => {
    const balanceBefore = await getTokenBalance(userAta);

    await program.methods.stake(new BN(1000))
      .accounts({ userAta, vaultAta, stakingPool, stakeRecord, user: user.publicKey, mint })
      .signers([user])
      .rpc();

    const balanceAfter = await getTokenBalance(userAta);
    const vaultBalance = await getTokenBalance(vaultAta);

    assert.equal(balanceBefore - balanceAfter, 1000n);
    assert.equal(vaultBalance, 1000n);
  });

  it("unstakes tokens and returns them to user", async () => {
    const balanceBefore = await getTokenBalance(userAta);

    await program.methods.unstake()
      .accounts({ userAta, vaultAta, stakingPool, stakeRecord, user: user.publicKey, mint })
      .signers([user])
      .rpc();

    const balanceAfter = await getTokenBalance(userAta);
    const vaultBalance = await getTokenBalance(vaultAta);

    assert.equal(balanceAfter - balanceBefore, 1000n);
    assert.equal(vaultBalance, 0n);
  });

  it("fails when staking zero tokens", async () => {
    try {
      await program.methods.stake(new BN(0))
        .accounts({ userAta, vaultAta, stakingPool, stakeRecord, user: user.publicKey, mint })
        .signers([user])
        .rpc();
      assert.fail("should have thrown");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      assert.equal(e.error.errorCode.code, "ZeroAmount");
    }
  });

  it("fails when staking more than balance", async () => {
    const balance = await getTokenBalance(userAta);
    const tooMuch = new BN(balance.toString()).addn(1);

    try {
      await program.methods.stake(tooMuch)
        .accounts({ userAta, vaultAta, stakingPool, stakeRecord, user: user.publicKey, mint })
        .signers([user])
        .rpc();
      assert.fail("should have thrown");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      assert.equal(e.error.errorCode.code, "InsufficientFunds");
    }
  });

  it("fails to unstake when no stake exists", async () => {
    const noStakeUser = Keypair.generate();
    const [noStakeRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), stakingPool.toBuffer(), noStakeUser.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods.unstake()
        .accounts({
          userAta: await getAssociatedTokenAddress(mint, noStakeUser.publicKey),
          vaultAta,
          stakingPool,
          stakeRecord: noStakeRecord,
          user: noStakeUser.publicKey,
          mint,
        })
        .signers([noStakeUser])
        .rpc();
      assert.fail("should have thrown");
    } catch (e) {
      assert.ok(e.message.includes("AccountNotInitialized") || e instanceof AnchorError);
    }
  });
});`,
                    testCases: {
                      create: [
                        {
                          name: "stake test deducts correct amount from user balance",
                          input: "Test 1: stake 1000 tokens",
                          expectedOutput:
                            "balanceBefore - balanceAfter === 1000n",
                          order: 0,
                        },
                        {
                          name: "unstake test returns tokens to user",
                          input: "Test 2: unstake after staking 1000",
                          expectedOutput:
                            "balanceAfter - balanceBefore === 1000n && vaultBalance === 0n",
                          order: 1,
                        },
                        {
                          name: "zero stake throws ZeroAmount error",
                          input: "Test 3: stake(0)",
                          expectedOutput:
                            "AnchorError with errorCode.code === 'ZeroAmount'",
                          order: 2,
                        },
                        {
                          name: "over-balance stake throws InsufficientFunds",
                          input: "Test 4: stake(balance + 1)",
                          expectedOutput:
                            "AnchorError with errorCode.code === 'InsufficientFunds'",
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
