import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Getting Started" };

export default function GettingStartedPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Getting Started</h1>
      <p className="lead">
        Superteam Academy is a decentralized learning platform built on Solana.
        Learn blockchain development through interactive courses, earn soulbound
        XP tokens, collect NFT credentials, and track your progress — all on-chain.
      </p>

      <h2>What is Superteam Academy?</h2>
      <p>
        Superteam Academy is designed for developers who want to learn Solana
        development. The platform offers structured courses covering everything
        from getting started with Solana to advanced program development with
        Anchor, Metaplex, and Token Extensions.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li><strong>Interactive Courses</strong> — Structured learning paths with lessons, quizzes, and coding challenges</li>
        <li><strong>Soulbound XP</strong> — Earn non-transferable Token-2022 XP tokens as you complete lessons</li>
        <li><strong>NFT Credentials</strong> — Receive Metaplex Core NFT certificates when you finish courses</li>
        <li><strong>Achievements</strong> — Unlock achievements and mint them as on-chain NFTs</li>
        <li><strong>Leaderboard</strong> — Compete with other learners based on XP</li>
        <li><strong>Community</strong> — Discuss lessons, ask questions, and help fellow learners</li>
        <li><strong>Streaks</strong> — Build daily learning habits with streak tracking</li>
      </ul>

      <h2>Quick Start</h2>
      <p>Here&apos;s how to get started in under 2 minutes:</p>
      <ol>
        <li><strong>Create an account</strong> — Sign in with Google, GitHub, or your Solana wallet</li>
        <li><strong>Set up your profile</strong> — Choose a display name and avatar</li>
        <li><strong>Connect a wallet</strong> — Link a Solana wallet (required to enroll in courses)</li>
        <li><strong>Browse courses</strong> — Explore courses by difficulty level or track</li>
        <li><strong>Enroll &amp; learn</strong> — Start your first course and earn XP</li>
      </ol>

      <h2>Platform Structure</h2>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>What It Does</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Courses</strong></td><td>Browse and search the full course catalog</td></tr>
          <tr><td><strong>Dashboard</strong></td><td>View your XP, level, streaks, and progress</td></tr>
          <tr><td><strong>My Courses</strong></td><td>See courses you&apos;ve enrolled in or created</td></tr>
          <tr><td><strong>Leaderboard</strong></td><td>See top learners ranked by XP</td></tr>
          <tr><td><strong>Community</strong></td><td>Forum for discussions and questions</td></tr>
          <tr><td><strong>Profile</strong></td><td>Your public profile with stats and achievements</td></tr>
          <tr><td><strong>Settings</strong></td><td>Manage language, theme, and account preferences</td></tr>
        </tbody>
      </table>

      <h2>Supported Languages</h2>
      <p>
        The platform interface is available in three languages:
      </p>
      <ul>
        <li>English (en)</li>
        <li>Portuguese — Brazil (pt-br)</li>
        <li>Spanish (es)</li>
      </ul>
      <p>
        You can change the language from the language switcher in the top navigation
        bar or in your settings.
      </p>

      <h2>Next Steps</h2>
      <p>
        Ready to dive in? Head to the <a href="/docs/account">Creating an Account</a> page
        to set up your account, or jump straight to <a href="/docs/courses">Browsing Courses</a> to
        explore what&apos;s available.
      </p>

      <DocsPagination />
    </article>
  );
}
