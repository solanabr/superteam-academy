import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Connecting a Wallet" };

export default function WalletPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Connecting a Wallet</h1>
      <p className="lead">
        A Solana wallet is required to use the platform. You need a connected
        wallet to enroll in courses, earn soulbound XP tokens, receive NFT
        credentials, and mint achievements.
      </p>

      <h2>Why Connect a Wallet?</h2>
      <table>
        <thead>
          <tr><th>Feature</th><th>Without Wallet</th><th>With Wallet</th></tr>
        </thead>
        <tbody>
          <tr><td>Course enrollment</td><td>✅ Off-chain only</td><td>✅ Off-chain + on-chain</td></tr>
          <tr><td>XP tracking</td><td>✅ Database only</td><td>✅ Database + soulbound Token-2022</td></tr>
          <tr><td>Credentials</td><td>❌</td><td>✅ Metaplex Core NFTs</td></tr>
          <tr><td>Achievement minting</td><td>❌</td><td>✅ Mint as on-chain NFTs</td></tr>
          <tr><td>Leaderboard</td><td>✅</td><td>✅ With on-chain verification</td></tr>
        </tbody>
      </table>

      <h2>Supported Wallets</h2>
      <p>
        Superteam Academy uses the Solana Wallet Standard, which means it works
        with any compatible wallet:
      </p>
      <ul>
        <li><strong>Phantom</strong> — Most popular Solana wallet</li>
        <li><strong>Solflare</strong> — Feature-rich wallet with staking support</li>
        <li><strong>Backpack</strong> — Multi-chain wallet with xNFT support</li>
        <li><strong>Torus</strong> — Social login wallet</li>
        <li>Any wallet that implements the Solana Wallet Standard</li>
      </ul>

      <h2>How to Connect</h2>

      <h3>Option 1: Sign In with Wallet</h3>
      <p>
        If you don&apos;t have an account yet, you can sign in directly with your
        wallet. This creates an account linked to your wallet address.
      </p>
      <ol>
        <li>Click <strong>Sign In</strong> in the navigation bar</li>
        <li>Select <strong>Sign in with Wallet</strong></li>
        <li>Choose your wallet provider</li>
        <li>Approve the signature request (free, no SOL required)</li>
      </ol>

      <h3>Option 2: Link Wallet to Existing Account</h3>
      <p>
        If you already have an account via Google or GitHub, you can link a
        wallet later:
      </p>
      <ol>
        <li>Sign in to your account</li>
        <li>Go to your <strong>Dashboard</strong> — you&apos;ll see a &quot;Link Wallet&quot; prompt</li>
        <li>Or go to <strong>Settings</strong> and find the wallet section</li>
        <li>Click <strong>Connect Wallet</strong></li>
        <li>Choose your wallet and approve the signature</li>
      </ol>

      <blockquote>
        <p>
          <strong>Important:</strong> Each wallet address can only be linked to
          one account. If the wallet is already linked elsewhere, you&apos;ll see
          an error.
        </p>
      </blockquote>

      <h2>What Happens On-Chain</h2>
      <p>When you connect a wallet, the platform can:</p>
      <ul>
        <li><strong>Check your XP balance</strong> — Reads your Token-2022 XP token account</li>
        <li><strong>Verify enrollments</strong> — Checks enrollment PDAs on the Solana program</li>
        <li><strong>Query credentials</strong> — Fetches your Metaplex Core NFTs via Helius DAS API</li>
        <li><strong>Mint achievements</strong> — Sends mint transactions to the Solana program</li>
      </ul>
      <p>
        All on-chain reads are free. Only minting operations require transaction
        approval (and the platform covers transaction fees in most cases).
      </p>

      <h2>Disconnecting a Wallet</h2>
      <p>
        You can disconnect your wallet from the wallet button in the navigation
        bar. Note that disconnecting doesn&apos;t unlink it from your account — it
        just disconnects the browser session. Your on-chain data (XP, credentials)
        remains on the blockchain.
      </p>

      <DocsPagination />
    </article>
  );
}
