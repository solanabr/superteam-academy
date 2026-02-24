import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = {
  title: "How to Create a Solana Wallet",
  description:
    "Step-by-step guide to creating your first Solana wallet using Solflare.",
};

export default function CreateWalletPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>How to Create a Solana Wallet</h1>
      <p className="lead">
        A Solana wallet lets you store tokens, collect NFT credentials, and
        interact with on-chain programs. This guide walks you through creating
        your first wallet using Solflare — one of the most trusted Solana wallets.
      </p>

      <div className="not-prose my-6 rounded-xl border bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>⏱ Time needed:</strong> About 5 minutes. No crypto or money required.
        </p>
      </div>

      <h2>What is a Wallet?</h2>
      <p>
        Think of a crypto wallet like a digital keychain. It holds a pair of keys:
      </p>
      <ul>
        <li>
          <strong>Public key (wallet address)</strong> — Like your email address.
          You share it so people can send you tokens or verify your identity.
        </li>
        <li>
          <strong>Private key / Secret phrase</strong> — Like your password. Never
          share it with anyone. Whoever has it controls your wallet.
        </li>
      </ul>

      <h2>Why Solflare?</h2>
      <p>
        Solflare is a trusted, open-source wallet built specifically for Solana.
        It works as a browser extension and mobile app, supports staking, NFTs,
        and all Solana tokens.
      </p>

      <hr />

      <h2>Step 1: Install Solflare</h2>
      <ol>
        <li>
          Go to{" "}
          <a
            href="https://solflare.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            solflare.com
          </a>
        </li>
        <li>
          Click <strong>&quot;Download&quot;</strong> and choose your browser
          (Chrome, Firefox, Brave, or Edge)
        </li>
        <li>Install the browser extension from your browser&apos;s extension store</li>
        <li>Pin the Solflare icon to your browser toolbar for easy access</li>
      </ol>

      <div className="not-prose my-6 rounded-xl border bg-blue-50 dark:bg-blue-950/30 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>📱 Mobile?</strong> You can also install Solflare from the{" "}
          <a
            href="https://apps.apple.com/app/solflare-solana-wallet/id1580902717"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            App Store
          </a>{" "}
          or{" "}
          <a
            href="https://play.google.com/store/apps/details?id=com.solflare.mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google Play
          </a>.
        </p>
      </div>

      <h2>Step 2: Create a New Wallet</h2>
      <ol>
        <li>Open the Solflare extension by clicking its icon in your toolbar</li>
        <li>Click <strong>&quot;I need a new wallet&quot;</strong></li>
        <li>Set a strong password for the extension (this is a local password, not your recovery phrase)</li>
      </ol>

      <h2>Step 3: Save Your Recovery Phrase</h2>
      <p>
        Solflare will show you a <strong>12 or 24-word recovery phrase</strong>
        (also called a seed phrase). This is the master key to your wallet.
      </p>

      <div className="not-prose my-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
          🔐 CRITICAL: Protect Your Recovery Phrase
        </p>
        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc pl-5 mb-0">
          <li>Write it down on paper — <strong>never store it digitally</strong> (no screenshots, no notes apps, no cloud)</li>
          <li>Store the paper in a safe, secure location</li>
          <li>Consider making a second copy in a different safe location</li>
          <li><strong>Never share it</strong> — no legitimate service will ever ask for it</li>
          <li>If you lose it, you lose access to your wallet forever</li>
        </ul>
      </div>

      <ol>
        <li>Write down every word in the exact order shown</li>
        <li>Double-check the spelling and order</li>
        <li>Confirm the phrase by selecting the words in the correct order</li>
      </ol>

      <h2>Step 4: Your Wallet is Ready!</h2>
      <p>
        Once you confirm your recovery phrase, your wallet is created. You&apos;ll
        see your <strong>wallet address</strong> — a long string that looks
        something like:
      </p>
      <pre>
        <code>7KqWfN3p4t... (44 characters)</code>
      </pre>
      <p>
        This is your public address. You can share it freely — it&apos;s how
        others identify your wallet on the Solana blockchain.
      </p>

      <h2>Step 5: Connect to Superteam Academy</h2>
      <p>Now that you have a wallet, connect it to unlock on-chain features:</p>
      <ol>
        <li>Go back to Superteam Academy</li>
        <li>
          Click <strong>&quot;Connect Wallet&quot;</strong> in the navigation or
          your dashboard
        </li>
        <li>Select <strong>Solflare</strong> from the wallet list</li>
        <li>Approve the connection in the Solflare popup</li>
        <li>Sign the verification message (free, no SOL needed)</li>
      </ol>

      <h2>What You Get</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🎯 XP Tokens</td>
            <td>Earn soulbound XP tokens on-chain as you complete lessons</td>
          </tr>
          <tr>
            <td>🏆 NFT Credentials</td>
            <td>Receive Metaplex Core NFTs as proof of course completion</td>
          </tr>
          <tr>
            <td>📊 On-chain Verification</td>
            <td>Your progress is verifiable on the Solana blockchain</td>
          </tr>
          <tr>
            <td>🎖️ Achievements</td>
            <td>Mint special achievement NFTs for milestones</td>
          </tr>
        </tbody>
      </table>

      <div className="not-prose my-6 rounded-xl border bg-green-50 dark:bg-green-950/30 p-4">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>💡 Good to know:</strong> You don&apos;t need any SOL to get
          started. Superteam Academy covers transaction fees for XP minting and
          credential issuance.
        </p>
      </div>

      <h2>Other Wallet Options</h2>
      <p>
        Solflare is just one option. Superteam Academy works with any wallet
        that supports the Solana Wallet Standard:
      </p>
      <ul>
        <li>
          <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
            <strong>Phantom</strong>
          </a>{" "}
          — The most popular Solana wallet
        </li>
        <li>
          <a href="https://backpack.app" target="_blank" rel="noopener noreferrer">
            <strong>Backpack</strong>
          </a>{" "}
          — Multi-chain wallet with xNFT support
        </li>
      </ul>

      <hr />

      <h2>Troubleshooting</h2>
      <h3>Solflare extension not showing up?</h3>
      <p>
        Make sure the extension is enabled in your browser settings. Try
        refreshing the page after installation.
      </p>
      <h3>Connection failed?</h3>
      <p>
        Try disconnecting and reconnecting. If the issue persists, make sure
        you&apos;re on the correct network (Devnet for testing, Mainnet for
        production).
      </p>

      <DocsPagination />
    </article>
  );
}
