import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "XP & Leveling" };

export default function XpAndLevelsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>XP &amp; Leveling</h1>
      <p className="lead">
        XP (Experience Points) is the core progression metric on Superteam
        Academy. Earn XP by completing lessons, level up, and compete on the
        leaderboard.
      </p>

      <h2>How XP Works</h2>
      <p>
        Every lesson completion awards XP. The amount varies by course and is
        set by the course creator (typically defined per lesson or as a base
        rate per course).
      </p>

      <h3>Off-Chain XP</h3>
      <p>
        All users receive off-chain XP stored in the database. This is instant
        and doesn&apos;t require a wallet.
      </p>

      <h3>On-Chain XP (Soulbound Token-2022)</h3>
      <p>
        If you have a wallet connected, XP is also minted as soulbound Token-2022
        tokens. These tokens are:
      </p>
      <ul>
        <li><strong>Non-Transferable</strong> — Cannot be sent to another wallet</li>
        <li><strong>Permanent Delegate</strong> — The program controls burning; you can&apos;t self-burn</li>
        <li><strong>Verifiable</strong> — Anyone can check your XP balance on-chain</li>
      </ul>

      <h2>Leveling System</h2>
      <p>
        XP accumulates to determine your level. The formula follows a quadratic
        curve:
      </p>
      <pre><code>{`XP required for level N = N² × 100

Level 1:  100 XP
Level 2:  400 XP
Level 3:  900 XP
Level 4:  1,600 XP
Level 5:  2,500 XP
Level 10: 10,000 XP
Level 20: 40,000 XP`}</code></pre>

      <h3>Level Ring</h3>
      <p>
        Your current level is displayed as a ring around your avatar on the
        Dashboard and Profile. The ring fills up as you progress toward the
        next level, showing your percentage progress.
      </p>

      <h2>Streaks</h2>
      <p>
        Daily streaks track consecutive days of learning activity.
      </p>
      <ul>
        <li><strong>Current Streak</strong> — How many consecutive days you&apos;ve been active</li>
        <li><strong>Longest Streak</strong> — Your all-time best streak</li>
        <li><strong>Streak Calendar</strong> — Visual heatmap showing your activity over time</li>
      </ul>

      <h3>What Counts as Activity</h3>
      <p>
        The following actions count toward your daily streak:
      </p>
      <ul>
        <li>Completing a lesson</li>
        <li>Enrolling in a course</li>
      </ul>

      <h3>Streak Freeze</h3>
      <p>
        If you miss a day, your streak resets to 0. Use a streak freeze (when
        available) to protect your streak for one missed day.
      </p>

      <h2>Leaderboard</h2>
      <p>
        The <strong>Leaderboard</strong> page ranks all learners by total XP.
        It shows:
      </p>
      <ul>
        <li>Rank position</li>
        <li>Display name and avatar</li>
        <li>Total XP</li>
        <li>Current level</li>
      </ul>
      <p>
        Compete with other learners to climb the leaderboard. Your position
        updates in real-time as you earn more XP.
      </p>

      <DocsPagination />
    </article>
  );
}
