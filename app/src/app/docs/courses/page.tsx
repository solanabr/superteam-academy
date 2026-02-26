import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Browsing Courses" };

export default function CoursesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Browsing Courses</h1>
      <p className="lead">
        Superteam Academy offers structured courses across multiple Solana
        development topics. Courses are organized by difficulty and track.
      </p>

      <h2>Course Catalog</h2>
      <p>
        Visit the <strong>Courses</strong> page from the navigation bar to see
        all available courses. Each course card displays:
      </p>
      <ul>
        <li><strong>Title</strong> and short description</li>
        <li><strong>Difficulty</strong> — Beginner, Intermediate, or Advanced</li>
        <li><strong>Duration</strong> — Estimated completion time</li>
        <li><strong>XP reward</strong> — XP available per lesson</li>
        <li><strong>Thumbnail</strong> — Course cover image</li>
      </ul>

      <h2>Difficulty Levels</h2>
      <table>
        <thead>
          <tr><th>Level</th><th>Label</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Beginner</td><td>No prior Solana knowledge required</td></tr>
          <tr><td>2</td><td>Intermediate</td><td>Requires basic Solana concepts</td></tr>
          <tr><td>3</td><td>Advanced</td><td>For experienced Solana developers</td></tr>
        </tbody>
      </table>

      <h2>Tracks</h2>
      <p>
        Courses are organized into learning tracks:
      </p>
      <table>
        <thead>
          <tr><th>Track ID</th><th>Track Name</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Solana Core</td></tr>
          <tr><td>2</td><td>Program Development</td></tr>
          <tr><td>3</td><td>Frontend</td></tr>
          <tr><td>4</td><td>Tokens &amp; DeFi</td></tr>
          <tr><td>5</td><td>NFTs &amp; Metaplex</td></tr>
          <tr><td>6</td><td>SDKs &amp; Tools</td></tr>
          <tr><td>7</td><td>Gaming</td></tr>
        </tbody>
      </table>

      <h2>Course Structure</h2>
      <p>Each course is organized into:</p>
      <ul>
        <li><strong>Modules</strong> — Thematic groups of lessons (e.g., &quot;Introduction&quot;, &quot;Core Concepts&quot;)</li>
        <li>
          <strong>Lessons</strong> — Individual learning units within modules. Types:
          <ul>
            <li><strong>Content</strong> — Rich text with code examples (most common)</li>
            <li><strong>Quiz</strong> — Multiple-choice questions to test knowledge</li>
            <li><strong>Challenge</strong> — Hands-on coding exercises with a built-in code editor</li>
          </ul>
        </li>
      </ul>

      <h2>Prerequisites</h2>
      <p>
        Some courses have prerequisites — other courses you should complete
        first. These are shown on the course detail page. You can still enroll
        in a course without completing its prerequisites, but completing them
        first is recommended for the best learning experience.
      </p>

      <h2>Course Details Page</h2>
      <p>
        Click on any course card to see the full details page, which includes:
      </p>
      <ul>
        <li>Full description and learning objectives (&quot;What you&apos;ll learn&quot;)</li>
        <li>Module and lesson outline</li>
        <li>Estimated duration and XP per lesson</li>
        <li>Prerequisite courses (if any)</li>
        <li>Enroll button</li>
        <li>Student reviews from learners who completed the course (see <a href="/docs/course-reviews">Course Reviews</a>)</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
