import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Frequently Asked Questions</h1>

      <h2>General</h2>

      <h3>Is Superteam Academy free?</h3>
      <p>
        Yes. All courses on the platform are free to access. Enrolling and
        completing courses costs nothing. Some on-chain features (like minting
        achievement NFTs) may require a small SOL amount for transaction fees.
      </p>

      <h3>Do I need a Solana wallet?</h3>
      <p>
        Yes. A Solana wallet is required to enroll in courses. You can sign in
        with Google or GitHub, but you must connect a wallet before enrolling.
        The wallet is used for XP tokens, NFT credentials, and achievement minting.
      </p>

      <h3>What wallets are supported?</h3>
      <p>
        Any wallet that implements the Solana Wallet Standard: Phantom, Solflare,
        Backpack, and many others.
      </p>

      <h2>Account</h2>

      <h3>Can I change my sign-in method?</h3>
      <p>
        If you signed in with Google or GitHub, you can link a wallet to your
        account. You cannot currently change from wallet-based auth to OAuth or
        vice versa.
      </p>

      <h3>Can I delete my account?</h3>
      <p>
        Contact the platform administrators to request account deletion. Note
        that on-chain data (XP tokens, credentials) cannot be deleted from the
        blockchain.
      </p>

      <h2>Learning</h2>

      <h3>Can I redo a lesson I&apos;ve already completed?</h3>
      <p>
        Yes, you can revisit any completed lesson. However, you won&apos;t receive
        additional XP for completing it again.
      </p>

      <h3>What happens if I fail a quiz?</h3>
      <p>
        You can retry as many times as needed. There is no penalty for incorrect
        answers.
      </p>

      <h3>Are courses self-paced?</h3>
      <p>
        Yes. All courses are self-paced. There are no deadlines. However,
        maintaining a daily streak requires consistent activity.
      </p>

      <h3>Can I take courses out of order?</h3>
      <p>
        Yes. While some courses have recommended prerequisites, you can enroll
        in any course at any time.
      </p>

      <h2>XP &amp; Rewards</h2>

      <h3>Can I transfer my XP to another wallet?</h3>
      <p>
        No. XP tokens are soulbound (non-transferable). They are permanently
        attached to your wallet.
      </p>

      <h3>What are credential NFTs?</h3>
      <p>
        Metaplex Core NFTs minted to your wallet when you complete a course.
        They serve as verifiable proof of completion and are also soulbound.
      </p>

      <h3>Can I sell my credentials?</h3>
      <p>
        No. Credentials are soulbound NFTs with a PermanentFreezeDelegate,
        meaning they cannot be transferred or sold.
      </p>

      <h3>What is the leaderboard based on?</h3>
      <p>
        The leaderboard ranks users by total XP earned across all courses.
      </p>

      <h2>Technical</h2>

      <h3>The platform is slow — what can I do?</h3>
      <ul>
        <li>Try clearing your browser cache</li>
        <li>Check your internet connection</li>
        <li>Try a different browser</li>
        <li>Disable browser extensions that might interfere</li>
      </ul>

      <h3>I completed a lesson but didn&apos;t get XP</h3>
      <p>
        Refresh your Dashboard. If the XP still doesn&apos;t appear, try signing
        out and back in. If the issue persists, reach out in the Community forum.
      </p>

      <h3>My wallet won&apos;t connect</h3>
      <ul>
        <li>Make sure you have a supported wallet extension installed</li>
        <li>Check that you&apos;re on the correct network (Devnet or Mainnet)</li>
        <li>Try disconnecting and reconnecting the wallet</li>
        <li>Refresh the page</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
