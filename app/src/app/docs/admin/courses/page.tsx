import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Course Management" };

export default function CoursesAdminPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Course Management</h1>
      <p className="lead">
        Courses can be created via push scripts, Sanity Studio, or the in-app
        course creation wizard. Admins review and approve user-submitted courses.
      </p>

      <h2>Course Lifecycle</h2>
      <pre><code>{`Draft → Submitted → Review → Approved/Rejected → Published
                                    ↓
                          On-chain creation (create_course instruction)`}</code></pre>

      <h2>Creating Courses</h2>

      <h3>Method 1: Push Scripts (Recommended for bulk content)</h3>
      <p>
        Pre-built course content lives in the <code>scripts/</code> directory.
        Each course has a TypeScript script that pushes structured content to Sanity:
      </p>
      <pre><code>{`# Push all courses at once
npx ts-node scripts/push-courses-to-sanity.ts

# Push individual courses
npx ts-node scripts/push-solana-getting-started.ts
npx ts-node scripts/push-anchor-course.ts`}</code></pre>
      <p>
        These scripts use the Sanity write client (<code>SANITY_API_TOKEN</code>)
        to create/update course documents with full module and lesson content.
      </p>

      <h3>Method 2: Sanity Studio (For content editors)</h3>
      <ol>
        <li>Go to <code>/studio</code> in your browser</li>
        <li>Click <strong>Course</strong> in the document list</li>
        <li>Click <strong>+ Create new</strong></li>
        <li>Fill in all course fields (title, slug, description, modules, lessons)</li>
        <li>Publish the document</li>
      </ol>

      <h3>Method 3: In-App Course Creator (For authenticated users)</h3>
      <ol>
        <li>Sign in with an authenticated account</li>
        <li>Click <strong>Create</strong> in the navigation bar</li>
        <li>Fill in the multi-step wizard:
          <ul>
            <li>Step 1: Basic info (title, description, difficulty, track)</li>
            <li>Step 2: Modules and lessons</li>
            <li>Step 3: Review and submit</li>
          </ul>
        </li>
        <li>Pay the course creation fee (SOL transfer to treasury)</li>
        <li>Course is submitted for admin review</li>
      </ol>

      <h2>Admin Review</h2>
      <p>
        Submitted courses appear in the <strong>Admin</strong> dashboard at
        <code>/admin/courses</code>:
      </p>
      <ol>
        <li>Go to <strong>Admin → Courses</strong></li>
        <li>View pending submissions</li>
        <li>Click a course to review its content</li>
        <li>Choose <strong>Approve</strong> or <strong>Reject</strong></li>
      </ol>

      <h3>Approval Flow</h3>
      <ul>
        <li><strong>Approve</strong> (<code>POST /api/admin/courses/[id]/approve</code>) — Creates the course on-chain and publishes it</li>
        <li><strong>Reject</strong> (<code>POST /api/admin/courses/[id]/reject</code>) — Marks the course as rejected with a reason</li>
      </ul>

      <h2>On-Chain Course Creation</h2>
      <p>
        When a course is approved, the backend signer creates it on-chain:
      </p>
      <pre><code>{`// lib/solana/create-course.ts
// Uses BACKEND_SIGNER_KEY to sign the create_course instruction
// Manual Borsh serialization with Anchor discriminator
// Creates Course PDA: ["course", course_id]`}</code></pre>

      <h2>Course Content Structure</h2>
      <p>
        Each course in Sanity follows this hierarchy:
      </p>
      <pre><code>{`Course
├── Module 1
│   ├── Lesson 1 (content)
│   ├── Lesson 2 (quiz)
│   └── Lesson 3 (challenge)
├── Module 2
│   ├── Lesson 4 (content)
│   └── Lesson 5 (content)
└── Module 3
    └── ...`}</code></pre>

      <h2>Course IDs</h2>
      <p>
        Each course has two IDs:
      </p>
      <ul>
        <li><strong>Sanity document ID</strong> — Internal CMS identifier</li>
        <li><strong>courseId (number)</strong> — On-chain identifier used for PDA derivation</li>
      </ul>
      <p>
        The <code>courseId</code> field in Sanity must match the numeric ID used
        when creating the course on-chain.
      </p>

      <h2>Hide / Show Courses</h2>
      <p>
        Admins can hide courses from the public catalog without deleting them.
        This is useful for temporarily removing a course or taking it offline for updates.
      </p>

      <h3>How to Hide a Course</h3>
      <ol>
        <li>Go to <strong>Admin → Courses</strong> (<code>/admin/courses</code>)</li>
        <li>Find the course in the list (use the search bar or status tabs to filter)</li>
        <li>Click the <strong>eye-off icon</strong> (👁️‍🗨️) on the right side of the course row</li>
        <li>The course status changes to <strong>Hidden</strong> and it disappears from the public catalog</li>
      </ol>

      <h3>How to Show a Hidden Course</h3>
      <ol>
        <li>Go to <strong>Admin → Courses</strong> and click the <strong>Hidden</strong> tab</li>
        <li>Find the hidden course</li>
        <li>Click the <strong>eye icon</strong> (👁️) to restore visibility</li>
        <li>The course returns to the public catalog as <strong>Approved</strong></li>
      </ol>

      <h3>What Happens When You Hide</h3>
      <table>
        <thead><tr><th>Field</th><th>Hidden</th><th>Visible</th></tr></thead>
        <tbody>
          <tr><td><code>isActive</code></td><td><code>false</code></td><td><code>true</code></td></tr>
          <tr><td><code>isPublished</code></td><td><code>false</code></td><td><code>true</code></td></tr>
          <tr><td><code>status</code></td><td>unchanged</td><td>unchanged</td></tr>
        </tbody>
      </table>
      <p>
        The <code>status</code> field is preserved (stays &quot;approved&quot;).
        The effective display status is derived from <code>isActive</code> — if <code>false</code>, the course shows as &quot;Hidden&quot; in the admin panel.
      </p>
      <p>
        Public queries filter with: <code>isActive == true &amp;&amp; (status == &quot;approved&quot; || !defined(status))</code>
      </p>

      <h3>API</h3>
      <pre><code>{`POST /api/admin/courses/[id]/hide
Headers: Authorization: Bearer <token>
Body: { "hidden": true }   // hide
       { "hidden": false }  // unhide`}</code></pre>

      <h2>Delete Courses</h2>
      <p>
        Admins can permanently delete a course. <strong>This cannot be undone.</strong>
      </p>

      <h3>How to Delete</h3>
      <ol>
        <li>Go to <strong>Admin → Courses</strong> (<code>/admin/courses</code>)</li>
        <li>Find the course and click the <strong>trash icon</strong> (🗑️)</li>
        <li>A confirmation prompt appears — click <strong>Confirm</strong> to proceed</li>
        <li>The course and all associated data are permanently removed</li>
      </ol>

      <h3>What Gets Deleted</h3>
      <ol>
        <li><code>course_reviews</code> — all reviews for this course (Supabase)</li>
        <li><code>course_progress</code> — all enrollment and progress records (Supabase)</li>
        <li>Course document — the course itself (Sanity CMS)</li>
      </ol>
      <p>
        <strong>Note:</strong> On-chain PDAs are not affected. If the course was
        already created on-chain, the PDA will remain but become orphaned.
      </p>

      <h3>API</h3>
      <pre><code>{`DELETE /api/admin/courses/[id]/delete
Headers: Authorization: Bearer <token>`}</code></pre>

      <h2>Filtering &amp; Status</h2>
      <p>
        The admin courses page (<code>/admin/courses</code>) provides tabs to filter by status:
      </p>
      <table>
        <thead><tr><th>Tab</th><th>Shows</th></tr></thead>
        <tbody>
          <tr><td><strong>All</strong></td><td>Every course regardless of status</td></tr>
          <tr><td><strong>Approved</strong></td><td>Active courses visible to learners</td></tr>
          <tr><td><strong>Hidden</strong></td><td>Courses hidden from public (<code>isActive == false</code>)</td></tr>
          <tr><td><strong>Pending</strong></td><td>Courses awaiting admin review</td></tr>
          <tr><td><strong>Rejected</strong></td><td>Courses rejected by admin</td></tr>
          <tr><td><strong>Draft</strong></td><td>Courses still being edited</td></tr>
        </tbody>
      </table>
      <p>
        The <strong>Course Performance</strong> table on the main admin dashboard
        (<code>/admin</code>) also has status and difficulty filters.
      </p>

      <h2>Available Courses</h2>
      <p>Pre-built course scripts cover:</p>
      <table>
        <thead>
          <tr><th>Course</th><th>Track</th><th>Difficulty</th></tr>
        </thead>
        <tbody>
          <tr><td>Solana Getting Started</td><td>Solana Core</td><td>Beginner</td></tr>
          <tr><td>Solana Core Concepts</td><td>Solana Core</td><td>Beginner</td></tr>
          <tr><td>Solana Frontend</td><td>Frontend</td><td>Intermediate</td></tr>
          <tr><td>Solana Developing Programs</td><td>Program Dev</td><td>Intermediate</td></tr>
          <tr><td>Anchor</td><td>Program Dev</td><td>Intermediate</td></tr>
          <tr><td>Solana Token Basics</td><td>Tokens &amp; DeFi</td><td>Beginner</td></tr>
          <tr><td>Solana Token Extensions</td><td>Tokens &amp; DeFi</td><td>Advanced</td></tr>
          <tr><td>Metaplex NFTs</td><td>NFTs &amp; Metaplex</td><td>Intermediate</td></tr>
          <tr><td>Metaplex Tokens</td><td>NFTs &amp; Metaplex</td><td>Intermediate</td></tr>
          <tr><td>Metaplex Smart Contracts</td><td>NFTs &amp; Metaplex</td><td>Advanced</td></tr>
          <tr><td>Metaplex Dev Tools</td><td>NFTs &amp; Metaplex</td><td>Beginner</td></tr>
          <tr><td>TypeScript SDK</td><td>SDKs &amp; Tools</td><td>Beginner</td></tr>
          <tr><td>Rust SDK</td><td>SDKs &amp; Tools</td><td>Intermediate</td></tr>
          <tr><td>Python SDK</td><td>SDKs &amp; Tools</td><td>Beginner</td></tr>
          <tr><td>Go SDK</td><td>SDKs &amp; Tools</td><td>Beginner</td></tr>
          <tr><td>Java SDK</td><td>SDKs &amp; Tools</td><td>Beginner</td></tr>
          <tr><td>Gaming SDKs</td><td>Gaming</td><td>Intermediate</td></tr>
        </tbody>
      </table>

      <DocsPagination />
    </article>
  );
}
