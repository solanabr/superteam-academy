import { CourseModule } from "./types";

export const MODULE_TOKENS: CourseModule = {
  title: "SPL Tokens",
  description:
    "Create, mint, and manage SPL tokens and Token-2022 extensions in Anchor programs.",
  lessons: [
    // ─── Lesson 1: Token Basics ─────────────────────────
    {
      title: "Token Basics",
      description:
        "Create token mints, token accounts, and perform transfers/mints using Anchor's SPL token helpers.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Token Basics in Anchor</h2>
<p>Anchor's <code>anchor-spl</code> crate provides type-safe wrappers for interacting with the SPL Token Program.</p>

<h3>Setup</h3>
<pre><code class="language-toml">[dependencies]
anchor-spl = { version = "0.32.1", features = ["token", "associated_token"] }</code></pre>

<h3>Create a Mint</h3>
<pre><code class="language-rust">use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct CreateMint&lt;'info&gt; {
    #[account(mut)]
    pub payer: Signer&lt;'info&gt;,
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = payer,
    )]
    pub mint: Account&lt;'info, Mint&gt;,
    pub token_program: Program&lt;'info, Token&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h3>Create Associated Token Account</h3>
<pre><code class="language-rust">use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct CreateATA&lt;'info&gt; {
    #[account(mut)]
    pub payer: Signer&lt;'info&gt;,
    pub mint: Account&lt;'info, Mint&gt;,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account&lt;'info, TokenAccount&gt;,
    pub associated_token_program: Program&lt;'info, AssociatedToken&gt;,
    pub token_program: Program&lt;'info, Token&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h3>Mint Tokens</h3>
<pre><code class="language-rust">use anchor_spl::token::{mint_to, MintTo};

pub fn mint_tokens(ctx: Context&lt;MintTokens&gt;, amount: u64) -&gt; Result&lt;()&gt; {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    mint_to(cpi_ctx, amount)?;
    Ok(())
}</code></pre>

<h3>Transfer Tokens</h3>
<pre><code class="language-rust">use anchor_spl::token::{transfer, Transfer};

pub fn transfer_tokens(ctx: Context&lt;TransferTokens&gt;, amount: u64) -&gt; Result&lt;()&gt; {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.from_ata.to_account_info(),
            to: ctx.accounts.to_ata.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        },
    );
    transfer(cpi_ctx, amount)?;
    Ok(())
}</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/tokens/basics" target="_blank">Token Basics Docs</a></p>
`,
    },
    // ─── Lesson 2: Token Extensions ─────────────────────
    {
      title: "Token Extensions (Token-2022)",
      description:
        "Use Token-2022 extensions in Anchor: NonTransferable, PermanentDelegate, TransferFee, and more.",
      type: "content",
      duration: "30 min",
      content: `
<h2>Token Extensions (Token-2022)</h2>
<p>Token-2022 is Solana's next-gen token program with built-in extensions. Use <code>anchor-spl</code> with the <code>token_2022</code> feature.</p>

<h3>Setup</h3>
<pre><code class="language-toml">[dependencies]
anchor-spl = { version = "0.32.1", features = ["token_2022", "associated_token"] }</code></pre>

<h3>Available Extensions</h3>
<table>
  <thead><tr><th>Extension</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>NonTransferable</td><td>Soulbound tokens (cannot be transferred)</td></tr>
    <tr><td>PermanentDelegate</td><td>Authority that can always burn/transfer</td></tr>
    <tr><td>TransferFee</td><td>Protocol-level fees on transfers</td></tr>
    <tr><td>TransferHook</td><td>Custom logic on every transfer</td></tr>
    <tr><td>MetadataPointer</td><td>On-chain metadata without Metaplex</td></tr>
    <tr><td>ConfidentialTransfer</td><td>Encrypted transfer amounts</td></tr>
    <tr><td>InterestBearing</td><td>Tokens that accrue interest</td></tr>
  </tbody>
</table>

<h3>Creating a Soulbound Token</h3>
<pre><code class="language-rust">use anchor_spl::token_2022::{self, Token2022};
use spl_token_2022::extension::ExtensionType;

// Calculate space for extensions
let extensions = [
    ExtensionType::NonTransferable,
    ExtensionType::PermanentDelegate,
];
let space = ExtensionType::try_calculate_account_len::&lt;spl_token_2022::state::Mint&gt;(
    &extensions
)?;

// Initialize extensions BEFORE InitializeMint
// 1. NonTransferable — no extra data
// 2. PermanentDelegate — set delegate to your PDA
initialize_permanent_delegate(
    &token_2022_program.key(),
    &xp_mint.key(),
    &config_pda.key(),
)?;</code></pre>

<h3>Using Token-2022 in Accounts</h3>
<pre><code class="language-rust">use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct MintXP&lt;'info&gt; {
    #[account(mut)]
    pub xp_mint: InterfaceAccount&lt;'info, Mint&gt;,
    #[account(mut)]
    pub user_ata: InterfaceAccount&lt;'info, TokenAccount&gt;,
    pub token_program: Interface&lt;'info, TokenInterface&gt;,
}</code></pre>
<p>Using <code>Interface</code> and <code>InterfaceAccount</code> makes your code compatible with both Token and Token-2022 programs.</p>

<h3>Minting with Token-2022</h3>
<pre><code class="language-rust">use anchor_spl::token_2022::mint_to;

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    token_2022::MintTo {
        mint: ctx.accounts.xp_mint.to_account_info(),
        to: ctx.accounts.user_ata.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    },
    signer_seeds,
);
mint_to(cpi_ctx, amount)?;</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/tokens/extensions" target="_blank">Token Extensions Docs</a></p>
`,
    },
    // ─── Lesson 3: Token Challenge ──────────────────────
    {
      title: "Create a Token Mint with PDA Authority",
      description:
        "Build a program that creates a token mint with a PDA as the mint authority.",
      type: "challenge",
      duration: "25 min",
      challenge: {
        prompt:
          "Create an instruction that initializes a token mint where the mint authority is a PDA derived from your program. Then create a mint_tokens instruction that uses the PDA signer.",
        objectives: [
          "Create a mint with PDA as authority using seeds constraint",
          "Implement mint_tokens using CpiContext::new_with_signer",
          "Use proper signer seeds with bump from ctx.bumps",
        ],
        starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, mint_to, MintTo};

declare_id!("11111111111111111111111111111111");

#[program]
mod token_factory {
    use super::*;

    pub fn create_mint(ctx: Context<CreateMint>) -> Result<()> {
        // Mint is auto-initialized by Anchor constraints
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        // TODO: Create signer seeds using ctx.bumps.mint_authority
        // TODO: CPI to mint_to with PDA signer
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // TODO: Add mint_authority PDA (seeds = [b"authority"], bump)
    // TODO: Add mint account (init, mint::decimals = 6, mint::authority = mint_authority)
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    // TODO: Add mint_authority PDA
    // TODO: Add mint (mut)
    // TODO: Add destination token account (mut)
    pub token_program: Program<'info, Token>,
}`,
        language: "rust",
        solution: `use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, mint_to, MintTo};

declare_id!("11111111111111111111111111111111");

#[program]
mod token_factory {
    use super::*;

    pub fn create_mint(ctx: Context<CreateMint>) -> Result<()> {
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let bump = ctx.bumps.mint_authority;
        let signer_seeds: &[&[&[u8]]] = &[&[b"authority", &[bump]]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        );
        mint_to(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"authority"], bump)]
    pub mint_authority: SystemAccount<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(seeds = [b"authority"], bump)]
    pub mint_authority: SystemAccount<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}`,
        hints: [
          "Derive mint_authority PDA with seeds = [b\"authority\"] and bump",
          "Access bump via ctx.bumps.mint_authority",
          "Use CpiContext::new_with_signer with signer_seeds",
        ],
        testCases: [
          {
            id: "tc-1",
            name: "PDA as mint authority",
            expectedOutput: "mint::authority = mint_authority",
            hidden: false,
          },
          {
            id: "tc-2",
            name: "CPI with signer seeds",
            expectedOutput: "new_with_signer",
            hidden: false,
          },
        ],
      },
    },
  ],
};
