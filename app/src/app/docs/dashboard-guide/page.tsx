import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardGuidePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Dashboard</h1>
      <p className="lead">
        Your Dashboard is the central hub for tracking your learning progress,
        XP, streaks, and achievements.
      </p>

      <h2>Dashboard Sections</h2>

      <h3>Stats Overview</h3>
      <p>
        At the top of your Dashboard, you&apos;ll see four key statistics:
      </p>
      <ul>
        <li><strong>Total XP</strong> — Your accumulated experience points</li>
        <li><strong>Level</strong> — Your current level (with progress ring)</li>
        <li><strong>Current Streak</strong> — Consecutive days of learning</li>
        <li><strong>Courses Completed</strong> — Total courses finished</li>
      </ul>

      <h3>XP &amp; Level Ring</h3>
      <p>
        The level ring visually shows your progress toward the next level.
        It fills clockwise as you earn XP. Hover over it to see exact
        numbers.
      </p>

      <h3>Streak Calendar</h3>
      <p>
        A heatmap calendar showing your daily learning activity over time.
        Darker squares indicate more activity. This helps you maintain
        consistency and visualize your learning habits.
      </p>

      <h3>In-Progress Courses</h3>
      <p>
        A list of courses you&apos;re currently enrolled in, showing:
      </p>
      <ul>
        <li>Course title and thumbnail</li>
        <li>Progress bar (percentage of lessons completed)</li>
        <li>XP earned so far</li>
        <li>Quick link to continue where you left off</li>
      </ul>

      <h3>Completed Courses</h3>
      <p>
        Courses you&apos;ve finished, with credential status (minted or pending).
      </p>

      <h3>Achievements</h3>
      <p>
        Your unlocked achievements with mint buttons for those not yet
        minted on-chain. See <a href="/docs/credentials">Credentials &amp; Achievements</a>.
      </p>

      <h3>Activity Feed</h3>
      <p>
        A chronological log of your recent activities:
      </p>
      <ul>
        <li>Lessons completed</li>
        <li>Courses enrolled in</li>
        <li>Achievements unlocked</li>
        <li>XP earned</li>
      </ul>

      <h3>Skill Radar</h3>
      <p>
        A radar chart showing your skill distribution across different
        tracks (Solana Core, Program Dev, Frontend, Tokens, NFTs, SDKs, Gaming).
        This helps you identify areas to focus on.
      </p>

      <h2>Link Wallet Prompt</h2>
      <p>
        If you signed in with Google or GitHub and haven&apos;t linked a wallet,
        you&apos;ll see a prompt asking you to connect one for on-chain features.
        You can dismiss it or connect your wallet directly from the Dashboard.
      </p>

      <DocsPagination />
    </article>
  );
}
