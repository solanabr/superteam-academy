import { CourseModule } from "../anchor-course/types";

export const MODULE_CORE_EXTENSIONS: CourseModule = {
  title: "Core Token Extensions",
  description:
    "Essential Token-2022 extensions: non-transferable, transfer fees, memo, immutable owner, and more",
  lessons: [
    {
      title: "Token Extensions Overview",
      description: "Introduction to Token-2022 and the extension system",
      type: "content",
      content: `<h2>Token Extensions (Token-2022)</h2><p><strong>Token-2022</strong> is the next-generation token program on Solana. It's fully compatible with the original Token Program but adds <strong>extensions</strong> — configurable features built directly into mint and token accounts.</p><h3>Key Differences from Token Program</h3><ul><li><strong>Extensions</strong> — add features at mint creation (non-transferable, transfer fees, etc.)</li><li><strong>On-chain metadata</strong> — store name, symbol, URI directly on the mint</li><li><strong>Same interface</strong> — clients can use the same SPL Token instructions</li></ul><h3>Extension Categories</h3><ul><li><strong>Mint extensions</strong> — apply to all tokens of a mint (transfer fees, non-transferable)</li><li><strong>Account extensions</strong> — apply to individual token accounts (memo transfer, CPI guard)</li></ul><h3>Creating a Token with Extensions</h3><pre><code># Create with non-transferable extension
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --enable-non-transferable</code></pre>`,
      xp: 30,
    },
    {
      title: "Non-Transferable Tokens",
      description: "Create soulbound tokens that cannot be transferred between wallets",
      type: "content",
      content: `<h2>Non-Transferable Tokens</h2><p>Non-transferable tokens are <strong>soulbound</strong> — once minted to a wallet, they can never be transferred. Perfect for credentials, reputation, and XP tokens.</p><h3>Creating a Non-Transferable Mint</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --enable-non-transferable</code></pre><h3>JavaScript</h3><pre><code>import {
  createInitializeNonTransferableMintInstruction,
  ExtensionType, getMintLen, TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

const mintLen = getMintLen([ExtensionType.NonTransferable]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeNonTransferableMintInstruction(
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeMintInstruction(
    mint.publicKey, 0, mintAuthority, null,
    TOKEN_2022_PROGRAM_ID
  )
);</code></pre><h3>Use Cases</h3><ul><li><strong>XP tokens</strong> — learner progression (Superteam Academy uses this!)</li><li><strong>Badges</strong> — achievement tokens</li><li><strong>Credentials</strong> — course completion certificates</li><li><strong>Reputation</strong> — governance weight</li></ul>`,
      xp: 30,
    },
    {
      title: "Transfer Fees",
      description: "Apply protocol-level fees on every token transfer",
      type: "content",
      content: `<h2>Transfer Fees</h2><p>The transfer fee extension automatically charges a percentage on every token transfer, withheld in the recipient's account.</p><h3>Configuration</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --transfer-fee 100 10000
# 100 = 1% fee (basis points), 10000 = max fee (raw units)</code></pre><h3>How It Works</h3><ol><li>Fee is calculated as <code>amount × fee_basis_points / 10000</code></li><li>Fee is <strong>withheld</strong> in the destination token account</li><li>A <strong>withdraw authority</strong> can collect accumulated fees</li><li>Max fee caps the per-transfer fee amount</li></ol><h3>Collecting Fees</h3><pre><code>import { harvestWithheldTokensToMint, withdrawWithheldTokensFromMint } from "@solana/spl-token";

// Harvest withheld fees from accounts to mint
await harvestWithheldTokensToMint(connection, payer, mint, [account1, account2]);

// Withdraw collected fees from mint
await withdrawWithheldTokensFromMint(connection, payer, mint, destination, withdrawAuthority);</code></pre><h3>Use Cases</h3><ul><li>Protocol revenue</li><li>Royalties on fungible token trades</li><li>Tax or compliance fees</li></ul>`,
      xp: 30,
    },
    {
      title: "Memo Transfer",
      description: "Require a memo with every token transfer for compliance",
      type: "content",
      content: `<h2>Memo Transfer</h2><p>The memo transfer extension requires a <strong>memo instruction</strong> to accompany every transfer to or from the account. Useful for compliance and auditing.</p><h3>Enable Memo Transfer</h3><pre><code>import {
  createEnableRequiredMemoTransfersInstruction,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

const ix = createEnableRequiredMemoTransfersInstruction(
  tokenAccount,
  owner,
  [],
  TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Sending with Memo</h3><pre><code>import { createMemoInstruction } from "@solana/spl-memo";

const tx = new Transaction().add(
  createMemoInstruction("Payment for invoice #1234", [sender.publicKey]),
  createTransferInstruction(sourceATA, destATA, sender.publicKey, amount)
);</code></pre><h3>Key Points</h3><ul><li>Transfers without a memo will <strong>fail</strong></li><li>The memo must be signed by the sender</li><li>Can be <strong>disabled</strong> by the account owner using <code>DisableRequiredMemoTransfers</code></li><li>This is a <strong>token account</strong> extension (not a mint extension)</li></ul>`,
      xp: 30,
    },
    {
      title: "Immutable Owner",
      description: "Prevent the owner of a token account from being changed",
      type: "content",
      content: `<h2>Immutable Owner</h2><p>The immutable owner extension prevents a token account's owner from being changed. All <strong>ATAs automatically have this</strong> in Token-2022.</p><h3>Why It Matters</h3><p>Without immutable owner, the <code>SetAuthority</code> instruction could change a token account's owner — potentially moving someone's tokens to another wallet. Immutable owner prevents this.</p><pre><code>import { createInitializeImmutableOwnerInstruction } from "@solana/spl-token";

const ix = createInitializeImmutableOwnerInstruction(
  tokenAccount,
  TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Key Points</h3><ul><li>Must be initialized <strong>before</strong> the token account is initialized</li><li><strong>ATAs already have this</strong> — it's the default for Associated Token Accounts on Token-2022</li><li>Once set, <code>SetAuthority</code> for <code>AccountOwner</code> will fail</li><li>Protects users from token account ownership transfer attacks</li></ul>`,
      xp: 30,
    },
    {
      title: "Interest Bearing Tokens",
      description: "Tokens that accrue interest over time via a UI multiplier",
      type: "content",
      content: `<h2>Interest Bearing Tokens</h2><p>The interest-bearing extension applies a <strong>continuous compounding rate</strong> to display a time-adjusted balance without actually minting new tokens.</p><h3>How It Works</h3><ul><li>The actual token balance stays the same on-chain</li><li>A <strong>UI amount</strong> is calculated by multiplying by <code>e^(rate × time)</code></li><li>The rate is set by a <strong>rate authority</strong></li><li>No new tokens are minted — it's purely a display mechanism</li></ul><h3>Configuration</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --interest-rate 500
# 500 = 5% annual rate (basis points)</code></pre><h3>JavaScript</h3><pre><code>import { amountToUiAmount } from "@solana/spl-token";

// Get the time-adjusted UI amount
const uiAmount = await amountToUiAmount(
  connection,
  payer,
  mint,
  rawAmount,
  TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Use Cases</h3><ul><li>Savings products</li><li>Yield-bearing stablecoins</li><li>Bonds and fixed-income tokens</li></ul>`,
      xp: 30,
    },
  ],
};
