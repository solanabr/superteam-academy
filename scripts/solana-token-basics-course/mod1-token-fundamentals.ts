import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_FUNDAMENTALS: CourseModule = {
  title: "SPL Token Fundamentals",
  description:
    "Understand the Solana token model and create your first token mint and accounts",
  lessons: [
    {
      title: "Tokens on Solana Overview",
      description: "How tokens work on Solana — mint accounts, token accounts, and ATAs",
      type: "content",
      content: `<h2>Tokens on Solana</h2><p>Solana tokens are managed by two programs: the original <strong>Token Program</strong> (SPL Token) and the newer <strong>Token-2022</strong> (Token Extensions Program). Both follow the same core model.</p><h3>Token Model</h3><ul><li><strong>Mint Account</strong> — defines the token (supply, decimals, authorities)</li><li><strong>Token Account</strong> — holds a specific token balance for a specific owner</li><li><strong>Associated Token Account (ATA)</strong> — deterministic token account derived from owner + mint</li></ul><h3>How It Works</h3><pre><code>Mint Account (defines the token)
  ├─ Token Account A (Alice: 100 tokens)
  ├─ Token Account B (Bob: 50 tokens)
  └─ Token Account C (Carol: 200 tokens)</code></pre><p>Each wallet can have one <strong>ATA</strong> per token mint — a deterministic address that anyone can derive.</p><h3>Token Programs</h3><ul><li><strong>Token Program</strong> — original SPL token program, basic functionality</li><li><strong>Token-2022</strong> — superset with extensions (transfer fees, non-transferable, etc.)</li></ul>`,
      xp: 30,
    },
    {
      title: "SPL Token Basics",
      description: "Introduction to the SPL Token standard and its operations",
      type: "content",
      content: `<h2>SPL Token Basics</h2><p>The SPL Token program provides core operations for fungible and non-fungible tokens on Solana.</p><h3>Key Concepts</h3><ul><li><strong>Decimals</strong> — defines the smallest unit (e.g., 9 decimals means 1 token = 1,000,000,000 units)</li><li><strong>Mint Authority</strong> — can create new tokens</li><li><strong>Freeze Authority</strong> — can freeze/thaw token accounts</li><li><strong>Supply</strong> — total tokens minted</li></ul><h3>CLI Quickstart</h3><pre><code># Create a new token
spl-token create-token

# Create a token account
spl-token create-account &lt;TOKEN_MINT&gt;

# Mint tokens
spl-token mint &lt;TOKEN_MINT&gt; 100

# Check balance
spl-token balance &lt;TOKEN_MINT&gt;

# Transfer
spl-token transfer &lt;TOKEN_MINT&gt; 10 &lt;RECIPIENT&gt;</code></pre><h3>Token Account Fields</h3><pre><code>TokenAccount {
  mint: Pubkey,       // which token
  owner: Pubkey,      // who owns this balance
  amount: u64,        // token balance
  delegate: Option&lt;Pubkey&gt;,
  state: AccountState, // initialized / frozen
  close_authority: Option&lt;Pubkey&gt;,
}</code></pre>`,
      xp: 30,
    },
    {
      title: "Create a Token Mint",
      description: "Create a new token with decimals, mint authority, and optional freeze authority",
      type: "content",
      content: `<h2>Create a Token Mint</h2><p>A <strong>mint account</strong> is the on-chain definition of a token. It stores the decimal precision, total supply, and authorities.</p><h3>CLI</h3><pre><code># Create with default 9 decimals
spl-token create-token

# Create with specific decimals
spl-token create-token --decimals 6

# Create with Token-2022
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code></pre><h3>JavaScript (@solana/spl-token)</h3><pre><code>import { createMint } from "@solana/spl-token";

const mint = await createMint(
  connection,
  payer,           // fee payer
  mintAuthority,   // who can mint
  freezeAuthority, // who can freeze (null for no freeze)
  9                // decimals
);
console.log("Mint:", mint.toBase58());</code></pre><h3>Mint Account Layout</h3><pre><code>MintAccount {
  mint_authority: Option&lt;Pubkey&gt;,  // can mint new tokens
  supply: u64,                     // total minted
  decimals: u8,                    // decimal places
  is_initialized: bool,
  freeze_authority: Option&lt;Pubkey&gt;, // can freeze accounts
}</code></pre>`,
      xp: 30,
    },
    {
      title: "Create a Token Account",
      description: "Create token accounts and Associated Token Accounts (ATAs)",
      type: "content",
      content: `<h2>Create a Token Account</h2><p>A token account holds a balance of a specific token for a specific owner.</p><h3>Associated Token Account (ATA)</h3><p>ATAs are the standard — deterministic addresses derived from owner + mint:</p><pre><code>import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,                // token mint
  owner.publicKey      // token account owner
);
console.log("ATA:", ata.address.toBase58());</code></pre><h3>CLI</h3><pre><code># Create ATA for your wallet
spl-token create-account &lt;MINT_ADDRESS&gt;

# Create ATA for another wallet
spl-token create-account &lt;MINT_ADDRESS&gt; --owner &lt;WALLET_ADDRESS&gt;</code></pre><h3>Deriving ATA Address</h3><pre><code>import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const ata = getAssociatedTokenAddressSync(
  mint,           // token mint
  owner,          // wallet that owns the ATA
  false,          // allowOwnerOffCurve
  TOKEN_PROGRAM_ID
);</code></pre><p>ATAs are PDAs derived from:<br/><code>seeds = [owner, TOKEN_PROGRAM_ID, mint]</code></p>`,
      xp: 30,
    },
    {
      title: "Mint Tokens",
      description: "Mint new tokens to a token account using the mint authority",
      type: "content",
      content: `<h2>Mint Tokens</h2><p>Only the <strong>mint authority</strong> can create new tokens. Minted tokens are added to a specific token account.</p><h3>CLI</h3><pre><code># Mint 100 tokens to your ATA
spl-token mint &lt;MINT_ADDRESS&gt; 100

# Mint to a specific account
spl-token mint &lt;MINT_ADDRESS&gt; 100 &lt;TOKEN_ACCOUNT&gt;</code></pre><h3>JavaScript</h3><pre><code>import { mintTo } from "@solana/spl-token";

const signature = await mintTo(
  connection,
  payer,           // fee payer
  mint,            // token mint
  destination,     // token account to receive
  mintAuthority,   // signer with mint authority
  1_000_000_000    // amount (raw units, not UI amount)
);</code></pre><h3>Anchor (CPI)</h3><pre><code>let cpi_accounts = MintTo {
    mint: ctx.accounts.mint.to_account_info(),
    to: ctx.accounts.token_account.to_account_info(),
    authority: ctx.accounts.mint_authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
token::mint_to(cpi_ctx, amount)?;</code></pre><p>Remember: amounts are in <strong>raw units</strong>. For a token with 9 decimals, 1 token = 1,000,000,000 raw units.</p>`,
      xp: 30,
    },
    {
      title: "Transfer Tokens",
      description: "Transfer tokens between accounts",
      type: "content",
      content: `<h2>Transfer Tokens</h2><p>Transfer tokens from one token account to another. The source account's owner must sign.</p><h3>CLI</h3><pre><code># Transfer 10 tokens
spl-token transfer &lt;MINT_ADDRESS&gt; 10 &lt;RECIPIENT_WALLET&gt;

# Create recipient ATA if needed
spl-token transfer &lt;MINT_ADDRESS&gt; 10 &lt;RECIPIENT_WALLET&gt; --fund-recipient</code></pre><h3>JavaScript</h3><pre><code>import { transfer } from "@solana/spl-token";

const signature = await transfer(
  connection,
  payer,          // fee payer
  sourceATA,      // source token account
  destinationATA, // destination token account
  owner,          // owner of source account (signer)
  1_000_000_000   // amount in raw units
);</code></pre><h3>Key Points</h3><ul><li>Both source and destination must be <strong>token accounts for the same mint</strong></li><li>Destination account must <strong>already exist</strong> (or use <code>--fund-recipient</code>)</li><li>The source account <strong>owner</strong> must sign (or an approved delegate)</li><li>Cannot transfer to a <strong>frozen</strong> token account</li></ul>`,
      xp: 30,
    },
  ],
};
