import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Community & Forum" };

export default function CommunityForumPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Community &amp; Forum</h1>
      <p className="lead">
        Engage with other learners through lesson comments and community forum
        posts. Ask questions, share knowledge, and earn achievements by helping
        others.
      </p>

      <h2>Lesson Comments</h2>
      <p>
        Every lesson has a comment section at the bottom. Use it to:
      </p>
      <ul>
        <li>Ask questions about the lesson content</li>
        <li>Share additional resources or tips</li>
        <li>Point out corrections or improvements</li>
        <li>Reply to other learners (threaded conversations)</li>
      </ul>

      <h3>Marking Comments as Helpful</h3>
      <p>
        If someone&apos;s comment helped you, click the <strong>Helpful</strong> button.
        This:
      </p>
      <ul>
        <li>Highlights the comment for other learners</li>
        <li>Contributes to the commenter&apos;s &quot;Helper&quot; achievement progress</li>
        <li>Tracks community help records</li>
      </ul>

      <h2>Community Forum</h2>
      <p>
        The <strong>Community</strong> page is a standalone forum for general
        discussions not tied to specific lessons. Topics include:
      </p>
      <ul>
        <li>General Solana development questions</li>
        <li>Project showcases</li>
        <li>Platform feedback and suggestions</li>
        <li>Learning tips and study groups</li>
      </ul>

      <h3>Creating a Forum Post</h3>
      <ol>
        <li>Go to <strong>Community</strong> from the navigation bar</li>
        <li>Click <strong>New Post</strong></li>
        <li>Write your post title and content</li>
        <li>Submit the post</li>
      </ol>

      <h3>Replying to Posts</h3>
      <ol>
        <li>Click on a forum post to open it</li>
        <li>Scroll to the bottom to see the reply section</li>
        <li>Write your reply and submit</li>
      </ol>

      <h2>Community Guidelines</h2>
      <ul>
        <li>Be respectful and constructive</li>
        <li>Stay on topic — use lesson comments for lesson-specific questions</li>
        <li>No spam or self-promotion</li>
        <li>Help others — earning the Helper achievement is rewarding</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
