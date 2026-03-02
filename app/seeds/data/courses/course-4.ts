export function getCourse4() {
  return {
    slug: "defi-on-solana",
    title: "DeFi on Solana",
    description:
      "Build decentralized finance applications on Solana — AMMs, lending protocols, oracles, and yield optimization using real-world DeFi patterns.",
    difficulty: "advanced",
    duration: "14 hours",
    xpTotal: 1800,
    trackId: 3,
    trackLevel: 1,
    trackName: "DeFi",
    creator: "Superteam Brazil",
    tags: ["defi", "amm", "lending", "solana", "spl-token"],
    prerequisites: ["anchor-fundamentals"],
    modules: {
      create: [
        // ────────────────────────────────────────────────────────────────────
        // Module 1: DeFi Fundamentals on Solana
        // ────────────────────────────────────────────────────────────────────
        {
          title: "DeFi Fundamentals on Solana",
          description:
            "Master the SPL Token program, token accounts, minting mechanics, and transfer hooks that form the foundation of every DeFi protocol on Solana.",
          order: 0,
          lessons: {
            create: [
              // Lesson 1.1 — SPL Token Program Deep Dive (content)
              {
                title: "SPL Token Program Deep Dive",
                description:
                  "Understand the architecture of Solana's token standard — mints, token accounts, and authorities",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# SPL Token Program Deep Dive

The SPL Token program is the backbone of every DeFi application on Solana. Unlike Ethereum's ERC-20 where each token deploys its own contract, Solana uses a **single shared program** that manages all fungible (and non-fungible) tokens. Understanding its architecture is critical before building any DeFi protocol.

## The Two-Account Model

Every SPL token involves two types of accounts:

### 1. Mint Account
The mint defines the token itself. It stores:

\`\`\`rust
pub struct Mint {
    pub mint_authority: COption<Pubkey>,   // Who can mint new tokens
    pub supply: u64,                        // Total circulating supply
    pub decimals: u8,                       // Decimal precision (e.g., 6 for USDC)
    pub is_initialized: bool,
    pub freeze_authority: COption<Pubkey>, // Who can freeze token accounts
}
\`\`\`

- **mint_authority**: The only pubkey allowed to call \`MintTo\`. For DeFi protocols, this is usually a PDA so the program can mint programmatically.
- **decimals**: USDC uses 6, SOL (wrapped) uses 9, most DeFi tokens use 6 or 9. The on-chain value is always an integer — a "1.5 USDC" transfer is actually 1,500,000 base units.
- **freeze_authority**: Can freeze individual token accounts, preventing all transfers. Used by regulated stablecoins.

### 2. Token Account
Each user holds a separate token account per mint:

\`\`\`rust
pub struct Account {
    pub mint: Pubkey,           // Which token this account holds
    pub owner: Pubkey,          // Who controls this account
    pub amount: u64,            // Balance in base units
    pub delegate: COption<Pubkey>,
    pub state: AccountState,    // Initialized | Frozen
    pub is_native: COption<u64>,
    pub delegated_amount: u64,
    pub close_authority: COption<Pubkey>,
}
\`\`\`

This means a user with 5 different tokens has 5 different token accounts, each 165 bytes, each requiring rent exemption (~0.002 SOL).

## Associated Token Accounts (ATAs)

To avoid users needing to manually create token accounts, the **Associated Token Account** program derives a deterministic address:

\`\`\`
ATA = PDA(["associated-token-account", wallet, token_program, mint], ATA_PROGRAM)
\`\`\`

In Anchor:

\`\`\`rust
#[derive(Accounts)]
pub struct InitializeUserTokenAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
\`\`\`

## Token-2022 Extensions for DeFi

Token-2022 introduces extensions critical for DeFi:

| Extension | DeFi Use Case |
|-----------|---------------|
| **TransferFee** | Protocol revenue on every transfer |
| **InterestBearingMint** | Display accrued interest without rebasing |
| **ConfidentialTransfer** | Private DeFi transactions |
| **TransferHook** | Custom logic on every transfer (compliance, tax, callbacks) |
| **PermanentDelegate** | Protocol-controlled token burns (liquidation) |

## Key Differences from ERC-20

| Feature | ERC-20 (Ethereum) | SPL Token (Solana) |
|---------|-------------------|-------------------|
| Deployment | One contract per token | One shared program |
| State | Inside contract | Separate accounts |
| Approval | \`approve()\` sets allowance | \`delegate\` + \`delegated_amount\` |
| Decimals | Up to 18 | Up to 9 (typically 6 or 9) |
| Account cost | Free (mapping entry) | ~0.002 SOL rent |

Understanding this model is essential because every DeFi instruction — swaps, deposits, borrows — ultimately calls the SPL Token program via CPI to move tokens between accounts.`,
              },

              // Lesson 1.2 — Minting & Burning Mechanics (content)
              {
                title: "Minting & Burning Mechanics",
                description:
                  "Learn how DeFi protocols use programmatic minting and burning for LP tokens, receipt tokens, and synthetic assets",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "20 min",
                content: `# Minting & Burning Mechanics

In DeFi, minting and burning tokens is fundamental. When you deposit into a liquidity pool, LP tokens are minted. When you withdraw, they are burned. Understanding the mechanics of CPI-based minting and burning is essential for building any DeFi protocol on Solana.

## Programmatic Minting via CPI

In Anchor, a DeFi program mints tokens by invoking the SPL Token program via Cross-Program Invocation. The mint authority must be a PDA owned by the program:

\`\`\`rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

#[derive(Accounts)]
pub struct MintLpTokens<'info> {
    #[account(
        mut,
        seeds = [b"lp-mint", pool.key().as_ref()],
        bump = pool.lp_mint_bump,
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_lp_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"pool-authority", pool.key().as_ref()],
        bump = pool.authority_bump,
    )]
    /// CHECK: PDA authority
    pub pool_authority: UncheckedAccount<'info>,

    pub pool: Account<'info, LiquidityPool>,
    pub token_program: Program<'info, Token>,
}

pub fn mint_lp_tokens(ctx: Context<MintLpTokens>, amount: u64) -> Result<()> {
    let pool_key = ctx.accounts.pool.key();
    let seeds = &[
        b"pool-authority",
        pool_key.as_ref(),
        &[ctx.accounts.pool.authority_bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}
\`\`\`

Key points:
- The mint authority is a **PDA** (\`pool_authority\`) so only the program can mint
- \`new_with_signer\` passes the PDA seeds so the runtime can verify the signature
- \`amount\` is in base units (if decimals = 6, then 1_000_000 = 1 token)

## Burning Tokens

Burning destroys tokens, reducing the mint's total supply. DeFi protocols burn tokens when users withdraw liquidity:

\`\`\`rust
use anchor_spl::token::{self, Burn, Token, TokenAccount, Mint};

pub fn burn_lp_tokens(ctx: Context<BurnLpTokens>, amount: u64) -> Result<()> {
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    Ok(())
}
\`\`\`

Note: The **user** is the authority here (they own the token account), so no PDA signer seeds needed.

## The Mint-Burn Cycle in DeFi

Most DeFi protocols follow this pattern:

\`\`\`
Deposit Flow:
  User deposits Token A + Token B
  → Program validates amounts
  → Program transfers tokens to vault via CPI
  → Program mints LP tokens to user via CPI (PDA signer)

Withdraw Flow:
  User submits LP tokens
  → Program burns LP tokens via CPI (user signer)
  → Program calculates proportional share
  → Program transfers Token A + Token B from vault to user via CPI (PDA signer)
\`\`\`

## Supply-Based Pricing

LP token value is derived from the underlying vault:

\`\`\`
lp_token_value = total_vault_value / lp_token_supply

tokens_to_mint = deposit_value * lp_token_supply / total_vault_value
tokens_to_return = burn_amount * total_vault_value / lp_token_supply
\`\`\`

This is the **share-based accounting** model used by virtually every vault and liquidity pool. It is critical to handle edge cases:

- **First depositor**: When \`lp_token_supply == 0\`, mint a fixed amount (e.g., \`sqrt(amount_a * amount_b)\`)
- **Rounding**: Always round **down** for minting (favor the pool) and **down** for withdrawals (favor the pool)
- **Donation attacks**: Validate that direct deposits to the vault don't inflate share price

## Decimals and Precision

A common bug: forgetting that amounts are in base units. If Token A has 6 decimals and Token B has 9 decimals:

\`\`\`
1 USDC = 1_000_000 (6 decimals)
1 SOL  = 1_000_000_000 (9 decimals)
\`\`\`

When computing ratios, normalize to the same precision or use u128 intermediaries to avoid overflow:

\`\`\`rust
let value_a = (amount_a as u128)
    .checked_mul(price_a as u128)
    .ok_or(ErrorCode::MathOverflow)?;
\`\`\``,
              },

              // Lesson 1.3 — Transfer Hooks & DeFi Callbacks (content)
              {
                title: "Transfer Hooks & DeFi Callbacks",
                description:
                  "Explore Token-2022 transfer hooks for building composable DeFi middleware",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Transfer Hooks & DeFi Callbacks

Token-2022's Transfer Hook extension is one of the most powerful primitives for DeFi on Solana. It allows a custom program to execute logic on **every token transfer**, enabling use cases like transfer taxes, compliance checks, royalty enforcement, and composable DeFi callbacks.

## How Transfer Hooks Work

When a mint has a transfer hook configured, every \`Transfer\` or \`TransferChecked\` instruction automatically invokes the hook program:

\`\`\`
User calls: transfer_checked(from, to, amount)
  → Token-2022 executes the transfer
  → Token-2022 CPIs into the hook program's execute() function
  → Hook program runs custom logic
  → If hook returns error, the entire transfer reverts
\`\`\`

## Setting Up a Transfer Hook

### 1. Initialize the mint with the hook extension:

\`\`\`rust
use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use spl_token_2022::extension::transfer_hook::instruction::initialize as init_hook;

pub fn initialize_hooked_mint(ctx: Context<InitHookedMint>) -> Result<()> {
    // The mint must be created with extra space for the TransferHook extension
    let init_hook_ix = init_hook(
        &spl_token_2022::id(),
        &ctx.accounts.mint.key(),
        Some(ctx.accounts.authority.key()),  // hook update authority
        Some(ctx.accounts.hook_program.key()), // the program to call on transfer
    )?;

    // Invoke the instruction
    anchor_lang::solana_program::program::invoke(
        &init_hook_ix,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    Ok(())
}
\`\`\`

### 2. Implement the hook program:

The hook program must implement the \`Execute\` interface:

\`\`\`rust
use anchor_lang::prelude::*;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

#[program]
pub mod transfer_hook {
    use super::*;

    /// Called automatically on every token transfer
    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        // Access transfer details
        let source = &ctx.accounts.source;
        let destination = &ctx.accounts.destination;
        let owner = &ctx.accounts.owner;

        // Example: Enforce a maximum transfer amount
        require!(amount <= 1_000_000_000, HookError::TransferTooLarge);

        // Example: Update a transfer counter
        let counter = &mut ctx.accounts.transfer_counter;
        counter.total_transfers = counter.total_transfers
            .checked_add(1)
            .ok_or(HookError::Overflow)?;
        counter.total_volume = counter.total_volume
            .checked_add(amount)
            .ok_or(HookError::Overflow)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Execute<'info> {
    /// The source token account
    pub source: InterfaceAccount<'info, TokenAccount>,
    /// The mint
    pub mint: InterfaceAccount<'info, Mint>,
    /// The destination token account
    pub destination: InterfaceAccount<'info, TokenAccount>,
    /// The source account's owner
    pub owner: Signer<'info>,
    /// Extra account: transfer counter PDA
    #[account(mut)]
    pub transfer_counter: Account<'info, TransferCounter>,
}
\`\`\`

## DeFi Use Cases for Transfer Hooks

### 1. Protocol Revenue (Transfer Tax)
\`\`\`
On every transfer:
  fee = amount * fee_bps / 10_000
  → Redirect fee to protocol treasury
  → Net transfer = amount - fee
\`\`\`

### 2. Anti-Bot / Rate Limiting
\`\`\`
On every transfer:
  → Check if sender transferred in last N slots
  → If too frequent, reject the transfer
  → Prevents MEV sandwich attacks on new token launches
\`\`\`

### 3. Dynamic Royalties
\`\`\`
On every transfer:
  → Look up royalty rate from a config PDA
  → Calculate royalty based on transfer amount
  → Transfer royalty to creator account
\`\`\`

### 4. Compliance / KYC Gating
\`\`\`
On every transfer:
  → Check if source and destination are in an allowlist PDA
  → If either is not verified, reject the transfer
  → Enables compliant DeFi (RWA tokenization)
\`\`\`

## Extra Accounts Resolution

Transfer hooks can require additional accounts beyond the standard transfer accounts. These "extra accounts" are resolved using the \`ExtraAccountMetaList\`:

\`\`\`rust
use spl_transfer_hook_interface::instruction::ExtraAccountMeta;

// Store extra account metas in a PDA
let extra_metas = vec![
    ExtraAccountMeta::new_with_seeds(
        &[Seed::Literal { bytes: b"counter".to_vec() }],
        false, // is_signer
        true,  // is_writable
    )?,
];
\`\`\`

The client must include these extra accounts when building the transfer instruction. The \`@solana/spl-token\` JS library handles this automatically.

## Performance Considerations

- Transfer hooks add CPI overhead (~5,000-15,000 CU per transfer)
- Complex hook logic can make simple transfers expensive
- Hooks execute synchronously — a slow hook blocks the entire transaction
- Design hooks to be as lightweight as possible for high-frequency DeFi operations`,
              },

              // Lesson 1.4 — Create a Token Mint with PDA Authority (challenge)
              {
                title: "Create a Token Mint with PDA Authority",
                description:
                  "Build an Anchor instruction that initializes an SPL token mint with a PDA as the mint authority",
                type: "challenge",
                order: 3,
                xpReward: 60,
                duration: "30 min",
                content: `# Create a Token Mint with PDA Authority

In DeFi, the protocol program — not any individual user — must control minting. This is achieved by setting a PDA as the mint authority. In this challenge, you will write an Anchor instruction that creates a new SPL token mint where the mint authority is a PDA derived from your program.

## Architecture

\`\`\`
Program PDA (mint_authority)
  └── controls → Mint Account
                    └── LP Token mint for a pool

Seeds: ["mint-authority", pool_id]
\`\`\`

When the program needs to mint LP tokens, it signs the CPI with the PDA's seeds.

## Account Setup in Anchor

\`\`\`rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(pool_id: String, decimals: u8)]
pub struct CreatePoolMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = mint_authority,
        seeds = [b"pool-mint", pool_id.as_bytes()],
        bump,
    )]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: PDA used as mint authority
    #[account(
        seeds = [b"mint-authority", pool_id.as_bytes()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
\`\`\`

Anchor's \`mint::authority = mint_authority\` constraint automatically sets the PDA as the mint authority during initialization.

## Your Task

Write an Anchor program with a \`create_pool_mint\` instruction that:
1. Accepts a \`pool_id\` (String) and \`decimals\` (u8)
2. Initializes a new mint PDA at seeds \`["pool-mint", pool_id]\`
3. Sets the mint authority to a separate PDA at seeds \`["mint-authority", pool_id]\`
4. Stores the bump seeds in a \`PoolConfig\` account for later use`,
                challenge: {
                  create: {
                    prompt:
                      'Write an Anchor instruction `create_pool_mint` that initializes a new SPL token mint where the mint authority is a PDA. The instruction takes `pool_id: String` and `decimals: u8`. The mint PDA uses seeds ["pool-mint", pool_id], and the authority PDA uses seeds ["mint-authority", pool_id]. Store both bumps in a PoolConfig account at seeds ["pool-config", pool_id].',
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod defi_mint {
    use super::*;

    pub fn create_pool_mint(
        ctx: Context<CreatePoolMint>,
        pool_id: String,
        decimals: u8,
    ) -> Result<()> {
        // TODO: Store the bumps in the pool config account
        // TODO: Set pool_id, mint_bump, and authority_bump on the config
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pool_id: String, decimals: u8)]
pub struct CreatePoolMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // TODO: Initialize the mint PDA with seeds ["pool-mint", pool_id]
    //       Set decimals and authority to mint_authority PDA
    pub pool_mint: Account<'info, Mint>,

    // TODO: Derive the mint authority PDA with seeds ["mint-authority", pool_id]
    /// CHECK: PDA authority
    pub mint_authority: UncheckedAccount<'info>,

    // TODO: Initialize the pool config PDA with seeds ["pool-config", pool_id]
    pub pool_config: Account<'info, PoolConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PoolConfig {
    pub pool_id: String,
    pub mint_bump: u8,
    pub authority_bump: u8,
}`,
                    language: "rust",
                    hints: [
                      'Use #[account(init, payer = payer, mint::decimals = decimals, mint::authority = mint_authority, seeds = [b"pool-mint", pool_id.as_bytes()], bump)] for the mint account.',
                      "The mint_authority PDA only needs seeds and bump constraints — it does not need init since it is just a derived address used as an authority.",
                      "In the instruction body, access bumps via ctx.bumps.pool_mint and ctx.bumps.mint_authority, and store them on the config.",
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod defi_mint {
    use super::*;

    pub fn create_pool_mint(
        ctx: Context<CreatePoolMint>,
        pool_id: String,
        decimals: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.pool_config;
        config.pool_id = pool_id;
        config.mint_bump = ctx.bumps.pool_mint;
        config.authority_bump = ctx.bumps.mint_authority;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pool_id: String, decimals: u8)]
pub struct CreatePoolMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = mint_authority,
        seeds = [b"pool-mint", pool_id.as_bytes()],
        bump,
    )]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: PDA used as mint authority
    #[account(
        seeds = [b"mint-authority", pool_id.as_bytes()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + 4 + 32 + 1 + 1,
        seeds = [b"pool-config", pool_id.as_bytes()],
        bump,
    )]
    pub pool_config: Account<'info, PoolConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PoolConfig {
    pub pool_id: String,
    pub mint_bump: u8,
    pub authority_bump: u8,
}`,
                    testCases: {
                      create: [
                        {
                          name: "Mint PDA is initialized with correct decimals",
                          input: 'pool_id = "sol-usdc", decimals = 6',
                          expectedOutput:
                            "Mint account exists with decimals = 6 and supply = 0",
                          order: 0,
                        },
                        {
                          name: "Mint authority is the correct PDA",
                          input: 'pool_id = "sol-usdc", decimals = 6',
                          expectedOutput:
                            'Mint authority equals PDA derived from ["mint-authority", "sol-usdc"]',
                          order: 1,
                        },
                        {
                          name: "PoolConfig stores correct bumps",
                          input: 'pool_id = "sol-usdc", decimals = 6',
                          expectedOutput:
                            "PoolConfig.mint_bump and authority_bump match the canonical PDA bumps",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 1.5 — Mint LP Tokens on Deposit (challenge)
              {
                title: "Mint LP Tokens on Deposit",
                description:
                  "Implement a deposit instruction that transfers tokens into a vault and mints LP tokens to the depositor",
                type: "challenge",
                order: 4,
                xpReward: 70,
                duration: "35 min",
                content: `# Mint LP Tokens on Deposit

The deposit-and-mint flow is the most common pattern in DeFi. When a user deposits tokens into a protocol vault, they receive LP (Liquidity Provider) tokens representing their share of the pool. This challenge implements the complete deposit flow with proper share calculation.

## Share Calculation

The number of LP tokens to mint depends on the current pool state:

\`\`\`
If pool is empty (first deposit):
  lp_tokens = initial_amount (or sqrt(amount) for two-sided pools)

If pool has existing liquidity:
  lp_tokens = deposit_amount * total_lp_supply / total_vault_balance
\`\`\`

This ensures each LP token represents a proportional share of the pool.

## The Complete Flow

\`\`\`
1. User calls deposit(amount)
2. Program transfers tokens from user → vault (CPI to Token program)
3. Program calculates LP tokens to mint
4. Program mints LP tokens to user (CPI with PDA signer)
5. Program updates pool state
\`\`\`

## Anchor Implementation Pattern

\`\`\`rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let pool = &ctx.accounts.pool;

    // Step 1: Calculate LP tokens to mint
    let lp_to_mint = if pool.total_deposits == 0 {
        amount // First depositor gets 1:1
    } else {
        (amount as u128)
            .checked_mul(ctx.accounts.lp_mint.supply as u128)
            .unwrap()
            .checked_div(pool.total_deposits as u128)
            .unwrap() as u64
    };

    require!(lp_to_mint > 0, ErrorCode::DepositTooSmall);

    // Step 2: Transfer tokens from user to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // Step 3: Mint LP tokens to user
    let pool_key = pool.key();
    let seeds = &[b"mint-authority", pool_key.as_ref(), &[pool.authority_bump]];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        lp_to_mint,
    )?;

    // Step 4: Update pool state
    let pool = &mut ctx.accounts.pool;
    pool.total_deposits = pool.total_deposits.checked_add(amount).unwrap();

    Ok(())
}
\`\`\`

## Security Considerations

1. **Rounding**: Always round LP tokens **down** when minting (truncation via integer division is correct)
2. **First deposit**: The first depositor sets the initial exchange rate — be careful of manipulation
3. **Overflow**: Use \`u128\` intermediaries for multiplication before division
4. **Reentrancy**: Solana's runtime prevents reentrancy, but always update state after CPIs as a best practice

## Your Task

Complete the \`deposit\` instruction that:
1. Transfers tokens from the user to the vault
2. Calculates the correct number of LP tokens to mint
3. Mints LP tokens to the user's LP token account
4. Updates the pool's total deposit tracker`,
                challenge: {
                  create: {
                    prompt:
                      "Implement a `deposit` instruction in Anchor that: (1) transfers `amount` tokens from the user's token account to the vault via CPI, (2) calculates LP tokens to mint using share-based accounting (amount * lp_supply / total_deposits, or 1:1 for first deposit), (3) mints LP tokens to the user via CPI with PDA signer, and (4) updates pool.total_deposits.",
                    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod defi_vault {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // TODO: Calculate LP tokens to mint
        //   - If pool.total_deposits == 0, mint 1:1
        //   - Otherwise: amount * lp_supply / total_deposits (use u128)
        //   - Ensure lp_to_mint > 0

        // TODO: Transfer tokens from user to vault via CPI

        // TODO: Mint LP tokens to user via CPI with PDA signer
        //   - PDA seeds: ["mint-authority", pool.key(), &[pool.authority_bump]]

        // TODO: Update pool.total_deposits

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, token::authority = user)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = user)]
    pub user_lp_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    /// CHECK: PDA mint authority
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub total_deposits: u64,
    pub authority_bump: u8,
}`,
                    language: "rust",
                    hints: [
                      "For the first deposit (total_deposits == 0), simply set lp_to_mint = amount. For subsequent deposits, cast to u128: (amount as u128).checked_mul(lp_mint.supply as u128).unwrap().checked_div(pool.total_deposits as u128).unwrap() as u64.",
                      "Use token::transfer with CpiContext::new for the user->vault transfer (user signs). Use token::mint_to with CpiContext::new_with_signer for minting LP tokens (PDA signs).",
                      'Build signer seeds as: let pool_key = ctx.accounts.pool.key(); let seeds = &[b"mint-authority", pool_key.as_ref(), &[ctx.accounts.pool.authority_bump]]; let signer = &[&seeds[..]];',
                    ],
                    solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod defi_vault {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let pool = &ctx.accounts.pool;

        // Calculate LP tokens to mint
        let lp_to_mint = if pool.total_deposits == 0 {
            amount
        } else {
            (amount as u128)
                .checked_mul(ctx.accounts.lp_mint.supply as u128)
                .unwrap()
                .checked_div(pool.total_deposits as u128)
                .unwrap() as u64
        };

        require!(lp_to_mint > 0, ErrorCode::DepositTooSmall);

        // Transfer tokens from user to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Mint LP tokens to user
        let pool_key = ctx.accounts.pool.key();
        let seeds = &[
            b"mint-authority",
            pool_key.as_ref(),
            &[ctx.accounts.pool.authority_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    to: ctx.accounts.user_lp_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            lp_to_mint,
        )?;

        // Update pool state
        let pool = &mut ctx.accounts.pool;
        pool.total_deposits = pool.total_deposits.checked_add(amount).unwrap();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, token::authority = user)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = user)]
    pub user_lp_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    /// CHECK: PDA mint authority
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub total_deposits: u64,
    pub authority_bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit too small to mint any LP tokens")]
    DepositTooSmall,
}`,
                    testCases: {
                      create: [
                        {
                          name: "First deposit mints 1:1 LP tokens",
                          input:
                            "amount = 1_000_000, pool.total_deposits = 0, lp_supply = 0",
                          expectedOutput:
                            "1_000_000 LP tokens minted, pool.total_deposits = 1_000_000",
                          order: 0,
                        },
                        {
                          name: "Subsequent deposit mints proportional LP tokens",
                          input:
                            "amount = 500_000, pool.total_deposits = 1_000_000, lp_supply = 1_000_000",
                          expectedOutput:
                            "500_000 LP tokens minted (500_000 * 1_000_000 / 1_000_000)",
                          order: 1,
                        },
                        {
                          name: "Deposit updates pool total_deposits correctly",
                          input:
                            "amount = 250_000, pool.total_deposits = 1_000_000",
                          expectedOutput:
                            "pool.total_deposits = 1_250_000 after deposit",
                          order: 2,
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
        // Module 2: Automated Market Makers
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Automated Market Makers",
          description:
            "Build and understand AMM mechanics — constant product formula, liquidity pools, swap execution, and slippage protection on Solana.",
          order: 1,
          lessons: {
            create: [
              // Lesson 2.1 — Constant Product Formula (content)
              {
                title: "Constant Product Formula",
                description:
                  "Understand the x * y = k invariant that powers Uniswap-style AMMs on Solana",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "30 min",
                content: `# Constant Product Formula

The constant product formula \`x * y = k\` is the mathematical foundation of the most widely used AMM design, pioneered by Uniswap and adopted on Solana by protocols like Raydium and Orca. Understanding this formula deeply is essential for building or auditing any AMM.

## The Core Invariant

A constant product AMM holds two token reserves (x and y). The fundamental rule is:

\`\`\`
x * y = k

Where:
  x = reserve of token A
  y = reserve of token B
  k = constant (only changes on deposits/withdrawals)
\`\`\`

When a user swaps token A for token B, they add to reserve x and remove from reserve y, such that the product remains constant.

## Swap Calculation

If a user wants to swap \`dx\` of token A for token B:

\`\`\`
Before swap: x * y = k
After swap:  (x + dx) * (y - dy) = k

Solving for dy (amount of token B received):
  dy = y - k / (x + dx)
  dy = y - (x * y) / (x + dx)
  dy = y * dx / (x + dx)
\`\`\`

This is the **key formula**:

\`\`\`
amount_out = reserve_out * amount_in / (reserve_in + amount_in)
\`\`\`

### Numerical Example

Pool: 1000 SOL (x) and 100,000 USDC (y), so k = 100,000,000

User swaps 10 SOL:
\`\`\`
dy = 100,000 * 10 / (1000 + 10)
dy = 1,000,000 / 1010
dy = 990.099 USDC
\`\`\`

The "price" of SOL was 100 USDC, but the user receives less than 1000 USDC for 10 SOL — this is **price impact** (slippage).

## Price Impact and Slippage

The larger the trade relative to pool reserves, the worse the price:

| Trade Size (SOL) | USDC Received | Effective Price | Price Impact |
|---|---|---|---|
| 1 | 99.90 | 99.90 | 0.1% |
| 10 | 990.10 | 99.01 | 0.99% |
| 100 | 9,090.91 | 90.91 | 9.09% |
| 500 | 33,333.33 | 66.67 | 33.3% |

This is by design — the curve provides infinite liquidity but at increasingly unfavorable prices for large trades.

## Implementation in Rust

\`\`\`rust
/// Calculate output amount for a constant product swap
/// Includes fee deduction before the swap calculation
pub fn calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,  // e.g., 30 = 0.30%
) -> Result<u64> {
    require!(amount_in > 0, AmmError::ZeroInput);
    require!(reserve_in > 0 && reserve_out > 0, AmmError::EmptyPool);

    // Deduct fee from input
    let fee = (amount_in as u128)
        .checked_mul(fee_bps as u128)
        .unwrap()
        .checked_div(10_000)
        .unwrap();
    let amount_in_after_fee = (amount_in as u128).checked_sub(fee).unwrap();

    // Constant product: dy = y * dx / (x + dx)
    let numerator = amount_in_after_fee
        .checked_mul(reserve_out as u128)
        .unwrap();
    let denominator = (reserve_in as u128)
        .checked_add(amount_in_after_fee)
        .unwrap();

    let amount_out = numerator.checked_div(denominator).unwrap() as u64;

    require!(amount_out > 0, AmmError::OutputTooSmall);

    Ok(amount_out)
}
\`\`\`

## The Price Curve

The constant product formula defines a **hyperbola** in (x, y) space. Key properties:

- **Never reaches zero**: You can never drain a reserve completely
- **Convex curve**: Large trades move the price exponentially
- **Spot price**: At any point, the instantaneous price is \`price = y / x\`
- **Concentrated vs. distributed**: Liquidity is spread across all prices (0, infinity) — most is "unused"

This inefficiency led to innovations like concentrated liquidity (Uniswap V3 / Orca Whirlpool), but the constant product model remains the foundation of AMM design.`,
              },

              // Lesson 2.2 — Liquidity Pool Architecture (content)
              {
                title: "Liquidity Pool Architecture",
                description:
                  "Design a Solana AMM pool with token vaults, LP tokens, and PDA-controlled accounts",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Liquidity Pool Architecture on Solana

Building an AMM on Solana requires carefully designing the account structure. Unlike Ethereum where a contract holds both code and state, Solana requires explicit accounts for every piece of data — token vaults, pool state, LP mint, and authority PDAs.

## Account Architecture

A typical AMM pool on Solana uses 6-8 accounts:

\`\`\`
Pool PDA (state)
  ├── token_vault_a: TokenAccount (holds token A reserves)
  ├── token_vault_b: TokenAccount (holds token B reserves)
  ├── lp_mint: Mint (LP token mint)
  ├── pool_authority: PDA (controls vaults + mint)
  ├── fee_account: TokenAccount (collects trading fees)
  └── config: fee_bps, is_paused, admin
\`\`\`

### Pool State Account

\`\`\`rust
#[account]
pub struct Pool {
    /// Token A mint
    pub token_a_mint: Pubkey,
    /// Token B mint
    pub token_b_mint: Pubkey,
    /// Token A vault (PDA-owned token account)
    pub token_a_vault: Pubkey,
    /// Token B vault (PDA-owned token account)
    pub token_b_vault: Pubkey,
    /// LP token mint
    pub lp_mint: Pubkey,
    /// PDA authority over vaults and mint
    pub authority: Pubkey,
    /// Authority PDA bump
    pub authority_bump: u8,
    /// Trading fee in basis points (30 = 0.30%)
    pub fee_bps: u16,
    /// Total token A in pool (cached for computation)
    pub reserve_a: u64,
    /// Total token B in pool (cached for computation)
    pub reserve_b: u64,
    /// Is the pool accepting trades?
    pub is_active: bool,
    /// Pool creation timestamp
    pub created_at: i64,
    /// Reserved for future use
    pub _reserved: [u8; 64],
}
\`\`\`

### PDA Seed Design

Each account is derived deterministically:

\`\`\`rust
// Pool state
seeds = ["pool", token_a_mint, token_b_mint]

// Pool authority (controls vaults and LP mint)
seeds = ["pool-authority", pool.key()]

// Token A vault
seeds = ["vault-a", pool.key()]

// Token B vault
seeds = ["vault-b", pool.key()]

// LP mint
seeds = ["lp-mint", pool.key()]
\`\`\`

### Token Ordering Convention

To ensure each pair has exactly one pool, always order mints canonically:

\`\`\`rust
pub fn order_mints(mint_a: Pubkey, mint_b: Pubkey) -> (Pubkey, Pubkey) {
    if mint_a < mint_b {
        (mint_a, mint_b)
    } else {
        (mint_b, mint_a)
    }
}
\`\`\`

This prevents creating duplicate pools for the same pair.

## Initialization Flow

Creating a pool requires multiple account initializations in a single transaction:

\`\`\`rust
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<Pool>(),
        seeds = [b"pool", token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: PDA authority
    #[account(
        seeds = [b"pool-authority", pool.key().as_ref()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = creator,
        token::mint = token_a_mint,
        token::authority = authority,
        seeds = [b"vault-a", pool.key().as_ref()],
        bump,
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        token::mint = token_b_mint,
        token::authority = authority,
        seeds = [b"vault-b", pool.key().as_ref()],
        bump,
    )]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = authority,
        seeds = [b"lp-mint", pool.key().as_ref()],
        bump,
    )]
    pub lp_mint: Account<'info, Mint>,

    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
\`\`\`

## Why Cached Reserves?

The pool stores \`reserve_a\` and \`reserve_b\` as cached values rather than reading from vault accounts each time. This:

1. **Saves CU**: Reading and deserializing a TokenAccount costs ~2,000 CU
2. **Prevents manipulation**: Direct deposits to the vault (bypassing the program) don't affect the cached reserves
3. **Matches the invariant**: The program controls exactly what \`x * y = k\` means

However, the cached reserves must be updated on every swap, deposit, and withdrawal. A mismatch between cached reserves and actual vault balances is a critical bug.`,
              },

              // Lesson 2.3 — Swap Execution & Fee Collection (content)
              {
                title: "Swap Execution & Fee Collection",
                description:
                  "Implement the complete swap instruction with fee collection, slippage protection, and state updates",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Swap Execution & Fee Collection

The swap instruction is the core of any AMM. It must validate inputs, calculate the output amount (including fees), execute token transfers, update reserves, and enforce slippage protection. This lesson walks through a complete implementation.

## Swap Instruction Flow

\`\`\`
1. Validate inputs (amount > 0, pool is active)
2. Determine swap direction (A→B or B→A)
3. Calculate output amount using constant product formula with fees
4. Check slippage (output >= minimum_amount_out)
5. Transfer input tokens: user → vault (CPI)
6. Transfer output tokens: vault → user (CPI with PDA signer)
7. Update cached reserves
8. Emit event
\`\`\`

## Complete Swap Implementation

\`\`\`rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    minimum_amount_out: u64,
    a_to_b: bool,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    require!(pool.is_active, AmmError::PoolPaused);
    require!(amount_in > 0, AmmError::ZeroInput);

    // Determine reserves based on swap direction
    let (reserve_in, reserve_out) = if a_to_b {
        (pool.reserve_a, pool.reserve_b)
    } else {
        (pool.reserve_b, pool.reserve_a)
    };

    // Calculate output with fee
    let amount_out = calculate_swap_output(
        amount_in, reserve_in, reserve_out, pool.fee_bps
    )?;

    // Slippage protection
    require!(
        amount_out >= minimum_amount_out,
        AmmError::SlippageExceeded
    );

    // Transfer input tokens: user → vault
    let (user_source, vault_dest) = if a_to_b {
        (&ctx.accounts.user_token_a, &ctx.accounts.vault_a)
    } else {
        (&ctx.accounts.user_token_b, &ctx.accounts.vault_b)
    };

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: user_source.to_account_info(),
                to: vault_dest.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_in,
    )?;

    // Transfer output tokens: vault → user (PDA signs)
    let pool_key = pool.key();
    let seeds = &[b"pool-authority", pool_key.as_ref(), &[pool.authority_bump]];
    let signer_seeds = &[&seeds[..]];

    let (vault_source, user_dest) = if a_to_b {
        (&ctx.accounts.vault_b, &ctx.accounts.user_token_b)
    } else {
        (&ctx.accounts.vault_a, &ctx.accounts.user_token_a)
    };

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: vault_source.to_account_info(),
                to: user_dest.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount_out,
    )?;

    // Update reserves
    let pool = &mut ctx.accounts.pool;
    if a_to_b {
        pool.reserve_a = pool.reserve_a.checked_add(amount_in).unwrap();
        pool.reserve_b = pool.reserve_b.checked_sub(amount_out).unwrap();
    } else {
        pool.reserve_b = pool.reserve_b.checked_add(amount_in).unwrap();
        pool.reserve_a = pool.reserve_a.checked_sub(amount_out).unwrap();
    }

    Ok(())
}
\`\`\`

## Fee Models

### Input Fee (Most Common)
Fees are deducted from the input amount before the swap calculation:

\`\`\`
effective_input = amount_in * (10_000 - fee_bps) / 10_000
amount_out = reserve_out * effective_input / (reserve_in + effective_input)
\`\`\`

The fee stays in the pool as additional reserves, benefiting LP holders.

### Output Fee
Fees are deducted from the output:

\`\`\`
gross_output = reserve_out * amount_in / (reserve_in + amount_in)
amount_out = gross_output * (10_000 - fee_bps) / 10_000
\`\`\`

### Protocol Fee Split
Many AMMs split fees between LPs and the protocol:

\`\`\`
total_fee = amount_in * fee_bps / 10_000
protocol_fee = total_fee * protocol_share / 10_000  (e.g., 16.67%)
lp_fee = total_fee - protocol_fee
\`\`\`

## Slippage Protection

The \`minimum_amount_out\` parameter is critical for user protection:

\`\`\`typescript
// Client-side: calculate expected output with slippage tolerance
const expectedOutput = calculateSwapOutput(amountIn, reserveIn, reserveOut, feeBps);
const slippageBps = 50; // 0.5% tolerance
const minimumOut = expectedOutput * (10_000 - slippageBps) / 10_000;

await program.methods
    .swap(amountIn, minimumOut, true)
    .accounts({ /* ... */ })
    .rpc();
\`\`\`

Without slippage protection, a sandwich attacker can:
1. Front-run: Buy before the user (moving the price up)
2. User's swap executes at a worse price
3. Back-run: Sell after the user (profiting from the price movement)

The \`minimum_amount_out\` ensures the user's swap reverts if the price moves too much.`,
              },

              // Lesson 2.4 — Build a Constant Product Swap (challenge)
              {
                title: "Build a Constant Product Swap",
                description:
                  "Implement the swap calculation function for a constant product AMM with fees",
                type: "challenge",
                order: 3,
                xpReward: 70,
                duration: "35 min",
                content: `# Build a Constant Product Swap

In this challenge, you will implement the core swap calculation for a constant product AMM. The function must handle fee deduction, the constant product formula, and return the correct output amount.

## Requirements

Your \`calculate_swap_output\` function must:

1. Accept the input amount, both reserves, and a fee in basis points
2. Deduct the fee from the input amount first
3. Apply the constant product formula: \`dy = y * dx / (x + dx)\`
4. Use u128 arithmetic to prevent overflow
5. Return the output amount as u64

## Mathematical Foundation

\`\`\`
Given: amount_in, reserve_in, reserve_out, fee_bps

Step 1: fee = amount_in * fee_bps / 10_000
Step 2: effective_in = amount_in - fee
Step 3: amount_out = reserve_out * effective_in / (reserve_in + effective_in)

Example: Swap 100 SOL with 0.3% fee, reserves: 1000 SOL / 200,000 USDC
  fee = 100 * 30 / 10_000 = 0.3 SOL
  effective_in = 99.7 SOL
  amount_out = 200_000 * 99.7 / (1000 + 99.7) = 18,127.67 USDC
\`\`\`

## Your Task

Implement the \`calculate_swap_output\` function that correctly performs this calculation with proper error handling.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement `calculate_swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_bps: u16) -> Result<u64>` that: (1) validates inputs are non-zero, (2) deducts fee from input (fee = amount_in * fee_bps / 10000), (3) applies constant product formula using u128 math, (4) returns the output amount. Use checked arithmetic throughout.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Input amount must be greater than zero")]
    ZeroInput,
    #[msg("Pool reserves must be greater than zero")]
    EmptyPool,
    #[msg("Output amount is zero")]
    OutputTooSmall,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,
) -> Result<u64> {
    // TODO: Validate amount_in > 0
    // TODO: Validate reserve_in > 0 and reserve_out > 0
    // TODO: Calculate fee: amount_in * fee_bps / 10_000 (use u128)
    // TODO: Subtract fee from amount_in to get effective input
    // TODO: Apply constant product: reserve_out * effective_in / (reserve_in + effective_in)
    // TODO: Validate output > 0
    // TODO: Return output as u64
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "Cast to u128 before multiplication to avoid overflow: (amount_in as u128).checked_mul(fee_bps as u128).unwrap().checked_div(10_000).unwrap()",
                      "The constant product formula in u128: let numerator = (effective_in as u128).checked_mul(reserve_out as u128); let denominator = (reserve_in as u128).checked_add(effective_in as u128);",
                      "Use .ok_or(error!(AmmError::MathOverflow))? instead of .unwrap() for proper error propagation in production code.",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Input amount must be greater than zero")]
    ZeroInput,
    #[msg("Pool reserves must be greater than zero")]
    EmptyPool,
    #[msg("Output amount is zero")]
    OutputTooSmall,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,
) -> Result<u64> {
    require!(amount_in > 0, AmmError::ZeroInput);
    require!(reserve_in > 0 && reserve_out > 0, AmmError::EmptyPool);

    // Calculate fee
    let fee = (amount_in as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(error!(AmmError::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(AmmError::MathOverflow))?;

    let effective_in = (amount_in as u128)
        .checked_sub(fee)
        .ok_or(error!(AmmError::MathOverflow))?;

    // Constant product formula: dy = y * dx / (x + dx)
    let numerator = effective_in
        .checked_mul(reserve_out as u128)
        .ok_or(error!(AmmError::MathOverflow))?;

    let denominator = (reserve_in as u128)
        .checked_add(effective_in)
        .ok_or(error!(AmmError::MathOverflow))?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(error!(AmmError::MathOverflow))? as u64;

    require!(amount_out > 0, AmmError::OutputTooSmall);

    Ok(amount_out)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Basic swap with 0.3% fee returns correct output",
                          input:
                            "amount_in = 1_000_000, reserve_in = 100_000_000, reserve_out = 100_000_000, fee_bps = 30",
                          expectedOutput:
                            "~987_158 (after 0.3% fee deduction and constant product calculation)",
                          order: 0,
                        },
                        {
                          name: "Zero input returns ZeroInput error",
                          input:
                            "amount_in = 0, reserve_in = 100_000_000, reserve_out = 100_000_000, fee_bps = 30",
                          expectedOutput: "Err(AmmError::ZeroInput)",
                          order: 1,
                        },
                        {
                          name: "Large swap has significant price impact",
                          input:
                            "amount_in = 50_000_000, reserve_in = 100_000_000, reserve_out = 100_000_000, fee_bps = 30",
                          expectedOutput:
                            "~33_222_259 (not 50M due to price impact on constant product curve)",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 2.5 — Add & Remove Liquidity (challenge)
              {
                title: "Add & Remove Liquidity",
                description:
                  "Implement balanced liquidity provision and withdrawal with proportional LP token minting/burning",
                type: "challenge",
                order: 4,
                xpReward: 75,
                duration: "40 min",
                content: `# Add & Remove Liquidity

Liquidity providers are the backbone of AMMs. They deposit equal-value amounts of both tokens and receive LP tokens representing their pool share. When they withdraw, they burn LP tokens to receive both tokens proportionally. This challenge implements both flows.

## Adding Liquidity

For a constant product AMM, liquidity must be added in the correct ratio to avoid changing the price:

\`\`\`
Current ratio: reserve_a / reserve_b = price
Required: amount_a / amount_b == reserve_a / reserve_b

LP tokens to mint:
  If first deposit: lp_tokens = sqrt(amount_a * amount_b)
  Otherwise: lp_tokens = min(
    amount_a * lp_supply / reserve_a,
    amount_b * lp_supply / reserve_b
  )
\`\`\`

The \`min()\` ensures the user doesn't get excess LP tokens if they over-provide one side.

## Removing Liquidity

Withdrawal is proportional to LP share:

\`\`\`
amount_a = lp_burn_amount * reserve_a / lp_supply
amount_b = lp_burn_amount * reserve_b / lp_supply
\`\`\`

## First Depositor: The sqrt() Convention

The first depositor sets the initial price. Using \`sqrt(amount_a * amount_b)\` for the initial LP mint ensures the LP token supply is independent of the token amounts' magnitude:

\`\`\`rust
fn initial_lp_amount(amount_a: u64, amount_b: u64) -> u64 {
    let product = (amount_a as u128)
        .checked_mul(amount_b as u128)
        .unwrap();
    // Integer square root
    isqrt(product) as u64
}

fn isqrt(n: u128) -> u128 {
    if n == 0 { return 0; }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}
\`\`\`

## Minimum Liquidity Lock

To prevent the first depositor from being vulnerable to a donation attack, many protocols permanently lock a small amount of LP tokens (e.g., 1000 units) on the first deposit:

\`\`\`rust
const MINIMUM_LIQUIDITY: u64 = 1_000;

let lp_to_mint = if lp_supply == 0 {
    let initial = isqrt((amount_a as u128) * (amount_b as u128)) as u64;
    // Lock MINIMUM_LIQUIDITY by minting to a burn address
    initial.checked_sub(MINIMUM_LIQUIDITY).unwrap()
} else {
    // proportional mint
};
\`\`\`

## Your Task

Implement \`add_liquidity\` and \`remove_liquidity\` calculation functions with proper share-based accounting.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement two functions: (1) `calculate_add_liquidity(amount_a: u64, amount_b: u64, reserve_a: u64, reserve_b: u64, lp_supply: u64) -> Result<u64>` returns LP tokens to mint (sqrt for first deposit, min of proportional ratios otherwise). (2) `calculate_remove_liquidity(lp_amount: u64, reserve_a: u64, reserve_b: u64, lp_supply: u64) -> Result<(u64, u64)>` returns (token_a_out, token_b_out) proportional to burn amount.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum LiquidityError {
    #[msg("Amounts must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Math overflow")]
    MathOverflow,
}

const MINIMUM_LIQUIDITY: u64 = 1_000;

pub fn calculate_add_liquidity(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    lp_supply: u64,
) -> Result<u64> {
    // TODO: Validate amount_a > 0 and amount_b > 0
    // TODO: If lp_supply == 0 (first deposit):
    //   - Calculate sqrt(amount_a * amount_b) using integer square root
    //   - Subtract MINIMUM_LIQUIDITY (locked forever)
    // TODO: Otherwise:
    //   - lp_a = amount_a * lp_supply / reserve_a
    //   - lp_b = amount_b * lp_supply / reserve_b
    //   - Return min(lp_a, lp_b)
    todo!()
}

pub fn calculate_remove_liquidity(
    lp_amount: u64,
    reserve_a: u64,
    reserve_b: u64,
    lp_supply: u64,
) -> Result<(u64, u64)> {
    // TODO: Validate lp_amount > 0 and lp_supply > 0
    // TODO: token_a_out = lp_amount * reserve_a / lp_supply
    // TODO: token_b_out = lp_amount * reserve_b / lp_supply
    // TODO: Validate both outputs > 0
    // TODO: Return (token_a_out, token_b_out)
    todo!()
}

/// Integer square root (Babylonian method)
fn isqrt(n: u128) -> u128 {
    // TODO: Implement integer square root
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "For isqrt: start with x = n, y = (x+1)/2, then loop while y < x: x = y; y = (x + n/x) / 2; return x.",
                      "For add_liquidity first deposit: let product = (amount_a as u128).checked_mul(amount_b as u128).unwrap(); isqrt(product) as u64 - MINIMUM_LIQUIDITY.",
                      "For remove_liquidity: cast to u128 for the multiplication: (lp_amount as u128).checked_mul(reserve_a as u128).unwrap().checked_div(lp_supply as u128).unwrap() as u64.",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum LiquidityError {
    #[msg("Amounts must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Math overflow")]
    MathOverflow,
}

const MINIMUM_LIQUIDITY: u64 = 1_000;

pub fn calculate_add_liquidity(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    lp_supply: u64,
) -> Result<u64> {
    require!(amount_a > 0 && amount_b > 0, LiquidityError::ZeroAmount);

    if lp_supply == 0 {
        // First deposit: sqrt(amount_a * amount_b) - MINIMUM_LIQUIDITY
        let product = (amount_a as u128)
            .checked_mul(amount_b as u128)
            .ok_or(error!(LiquidityError::MathOverflow))?;
        let sqrt_product = isqrt(product) as u64;
        require!(sqrt_product > MINIMUM_LIQUIDITY, LiquidityError::InsufficientLiquidity);
        Ok(sqrt_product.checked_sub(MINIMUM_LIQUIDITY).unwrap())
    } else {
        // Proportional deposit
        let lp_a = (amount_a as u128)
            .checked_mul(lp_supply as u128)
            .ok_or(error!(LiquidityError::MathOverflow))?
            .checked_div(reserve_a as u128)
            .ok_or(error!(LiquidityError::MathOverflow))? as u64;

        let lp_b = (amount_b as u128)
            .checked_mul(lp_supply as u128)
            .ok_or(error!(LiquidityError::MathOverflow))?
            .checked_div(reserve_b as u128)
            .ok_or(error!(LiquidityError::MathOverflow))? as u64;

        Ok(lp_a.min(lp_b))
    }
}

pub fn calculate_remove_liquidity(
    lp_amount: u64,
    reserve_a: u64,
    reserve_b: u64,
    lp_supply: u64,
) -> Result<(u64, u64)> {
    require!(lp_amount > 0 && lp_supply > 0, LiquidityError::ZeroAmount);

    let token_a_out = (lp_amount as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(error!(LiquidityError::MathOverflow))?
        .checked_div(lp_supply as u128)
        .ok_or(error!(LiquidityError::MathOverflow))? as u64;

    let token_b_out = (lp_amount as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(error!(LiquidityError::MathOverflow))?
        .checked_div(lp_supply as u128)
        .ok_or(error!(LiquidityError::MathOverflow))? as u64;

    require!(token_a_out > 0 && token_b_out > 0, LiquidityError::InsufficientLiquidity);

    Ok((token_a_out, token_b_out))
}

fn isqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}`,
                    testCases: {
                      create: [
                        {
                          name: "First deposit returns sqrt(a*b) - MINIMUM_LIQUIDITY",
                          input:
                            "amount_a = 1_000_000, amount_b = 4_000_000, reserve_a = 0, reserve_b = 0, lp_supply = 0",
                          expectedOutput:
                            "1_999_000 (sqrt(4_000_000_000_000) = 2_000_000 minus 1_000 locked)",
                          order: 0,
                        },
                        {
                          name: "Proportional deposit uses min of both ratios",
                          input:
                            "amount_a = 100, amount_b = 300, reserve_a = 1000, reserve_b = 2000, lp_supply = 500",
                          expectedOutput:
                            "50 (min(100*500/1000, 300*500/2000) = min(50, 75) = 50)",
                          order: 1,
                        },
                        {
                          name: "Remove liquidity returns proportional amounts",
                          input:
                            "lp_amount = 250, reserve_a = 1_000_000, reserve_b = 2_000_000, lp_supply = 1_000",
                          expectedOutput:
                            "(250_000, 500_000) — 25% of reserves",
                          order: 2,
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
        // Module 3: Lending & Borrowing
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Lending & Borrowing",
          description:
            "Build lending protocol mechanics — collateral management, interest rate models, liquidation engines, and health factor calculations on Solana.",
          order: 2,
          lessons: {
            create: [
              // Lesson 3.1 — Lending Protocol Architecture (content)
              {
                title: "Lending Protocol Architecture",
                description:
                  "Understand the account structure and flow of a Solana lending protocol — reserves, obligations, and interest accrual",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "30 min",
                content: `# Lending Protocol Architecture

Lending protocols are among the most complex DeFi primitives. They allow users to deposit assets to earn interest and borrow against collateral. On Solana, protocols like Solend, MarginFi, and Kamino Lend implement these patterns. Understanding the architecture is essential before building one.

## Core Concepts

### Reserves (Markets)
A **reserve** represents a single lendable asset (e.g., USDC, SOL). It tracks:

\`\`\`rust
#[account]
pub struct Reserve {
    pub mint: Pubkey,                  // The asset being lent
    pub liquidity_supply: Pubkey,      // Vault holding deposited tokens
    pub collateral_mint: Pubkey,       // cToken mint (receipt token)
    pub collateral_supply: Pubkey,     // Vault holding cTokens (for collateral)

    // Interest state
    pub cumulative_borrow_rate: u128,  // Accumulated interest multiplier
    pub total_borrows: u64,            // Total borrowed amount
    pub total_deposits: u64,           // Total deposited amount
    pub last_update_slot: u64,         // Slot of last interest accrual

    // Configuration
    pub optimal_utilization: u8,       // Target utilization (e.g., 80%)
    pub loan_to_value: u8,             // Max LTV for borrowing (e.g., 75%)
    pub liquidation_threshold: u8,     // LTV at which liquidation starts (e.g., 85%)
    pub liquidation_bonus: u8,         // Bonus for liquidators (e.g., 5%)
    pub base_rate: u64,                // Minimum interest rate
    pub optimal_rate: u64,             // Rate at optimal utilization
    pub max_rate: u64,                 // Rate at 100% utilization

    pub is_active: bool,
    pub _reserved: [u8; 128],
}
\`\`\`

### Obligations (User Positions)
An **obligation** represents a user's lending/borrowing position:

\`\`\`rust
#[account]
pub struct Obligation {
    pub owner: Pubkey,
    pub deposits: Vec<ObligationDeposit>,   // What the user deposited as collateral
    pub borrows: Vec<ObligationBorrow>,     // What the user borrowed
    pub last_update_slot: u64,
    pub _reserved: [u8; 64],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ObligationDeposit {
    pub reserve: Pubkey,           // Which reserve this deposit is in
    pub deposited_amount: u64,     // cToken amount deposited as collateral
    pub market_value_usd: u64,     // USD value (updated by oracle)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ObligationBorrow {
    pub reserve: Pubkey,
    pub borrowed_amount: u64,       // Base amount borrowed
    pub cumulative_rate_at_borrow: u128, // Snapshot of cumulative rate
    pub market_value_usd: u64,
}
\`\`\`

## The Lending Flow

\`\`\`
DEPOSIT (Earn Interest):
1. User deposits 1000 USDC into the USDC reserve
2. Protocol calculates the exchange rate: cUSDC/USDC
3. Protocol mints cUSDC tokens to the user
4. cUSDC appreciates over time as interest accrues

BORROW (Take a Loan):
1. User deposits cTokens as collateral into their obligation
2. Protocol checks: collateral_value * LTV >= borrow_value
3. Protocol transfers borrowed tokens from reserve to user
4. Interest accrues on the borrow continuously

REPAY:
1. User transfers borrowed tokens + interest back to reserve
2. Protocol updates the obligation's borrow balance

WITHDRAW:
1. Protocol checks: remaining collateral supports existing borrows
2. Protocol burns cTokens and returns underlying tokens
\`\`\`

## cToken (Receipt Token) Exchange Rate

The exchange rate between cTokens and underlying tokens increases over time as interest accrues:

\`\`\`
exchange_rate = total_liquidity / cToken_supply

Where:
total_liquidity = deposits - borrows + accrued_interest

Initially: 1 cUSDC = 1 USDC
After interest: 1 cUSDC = 1.05 USDC (5% interest earned)
\`\`\`

Users don't need to "claim" interest — the cToken simply becomes worth more underlying tokens over time.

## Utilization Rate

The utilization rate is the ratio of borrowed to deposited assets:

\`\`\`
utilization = total_borrows / total_deposits

Example:
  total_deposits = 10,000,000 USDC
  total_borrows  =  7,500,000 USDC
  utilization    = 75%
\`\`\`

This drives the interest rate model (covered in the next lesson).

## PDA Architecture

\`\`\`
Reserve PDA:     ["reserve", lending_market, mint]
Obligation PDA:  ["obligation", lending_market, user]
Liquidity Vault: ["liquidity", reserve]
cToken Mint:     ["collateral-mint", reserve]
Authority PDA:   ["lending-authority", lending_market]
\`\`\`

All vaults are owned by the authority PDA, ensuring only the lending program can move tokens.`,
              },

              // Lesson 3.2 — Interest Rate Models (content)
              {
                title: "Interest Rate Models",
                description:
                  "Implement kinked interest rate curves and understand how utilization drives borrow/supply rates",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Interest Rate Models

Interest rates in lending protocols are algorithmically determined based on supply and demand — specifically, the **utilization rate**. Most Solana lending protocols use a **kinked (two-slope) interest rate model** that incentivizes optimal utilization.

## The Kinked Rate Model

The most common model has two slopes separated by an "optimal utilization" point:

\`\`\`
If utilization <= optimal_utilization:
  borrow_rate = base_rate + (utilization / optimal_utilization) * (optimal_rate - base_rate)

If utilization > optimal_utilization:
  excess = (utilization - optimal_utilization) / (1 - optimal_utilization)
  borrow_rate = optimal_rate + excess * (max_rate - optimal_rate)
\`\`\`

### Visual Representation

\`\`\`
Borrow Rate
    ^
    |                                    /
max |                                   /
    |                                  /
    |                                 /  ← Steep slope above optimal
    |                                /
opt |............................./
    |                        /
    |                    /
    |                /       ← Gentle slope below optimal
    |            /
base|........./
    |
    +────────────────────────────────────> Utilization
    0%        optimal (80%)        100%
\`\`\`

### Numerical Example (Typical DeFi Parameters)

\`\`\`
base_rate = 0% (annualized)
optimal_rate = 4% at 80% utilization
max_rate = 300% at 100% utilization

At 50% utilization:
  rate = 0 + (50/80) * 4% = 2.5%

At 80% utilization (optimal):
  rate = 4%

At 90% utilization:
  excess = (90 - 80) / (100 - 80) = 50%
  rate = 4% + 50% * (300% - 4%) = 4% + 148% = 152%

At 95% utilization:
  excess = (95 - 80) / (100 - 80) = 75%
  rate = 4% + 75% * 296% = 226%
\`\`\`

The steep slope above optimal utilization creates strong economic pressure for borrowers to repay and depositors to deposit, pushing utilization back to optimal.

## Rust Implementation

\`\`\`rust
/// Interest rate parameters stored on the Reserve
pub struct InterestRateConfig {
    pub optimal_utilization_bps: u16,  // e.g., 8000 = 80%
    pub base_rate_bps: u16,            // e.g., 0 = 0%
    pub optimal_rate_bps: u16,         // e.g., 400 = 4%
    pub max_rate_bps: u16,             // e.g., 30000 = 300%
}

/// Calculate the annualized borrow rate in basis points
pub fn calculate_borrow_rate(
    utilization_bps: u16,
    config: &InterestRateConfig,
) -> u64 {
    if utilization_bps <= config.optimal_utilization_bps {
        // Below optimal: gentle slope
        let ratio = (utilization_bps as u64)
            .checked_mul(10_000)
            .unwrap()
            .checked_div(config.optimal_utilization_bps as u64)
            .unwrap();

        let rate_delta = (config.optimal_rate_bps as u64)
            .checked_sub(config.base_rate_bps as u64)
            .unwrap();

        (config.base_rate_bps as u64)
            .checked_add(
                ratio.checked_mul(rate_delta).unwrap()
                    .checked_div(10_000).unwrap()
            )
            .unwrap()
    } else {
        // Above optimal: steep slope
        let excess_utilization = (utilization_bps as u64)
            .checked_sub(config.optimal_utilization_bps as u64)
            .unwrap();
        let remaining = 10_000u64
            .checked_sub(config.optimal_utilization_bps as u64)
            .unwrap();

        let excess_ratio = excess_utilization
            .checked_mul(10_000)
            .unwrap()
            .checked_div(remaining)
            .unwrap();

        let rate_delta = (config.max_rate_bps as u64)
            .checked_sub(config.optimal_rate_bps as u64)
            .unwrap();

        (config.optimal_rate_bps as u64)
            .checked_add(
                excess_ratio.checked_mul(rate_delta).unwrap()
                    .checked_div(10_000).unwrap()
            )
            .unwrap()
    }
}
\`\`\`

## Supply Rate Calculation

The supply rate is derived from the borrow rate:

\`\`\`
supply_rate = borrow_rate * utilization * (1 - protocol_fee)

Example:
  borrow_rate = 4%
  utilization = 80%
  protocol_fee = 10%
  supply_rate = 4% * 80% * 90% = 2.88%
\`\`\`

Depositors always earn less than borrowers pay — the spread is the protocol's revenue.

## Compound Interest Accrual

Interest compounds continuously on Solana (every slot):

\`\`\`rust
/// Accrue interest since last update
pub fn accrue_interest(reserve: &mut Reserve, current_slot: u64) -> Result<()> {
    let slots_elapsed = current_slot
        .checked_sub(reserve.last_update_slot)
        .unwrap();

    if slots_elapsed == 0 {
        return Ok(());
    }

    let utilization = calculate_utilization(
        reserve.total_borrows,
        reserve.total_deposits,
    );

    let borrow_rate_annual = calculate_borrow_rate(utilization, &reserve.config);

    // Convert annual rate to per-slot rate
    // ~216,000 slots per day, ~78,840,000 slots per year
    let rate_per_slot = borrow_rate_annual as u128 / 78_840_000;

    // Simple interest for the elapsed slots
    let interest = (reserve.total_borrows as u128)
        .checked_mul(rate_per_slot)
        .unwrap()
        .checked_mul(slots_elapsed as u128)
        .unwrap()
        .checked_div(10_000) // bps to decimal
        .unwrap() as u64;

    reserve.total_borrows = reserve.total_borrows
        .checked_add(interest)
        .unwrap();
    reserve.last_update_slot = current_slot;

    Ok(())
}
\`\`\`

## Key Takeaways

1. Interest rates are **not set by governance** — they respond dynamically to market conditions
2. High utilization = high rates = incentivize deposits and repayments
3. Low utilization = low rates = incentivize borrowing
4. The kink creates a sharp penalty above optimal utilization
5. Supply rate is always lower than borrow rate (protocol spread)`,
              },

              // Lesson 3.3 — Collateral & Health Factors (content)
              {
                title: "Collateral & Health Factors",
                description:
                  "Learn how lending protocols evaluate position health and determine when liquidation is needed",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# Collateral & Health Factors

The health factor is the single most important metric in a lending protocol. It determines whether a user's position is safe, at risk, or eligible for liquidation. Understanding the math behind collateral valuation and health factors is essential for both protocol builders and users.

## Health Factor Formula

\`\`\`
health_factor = total_collateral_value * liquidation_threshold / total_borrow_value

Where:
  total_collateral_value = sum(deposit_amount * oracle_price * LTV_weight)
  total_borrow_value = sum(borrow_amount * oracle_price)

If health_factor >= 1.0: Position is healthy
If health_factor < 1.0:  Position can be liquidated
\`\`\`

### Numerical Example

User position:
\`\`\`
Collateral: 10 SOL at $100/SOL = $1,000
  liquidation_threshold = 85%
  weighted_collateral = $1,000 * 0.85 = $850

Borrow: 700 USDC at $1/USDC = $700

health_factor = $850 / $700 = 1.214

→ Position is healthy (HF > 1.0)
\`\`\`

If SOL drops to $85:
\`\`\`
weighted_collateral = 10 * $85 * 0.85 = $722.50
health_factor = $722.50 / $700 = 1.032

→ Still healthy, but at risk
\`\`\`

If SOL drops to $82:
\`\`\`
weighted_collateral = 10 * $82 * 0.85 = $697
health_factor = $697 / $700 = 0.996

→ LIQUIDATABLE (HF < 1.0)
\`\`\`

## Loan-to-Value (LTV) vs. Liquidation Threshold

These are different parameters that serve different purposes:

| Parameter | Purpose | Typical Value |
|---|---|---|
| **LTV (Loan-to-Value)** | Maximum borrowing power per collateral | 75% |
| **Liquidation Threshold** | HF < 1.0 trigger point | 85% |

The gap between LTV and liquidation threshold is the **safety buffer**. A user who borrows at max LTV has a health factor of:

\`\`\`
HF = (collateral * liquidation_threshold) / (collateral * LTV)
HF = liquidation_threshold / LTV
HF = 85% / 75% = 1.133

→ 13.3% price drop before liquidation
\`\`\`

## Risk Tiers

Different assets have different risk parameters:

\`\`\`rust
// Stablecoins (low risk)
let usdc_config = AssetConfig {
    ltv: 85,
    liquidation_threshold: 90,
    liquidation_bonus: 2,  // 2%
};

// Major assets (medium risk)
let sol_config = AssetConfig {
    ltv: 75,
    liquidation_threshold: 85,
    liquidation_bonus: 5,  // 5%
};

// Volatile assets (high risk)
let meme_config = AssetConfig {
    ltv: 50,
    liquidation_threshold: 65,
    liquidation_bonus: 10, // 10%
};
\`\`\`

## Health Factor Calculation in Rust

\`\`\`rust
use anchor_lang::prelude::*;

pub fn calculate_health_factor(
    obligation: &Obligation,
    reserves: &[Reserve],
    prices: &[(Pubkey, u64)],  // (mint, price_in_usd_scaled)
) -> Result<u64> {
    let mut total_collateral_value: u128 = 0;
    let mut total_borrow_value: u128 = 0;

    // Sum collateral values (weighted by liquidation threshold)
    for deposit in &obligation.deposits {
        let reserve = reserves.iter()
            .find(|r| r.key() == deposit.reserve)
            .ok_or(error!(LendingError::ReserveNotFound))?;

        let price = prices.iter()
            .find(|p| p.0 == reserve.mint)
            .ok_or(error!(LendingError::PriceNotFound))?
            .1;

        // Convert cToken amount to underlying amount
        let underlying = ctoken_to_underlying(
            deposit.deposited_amount,
            reserve,
        )?;

        // Value = amount * price * liquidation_threshold / 10000
        let value = (underlying as u128)
            .checked_mul(price as u128).unwrap()
            .checked_mul(reserve.liquidation_threshold as u128).unwrap()
            .checked_div(10_000).unwrap();

        total_collateral_value = total_collateral_value
            .checked_add(value).unwrap();
    }

    // Sum borrow values (including accrued interest)
    for borrow in &obligation.borrows {
        let reserve = reserves.iter()
            .find(|r| r.key() == borrow.reserve)
            .ok_or(error!(LendingError::ReserveNotFound))?;

        let price = prices.iter()
            .find(|p| p.0 == reserve.mint)
            .ok_or(error!(LendingError::PriceNotFound))?
            .1;

        // Include accrued interest
        let total_owed = calculate_owed_with_interest(borrow, reserve)?;

        let value = (total_owed as u128)
            .checked_mul(price as u128).unwrap();

        total_borrow_value = total_borrow_value
            .checked_add(value).unwrap();
    }

    if total_borrow_value == 0 {
        return Ok(u64::MAX); // No borrows = infinite health
    }

    // Health factor scaled by 10_000 (10000 = 1.0)
    let hf = total_collateral_value
        .checked_mul(10_000).unwrap()
        .checked_div(total_borrow_value).unwrap() as u64;

    Ok(hf)
}
\`\`\`

## Cross-Collateralization

Most lending protocols support **cross-collateralization** — users can deposit multiple asset types and borrow multiple asset types in the same obligation. The health factor considers the aggregate:

\`\`\`
Deposits:
  5 SOL ($100) * 85% = $425
  500 USDC ($1) * 90% = $450
  Total weighted collateral = $875

Borrows:
  400 USDC = $400
  0.5 ETH ($3000) = $1500 → wait, this exceeds collateral!

health_factor = $875 / $400 = 2.19 ← if only USDC borrow
\`\`\`

The protocol must check HF before every new borrow to ensure it stays above 1.0.`,
              },

              // Lesson 3.4 — Implement Health Factor Calculator (challenge)
              {
                title: "Implement Health Factor Calculator",
                description:
                  "Build the health factor calculation that determines liquidation eligibility",
                type: "challenge",
                order: 3,
                xpReward: 70,
                duration: "35 min",
                content: `# Implement Health Factor Calculator

In this challenge, you will implement the core health factor calculation used by lending protocols. The function must evaluate a user's collateral deposits against their borrows and determine if the position is healthy or liquidatable.

## Requirements

Your function must:
1. Calculate the weighted collateral value using each asset's liquidation threshold
2. Calculate the total borrow value including accrued interest
3. Return the health factor as a fixed-point number (scaled by 10,000 so 10000 = 1.0)
4. Return u64::MAX for positions with no borrows

## Mathematical Foundation

\`\`\`
For each deposit:
  weighted_value += amount * price * liquidation_threshold_bps / 10_000

For each borrow:
  owed = borrowed_amount * current_cumulative_rate / rate_at_borrow_time
  borrow_value += owed * price

health_factor = weighted_collateral * 10_000 / total_borrow_value
\`\`\`

## Your Task

Complete the health factor calculator that handles multiple deposits and borrows with interest accrual.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement `calculate_health_factor(deposits: &[DepositInfo], borrows: &[BorrowInfo]) -> Result<u64>` where DepositInfo has {amount: u64, price_usd: u64, liquidation_threshold_bps: u16} and BorrowInfo has {borrowed_amount: u64, price_usd: u64, cumulative_rate_at_borrow: u128, current_cumulative_rate: u128}. Return health factor scaled by 10_000 (10000 = 1.0). Return u64::MAX if no borrows.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum LendingError {
    #[msg("Math overflow in health factor calculation")]
    MathOverflow,
    #[msg("Invalid input")]
    InvalidInput,
}

pub struct DepositInfo {
    pub amount: u64,
    pub price_usd: u64,              // Price scaled by 1e6 (1 USDC = 1_000_000)
    pub liquidation_threshold_bps: u16, // e.g., 8500 = 85%
}

pub struct BorrowInfo {
    pub borrowed_amount: u64,
    pub price_usd: u64,
    pub cumulative_rate_at_borrow: u128, // Scaled by 1e18
    pub current_cumulative_rate: u128,   // Scaled by 1e18
}

pub fn calculate_health_factor(
    deposits: &[DepositInfo],
    borrows: &[BorrowInfo],
) -> Result<u64> {
    // TODO: If borrows is empty, return u64::MAX

    // TODO: Calculate total weighted collateral value
    //   For each deposit:
    //     weighted_value += amount * price_usd * liquidation_threshold_bps / 10_000

    // TODO: Calculate total borrow value with interest
    //   For each borrow:
    //     owed = borrowed_amount * current_cumulative_rate / cumulative_rate_at_borrow
    //     borrow_value += owed * price_usd

    // TODO: Calculate health factor = weighted_collateral * 10_000 / total_borrow_value

    // TODO: Return health factor as u64
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "Use u128 for all intermediate calculations to prevent overflow. Cast u64 values: (deposit.amount as u128).checked_mul(deposit.price_usd as u128).unwrap()",
                      "For interest accrual: owed = (borrowed_amount as u128) * current_cumulative_rate / cumulative_rate_at_borrow. This gives the total amount owed including interest.",
                      "The final health factor: (total_collateral_weighted as u128).checked_mul(10_000).unwrap().checked_div(total_borrow_value).unwrap() as u64",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum LendingError {
    #[msg("Math overflow in health factor calculation")]
    MathOverflow,
    #[msg("Invalid input")]
    InvalidInput,
}

pub struct DepositInfo {
    pub amount: u64,
    pub price_usd: u64,
    pub liquidation_threshold_bps: u16,
}

pub struct BorrowInfo {
    pub borrowed_amount: u64,
    pub price_usd: u64,
    pub cumulative_rate_at_borrow: u128,
    pub current_cumulative_rate: u128,
}

pub fn calculate_health_factor(
    deposits: &[DepositInfo],
    borrows: &[BorrowInfo],
) -> Result<u64> {
    if borrows.is_empty() {
        return Ok(u64::MAX);
    }

    // Calculate total weighted collateral value
    let mut total_collateral: u128 = 0;
    for deposit in deposits {
        let value = (deposit.amount as u128)
            .checked_mul(deposit.price_usd as u128)
            .ok_or(error!(LendingError::MathOverflow))?;
        let weighted = value
            .checked_mul(deposit.liquidation_threshold_bps as u128)
            .ok_or(error!(LendingError::MathOverflow))?
            .checked_div(10_000)
            .ok_or(error!(LendingError::MathOverflow))?;
        total_collateral = total_collateral
            .checked_add(weighted)
            .ok_or(error!(LendingError::MathOverflow))?;
    }

    // Calculate total borrow value with interest
    let mut total_borrow: u128 = 0;
    for borrow in borrows {
        let owed = (borrow.borrowed_amount as u128)
            .checked_mul(borrow.current_cumulative_rate)
            .ok_or(error!(LendingError::MathOverflow))?
            .checked_div(borrow.cumulative_rate_at_borrow)
            .ok_or(error!(LendingError::MathOverflow))?;
        let value = owed
            .checked_mul(borrow.price_usd as u128)
            .ok_or(error!(LendingError::MathOverflow))?;
        total_borrow = total_borrow
            .checked_add(value)
            .ok_or(error!(LendingError::MathOverflow))?;
    }

    if total_borrow == 0 {
        return Ok(u64::MAX);
    }

    let hf = total_collateral
        .checked_mul(10_000)
        .ok_or(error!(LendingError::MathOverflow))?
        .checked_div(total_borrow)
        .ok_or(error!(LendingError::MathOverflow))? as u64;

    Ok(hf)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Healthy position returns HF > 10000",
                          input:
                            "deposit: 1000 USDC (price=1e6, threshold=9000), borrow: 700 USDC (price=1e6, no interest)",
                          expectedOutput:
                            "12857 (1000 * 9000/10000 * 10000 / 700 = ~12857)",
                          order: 0,
                        },
                        {
                          name: "Liquidatable position returns HF < 10000",
                          input:
                            "deposit: 10 SOL (price=80e6, threshold=8500), borrow: 700 USDC (price=1e6, no interest)",
                          expectedOutput:
                            "9714 (10*80*8500/10000 * 10000 / 700 = ~9714)",
                          order: 1,
                        },
                        {
                          name: "No borrows returns u64::MAX",
                          input: "deposit: 1000 USDC, borrows: []",
                          expectedOutput: "u64::MAX (18446744073709551615)",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 3.5 — Build a Liquidation Engine (challenge)
              {
                title: "Build a Liquidation Engine",
                description:
                  "Implement the liquidation logic that repays undercollateralized borrows and rewards liquidators",
                type: "challenge",
                order: 4,
                xpReward: 80,
                duration: "40 min",
                content: `# Build a Liquidation Engine

Liquidation is the critical safety mechanism that keeps lending protocols solvent. When a borrower's health factor drops below 1.0, liquidators can repay part of the debt and receive a bonus from the borrower's collateral. This challenge implements the core liquidation calculation.

## Liquidation Mechanics

\`\`\`
1. Liquidator identifies an undercollateralized position (HF < 1.0)
2. Liquidator repays up to 50% of the borrower's debt (close factor)
3. Liquidator receives collateral worth: repay_amount * (1 + liquidation_bonus)
4. Borrower's debt decreases, collateral decreases, HF improves
\`\`\`

## Close Factor

The **close factor** limits how much can be liquidated at once (typically 50%). This prevents full liquidation in a single transaction and gives the borrower time to recover:

\`\`\`rust
const CLOSE_FACTOR_BPS: u16 = 5000; // 50%

let max_repay = borrow_balance
    .checked_mul(CLOSE_FACTOR_BPS as u64)
    .unwrap()
    .checked_div(10_000)
    .unwrap();

let actual_repay = repay_amount.min(max_repay);
\`\`\`

## Liquidation Bonus

The bonus incentivizes liquidators to act quickly. A 5% bonus means repaying $100 of debt earns $105 of collateral:

\`\`\`
collateral_to_seize = repay_amount_in_usd * (10_000 + liquidation_bonus_bps) / collateral_price

Example:
  Repay 100 USDC ($100)
  Liquidation bonus = 5% (500 bps)
  SOL price = $100

  collateral_in_usd = $100 * 10_500 / 10_000 = $105
  sol_to_seize = $105 / $100 = 1.05 SOL
\`\`\`

## Full Liquidation Calculation

\`\`\`rust
pub fn calculate_liquidation(
    repay_amount: u64,
    borrow_total: u64,
    collateral_amount: u64,
    repay_token_price: u64,     // scaled by 1e6
    collateral_token_price: u64, // scaled by 1e6
    liquidation_bonus_bps: u16,
    close_factor_bps: u16,
) -> Result<LiquidationResult> {
    // Step 1: Cap repay amount by close factor
    let max_repay = (borrow_total as u128)
        .checked_mul(close_factor_bps as u128).unwrap()
        .checked_div(10_000).unwrap() as u64;
    let actual_repay = repay_amount.min(max_repay);

    // Step 2: Calculate collateral to seize
    let repay_value = (actual_repay as u128)
        .checked_mul(repay_token_price as u128).unwrap();
    let seize_value = repay_value
        .checked_mul((10_000 + liquidation_bonus_bps as u128)).unwrap()
        .checked_div(10_000).unwrap();
    let collateral_to_seize = seize_value
        .checked_div(collateral_token_price as u128).unwrap() as u64;

    // Step 3: Cap by available collateral
    let actual_seize = collateral_to_seize.min(collateral_amount);

    Ok(LiquidationResult {
        repay_amount: actual_repay,
        collateral_seized: actual_seize,
    })
}
\`\`\`

## Profit Calculation for Liquidators

\`\`\`
profit = collateral_value_seized - repay_amount_in_usd
profit = repay_amount * bonus_bps / 10_000

For $10,000 repay with 5% bonus:
  profit = $10,000 * 500 / 10_000 = $500
\`\`\`

In practice, liquidators also pay gas (priority fees) and may face competition from other liquidators (MEV).

## Your Task

Implement the complete liquidation calculation that handles close factor limits, bonus calculations, and collateral caps.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement `calculate_liquidation(repay_amount: u64, borrow_total: u64, collateral_amount: u64, repay_price: u64, collateral_price: u64, bonus_bps: u16, close_factor_bps: u16) -> Result<(u64, u64)>` returning (actual_repay, collateral_seized). Cap repay by close_factor * borrow_total. Calculate collateral_seized = repay_value * (10000 + bonus) / collateral_price. Cap seized by available collateral.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum LiquidationError {
    #[msg("Position is not liquidatable")]
    NotLiquidatable,
    #[msg("Repay amount is zero")]
    ZeroRepay,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_liquidation(
    repay_amount: u64,
    borrow_total: u64,
    collateral_amount: u64,
    repay_price: u64,        // scaled by 1e6
    collateral_price: u64,   // scaled by 1e6
    bonus_bps: u16,          // e.g., 500 = 5%
    close_factor_bps: u16,   // e.g., 5000 = 50%
) -> Result<(u64, u64)> {
    // TODO: Validate repay_amount > 0
    // TODO: Calculate max_repay = borrow_total * close_factor_bps / 10_000
    // TODO: actual_repay = min(repay_amount, max_repay)
    // TODO: Calculate repay value in USD terms
    // TODO: Apply liquidation bonus: seize_value = repay_value * (10_000 + bonus_bps) / 10_000
    // TODO: Convert seize_value to collateral token amount using collateral_price
    // TODO: Cap collateral_seized by available collateral_amount
    // TODO: Return (actual_repay, collateral_seized)
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "Cap the repay first: let max_repay = (borrow_total as u128) * (close_factor_bps as u128) / 10_000; let actual_repay = repay_amount.min(max_repay as u64);",
                      "For collateral to seize: repay_value = actual_repay * repay_price; seize_value = repay_value * (10000 + bonus_bps) / 10000; collateral_seized = seize_value / collateral_price. All in u128.",
                      "Always cap the final seized amount: let actual_seized = collateral_to_seize.min(collateral_amount);",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum LiquidationError {
    #[msg("Position is not liquidatable")]
    NotLiquidatable,
    #[msg("Repay amount is zero")]
    ZeroRepay,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_liquidation(
    repay_amount: u64,
    borrow_total: u64,
    collateral_amount: u64,
    repay_price: u64,
    collateral_price: u64,
    bonus_bps: u16,
    close_factor_bps: u16,
) -> Result<(u64, u64)> {
    require!(repay_amount > 0, LiquidationError::ZeroRepay);

    // Cap repay by close factor
    let max_repay = (borrow_total as u128)
        .checked_mul(close_factor_bps as u128)
        .ok_or(error!(LiquidationError::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(LiquidationError::MathOverflow))? as u64;

    let actual_repay = repay_amount.min(max_repay);

    // Calculate collateral to seize
    let repay_value = (actual_repay as u128)
        .checked_mul(repay_price as u128)
        .ok_or(error!(LiquidationError::MathOverflow))?;

    let seize_value = repay_value
        .checked_mul(10_000u128 + bonus_bps as u128)
        .ok_or(error!(LiquidationError::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(LiquidationError::MathOverflow))?;

    let collateral_to_seize = seize_value
        .checked_div(collateral_price as u128)
        .ok_or(error!(LiquidationError::MathOverflow))? as u64;

    // Cap by available collateral
    let actual_seized = collateral_to_seize.min(collateral_amount);

    Ok((actual_repay, actual_seized))
}`,
                    testCases: {
                      create: [
                        {
                          name: "Liquidation with 5% bonus seizes correct collateral",
                          input:
                            "repay=500e6, borrow_total=1000e6, collateral=10e9, repay_price=1e6, collateral_price=100e6, bonus=500, close_factor=5000",
                          expectedOutput:
                            "(500e6, 5.25e9) — repay 500 USDC, seize 5.25 SOL ($525 worth at $100/SOL)",
                          order: 0,
                        },
                        {
                          name: "Repay capped by close factor",
                          input:
                            "repay=800e6, borrow_total=1000e6, collateral=100e9, repay_price=1e6, collateral_price=100e6, bonus=500, close_factor=5000",
                          expectedOutput:
                            "(500e6, _) — capped at 50% of 1000 = 500",
                          order: 1,
                        },
                        {
                          name: "Collateral seized capped by available amount",
                          input:
                            "repay=1000e6, borrow_total=2000e6, collateral=2e9, repay_price=1e6, collateral_price=100e6, bonus=500, close_factor=5000",
                          expectedOutput:
                            "(1000e6, 2e9) — would seize 10.5 SOL but only 2 SOL available",
                          order: 2,
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
        // Module 4: Oracles & Price Feeds
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Oracles & Price Feeds",
          description:
            "Integrate Pyth and Switchboard oracles for reliable price data — TWAP calculations, confidence intervals, and oracle manipulation prevention.",
          order: 3,
          lessons: {
            create: [
              // Lesson 4.1 — Oracle Architecture on Solana (content)
              {
                title: "Oracle Architecture on Solana",
                description:
                  "Understand how price oracles work on Solana — Pyth Network, Switchboard, and their trust models",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "25 min",
                content: `# Oracle Architecture on Solana

Oracles are the bridge between off-chain data and on-chain DeFi. Without reliable price feeds, lending protocols cannot calculate health factors, AMMs cannot detect manipulation, and derivatives cannot settle. Solana has two major oracle providers: **Pyth Network** and **Switchboard**.

## Why Oracles Matter for DeFi

On-chain programs cannot fetch external data. They can only read accounts passed as instruction arguments. Oracles solve this by:

1. Collecting prices from multiple off-chain sources (exchanges, data providers)
2. Aggregating and publishing them to on-chain accounts
3. DeFi programs read these accounts to get current prices

\`\`\`
Off-chain sources (Binance, Coinbase, etc.)
  → Oracle network (Pyth publishers / Switchboard oracles)
    → On-chain price account
      → Your DeFi program reads it
\`\`\`

## Pyth Network

Pyth is the dominant oracle on Solana, with **sub-second price updates** from institutional market makers (Jane Street, Jump Trading, etc.).

### Pyth Price Account Structure

\`\`\`rust
// Simplified Pyth price data
pub struct PriceData {
    pub price: i64,           // Current price
    pub conf: u64,            // Confidence interval (uncertainty)
    pub expo: i32,            // Price exponent (e.g., -8 means price * 10^-8)
    pub publish_time: i64,    // Unix timestamp of last update
    pub ema_price: i64,       // Exponential moving average price
    pub ema_conf: u64,        // EMA confidence
}
\`\`\`

Key fields:
- **price**: The aggregate price from all publishers, e.g., \`10050000000\` with \`expo = -8\` means \`$100.50\`
- **conf**: The uncertainty range. A conf of \`500000\` with \`expo = -8\` means +/- \`$0.005\`
- **publish_time**: When this price was last updated. **Stale prices are dangerous.**

### Reading Pyth in Anchor

\`\`\`rust
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

#[derive(Accounts)]
pub struct SwapWithOracle<'info> {
    #[account(
        constraint = price_feed.key() == EXPECTED_FEED_ID @ OracleError::InvalidFeed,
    )]
    pub price_feed: Account<'info, PriceUpdateV2>,
    // ... other accounts
}

pub fn swap_with_oracle(ctx: Context<SwapWithOracle>) -> Result<()> {
    let price_data = ctx.accounts.price_feed.get_price_no_older_than(
        &Clock::get()?,
        60, // max age in seconds
    )?;

    let price = price_data.price;
    let exponent = price_data.exponent;
    let confidence = price_data.conf;

    // Convert to a usable format
    // price = 10050000000, expo = -8 → $100.50
    let price_usd = (price as u128)
        .checked_mul(1_000_000) // scale to 6 decimals
        .unwrap()
        .checked_div(10u128.pow((-exponent) as u32))
        .unwrap() as u64;

    msg!("SOL price: {} (conf: {})", price, confidence);

    Ok(())
}
\`\`\`

## Switchboard

Switchboard uses a decentralized oracle network where anyone can run an oracle. It supports custom data feeds beyond just prices.

### Switchboard Feed Structure

\`\`\`rust
use switchboard_on_demand::on_demand::accounts::pull_feed::PullFeedAccountData;

pub fn read_switchboard_price(
    feed_account: &AccountInfo,
) -> Result<(i128, i64)> {
    let feed = PullFeedAccountData::parse(feed_account.data.borrow())
        .map_err(|_| error!(OracleError::InvalidFeed))?;

    let price = feed.value()
        .ok_or(error!(OracleError::StalePrice))?;

    let last_updated = feed.result.slot;

    Ok((price, last_updated))
}
\`\`\`

## Pyth vs. Switchboard Comparison

| Feature | Pyth | Switchboard |
|---|---|---|
| Update speed | ~400ms | ~1-5 seconds |
| Publishers | Institutional (permissioned) | Decentralized (permissionless) |
| Price model | Aggregate + confidence interval | Weighted median |
| Custom feeds | Limited (pre-defined assets) | Fully custom |
| Cost | Pull-based (user pays) | Pull-based or push-based |
| Best for | Major DeFi protocols | Custom data, long-tail assets |

## Critical Security Properties

### 1. Staleness Check
**Always** verify the price is recent:
\`\`\`rust
let max_age_seconds = 60;
let current_time = Clock::get()?.unix_timestamp;
require!(
    current_time - price.publish_time <= max_age_seconds,
    OracleError::StalePrice
);
\`\`\`

### 2. Confidence Check
Reject prices with high uncertainty:
\`\`\`rust
// Reject if confidence > 1% of price
let max_conf_ratio = 100; // 1% in bps
let conf_ratio = (price.conf as u128)
    .checked_mul(10_000).unwrap()
    .checked_div(price.price.unsigned_abs() as u128).unwrap();
require!(conf_ratio <= max_conf_ratio as u128, OracleError::PriceTooUncertain);
\`\`\`

### 3. Feed Validation
Verify the account is the expected oracle feed:
\`\`\`rust
require!(
    price_feed.key() == expected_feed_pubkey,
    OracleError::WrongFeed
);
\`\`\`

Never trust that the user passed the correct oracle account — always validate.`,
              },

              // Lesson 4.2 — TWAP and Price Smoothing (content)
              {
                title: "TWAP and Price Smoothing",
                description:
                  "Implement Time-Weighted Average Price calculations for oracle manipulation resistance",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# TWAP and Price Smoothing

A Time-Weighted Average Price (TWAP) smooths price data over a time window, making it resistant to short-term manipulation. TWAP oracles are critical for lending protocols, derivatives, and any DeFi application where a single manipulated price could cause significant damage.

## Why TWAP?

Spot prices can be manipulated within a single transaction (flash loan attacks). A TWAP over the last 30 minutes, however, would require the attacker to sustain the manipulation for the entire window — which is economically prohibitive.

\`\`\`
Attack scenario without TWAP:
1. Attacker flash-borrows massive amount
2. Swaps to temporarily spike the oracle price
3. Uses the inflated price to borrow more than their collateral is worth
4. Repays the flash loan, keeping the excess

Attack scenario with TWAP:
1. Attacker would need to sustain the manipulation for 30 minutes
2. Cost: continual capital deployment at unfavorable rates
3. Other traders arbitrage the manipulation away
4. Attack is economically unfeasible
\`\`\`

## TWAP Calculation

### Discrete TWAP (Sum of price * time / total time)

\`\`\`
TWAP = Σ(price_i * duration_i) / Σ(duration_i)

Where:
  price_i = price during interval i
  duration_i = length of interval i (in seconds or slots)
\`\`\`

### Numerical Example

\`\`\`
Time 0-10s:   price = $100
Time 10-25s:  price = $102
Time 25-30s:  price = $98

TWAP = ($100 * 10 + $102 * 15 + $98 * 5) / 30
     = ($1000 + $1530 + $490) / 30
     = $3020 / 30
     = $100.67
\`\`\`

## On-Chain TWAP Implementation

\`\`\`rust
use anchor_lang::prelude::*;

#[account]
pub struct TwapOracle {
    pub price_cumulative: u128,    // Running sum of price * time
    pub last_price: u64,           // Last observed price
    pub last_timestamp: i64,       // Timestamp of last update
    pub window_start: i64,         // Start of current TWAP window
    pub window_price_cumulative: u128, // Cumulative at window start
}

impl TwapOracle {
    /// Update the TWAP with a new price observation
    pub fn update(&mut self, new_price: u64, current_time: i64) -> Result<()> {
        let elapsed = (current_time - self.last_timestamp) as u128;

        // Add price * time to cumulative
        self.price_cumulative = self.price_cumulative
            .checked_add(
                (self.last_price as u128).checked_mul(elapsed).unwrap()
            )
            .unwrap();

        self.last_price = new_price;
        self.last_timestamp = current_time;

        Ok(())
    }

    /// Get the TWAP over the window
    pub fn get_twap(&self, current_time: i64, window_seconds: i64) -> Result<u64> {
        let window_start_time = current_time - window_seconds;

        // For simplicity, use the cumulative difference
        let elapsed = (current_time - self.last_timestamp) as u128;
        let current_cumulative = self.price_cumulative
            .checked_add(
                (self.last_price as u128).checked_mul(elapsed).unwrap()
            )
            .unwrap();

        let total_elapsed = (current_time - window_start_time) as u128;

        if total_elapsed == 0 {
            return Ok(self.last_price);
        }

        let twap = current_cumulative
            .checked_sub(self.window_price_cumulative)
            .unwrap()
            .checked_div(total_elapsed)
            .unwrap() as u64;

        Ok(twap)
    }
}
\`\`\`

## Exponential Moving Average (EMA)

Pyth provides an EMA price alongside the spot price. The EMA gives more weight to recent observations:

\`\`\`
EMA_new = EMA_old * (1 - alpha) + price_new * alpha

Where alpha = 2 / (N + 1), N = number of periods
\`\`\`

### EMA in Rust (Fixed-Point)

\`\`\`rust
const EMA_ALPHA_BPS: u64 = 200;  // alpha = 2%, approximately N=99

pub fn update_ema(current_ema: u64, new_price: u64) -> u64 {
    let weighted_old = (current_ema as u128)
        .checked_mul((10_000 - EMA_ALPHA_BPS) as u128)
        .unwrap();
    let weighted_new = (new_price as u128)
        .checked_mul(EMA_ALPHA_BPS as u128)
        .unwrap();
    weighted_old.checked_add(weighted_new).unwrap()
        .checked_div(10_000).unwrap() as u64
}
\`\`\`

## TWAP vs. EMA vs. Spot

| Property | Spot Price | TWAP | EMA |
|---|---|---|---|
| Responsiveness | Instant | Slow (window-based) | Medium (alpha-based) |
| Manipulation resistance | None | High | Medium |
| Implementation complexity | Trivial | Medium | Low |
| Storage cost | 0 | Medium (cumulative values) | Low (single value) |
| Best for | Display | Liquidations, settlements | Interest rate calculations |

## Practical DeFi Usage

- **Lending liquidations**: Use TWAP to prevent flash-loan-based oracle manipulation
- **AMM oracle prices**: Uniswap V2/V3 style TWAP based on on-chain swap prices
- **Derivatives settlement**: Use TWAP for fair settlement prices
- **Dynamic fees**: Adjust AMM fees based on EMA volatility`,
              },

              // Lesson 4.3 — Integrate Pyth Price Feeds (challenge)
              {
                title: "Integrate Pyth Price Feeds",
                description:
                  "Build a function that reads and validates a Pyth oracle price feed with staleness and confidence checks",
                type: "challenge",
                order: 2,
                xpReward: 70,
                duration: "35 min",
                content: `# Integrate Pyth Price Feeds

In this challenge, you will build a price reader that integrates with Pyth Network oracle feeds. Your implementation must validate the price is fresh, has acceptable confidence, and correctly handles the exponent for decimal conversion.

## Requirements

Your \`get_validated_price\` function must:
1. Read the price from a Pyth price account
2. Check that the price is not stale (within max_age_seconds)
3. Check that the confidence interval is within acceptable bounds
4. Convert the price to a standardized format (scaled by 1e6)
5. Return the validated price or an appropriate error

## Pyth Price Format

Pyth prices use a price + exponent format:
\`\`\`
Stored: price = 10050000000, exponent = -8
Meaning: $100.50 (10050000000 * 10^-8 = 100.50)

Stored: price = 153721, exponent = -2
Meaning: $1537.21
\`\`\`

## Your Task

Implement the price validation and conversion logic that DeFi protocols need for safe oracle integration.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement `get_validated_price(price: i64, exponent: i32, confidence: u64, publish_time: i64, current_time: i64, max_age_secs: i64, max_conf_bps: u16) -> Result<u64>` that: (1) rejects stale prices (current_time - publish_time > max_age_secs), (2) rejects high-confidence prices (conf/abs(price) > max_conf_bps/10000), (3) converts price to u64 scaled by 1e6 using the exponent. Handle both positive and negative exponents.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("Price is stale")]
    StalePrice,
    #[msg("Price confidence too wide")]
    PriceTooUncertain,
    #[msg("Invalid price (zero or negative)")]
    InvalidPrice,
    #[msg("Math overflow")]
    MathOverflow,
}

/// Validate and convert a Pyth oracle price to a u64 scaled by 1e6
///
/// # Arguments
/// * price - Raw Pyth price (i64)
/// * exponent - Price exponent (i32, typically negative like -8)
/// * confidence - Confidence interval (u64)
/// * publish_time - Unix timestamp of price publication
/// * current_time - Current Unix timestamp
/// * max_age_secs - Maximum acceptable age in seconds
/// * max_conf_bps - Maximum confidence/price ratio in basis points
///
/// # Returns
/// Price as u64 scaled by 1_000_000 (1e6)
pub fn get_validated_price(
    price: i64,
    exponent: i32,
    confidence: u64,
    publish_time: i64,
    current_time: i64,
    max_age_secs: i64,
    max_conf_bps: u16,
) -> Result<u64> {
    // TODO: Validate price > 0
    // TODO: Check staleness: current_time - publish_time <= max_age_secs
    // TODO: Check confidence: confidence * 10_000 / abs(price) <= max_conf_bps
    // TODO: Convert price to u64 scaled by 1e6:
    //   If exponent is negative (e.g., -8):
    //     target_decimals = 6, source_decimals = abs(exponent) = 8
    //     if source > target: price / 10^(source - target)
    //     if source <= target: price * 10^(target - source)
    // TODO: Return the scaled price
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "For staleness: require!(current_time - publish_time <= max_age_secs, OracleError::StalePrice). For confidence: let conf_ratio = (confidence as u128) * 10_000 / (price.unsigned_abs() as u128); require!(conf_ratio <= max_conf_bps as u128, OracleError::PriceTooUncertain);",
                      "For exponent conversion: let source_decimals = (-exponent) as u32; const TARGET_DECIMALS: u32 = 6; Then if source_decimals > TARGET_DECIMALS, divide by 10^(source-target); otherwise multiply by 10^(target-source).",
                      "Handle the common case of exponent = -8: price is in 8 decimal places, you want 6, so divide by 10^2 = 100. For exponent = -4: price is in 4 decimal places, you want 6, so multiply by 10^2 = 100.",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("Price is stale")]
    StalePrice,
    #[msg("Price confidence too wide")]
    PriceTooUncertain,
    #[msg("Invalid price (zero or negative)")]
    InvalidPrice,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn get_validated_price(
    price: i64,
    exponent: i32,
    confidence: u64,
    publish_time: i64,
    current_time: i64,
    max_age_secs: i64,
    max_conf_bps: u16,
) -> Result<u64> {
    // Validate price is positive
    require!(price > 0, OracleError::InvalidPrice);

    // Check staleness
    require!(
        current_time - publish_time <= max_age_secs,
        OracleError::StalePrice
    );

    // Check confidence
    let conf_ratio = (confidence as u128)
        .checked_mul(10_000)
        .ok_or(error!(OracleError::MathOverflow))?
        .checked_div(price.unsigned_abs() as u128)
        .ok_or(error!(OracleError::MathOverflow))?;

    require!(
        conf_ratio <= max_conf_bps as u128,
        OracleError::PriceTooUncertain
    );

    // Convert to u64 scaled by 1e6
    const TARGET_DECIMALS: u32 = 6;
    let price_u128 = price as u128;

    let scaled_price = if exponent < 0 {
        let source_decimals = (-exponent) as u32;
        if source_decimals > TARGET_DECIMALS {
            let divisor = 10u128.pow(source_decimals - TARGET_DECIMALS);
            price_u128.checked_div(divisor)
                .ok_or(error!(OracleError::MathOverflow))?
        } else {
            let multiplier = 10u128.pow(TARGET_DECIMALS - source_decimals);
            price_u128.checked_mul(multiplier)
                .ok_or(error!(OracleError::MathOverflow))?
        }
    } else {
        let multiplier = 10u128
            .pow(exponent as u32)
            .checked_mul(10u128.pow(TARGET_DECIMALS))
            .ok_or(error!(OracleError::MathOverflow))?;
        price_u128.checked_mul(multiplier)
            .ok_or(error!(OracleError::MathOverflow))?
    };

    Ok(scaled_price as u64)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Converts Pyth price with exponent -8 to 6-decimal scaled value",
                          input:
                            "price=10050000000, exponent=-8, conf=500000, publish_time=1000, current_time=1030, max_age=60, max_conf=100",
                          expectedOutput:
                            "100500000 ($100.50 scaled by 1e6: 10050000000 / 10^2 = 100500000)",
                          order: 0,
                        },
                        {
                          name: "Rejects stale price",
                          input:
                            "price=10050000000, exponent=-8, conf=500000, publish_time=1000, current_time=1100, max_age=60, max_conf=100",
                          expectedOutput:
                            "Err(OracleError::StalePrice) — 100 seconds > 60 max age",
                          order: 1,
                        },
                        {
                          name: "Rejects price with too-wide confidence",
                          input:
                            "price=10050000000, exponent=-8, conf=1005000000, publish_time=1000, current_time=1030, max_age=60, max_conf=100",
                          expectedOutput:
                            "Err(OracleError::PriceTooUncertain) — conf/price ~10% > 1%",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 4.4 — Oracle Manipulation Prevention (challenge)
              {
                title: "Oracle Manipulation Prevention",
                description:
                  "Implement a multi-oracle price aggregator with deviation checks and fallback logic",
                type: "challenge",
                order: 3,
                xpReward: 75,
                duration: "35 min",
                content: `# Oracle Manipulation Prevention

Relying on a single oracle is a single point of failure. If an oracle is manipulated, delayed, or goes offline, the DeFi protocol must have fallback mechanisms. This challenge implements a multi-oracle aggregator with deviation detection and circuit breakers.

## Defense Strategies

### 1. Multi-Oracle Aggregation
Use multiple oracle sources and compare them:
\`\`\`
primary_price = Pyth SOL/USD
secondary_price = Switchboard SOL/USD

If |primary - secondary| / primary > 5%:
  → Price divergence detected, use conservative price
  → Or pause the protocol
\`\`\`

### 2. Price Banding
Reject prices that deviate too far from a reference:
\`\`\`
If |new_price - last_known_price| / last_known_price > 20%:
  → Likely manipulation, reject the price
  → Use the last known good price instead
\`\`\`

### 3. Circuit Breaker
Pause critical operations when oracle conditions are abnormal:
\`\`\`rust
if price_deviation > threshold || price_stale || confidence_too_wide {
    return Err(OracleError::CircuitBreakerTripped);
}
\`\`\`

## Multi-Oracle Aggregation Logic

\`\`\`
1. Read price from primary oracle (Pyth)
2. Read price from secondary oracle (Switchboard)
3. If both are valid and within deviation threshold:
   → Use the median (or primary)
4. If one is stale but the other is valid:
   → Use the valid one with reduced confidence
5. If both are stale or diverge too much:
   → Trip circuit breaker, pause operations
\`\`\`

## Your Task

Implement a \`get_safe_price\` function that aggregates two oracle prices with deviation checking and fallback logic.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement `get_safe_price(primary_price: u64, primary_valid: bool, secondary_price: u64, secondary_valid: bool, last_known_price: u64, max_deviation_bps: u16) -> Result<u64>`. Rules: (1) If both valid and within deviation, return primary. (2) If both valid but deviation exceeded, return their average. (3) If only one valid and within max_deviation of last_known_price, return the valid one. (4) If neither valid, return error. (5) Deviation = |a-b|*10000/a.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("No valid oracle price available")]
    NoValidPrice,
    #[msg("Price deviation too large")]
    PriceDeviation,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn get_safe_price(
    primary_price: u64,
    primary_valid: bool,
    secondary_price: u64,
    secondary_valid: bool,
    last_known_price: u64,
    max_deviation_bps: u16,
) -> Result<u64> {
    // TODO: If neither oracle is valid, return NoValidPrice error

    // TODO: If both valid:
    //   Calculate deviation = |primary - secondary| * 10_000 / primary
    //   If deviation <= max_deviation_bps: return primary_price
    //   If deviation > max_deviation_bps: return average of both

    // TODO: If only primary valid:
    //   Check deviation from last_known_price
    //   If within bounds: return primary_price
    //   Else: return error

    // TODO: If only secondary valid:
    //   Check deviation from last_known_price
    //   If within bounds: return secondary_price
    //   Else: return error

    todo!()
}

fn calculate_deviation_bps(price_a: u64, price_b: u64) -> Result<u16> {
    // TODO: |price_a - price_b| * 10_000 / price_a
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "For deviation: let diff = if price_a > price_b { price_a - price_b } else { price_b - price_a }; then (diff as u128) * 10_000 / (price_a as u128).",
                      "For the average: ((primary_price as u128) + (secondary_price as u128)) / 2. Cast back to u64.",
                      "Handle the case where only one oracle is valid by comparing it against last_known_price using the same deviation check.",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("No valid oracle price available")]
    NoValidPrice,
    #[msg("Price deviation too large")]
    PriceDeviation,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn get_safe_price(
    primary_price: u64,
    primary_valid: bool,
    secondary_price: u64,
    secondary_valid: bool,
    last_known_price: u64,
    max_deviation_bps: u16,
) -> Result<u64> {
    if !primary_valid && !secondary_valid {
        return Err(error!(OracleError::NoValidPrice));
    }

    if primary_valid && secondary_valid {
        let deviation = calculate_deviation_bps(primary_price, secondary_price)?;
        if deviation <= max_deviation_bps {
            return Ok(primary_price);
        } else {
            // Return average when deviation is high but both are valid
            let avg = ((primary_price as u128)
                .checked_add(secondary_price as u128)
                .ok_or(error!(OracleError::MathOverflow))?)
                .checked_div(2)
                .ok_or(error!(OracleError::MathOverflow))? as u64;
            return Ok(avg);
        }
    }

    if primary_valid {
        let deviation = calculate_deviation_bps(primary_price, last_known_price)?;
        require!(deviation <= max_deviation_bps, OracleError::PriceDeviation);
        return Ok(primary_price);
    }

    // secondary_valid
    let deviation = calculate_deviation_bps(secondary_price, last_known_price)?;
    require!(deviation <= max_deviation_bps, OracleError::PriceDeviation);
    Ok(secondary_price)
}

fn calculate_deviation_bps(price_a: u64, price_b: u64) -> Result<u16> {
    let diff = if price_a > price_b {
        price_a - price_b
    } else {
        price_b - price_a
    };

    let deviation = (diff as u128)
        .checked_mul(10_000)
        .ok_or(error!(OracleError::MathOverflow))?
        .checked_div(price_a.max(1) as u128)
        .ok_or(error!(OracleError::MathOverflow))? as u16;

    Ok(deviation)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Both valid within deviation returns primary",
                          input:
                            "primary=100_000_000, primary_valid=true, secondary=100_500_000, secondary_valid=true, last=100_000_000, max_deviation=100",
                          expectedOutput:
                            "100_000_000 (deviation is 0.5% < 1% threshold)",
                          order: 0,
                        },
                        {
                          name: "Both valid exceeding deviation returns average",
                          input:
                            "primary=100_000_000, primary_valid=true, secondary=110_000_000, secondary_valid=true, last=100_000_000, max_deviation=500",
                          expectedOutput:
                            "105_000_000 (average of 100M and 110M, deviation 10% > 5%)",
                          order: 1,
                        },
                        {
                          name: "Neither valid returns error",
                          input:
                            "primary=0, primary_valid=false, secondary=0, secondary_valid=false, last=100_000_000, max_deviation=500",
                          expectedOutput: "Err(OracleError::NoValidPrice)",
                          order: 2,
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
        // Module 5: Yield Strategies
        // ────────────────────────────────────────────────────────────────────
        {
          title: "Yield Strategies",
          description:
            "Design and implement DeFi yield optimization — vault patterns, auto-compounding, LP farming strategies, and risk management frameworks.",
          order: 4,
          lessons: {
            create: [
              // Lesson 5.1 — Vault Architecture Patterns (content)
              {
                title: "Vault Architecture Patterns",
                description:
                  "Understand the ERC-4626-style vault pattern adapted for Solana — share-based accounting, deposit/withdraw flows, and fee structures",
                type: "content",
                order: 0,
                xpReward: 35,
                duration: "25 min",
                content: `# Vault Architecture Patterns

Vaults are the fundamental building block of yield strategies on Solana. A vault accepts deposits, deploys capital into yield-generating strategies, and allows proportional withdrawals. The pattern is analogous to Ethereum's ERC-4626 standard, adapted for Solana's account model.

## Share-Based Accounting

The core principle: users deposit tokens and receive **shares** (vault tokens). Shares represent a proportional claim on the vault's total assets.

\`\`\`
share_price = total_assets / total_shares

On deposit:
  shares_minted = deposit_amount / share_price
  shares_minted = deposit_amount * total_shares / total_assets

On withdraw:
  assets_returned = shares_burned * share_price
  assets_returned = shares_burned * total_assets / total_shares
\`\`\`

### Why Shares Instead of Direct Tracking?

1. **Gas efficiency**: No need to update every depositor when yield accrues
2. **Simplicity**: One number (share balance) represents the user's position
3. **Composability**: Share tokens can be used as collateral in other protocols

### Numerical Walk-Through

\`\`\`
Initial state: 0 assets, 0 shares

Alice deposits 1000 USDC:
  shares = 1000 (first depositor, 1:1)
  State: 1000 assets, 1000 shares, price = 1.0

Vault earns 100 USDC yield:
  State: 1100 assets, 1000 shares, price = 1.1

Bob deposits 550 USDC:
  shares = 550 / 1.1 = 500 shares
  State: 1650 assets, 1500 shares, price = 1.1

Vault earns another 150 USDC:
  State: 1800 assets, 1500 shares, price = 1.2

Alice withdraws all (1000 shares):
  assets = 1000 * 1.2 = 1200 USDC (earned 200 on 1000 deposit)
  State: 600 assets, 500 shares, price = 1.2

Bob withdraws all (500 shares):
  assets = 500 * 1.2 = 600 USDC (earned 50 on 550 deposit)
\`\`\`

## Vault Account Structure

\`\`\`rust
#[account]
pub struct Vault {
    pub authority: Pubkey,           // PDA controlling the vault
    pub authority_bump: u8,
    pub underlying_mint: Pubkey,     // e.g., USDC mint
    pub share_mint: Pubkey,          // Vault share token mint
    pub token_vault: Pubkey,         // Token account holding deposits
    pub total_deposited: u64,        // Total assets under management
    pub strategy: Pubkey,            // Current yield strategy account
    pub performance_fee_bps: u16,    // Fee on profits (e.g., 1000 = 10%)
    pub management_fee_bps: u16,     // Annual fee on AUM (e.g., 200 = 2%)
    pub last_fee_collection: i64,    // Timestamp of last fee collection
    pub deposit_cap: u64,            // Maximum total deposits
    pub is_paused: bool,
    pub _reserved: [u8; 64],
}
\`\`\`

## Fee Models

### Performance Fee (Profit Share)
Charged only on profits:
\`\`\`
profit = current_total_assets - high_water_mark
performance_fee = profit * performance_fee_bps / 10_000

Example:
  Deposits: 1,000,000 USDC
  Current value: 1,100,000 USDC
  Profit: 100,000 USDC
  Performance fee (10%): 10,000 USDC
\`\`\`

### Management Fee (AUM Fee)
Charged continuously on total assets:
\`\`\`
annual_fee = total_assets * management_fee_bps / 10_000
per_second_fee = annual_fee / 31_536_000

Example:
  AUM: 10,000,000 USDC
  Management fee (2%): 200,000 USDC/year
  Per second: ~0.00634 USDC
\`\`\`

Fees are typically collected by minting additional share tokens to the protocol, diluting other shareholders:
\`\`\`rust
let fee_shares = fee_amount * total_shares / (total_assets - fee_amount);
// Mint fee_shares to protocol treasury
\`\`\`

## Deposit Cap and Security

\`\`\`rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;

    // Check deposit cap
    require!(!vault.is_paused, VaultError::VaultPaused);
    require!(
        vault.total_deposited.checked_add(amount).unwrap() <= vault.deposit_cap,
        VaultError::DepositCapExceeded
    );

    // Collect pending fees before deposit (important!)
    collect_management_fees(ctx.accounts)?;

    // Calculate shares (after fee collection to use accurate share price)
    let shares = if ctx.accounts.share_mint.supply == 0 {
        amount
    } else {
        (amount as u128)
            .checked_mul(ctx.accounts.share_mint.supply as u128).unwrap()
            .checked_div(vault.total_deposited as u128).unwrap() as u64
    };

    // Transfer + mint
    // ...

    Ok(())
}
\`\`\`

## Key Security Considerations

1. **Donation attack**: Attacker sends tokens directly to vault (not through deposit), inflating share price. Prevent by using cached \`total_deposited\` instead of vault balance.
2. **First depositor attack**: First depositor can manipulate the initial share price. Mitigate with minimum deposit or locked liquidity.
3. **Fee collection timing**: Always collect fees BEFORE deposits/withdrawals to ensure accurate share pricing.
4. **Rounding**: Round shares DOWN on deposit, round assets DOWN on withdrawal (always favor the vault).`,
              },

              // Lesson 5.2 — Auto-Compounding Strategies (content)
              {
                title: "Auto-Compounding Strategies",
                description:
                  "Design auto-compounding yield strategies that harvest and reinvest rewards on Solana",
                type: "content",
                order: 1,
                xpReward: 35,
                duration: "25 min",
                content: `# Auto-Compounding Strategies

Auto-compounding is one of the most popular yield optimization strategies. Instead of letting rewards accumulate (simple interest), the strategy periodically harvests and reinvests them (compound interest). On Solana, this can be done permissionlessly by "crankers" — bots that call the compound instruction.

## Simple vs. Compound Interest

\`\`\`
Simple interest (no compounding):
  value = principal * (1 + rate)
  1000 USDC at 10% APR for 1 year = 1100 USDC

Compound interest (daily compounding):
  value = principal * (1 + rate/365)^365
  1000 USDC at 10% APR compounded daily = 1105.16 USDC

Continuous compounding:
  value = principal * e^rate
  1000 USDC at 10% APR = 1105.17 USDC
\`\`\`

The more frequently you compound, the higher the effective yield (APY vs APR):

\`\`\`
APY = (1 + APR/n)^n - 1

Where n = compounding frequency per year

APR = 10%:
  Annual compounding (n=1):     APY = 10.00%
  Monthly compounding (n=12):   APY = 10.47%
  Daily compounding (n=365):    APY = 10.52%
  Hourly compounding (n=8760):  APY = 10.52%
\`\`\`

## Auto-Compound Architecture

\`\`\`
Vault → deploys capital to → Strategy (e.g., LP farming)
                                ↓
                          Rewards accumulate (token emissions)
                                ↓
Cranker calls: compound()
  1. Harvest reward tokens
  2. Swap reward tokens → underlying tokens
  3. Re-deposit underlying into strategy
  4. Update vault's total_deposited
\`\`\`

## Compound Instruction

\`\`\`rust
pub fn compound(ctx: Context<Compound>) -> Result<()> {
    let vault = &ctx.accounts.vault;

    // Step 1: Harvest pending rewards from the farm
    let reward_amount = harvest_rewards(
        &ctx.accounts.strategy,
        &ctx.accounts.reward_token_account,
        &ctx.accounts.farm,
    )?;

    if reward_amount == 0 {
        return Ok(()); // Nothing to compound
    }

    // Step 2: Swap rewards to underlying token via AMM
    let underlying_received = swap_tokens(
        &ctx.accounts.amm_pool,
        &ctx.accounts.reward_token_account,
        &ctx.accounts.underlying_token_account,
        reward_amount,
        0, // min_out (in production, use a calculated minimum)
    )?;

    // Step 3: Re-deposit into the strategy
    deposit_to_strategy(
        &ctx.accounts.strategy,
        &ctx.accounts.underlying_token_account,
        underlying_received,
    )?;

    // Step 4: Update vault state
    let vault = &mut ctx.accounts.vault;
    vault.total_deposited = vault.total_deposited
        .checked_add(underlying_received)
        .unwrap();

    // Step 5: Pay cranker fee (incentive to compound)
    let cranker_fee = underlying_received
        .checked_mul(vault.cranker_fee_bps as u64).unwrap()
        .checked_div(10_000).unwrap();

    emit!(CompoundEvent {
        vault: vault.key(),
        rewards_harvested: reward_amount,
        underlying_deposited: underlying_received,
        cranker_fee,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
\`\`\`

## Optimal Compounding Frequency

Compounding too frequently wastes gas; too infrequently leaves yield on the table. The optimal frequency depends on:

\`\`\`
net_gain_per_compound = compound_gain - gas_cost

Where:
  compound_gain = principal * daily_rate * time_since_last_compound
  gas_cost = ~5000 lamports + priority fee + CU cost

Break-even time:
  min_interval = gas_cost / (principal * per_second_rate)
\`\`\`

For a $1M vault at 10% APR with $0.01 gas cost:
\`\`\`
per_second_rate = 0.10 / 31_536_000 = 0.00000000317
per_second_yield = $1,000,000 * 0.00000000317 = $0.00317/sec

break_even = $0.01 / $0.00317 = 3.15 seconds
→ Compound every few minutes for practical purposes
\`\`\`

## Cranker Incentives

Since \`compound()\` is permissionless, anyone can call it. To incentivize timely compounding:

\`\`\`rust
// Pay cranker a small percentage of the compounded amount
let cranker_fee_bps = 50; // 0.5%
let cranker_reward = compounded_amount * cranker_fee_bps / 10_000;

// Transfer cranker_reward to the caller
token::transfer(
    CpiContext::new_with_signer(/* PDA signer */),
    cranker_reward,
)?;
\`\`\`

## Strategy Rotation

Advanced vaults can switch between strategies based on yield rates:

\`\`\`
Strategy A (Raydium SOL-USDC farm): 15% APY
Strategy B (Orca SOL-USDC whirlpool): 18% APY
Strategy C (MarginFi lending): 8% APY

Vault rebalances:
  1. Withdraw from Strategy A
  2. Deposit into Strategy B (higher yield)
  3. Update vault.strategy pointer
\`\`\`

This requires careful timing to avoid impermanent loss during transitions and sufficient liquidity for withdrawals.`,
              },

              // Lesson 5.3 — LP Farming & Impermanent Loss (content)
              {
                title: "LP Farming & Impermanent Loss",
                description:
                  "Understand LP farming rewards, impermanent loss calculations, and strategies to mitigate IL",
                type: "content",
                order: 2,
                xpReward: 35,
                duration: "25 min",
                content: `# LP Farming & Impermanent Loss

LP farming (yield farming) is the practice of providing liquidity to AMMs and earning additional token rewards on top of trading fees. However, LP positions are subject to **impermanent loss** (IL) — a hidden cost that can erode profits. Understanding and mitigating IL is critical for building effective yield strategies.

## How LP Farming Works

\`\`\`
1. User deposits Token A + Token B into AMM pool
2. User receives LP tokens
3. User stakes LP tokens in a farming contract
4. Farming contract distributes reward tokens over time
5. Total yield = trading_fees + farming_rewards - impermanent_loss
\`\`\`

## Impermanent Loss Explained

When you provide liquidity to a constant product AMM, the pool automatically rebalances your position as prices change. This rebalancing means you end up with more of the cheaper token and less of the expensive token — always worse than simply holding.

### The Formula

For a price change of ratio \`r = new_price / old_price\`:

\`\`\`
IL = 2 * sqrt(r) / (1 + r) - 1

Where:
  r = price_ratio (new/old)
  IL = fractional loss compared to holding
\`\`\`

### IL Table

| Price Change | IL (loss vs holding) |
|---|---|
| 1.25x (25% up) | -0.6% |
| 1.50x (50% up) | -2.0% |
| 2.00x (2x up) | -5.7% |
| 3.00x (3x up) | -13.4% |
| 5.00x (5x up) | -25.5% |
| 0.50x (50% down) | -5.7% |
| 0.25x (75% down) | -20.0% |

Note: IL is symmetric — a 2x increase has the same IL as a 2x decrease (0.5x).

### Numerical Example

\`\`\`
Initial: Deposit $500 SOL + $500 USDC at SOL = $100
Pool: 5 SOL + 500 USDC, k = 2500

SOL rises to $400 (4x):
  Pool rebalances: 2.5 SOL + 1000 USDC (k still = 2500)
  LP position value: 2.5 * $400 + $1000 = $2000

If just held: 5 * $400 + $500 = $2500

IL = $2000 / $2500 - 1 = -20%

IL formula: 2 * sqrt(4) / (1 + 4) - 1 = 4/5 - 1 = -20% ✓
\`\`\`

## IL Calculation in Rust

\`\`\`rust
/// Calculate impermanent loss for a given price ratio
/// Returns loss as basis points (negative = loss)
/// price_ratio is scaled by 10_000 (10_000 = 1.0x, 20_000 = 2.0x)
pub fn calculate_impermanent_loss_bps(price_ratio_bps: u64) -> i64 {
    // IL = 2 * sqrt(r) / (1 + r) - 1
    // All calculations in fixed-point with 10_000 scale

    let r = price_ratio_bps; // scaled by 10_000

    // sqrt(r) where r is scaled by 10_000
    // sqrt(r * 10_000) to maintain precision
    let r_scaled = (r as u128).checked_mul(10_000).unwrap();
    let sqrt_r = isqrt(r_scaled) as u64; // scaled by 10_000

    // 2 * sqrt(r) scaled by 10_000
    let numerator = 2u64.checked_mul(sqrt_r).unwrap(); // scaled by 10_000

    // (1 + r) scaled by 10_000
    let denominator = 10_000u64.checked_add(r).unwrap(); // scaled by 10_000

    // ratio = numerator / denominator, result scaled by 10_000
    let ratio = (numerator as u128)
        .checked_mul(10_000).unwrap()
        .checked_div(denominator as u128).unwrap() as u64;

    // IL = ratio - 10_000 (in basis points)
    (ratio as i64).checked_sub(10_000).unwrap()
}
\`\`\`

## Strategies to Mitigate IL

### 1. Correlated Pairs
Provide liquidity to pairs that move together:
- **stSOL/SOL**: Both track SOL price → near-zero IL
- **USDC/USDT**: Both stable → minimal IL
- **mSOL/SOL**: Liquid staking token → low IL

### 2. Concentrated Liquidity
Provide liquidity in a narrow range to earn more fees:
- Higher fee income offsets IL
- Risk: if price moves out of range, you earn nothing

### 3. Single-Sided Deposits
Some protocols accept single-sided deposits and handle the swap internally:
\`\`\`
User deposits 100% USDC
→ Protocol swaps 50% to SOL
→ Provides liquidity with 50 USDC + equivalent SOL
→ User bears IL from the swap forward
\`\`\`

### 4. IL Insurance / Hedging
- Purchase options or perpetual positions to hedge directional exposure
- Some protocols offer IL protection after a minimum deposit period

## Yield Breakdown

For an LP farming position, the true return is:

\`\`\`
net_yield = trading_fees + farming_rewards - impermanent_loss - gas_costs

Example:
  Trading fees: 12% APY
  Farming rewards: 25% APY
  Impermanent loss: -8% APY
  Gas costs: -0.5% APY
  ─────────────────────
  Net yield: 28.5% APY
\`\`\`

Always evaluate net yield, not just the advertised APY (which typically excludes IL).`,
              },

              // Lesson 5.4 — Build a Yield Vault (challenge)
              {
                title: "Build a Yield Vault",
                description:
                  "Implement a share-based yield vault with deposit, withdraw, and compound functionality",
                type: "challenge",
                order: 3,
                xpReward: 75,
                duration: "40 min",
                content: `# Build a Yield Vault

In this challenge, you will implement the core accounting logic for a yield vault. The vault uses share-based accounting where depositors receive vault shares proportional to their deposit, and shares appreciate as yield is compounded.

## Requirements

Implement three functions:
1. **calculate_deposit_shares**: Given a deposit amount, return shares to mint
2. **calculate_withdraw_amount**: Given shares to burn, return underlying to return
3. **calculate_compound_shares_fee**: Given compounded yield, return management fee shares

## Share Price Invariant

\`\`\`
share_price = total_assets / total_shares

After any operation, the share price should remain the same or increase
(increase only from yield, never from deposits/withdrawals)
\`\`\`

## Your Task

Build the complete vault accounting that handles edge cases like first deposit, rounding, and fee calculation.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement three functions: (1) `calculate_deposit_shares(amount: u64, total_assets: u64, total_shares: u64) -> Result<u64>` — returns shares to mint (1:1 for first deposit, proportional otherwise, rounded DOWN). (2) `calculate_withdraw_amount(shares: u64, total_assets: u64, total_shares: u64) -> Result<u64>` — returns underlying amount (proportional, rounded DOWN). (3) `calculate_performance_fee_shares(yield_amount: u64, total_assets: u64, total_shares: u64, fee_bps: u16) -> Result<u64>` — returns fee shares to mint to protocol (fee_shares = yield * fee_bps/10000 * total_shares / total_assets).",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Deposit amount must be greater than zero")]
    ZeroDeposit,
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("Vault is empty")]
    EmptyVault,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_deposit_shares(
    amount: u64,
    total_assets: u64,
    total_shares: u64,
) -> Result<u64> {
    // TODO: Validate amount > 0
    // TODO: If total_shares == 0 (first deposit), return amount (1:1)
    // TODO: Otherwise: shares = amount * total_shares / total_assets
    // TODO: Round DOWN (integer division is naturally floor)
    // TODO: Validate shares > 0
    todo!()
}

pub fn calculate_withdraw_amount(
    shares: u64,
    total_assets: u64,
    total_shares: u64,
) -> Result<u64> {
    // TODO: Validate shares > 0 and total_shares > 0
    // TODO: amount = shares * total_assets / total_shares
    // TODO: Round DOWN (favor the vault)
    // TODO: Validate amount > 0
    todo!()
}

pub fn calculate_performance_fee_shares(
    yield_amount: u64,
    total_assets: u64,
    total_shares: u64,
    fee_bps: u16,
) -> Result<u64> {
    // TODO: fee_value = yield_amount * fee_bps / 10_000
    // TODO: fee_shares = fee_value * total_shares / total_assets
    // TODO: Round DOWN
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "For deposit shares: (amount as u128).checked_mul(total_shares as u128).unwrap().checked_div(total_assets as u128).unwrap() as u64. Integer division naturally rounds down.",
                      "For withdraw amount: same pattern but (shares as u128) * total_assets / total_shares. Rounding down here means the vault keeps a tiny bit extra — this is correct and prevents draining.",
                      "For fee shares: first calculate fee_value = yield_amount * fee_bps / 10_000, then fee_shares = fee_value * total_shares / total_assets. The fee is taken as newly minted shares, diluting all holders proportionally.",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Deposit amount must be greater than zero")]
    ZeroDeposit,
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("Vault is empty")]
    EmptyVault,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn calculate_deposit_shares(
    amount: u64,
    total_assets: u64,
    total_shares: u64,
) -> Result<u64> {
    require!(amount > 0, VaultError::ZeroDeposit);

    if total_shares == 0 {
        return Ok(amount); // First deposit: 1:1
    }

    let shares = (amount as u128)
        .checked_mul(total_shares as u128)
        .ok_or(error!(VaultError::MathOverflow))?
        .checked_div(total_assets as u128)
        .ok_or(error!(VaultError::MathOverflow))? as u64;

    require!(shares > 0, VaultError::ZeroDeposit);

    Ok(shares)
}

pub fn calculate_withdraw_amount(
    shares: u64,
    total_assets: u64,
    total_shares: u64,
) -> Result<u64> {
    require!(shares > 0, VaultError::InsufficientShares);
    require!(total_shares > 0, VaultError::EmptyVault);

    let amount = (shares as u128)
        .checked_mul(total_assets as u128)
        .ok_or(error!(VaultError::MathOverflow))?
        .checked_div(total_shares as u128)
        .ok_or(error!(VaultError::MathOverflow))? as u64;

    require!(amount > 0, VaultError::InsufficientShares);

    Ok(amount)
}

pub fn calculate_performance_fee_shares(
    yield_amount: u64,
    total_assets: u64,
    total_shares: u64,
    fee_bps: u16,
) -> Result<u64> {
    if yield_amount == 0 || fee_bps == 0 {
        return Ok(0);
    }

    let fee_value = (yield_amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(error!(VaultError::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(VaultError::MathOverflow))?;

    let fee_shares = fee_value
        .checked_mul(total_shares as u128)
        .ok_or(error!(VaultError::MathOverflow))?
        .checked_div(total_assets as u128)
        .ok_or(error!(VaultError::MathOverflow))? as u64;

    Ok(fee_shares)
}`,
                    testCases: {
                      create: [
                        {
                          name: "First deposit returns 1:1 shares",
                          input:
                            "amount = 1_000_000, total_assets = 0, total_shares = 0",
                          expectedOutput: "1_000_000 shares",
                          order: 0,
                        },
                        {
                          name: "Subsequent deposit with appreciated shares",
                          input:
                            "amount = 1_100_000, total_assets = 1_100_000, total_shares = 1_000_000",
                          expectedOutput:
                            "1_000_000 shares (1_100_000 * 1_000_000 / 1_100_000 = 1_000_000)",
                          order: 1,
                        },
                        {
                          name: "Withdraw returns proportional assets",
                          input:
                            "shares = 500_000, total_assets = 1_100_000, total_shares = 1_000_000",
                          expectedOutput:
                            "550_000 (500_000 * 1_100_000 / 1_000_000 = 550_000)",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },

              // Lesson 5.5 — Risk Management Framework (challenge)
              {
                title: "Risk Management Framework",
                description:
                  "Implement risk controls for DeFi vaults — exposure limits, drawdown protection, and emergency shutdown",
                type: "challenge",
                order: 4,
                xpReward: 80,
                duration: "40 min",
                content: `# Risk Management Framework

Every production DeFi vault needs robust risk management. Without proper controls, a single bad trade, oracle failure, or smart contract exploit can wipe out all depositor funds. This challenge implements the core risk checks that protect vault capital.

## Risk Parameters

\`\`\`rust
#[account]
pub struct RiskConfig {
    pub max_single_deposit: u64,        // Max deposit per transaction
    pub max_total_deposits: u64,        // Vault deposit cap
    pub max_drawdown_bps: u16,          // Max allowed loss before pause (e.g., 1000 = 10%)
    pub max_single_withdrawal_bps: u16, // Max % of vault per withdrawal
    pub high_water_mark: u64,           // Highest total_assets recorded
    pub emergency_admin: Pubkey,        // Can trigger emergency shutdown
    pub is_emergency: bool,             // Emergency shutdown flag
}
\`\`\`

## Drawdown Protection

A **drawdown** is the decline from peak to trough. If the vault's total assets drop more than the allowed drawdown from the high water mark, the vault should pause:

\`\`\`
drawdown = (high_water_mark - current_assets) / high_water_mark

If drawdown > max_drawdown:
  → Pause deposits and strategy deployment
  → Allow withdrawals only (wind down)
  → Alert admin
\`\`\`

## Position Sizing

No single strategy or position should risk more than a portion of the vault:

\`\`\`
max_position = total_assets * max_position_bps / 10_000

Example:
  Total vault: $10,000,000
  Max position: 20% = $2,000,000 in any single strategy
\`\`\`

## Emergency Withdrawal

In an emergency, the vault must be able to:
1. Pause all deposits
2. Withdraw from all strategies
3. Allow proportional withdrawals only
4. Prevent any new deployments

\`\`\`rust
pub fn emergency_shutdown(ctx: Context<EmergencyShutdown>) -> Result<()> {
    require!(
        ctx.accounts.admin.key() == ctx.accounts.risk_config.emergency_admin,
        VaultError::Unauthorized
    );

    let config = &mut ctx.accounts.risk_config;
    config.is_emergency = true;

    // Withdraw from all active strategies
    withdraw_all_strategies(ctx.accounts)?;

    emit!(EmergencyShutdownEvent {
        vault: ctx.accounts.vault.key(),
        timestamp: Clock::get()?.unix_timestamp,
        total_assets: ctx.accounts.vault.total_deposited,
    });

    Ok(())
}
\`\`\`

## Your Task

Implement the risk validation functions that protect vault operations: deposit validation, withdrawal validation, and drawdown checking.`,
                challenge: {
                  create: {
                    prompt:
                      "Implement three risk management functions: (1) `validate_deposit(amount: u64, current_total: u64, max_single: u64, max_total: u64, is_emergency: bool) -> Result<()>` — rejects if emergency, exceeds single limit, or exceeds total cap. (2) `validate_withdrawal(shares: u64, total_shares: u64, max_withdrawal_bps: u16) -> Result<()>` — rejects if withdrawal exceeds max_withdrawal_bps percent of total shares. (3) `check_drawdown(current_assets: u64, high_water_mark: u64, max_drawdown_bps: u16) -> Result<bool>` — returns true if drawdown exceeds max, meaning vault should pause.",
                    starterCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum RiskError {
    #[msg("Vault is in emergency shutdown")]
    EmergencyShutdown,
    #[msg("Deposit exceeds single transaction limit")]
    DepositTooLarge,
    #[msg("Deposit would exceed vault cap")]
    VaultCapExceeded,
    #[msg("Withdrawal exceeds maximum allowed percentage")]
    WithdrawalTooLarge,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn validate_deposit(
    amount: u64,
    current_total: u64,
    max_single: u64,
    max_total: u64,
    is_emergency: bool,
) -> Result<()> {
    // TODO: Reject if is_emergency
    // TODO: Reject if amount > max_single
    // TODO: Reject if current_total + amount > max_total
    todo!()
}

pub fn validate_withdrawal(
    shares: u64,
    total_shares: u64,
    max_withdrawal_bps: u16,
) -> Result<()> {
    // TODO: Calculate max_shares = total_shares * max_withdrawal_bps / 10_000
    // TODO: Reject if shares > max_shares
    todo!()
}

pub fn check_drawdown(
    current_assets: u64,
    high_water_mark: u64,
    max_drawdown_bps: u16,
) -> Result<bool> {
    // TODO: If current_assets >= high_water_mark, return false (no drawdown)
    // TODO: drawdown_bps = (high_water_mark - current_assets) * 10_000 / high_water_mark
    // TODO: Return true if drawdown_bps > max_drawdown_bps
    todo!()
}`,
                    language: "rust",
                    hints: [
                      "For validate_deposit: require!(!is_emergency, RiskError::EmergencyShutdown); require!(amount <= max_single, RiskError::DepositTooLarge); require!(current_total.checked_add(amount).unwrap() <= max_total, RiskError::VaultCapExceeded);",
                      "For validate_withdrawal: let max_shares = (total_shares as u128) * (max_withdrawal_bps as u128) / 10_000; require!(shares <= max_shares as u64, RiskError::WithdrawalTooLarge);",
                      "For check_drawdown: if current >= hwm return Ok(false). Otherwise: let loss = hwm - current; let drawdown_bps = (loss as u128) * 10_000 / (hwm as u128); Ok(drawdown_bps > max_drawdown_bps as u128).",
                    ],
                    solution: `use anchor_lang::prelude::*;

#[error_code]
pub enum RiskError {
    #[msg("Vault is in emergency shutdown")]
    EmergencyShutdown,
    #[msg("Deposit exceeds single transaction limit")]
    DepositTooLarge,
    #[msg("Deposit would exceed vault cap")]
    VaultCapExceeded,
    #[msg("Withdrawal exceeds maximum allowed percentage")]
    WithdrawalTooLarge,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn validate_deposit(
    amount: u64,
    current_total: u64,
    max_single: u64,
    max_total: u64,
    is_emergency: bool,
) -> Result<()> {
    require!(!is_emergency, RiskError::EmergencyShutdown);
    require!(amount <= max_single, RiskError::DepositTooLarge);
    require!(
        current_total.checked_add(amount)
            .ok_or(error!(RiskError::MathOverflow))? <= max_total,
        RiskError::VaultCapExceeded
    );
    Ok(())
}

pub fn validate_withdrawal(
    shares: u64,
    total_shares: u64,
    max_withdrawal_bps: u16,
) -> Result<()> {
    let max_shares = (total_shares as u128)
        .checked_mul(max_withdrawal_bps as u128)
        .ok_or(error!(RiskError::MathOverflow))?
        .checked_div(10_000)
        .ok_or(error!(RiskError::MathOverflow))? as u64;

    require!(shares <= max_shares, RiskError::WithdrawalTooLarge);
    Ok(())
}

pub fn check_drawdown(
    current_assets: u64,
    high_water_mark: u64,
    max_drawdown_bps: u16,
) -> Result<bool> {
    if current_assets >= high_water_mark {
        return Ok(false);
    }

    let loss = high_water_mark
        .checked_sub(current_assets)
        .ok_or(error!(RiskError::MathOverflow))?;

    let drawdown_bps = (loss as u128)
        .checked_mul(10_000)
        .ok_or(error!(RiskError::MathOverflow))?
        .checked_div(high_water_mark.max(1) as u128)
        .ok_or(error!(RiskError::MathOverflow))?;

    Ok(drawdown_bps > max_drawdown_bps as u128)
}`,
                    testCases: {
                      create: [
                        {
                          name: "Deposit rejected during emergency",
                          input:
                            "amount=1000, current_total=0, max_single=5000, max_total=100000, is_emergency=true",
                          expectedOutput: "Err(RiskError::EmergencyShutdown)",
                          order: 0,
                        },
                        {
                          name: "Drawdown detected when loss exceeds threshold",
                          input:
                            "current_assets=850_000, high_water_mark=1_000_000, max_drawdown_bps=1000",
                          expectedOutput: "true (15% drawdown > 10% max)",
                          order: 1,
                        },
                        {
                          name: "Withdrawal within limits passes validation",
                          input:
                            "shares=100, total_shares=1000, max_withdrawal_bps=2000",
                          expectedOutput: "Ok(()) — 10% withdrawal < 20% max",
                          order: 2,
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
