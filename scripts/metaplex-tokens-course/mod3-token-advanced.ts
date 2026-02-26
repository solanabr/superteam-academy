import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_ADVANCED: CourseModule = {
  title: "Advanced Token Operations",
  description:
    "Launch tokens using Genesis Launch Pools, create tokens with Anchor/Rust, and test your knowledge.",
  lessons: [
    {
      title: "Launch a Token (Genesis Launch Pools)",
      description:
        "Run a Token Generation Event (TGE) or fair launch on Solana using Metaplex Genesis.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Launch a Token on Solana</h2>
<p>Metaplex <strong>Genesis</strong> provides Launch Pools — a mechanism for fair token launches where users deposit SOL during a time window and receive tokens proportional to their share of total deposits.</p>

<h3>Three Phases</h3>
<ol>
  <li><strong>Setup</strong> — Create the token, configure the launch, and activate it</li>
  <li><strong>Deposit Period</strong> — Users deposit SOL during the configured window</li>
  <li><strong>Post-Launch</strong> — Execute the transition, users claim tokens, you revoke authorities</li>
</ol>

<h3>Prerequisites</h3>
<pre><code>npm install @metaplex-foundation/genesis \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults \\
  @metaplex-foundation/mpl-token-metadata \\
  @metaplex-foundation/mpl-toolbox</code></pre>

<h3>Script 1: launch.ts — Create & Activate</h3>
<pre><code>import {
  createLaunchPool,
  activateLaunchPool,
} from '@metaplex-foundation/genesis'
import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  some,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())

// Load wallet...
const mint = generateSigner(umi)

// 1. Create token
await createFungible(umi, {
  mint,
  name: 'Launch Token',
  symbol: 'LTK',
  uri: 'https://example.com/metadata.json',
  sellerFeeBasisPoints: percentAmount(0),
  decimals: some(9),
}).sendAndConfirm(umi)

// 2. Create launch pool
const launchPool = generateSigner(umi)
await createLaunchPool(umi, {
  launchPool,
  mint: mint.publicKey,
  depositStartTime: Math.floor(Date.now() / 1000) + 60,
  depositEndTime: Math.floor(Date.now() / 1000) + 86400,
  vestingDuration: 0,
  tokenSupply: 1_000_000_000_000_000,
}).sendAndConfirm(umi)

// 3. Activate
await activateLaunchPool(umi, {
  launchPool: launchPool.publicKey,
}).sendAndConfirm(umi)</code></pre>

<h3>Script 2: transition.ts — Post-Deposit</h3>
<p>After the deposit window closes, execute the transition to finalize the launch:</p>
<pre><code>import { transitionLaunchPool } from '@metaplex-foundation/genesis'

await transitionLaunchPool(umi, {
  launchPool: launchPoolAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Script 3: claim.ts — Users Claim Tokens</h3>
<pre><code>import { claimTokens } from '@metaplex-foundation/genesis'

await claimTokens(umi, {
  launchPool: launchPoolAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Script 4: revoke.ts — Revoke Authorities</h3>
<p>After launch is complete, revoke mint and freeze authorities to make the token fully decentralized:</p>
<pre><code>import { revokeAuthority } from '@metaplex-foundation/genesis'

await revokeAuthority(umi, {
  mint: mintAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Key Considerations</h3>
<ul>
  <li>Launch pools handle SOL escrow and proportional distribution automatically</li>
  <li>Vesting can be configured for gradual token release</li>
  <li>Always test on devnet before mainnet launches</li>
  <li>Revoking authorities is irreversible — supply becomes permanently fixed</li>
</ul>
`,
    },
    {
      title: "Create a Token with Anchor (Rust)",
      description:
        "Build an Anchor program that creates a fungible token with metadata via CPI to the Token Metadata program.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Create a Token with Rust & Anchor</h2>
<p>This guide demonstrates creating a fungible token on-chain using an <strong>Anchor program</strong> that makes CPIs to the SPL Token and Metaplex Token Metadata programs.</p>

<h3>What You'll Build</h3>
<p>A single Anchor instruction that:</p>
<ol>
  <li>Creates a new SPL token mint</li>
  <li>Creates the associated token account for the payer</li>
  <li>Creates a metadata account with name, symbol, and URI</li>
  <li>Mints an initial token supply to the payer</li>
</ol>

<h3>Setup</h3>
<pre><code>anchor init anchor-spl-token
cd anchor-spl-token</code></pre>

<p>Add dependencies to <code>Cargo.toml</code>:</p>
<pre><code>[dependencies]
anchor-lang = "0.32.1"
anchor-spl = { version = "0.32.1", features = ["metadata"] }
mpl-token-metadata = "5.0.0-beta.1"</code></pre>

<h3>Program Code</h3>
<pre><code>use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3,
        CreateMetadataAccountsV3,
        Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::types::DataV2;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod anchor_spl_token {
    use super::*;

    pub fn create_token(
        ctx: Context&lt;CreateToken&gt;,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        supply: u64,
    ) -> Result&lt;()&gt; {
        // Create metadata account
        let data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        create_metadata_accounts_v3(
            CpiContext::new(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.payer.to_account_info(),
                    update_authority: ctx.accounts.payer.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            data,
            true,  // is_mutable
            true,  // update_authority_is_signer
            None,  // collection_details
        )?;

        // Mint initial supply
        mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            supply,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateToken&lt;'info&gt; {
    #[account(mut)]
    pub payer: Signer&lt;'info&gt;,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = payer,
    )]
    pub mint: Account&lt;'info, Mint&gt;,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account&lt;'info, TokenAccount&gt;,

    /// CHECK: Metadata PDA validated by Token Metadata program
    #[account(mut)]
    pub metadata: UncheckedAccount&lt;'info&gt;,

    pub token_program: Program&lt;'info, Token&gt;,
    pub associated_token_program: Program&lt;'info, AssociatedToken&gt;,
    pub metadata_program: Program&lt;'info, Metadata&gt;,
    pub system_program: Program&lt;'info, System&gt;,
    pub rent: Sysvar&lt;'info, Rent&gt;,
}</code></pre>

<h3>Testing</h3>
<p>Clone the Token Metadata program for local testing in <code>Anchor.toml</code>:</p>
<pre><code>[test.validator]
url = "https://api.mainnet-beta.solana.com"

[[test.validator.clone]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"</code></pre>

<h3>Key Takeaways</h3>
<ul>
  <li>Use <code>anchor-spl</code> with the <code>metadata</code> feature for Token Metadata CPI helpers</li>
  <li>The metadata PDA is derived as <code>["metadata", TOKEN_METADATA_ID, mint]</code></li>
  <li>Clone the Token Metadata program in Anchor.toml for local testing</li>
  <li>This pattern works for fungible tokens; NFTs need a Master Edition account</li>
</ul>
`,
    },
    {
      title: "Token Operations Quiz",
      description:
        "Test your knowledge of creating, minting, transferring, and managing tokens on Solana.",
      type: "quiz",
      duration: "10 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question:
              "Which Metaplex program stores a token's name, symbol, and URI on-chain?",
            options: [
              "SPL Token Program",
              "Token Metadata Program",
              "Associated Token Program",
              "Token-2022 Program",
            ],
            correctIndex: 1,
            explanation:
              "The Token Metadata program creates a Metadata PDA linked to each mint that stores name, symbol, URI, and other metadata.",
          },
          {
            question:
              "What does the `createTokenIfMissing` helper do?",
            options: [
              "Creates a new mint account",
              "Creates the recipient's ATA if it doesn't exist",
              "Burns tokens if the account is empty",
              "Validates the token metadata",
            ],
            correctIndex: 1,
            explanation:
              "createTokenIfMissing ensures the Associated Token Account exists for the given mint and owner. If it already exists, it's a no-op.",
          },
          {
            question:
              "With 9 decimals, how many raw units represent 1 token?",
            options: [
              "1,000",
              "1,000,000",
              "1,000,000,000",
              "1,000,000,000,000",
            ],
            correctIndex: 2,
            explanation:
              "With 9 decimal places, 1 token = 10^9 = 1,000,000,000 raw units.",
          },
          {
            question: "Who can update a token's metadata?",
            options: [
              "Any wallet",
              "The mint authority",
              "The update authority",
              "The token holder",
            ],
            correctIndex: 2,
            explanation:
              "Only the update authority (set during token creation) can modify the metadata. This is separate from the mint authority.",
          },
          {
            question:
              "What happens when you burn tokens?",
            options: [
              "They are sent to a treasury wallet",
              "They are locked for 30 days",
              "They are permanently destroyed, reducing supply",
              "They are converted to SOL",
            ],
            correctIndex: 2,
            explanation:
              "Burning permanently destroys tokens, reducing the circulating supply. This action cannot be undone.",
          },
          {
            question:
              "In a Genesis Launch Pool, how are tokens distributed to depositors?",
            options: [
              "First come, first served",
              "Equal amounts to all participants",
              "Proportional to their share of total SOL deposits",
              "Random lottery",
            ],
            correctIndex: 2,
            explanation:
              "Genesis Launch Pools distribute tokens proportional to each user's share of the total SOL deposited during the deposit window.",
          },
          {
            question:
              "Which Cargo dependency is needed for Token Metadata CPI in Anchor?",
            options: [
              "anchor-spl with 'metadata' feature",
              "spl-token-2022",
              "mpl-core",
              "solana-program",
            ],
            correctIndex: 0,
            explanation:
              "Use anchor-spl with the 'metadata' feature flag to get CPI helpers for the Metaplex Token Metadata program.",
          },
        ],
      },
    },
    {
      title: "Create & Mint a Token",
      description:
        "Build a script that creates a fungible token with metadata and mints an initial supply.",
      type: "challenge",
      duration: "20 min",
      challenge: {
        prompt:
          "Create a TypeScript script using the Umi SDK that: (1) Creates a fungible token with custom name, symbol, URI, and 6 decimals, (2) Mints 1,000,000 tokens to your wallet, (3) Logs the mint address.",
        objectives: [
          "Initialize Umi with mplTokenMetadata plugin",
          "Use createFungible to create a token with 6 decimals",
          "Use mintTokensTo to mint 1,000,000 tokens (accounting for 6 decimals)",
          "Log the mint public key",
        ],
        starterCode: `import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  some,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

// TODO: Initialize Umi with devnet RPC and mplTokenMetadata plugin

// TODO: Generate a mint signer

// TODO: Create a fungible token with:
//   name: "Academy Token"
//   symbol: "ACAD"
//   uri: "https://example.com/acad.json"
//   decimals: 6

// TODO: Mint 1,000,000 tokens to your wallet

// TODO: Log the mint address
`,
        language: "typescript",
        solution: `import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  some,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())

const mint = generateSigner(umi)

await createFungible(umi, {
  mint,
  name: 'Academy Token',
  symbol: 'ACAD',
  uri: 'https://example.com/acad.json',
  sellerFeeBasisPoints: percentAmount(0),
  decimals: some(6),
}).sendAndConfirm(umi)

await createTokenIfMissing(umi, {
  mint: mint.publicKey,
  owner: umi.identity.publicKey,
})
.add(
  mintTokensTo(umi, {
    mint: mint.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mint.publicKey,
      owner: umi.identity.publicKey,
    }),
    amount: 1_000_000_000_000, // 1M tokens with 6 decimals
  })
)
.sendAndConfirm(umi)

console.log('Token created:', mint.publicKey)`,
        hints: [
          "With 6 decimals, 1 million tokens = 1_000_000 * 10^6 = 1_000_000_000_000",
          "Use some(6) to set decimals in createFungible",
          "Don't forget to call .sendAndConfirm(umi) on each transaction",
        ],
        testCases: [
          {
            id: "tc1",
            name: "Creates fungible token",
            expectedOutput: "Token created:",
          },
        ],
      },
    },
  ],
};
