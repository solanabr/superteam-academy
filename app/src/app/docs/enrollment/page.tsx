import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Enrolling in Courses" };

export default function EnrollmentPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Enrolling in Courses</h1>
      <p className="lead">
        Enrollment is the first step to start learning. Once enrolled, you can
        access all lessons and track your progress.
      </p>

      <h2>How to Enroll</h2>
      <blockquote>
        <p>
          <strong>Wallet Required:</strong> You must have a Solana wallet connected
          to enroll in any course. If you haven&apos;t connected one yet, see the
          <a href="/docs/wallet">Connecting a Wallet</a> guide.
        </p>
      </blockquote>
      <ol>
        <li>Make sure your Solana wallet is connected</li>
        <li>Navigate to the <strong>Courses</strong> page</li>
        <li>Click on the course you want to take</li>
        <li>On the course detail page, click <strong>Enroll</strong></li>
        <li>Approve the wallet transaction</li>
        <li>You&apos;re enrolled — start the first lesson</li>
      </ol>

      <h2>Off-Chain vs On-Chain Enrollment</h2>
      <p>
        Superteam Academy supports two types of enrollment:
      </p>

      <h2>What Happens When You Enroll</h2>
      <p>
        When you click Enroll, the platform:
      </p>
      <ul>
        <li>Records your enrollment in the database</li>
        <li>Creates an enrollment PDA on-chain via the Solana program</li>
        <li>Enables on-chain XP tracking for the course</li>
        <li>Enables you to receive NFT credentials upon completion</li>
      </ul>

      <h2>After Enrolling</h2>
      <p>Once enrolled, the course appears in:</p>
      <ul>
        <li><strong>My Courses</strong> — Your personal course list</li>
        <li><strong>Dashboard</strong> — Under &quot;In Progress&quot; courses</li>
      </ul>
      <p>
        Your enrollment also starts your streak timer — completing a lesson
        within 24 hours starts building your daily streak.
      </p>

      <h2>Streak on Enrollment</h2>
      <p>
        Enrolling in a course counts as a learning activity and will contribute
        to your daily streak. The streak system tracks consecutive days of
        learning activity.
      </p>

      <h2>Unenrolling</h2>
      <p>
        Currently, there is no unenroll feature. Once you enroll, the course
        remains in your &quot;My Courses&quot; list. Your progress is always saved, so
        you can return to a course anytime.
      </p>

      <DocsPagination />
    </article>
  );
}
