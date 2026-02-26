import { CourseModule } from "../anchor-course/types";

export const MODULE_ADVANCED_EXTENSIONS: CourseModule = {
  title: "Advanced Token Extensions",
  description:
    "Permanent delegate, close mint, token groups, CPI guard, default state, and specialized extensions",
  lessons: [
    {
      title: "Permanent Delegate",
      description: "A delegate that can always transfer or burn tokens regardless of owner",
      type: "content",
      content: `<h2>Permanent Delegate</h2><p>The permanent delegate extension assigns an authority that can <strong>always</strong> transfer or burn tokens from any account of this mint — regardless of the token account owner.</p><h3>Configuration</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --enable-permanent-delegate</code></pre><h3>JavaScript</h3><pre><code>import { createInitializePermanentDelegateInstruction } from "@solana/spl-token";

const ix = createInitializePermanentDelegateInstruction(
  mint.publicKey,
  permanentDelegate,   // the permanent delegate authority
  TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Use Cases</h3><ul><li><strong>Soulbound tokens</strong> — combined with NonTransferable, the delegate can burn tokens the user cannot</li><li><strong>Compliance</strong> — ability to claw back or freeze tokens</li><li><strong>Gaming</strong> — game authority can manage in-game assets</li></ul><h3>Security Note</h3><p>This is a <strong>powerful</strong> extension. The permanent delegate has unlimited transfer/burn authority on all accounts of this mint. Use with care and clear documentation.</p>`,
      xp: 30,
    },
    {
      title: "Default Account State",
      description: "Set the default state (frozen/initialized) for all new token accounts",
      type: "content",
      content: `<h2>Default Account State</h2><p>This extension sets the <strong>default state</strong> of all newly created token accounts for a mint — either <code>Initialized</code> or <code>Frozen</code>.</p><h3>Configuration</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --default-account-state frozen</code></pre><h3>How It Works</h3><ul><li>Set to <code>Frozen</code> → all new accounts start frozen</li><li>The freeze authority must <strong>thaw</strong> each account before it can transact</li><li>Enables <strong>KYC/AML workflows</strong> — users create accounts but must be approved before using them</li></ul><h3>JavaScript</h3><pre><code>import {
  createInitializeDefaultAccountStateInstruction,
  AccountState
} from "@solana/spl-token";

const ix = createInitializeDefaultAccountStateInstruction(
  mint.publicKey,
  AccountState.Frozen,
  TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Use Cases</h3><ul><li>KYC-gated tokens</li><li>Regulated assets (securities)</li><li>Controlled distribution</li></ul>`,
      xp: 30,
    },
    {
      title: "Close Mint",
      description: "Close a mint account to reclaim rent when supply is zero",
      type: "content",
      content: `<h2>Close Mint</h2><p>Normally, mint accounts <strong>cannot be closed</strong>. The close-mint extension enables closing a mint account when total supply is zero.</p><h3>Configuration</h3><pre><code>spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \\
  --enable-close</code></pre><h3>Requirements</h3><ul><li>Total supply must be <strong>exactly 0</strong> (burn all tokens first)</li><li>Only the <strong>close authority</strong> can close the mint</li><li>Rent lamports are returned to a specified destination</li></ul><h3>JavaScript</h3><pre><code>import { closeAccount } from "@solana/spl-token";

// Close the mint (supply must be 0)
await closeAccount(
  connection,
  payer,
  mint,             // mint account to close
  destination,      // where to send lamports
  closeAuthority,   // close authority signer
  [],
  undefined,
  TOKEN_2022_PROGRAM_ID
);</code></pre>`,
      xp: 30,
    },
    {
      title: "Token Groups & Members",
      description: "Group related tokens together on-chain without NFT collections",
      type: "content",
      content: `<h2>Token Groups & Members</h2><p>The group/member extension creates on-chain relationships between token mints — similar to NFT collections but for any token type.</p><h3>Group Mint</h3><pre><code>import {
  createInitializeGroupInstruction,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

const ix = createInitializeGroupInstruction({
  group: groupMint,
  mint: groupMint,
  mintAuthority: authority,
  updateAuthority: authority,
  maxSize: 100,         // max members
  programId: TOKEN_2022_PROGRAM_ID,
});</code></pre><h3>Member Mint</h3><pre><code>import { createInitializeMemberInstruction } from "@solana/spl-token";

const ix = createInitializeMemberInstruction({
  member: memberMint,
  memberMint: memberMint,
  group: groupMint,
  groupUpdateAuthority: authority,
  programId: TOKEN_2022_PROGRAM_ID,
});</code></pre><h3>Use Cases</h3><ul><li>Grouping related fungible tokens</li><li>On-chain token categorization</li><li>DAOs with multiple governance tokens</li></ul>`,
      xp: 30,
    },
    {
      title: "CPI Guard",
      description: "Protect token accounts from unauthorized CPI actions",
      type: "content",
      content: `<h2>CPI Guard</h2><p>CPI Guard prevents certain token operations from being performed via Cross-Program Invocations. This protects users from malicious programs that use CPI to move their tokens.</p><h3>What CPI Guard Blocks</h3><ul><li><strong>Transfer</strong> — cannot transfer tokens via CPI</li><li><strong>Burn</strong> — cannot burn tokens via CPI</li><li><strong>Approve</strong> — cannot approve delegates via CPI</li><li><strong>Close</strong> — cannot close the account via CPI</li><li><strong>SetAuthority</strong> — cannot change owner via CPI</li></ul><h3>Enable/Disable</h3><pre><code>import {
  createEnableCpiGuardInstruction,
  createDisableCpiGuardInstruction
} from "@solana/spl-token";

// Enable CPI Guard
const enableIx = createEnableCpiGuardInstruction(
  tokenAccount, owner, [], TOKEN_2022_PROGRAM_ID
);

// Disable CPI Guard
const disableIx = createDisableCpiGuardInstruction(
  tokenAccount, owner, [], TOKEN_2022_PROGRAM_ID
);</code></pre><h3>Key Points</h3><ul><li>CPI Guard is a <strong>token account</strong> extension (per-account)</li><li>The account <strong>owner</strong> can enable/disable it</li><li>Top-level instructions (not via CPI) are <strong>not affected</strong></li></ul>`,
      xp: 30,
    },
    {
      title: "Confidential Transfers",
      description: "Private token transfers with encrypted balances using zero-knowledge proofs",
      type: "content",
      content: `<h2>Confidential Transfers</h2><p>Confidential transfers encrypt token balances and amounts using <strong>ElGamal encryption</strong> and <strong>zero-knowledge proofs</strong>. Balances and transfer amounts are hidden from public view.</p><h3>How It Works</h3><ol><li><strong>Create mint</strong> with confidential transfer extension</li><li><strong>Configure accounts</strong> — generate ElGamal keypair per token account</li><li><strong>Deposit</strong> — move tokens from public to confidential balance</li><li><strong>Transfer</strong> — send between confidential balances (amounts hidden)</li><li><strong>Apply pending</strong> — merge incoming transfers to available balance</li><li><strong>Withdraw</strong> — move from confidential back to public</li></ol><h3>Key Concepts</h3><ul><li><strong>Public balance</strong> — visible on-chain (normal SPL token)</li><li><strong>Pending balance</strong> — incoming confidential transfers (encrypted)</li><li><strong>Available balance</strong> — spendable confidential balance (encrypted)</li><li><strong>ElGamal keypair</strong> — per-account encryption keys</li></ul><h3>Limitations</h3><ul><li>Requires client-side proof generation (computationally expensive)</li><li>Each confidential transfer requires ZK proofs</li><li>Auditor key can optionally decrypt for compliance</li></ul><p>This extension brings <strong>privacy</strong> to Solana tokens while maintaining on-chain verifiability.</p>`,
      xp: 30,
    },
    {
      title: "Scaled UI Amount",
      description: "Display scaled token amounts without changing on-chain balances",
      type: "content",
      content: `<h2>Scaled UI Amount</h2><p>The scaled UI amount extension applies a <strong>multiplier</strong> to the raw token balance for display purposes, without modifying on-chain data.</p><h3>How It Works</h3><ul><li>On-chain balance stays the same</li><li>A <strong>multiplier</strong> is applied when displaying to users</li><li>Useful for share-based tokens where the value per share changes</li></ul><h3>Configuration</h3><pre><code>// The multiplier can be updated by the authority
// UI Amount = raw_amount × multiplier

// Example: 1000 raw tokens with multiplier 1.5
// Displayed as 1500 tokens</code></pre><h3>Roles</h3><ul><li><strong>Issuer</strong> — sets and updates the multiplier</li><li><strong>Integrator</strong> — reads the multiplier to display correct UI amounts</li></ul><h3>Use Cases</h3><ul><li>Yield-bearing stablecoins (stUSD, etc.)</li><li>Rebasing tokens</li><li>Share-to-asset conversions (like stETH)</li></ul><h3>Integration</h3><pre><code>// Fetch the multiplier
const mintInfo = await getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
const extension = getScaledUiAmountConfig(mintInfo);
const uiAmount = rawAmount * extension.multiplier;</code></pre>`,
      xp: 30,
    },
    {
      title: "Token Extensions Quiz",
      description: "Test your understanding of Token-2022 extensions",
      type: "quiz",
      content: null,
      xp: 30,
      quiz: {
        questions: [
          {
            question: "What does the NonTransferable extension do?",
            options: [
              "Prevents minting new tokens",
              "Makes tokens soulbound — they cannot be transferred",
              "Adds transfer fees to every transaction",
              "Freezes all token accounts",
            ],
            correctAnswer: 1,
          },
          {
            question: "How do transfer fees work in Token-2022?",
            options: [
              "Fees are deducted from the sender's SOL balance",
              "Fees are withheld in the recipient's token account",
              "Fees are burned automatically",
              "Fees are sent to the mint authority",
            ],
            correctAnswer: 1,
          },
          {
            question: "What does CPI Guard protect against?",
            options: [
              "Unauthorized token operations performed via Cross-Program Invocation",
              "Unauthorized program deployments",
              "Account creation by non-owners",
              "Rent exemption attacks",
            ],
            correctAnswer: 0,
          },
          {
            question: "Which extension uses ElGamal encryption and zero-knowledge proofs?",
            options: [
              "CPI Guard",
              "Non-Transferable",
              "Confidential Transfers",
              "Permanent Delegate",
            ],
            correctAnswer: 2,
          },
        ],
        passingScore: 75,
      },
    },
  ],
};
