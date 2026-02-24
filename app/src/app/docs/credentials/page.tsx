import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Credentials & Achievements" };

export default function CredentialsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Credentials &amp; Achievements</h1>
      <p className="lead">
        Earn on-chain proof of your learning. Credentials are course completion
        NFTs, and achievements are milestone rewards — both soulbound to your
        wallet.
      </p>

      <h2>Credentials (Course Completion NFTs)</h2>
      <p>
        When you complete all lessons in a course with a wallet connected, you
        receive a Metaplex Core NFT credential. These credentials are:
      </p>
      <ul>
        <li><strong>Soulbound</strong> — Frozen via PermanentFreezeDelegate, cannot be transferred</li>
        <li><strong>Upgradeable</strong> — Attributes can be updated (e.g., XP earned at completion time)</li>
        <li><strong>Wallet-visible</strong> — Shows up in your wallet alongside other NFTs</li>
        <li><strong>Verifiable</strong> — Anyone can verify your credential on-chain</li>
      </ul>

      <h3>How Credentials Are Issued</h3>
      <ol>
        <li>Complete all lessons in a course</li>
        <li>The course is finalized (XP awarded)</li>
        <li>A credential NFT is minted to your wallet via Metaplex Core CPI</li>
        <li>The credential includes metadata: course name, completion date, XP earned</li>
      </ol>

      <h3>Viewing Your Credentials</h3>
      <p>
        Your credentials appear in:
      </p>
      <ul>
        <li>Your <strong>Dashboard</strong> under completed courses</li>
        <li>Your <strong>Profile</strong> page</li>
        <li>Your Solana wallet (as NFTs)</li>
        <li>The <strong>Certificates</strong> page at <code>/certificates/[id]</code></li>
      </ul>

      <h2>Achievements</h2>
      <p>
        Achievements reward specific milestones. When you unlock an achievement,
        you can mint it as an on-chain NFT.
      </p>

      <h3>Achievement Types</h3>
      <table>
        <thead>
          <tr><th>Achievement</th><th>How to Unlock</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Early Adopter</strong></td><td>Be among the first users on the platform</td></tr>
          <tr><td><strong>First Course</strong></td><td>Complete your first course</td></tr>
          <tr><td><strong>Streak Master</strong></td><td>Maintain a 7-day learning streak</td></tr>
          <tr><td><strong>Helper</strong></td><td>Have your comments marked as helpful by others</td></tr>
          <tr><td><strong>Explorer</strong></td><td>Enroll in courses across multiple tracks</td></tr>
        </tbody>
      </table>

      <h3>Minting Achievements</h3>
      <p>
        Once an achievement is unlocked:
      </p>
      <ol>
        <li>Go to your <strong>Dashboard</strong></li>
        <li>Find the achievement in the achievements section</li>
        <li>Click <strong>Mint</strong></li>
        <li>Approve the transaction in your wallet</li>
        <li>The achievement NFT is minted to your wallet</li>
      </ol>

      <blockquote>
        <p>
          <strong>Note:</strong> Minting achievements requires a connected wallet
          and a small amount of SOL for the transaction. In most cases, the
          platform covers transaction fees.
        </p>
      </blockquote>

      <h3>Eligibility Checking</h3>
      <p>
        The platform automatically checks your eligibility for achievements
        based on your activity. When you meet the criteria, the achievement
        appears in your unlocked achievements list ready to be minted.
      </p>

      <DocsPagination />
    </article>
  );
}
