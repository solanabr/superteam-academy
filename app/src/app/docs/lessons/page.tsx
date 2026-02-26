import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Completing Lessons" };

export default function LessonsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Completing Lessons</h1>
      <p className="lead">
        Lessons are the building blocks of courses. Complete them to earn XP,
        build your streak, and progress toward course credentials.
      </p>

      <h2>Lesson Types</h2>

      <h3>Content Lessons</h3>
      <p>
        The most common type. Content lessons include rich text, code snippets,
        diagrams, and explanations. Read through the material and click
        <strong> Mark as Complete</strong> at the bottom to earn XP.
      </p>

      <h3>Quiz Lessons</h3>
      <p>
        Quiz lessons test your understanding with multiple-choice questions.
        You need to answer all questions correctly to complete the lesson.
        Don&apos;t worry — you can retry as many times as needed.
      </p>
      <ul>
        <li>Read each question carefully</li>
        <li>Select your answer(s)</li>
        <li>Submit to check your answers</li>
        <li>If incorrect, review and try again</li>
        <li>Once all answers are correct, the lesson is marked complete</li>
      </ul>

      <h3>Coding Challenges</h3>
      <p>
        Challenge lessons include a built-in Monaco code editor where you write
        and test code. These are hands-on exercises that reinforce what you&apos;ve
        learned.
      </p>
      <ul>
        <li>Read the challenge description and objectives</li>
        <li>Write your solution in the code editor</li>
        <li>Click <strong>Run</strong> to validate your code against test cases</li>
        <li>Use the provided hints if you get stuck</li>
        <li>View the reference solution if needed</li>
      </ul>

      <h4>How Code Validation Works</h4>
      <p>
        When you click <strong>Run</strong>, your code goes through two checks:
      </p>
      <ol>
        <li>
          <strong>Compile check</strong> (TypeScript only) — the editor checks
          for syntax and type errors before sending your code for validation.
          If there are compile errors, all tests fail immediately and the errors
          are shown.
        </li>
        <li>
          <strong>Server-side validation</strong> — your code is sent to the
          server where it&apos;s checked against test cases defined by the course
          creator. The server strips comments before checking, so the patterns
          must appear in actual code, not in comments.
        </li>
      </ol>
      <p>
        Some test cases are <strong>hidden</strong> — you can see they exist but
        not what they check. This encourages writing complete solutions rather
        than targeting specific patterns.
      </p>

      <blockquote>
        <p>
          <strong>Offline:</strong> If you&apos;re offline, code validation falls
          back to client-side checking so you can keep working.
        </p>
      </blockquote>

      <h2>Lesson Navigation</h2>
      <p>
        Within a course, lessons are organized sequentially within modules.
        You can navigate between lessons using:
      </p>
      <ul>
        <li><strong>Previous/Next</strong> buttons at the bottom of each lesson</li>
        <li>The <strong>lesson sidebar</strong> showing all modules and lessons</li>
        <li>Clicking on any lesson in the sidebar to jump to it</li>
      </ul>

      <h2>Earning XP</h2>
      <p>
        Each lesson awards XP upon completion. The amount depends on the course
        configuration (typically set per lesson by the course creator). XP is
        awarded:
      </p>
      <ul>
        <li><strong>Off-chain</strong> — Recorded in the database immediately</li>
        <li><strong>On-chain</strong> — Minted as soulbound Token-2022 tokens (if wallet connected)</li>
      </ul>

      <blockquote>
        <p>
          <strong>Note:</strong> You can only earn XP for a lesson once.
          Revisiting a completed lesson won&apos;t award additional XP.
        </p>
      </blockquote>

      <h2>Lesson Comments</h2>
      <p>
        Each lesson has a comment section at the bottom where you can:
      </p>
      <ul>
        <li>Ask questions about the lesson content</li>
        <li>Share tips and additional resources</li>
        <li>Reply to other learners&apos; comments (threaded replies)</li>
        <li>Mark comments as &quot;Helpful&quot; to recognize useful contributions</li>
      </ul>

      <h2>Progress Tracking</h2>
      <p>
        Your lesson completion progress is tracked using a bitmap system.
        Each lesson has a corresponding bit — when you complete it, the bit
        is flipped. This allows efficient tracking of which lessons you&apos;ve
        finished.
      </p>
      <p>
        You can see your overall course progress as a percentage on:
      </p>
      <ul>
        <li>The course detail page</li>
        <li>Your Dashboard</li>
        <li>My Courses page</li>
      </ul>

      <h2>Completing a Course</h2>
      <p>
        When you complete all lessons in a course, the course is automatically
        marked as finished. You&apos;ll see:
      </p>
      <ul>
        <li>A 🎉 completion notification</li>
        <li>The course moves from &quot;In Progress&quot; to &quot;Completed&quot; on your Dashboard</li>
        <li>If you have a wallet, you may receive an NFT credential (see <a href="/docs/credentials">Credentials</a>)</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
