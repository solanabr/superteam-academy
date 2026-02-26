import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_MANAGEMENT: CourseModule = {
  title: "Token Management",
  description:
    "Delegate, revoke, burn, freeze, and manage token accounts and authorities",
  lessons: [
    {
      title: "Approve Delegate",
      description: "Authorize another account to transfer or burn tokens on your behalf",
      type: "content",
      content: `<h2>Approve Delegate</h2><p>A <strong>delegate</strong> is an account authorized to transfer or burn tokens from your token account, up to a specified amount.</p><h3>CLI</h3><pre><code># Approve a delegate for 50 tokens
spl-token approve &lt;TOKEN_ACCOUNT&gt; 50 &lt;DELEGATE_ADDRESS&gt;</code></pre><h3>JavaScript</h3><pre><code>import { approve } from "@solana/spl-token";

await approve(
  connection,
  payer,
  tokenAccount,    // your token account
  delegate,        // address to authorize
  owner,           // owner of token account (signer)
  100_000_000      // max amount delegate can use
);</code></pre><h3>How It Works</h3><ul><li>Delegate can transfer up to the approved amount</li><li>Delegate can burn up to the approved amount</li><li>Delegated amount <strong>decreases</strong> with each use</li><li>Only <strong>one delegate</strong> per token account at a time</li><li>Setting a new delegate replaces the previous one</li></ul>`,
      xp: 30,
    },
    {
      title: "Revoke Delegate",
      description: "Remove a delegate's authorization from your token account",
      type: "content",
      content: `<h2>Revoke Delegate</h2><p>Revoke removes a previously approved delegate's permission to transfer or burn tokens.</p><h3>CLI</h3><pre><code>spl-token revoke &lt;TOKEN_ACCOUNT&gt;</code></pre><h3>JavaScript</h3><pre><code>import { revoke } from "@solana/spl-token";

await revoke(
  connection,
  payer,
  tokenAccount,   // token account with delegate
  owner           // owner of the token account (signer)
);</code></pre><h3>Key Points</h3><ul><li>Sets the delegate to <code>None</code> and delegated amount to <code>0</code></li><li>Only the <strong>owner</strong> of the token account can revoke</li><li>Always revoke delegates you no longer need for security</li></ul>`,
      xp: 30,
    },
    {
      title: "Set Authority",
      description: "Change or revoke the mint authority and freeze authority",
      type: "content",
      content: `<h2>Set Authority</h2><p>Use <code>SetAuthority</code> to change or permanently revoke the mint authority or freeze authority of a token.</p><h3>CLI</h3><pre><code># Change mint authority
spl-token authorize &lt;MINT_ADDRESS&gt; mint &lt;NEW_AUTHORITY&gt;

# Revoke mint authority (no more tokens can be minted)
spl-token authorize &lt;MINT_ADDRESS&gt; mint --disable

# Change freeze authority
spl-token authorize &lt;MINT_ADDRESS&gt; freeze &lt;NEW_AUTHORITY&gt;</code></pre><h3>JavaScript</h3><pre><code>import { setAuthority, AuthorityType } from "@solana/spl-token";

// Transfer mint authority
await setAuthority(
  connection,
  payer,
  mint,
  currentAuthority,                // signer
  AuthorityType.MintTokens,        // which authority
  newAuthority                     // new authority pubkey (null to revoke)
);</code></pre><h3>Authority Types</h3><ul><li><code>MintTokens</code> — can mint new tokens</li><li><code>FreezeAccount</code> — can freeze/thaw token accounts</li><li><code>AccountOwner</code> — owner of a token account</li><li><code>CloseAccount</code> — can close a token account</li></ul><p><strong>Warning:</strong> Revoking mint authority is <strong>irreversible</strong>. No more tokens can ever be minted.</p>`,
      xp: 30,
    },
    {
      title: "Burn Tokens",
      description: "Permanently destroy tokens to reduce supply",
      type: "content",
      content: `<h2>Burn Tokens</h2><p>Burning permanently removes tokens from circulation by reducing the supply.</p><h3>CLI</h3><pre><code># Burn 50 tokens
spl-token burn &lt;TOKEN_ACCOUNT&gt; 50</code></pre><h3>JavaScript</h3><pre><code>import { burn } from "@solana/spl-token";

await burn(
  connection,
  payer,
  tokenAccount,    // account to burn from
  mint,            // token mint
  owner,           // owner of token account (signer)
  50_000_000_000   // amount in raw units
);</code></pre><h3>Key Points</h3><ul><li>Only the <strong>owner</strong> (or approved delegate) can burn</li><li>Burns reduce the token account balance AND the mint's total supply</li><li>Burned tokens are <strong>permanently destroyed</strong></li></ul>`,
      xp: 30,
    },
    {
      title: "Sync Native",
      description: "Wrap SOL into a token account for use with the SPL Token program",
      type: "content",
      content: `<h2>Sync Native</h2><p><strong>Wrapped SOL</strong> lets you use native SOL as an SPL token. The <code>syncNative</code> instruction updates a native SOL token account's balance to reflect its lamport balance.</p><h3>How It Works</h3><p>The Native Mint represents SOL as a token: <code>So11111111111111111111111111111111111111112</code></p><pre><code>import { NATIVE_MINT, syncNative, createSyncNativeInstruction } from "@solana/spl-token";

// 1. Create an ATA for the native mint
const ata = await getOrCreateAssociatedTokenAccount(
  connection, payer, NATIVE_MINT, owner.publicKey
);

// 2. Transfer SOL to the ATA
const transferIx = SystemProgram.transfer({
  fromPubkey: owner.publicKey,
  toPubkey: ata.address,
  lamports: 1_000_000_000, // 1 SOL
});

// 3. Sync native to update the token balance
const syncIx = createSyncNativeInstruction(ata.address);</code></pre><h3>Use Cases</h3><ul><li>DEX swaps that expect SPL tokens</li><li>Programs that only handle SPL token transfers</li><li>Unified token handling in DeFi protocols</li></ul>`,
      xp: 30,
    },
    {
      title: "Close Token Account",
      description: "Close empty token accounts to reclaim rent SOL",
      type: "content",
      content: `<h2>Close Token Account</h2><p>Closing a token account reclaims the <strong>rent-exempt SOL</strong> (~0.002 SOL) back to the owner.</p><h3>CLI</h3><pre><code># Close a specific token account
spl-token close --address &lt;TOKEN_ACCOUNT&gt;

# Close all empty token accounts
spl-token close --all</code></pre><h3>JavaScript</h3><pre><code>import { closeAccount } from "@solana/spl-token";

await closeAccount(
  connection,
  payer,
  tokenAccount,    // account to close
  destination,     // where to send remaining lamports
  owner            // owner of the token account (signer)
);</code></pre><h3>Requirements</h3><ul><li>Token account balance must be <strong>0</strong> (burn or transfer all tokens first)</li><li>Only the <strong>owner</strong> (or close authority) can close</li><li>Lamports are sent to the <strong>destination</strong> address</li></ul>`,
      xp: 30,
    },
    {
      title: "Freeze & Thaw Account",
      description: "Freeze and unfreeze token accounts to prevent transfers",
      type: "content",
      content: `<h2>Freeze & Thaw Account</h2><p>The <strong>freeze authority</strong> can freeze a token account, preventing all transfers in and out.</p><h3>Freeze</h3><pre><code>import { freezeAccount } from "@solana/spl-token";

await freezeAccount(
  connection,
  payer,
  tokenAccount,      // account to freeze
  mint,              // token mint
  freezeAuthority    // signer with freeze authority
);</code></pre><h3>Thaw</h3><pre><code>import { thawAccount } from "@solana/spl-token";

await thawAccount(
  connection,
  payer,
  tokenAccount,      // account to thaw
  mint,              // token mint
  freezeAuthority    // signer with freeze authority
);</code></pre><h3>CLI</h3><pre><code># Freeze
spl-token freeze &lt;TOKEN_ACCOUNT&gt;

# Thaw
spl-token thaw &lt;TOKEN_ACCOUNT&gt;</code></pre><h3>Key Points</h3><ul><li>Only the <strong>freeze authority</strong> of the mint can freeze/thaw</li><li>Frozen accounts cannot send or receive tokens</li><li>If no freeze authority was set at mint creation, accounts <strong>cannot be frozen</strong></li><li>Used for compliance, security, and soulbound tokens</li></ul>`,
      xp: 30,
    },
    {
      title: "Token Basics Quiz",
      description: "Test your knowledge of the SPL Token standard",
      type: "quiz",
      content: null,
      xp: 30,
      quiz: {
        questions: [
          {
            question: "What is the purpose of a Mint Account on Solana?",
            options: [
              "To store a user's token balance",
              "To define a token's properties (decimals, supply, authorities)",
              "To hold SOL for rent exemption",
              "To execute token transfer instructions",
            ],
            correctAnswer: 1,
          },
          {
            question: "What makes an Associated Token Account (ATA) special?",
            options: [
              "It can hold multiple token types",
              "It's derived deterministically from owner + mint (PDA)",
              "It doesn't require rent",
              "It's owned by the System Program",
            ],
            correctAnswer: 1,
          },
          {
            question: "What happens when you revoke the mint authority?",
            options: [
              "All existing tokens are burned",
              "The token account is closed",
              "No more tokens can ever be minted",
              "The freeze authority is also revoked",
            ],
            correctAnswer: 2,
          },
          {
            question: "What is required to close a token account?",
            options: [
              "The account must be frozen first",
              "The token balance must be 0",
              "The mint authority must sign",
              "All delegates must be revoked",
            ],
            correctAnswer: 1,
          },
        ],
        passingScore: 75,
      },
    },
  ],
};
