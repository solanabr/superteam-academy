import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "API Reference" };

export default function ApiReferencePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>API Reference</h1>
      <p className="lead">
        Complete reference for all API routes in the application. All endpoints
        are Next.js API routes under <code>/api/</code>.
      </p>

      <h2>Authentication</h2>

      <h3>GET /api/auth/callback</h3>
      <p>OAuth callback handler. Exchanges authorization code for Supabase session.</p>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>code</code></td><td>query</td><td>OAuth authorization code</td></tr>
          <tr><td><code>next</code></td><td>query</td><td>Redirect path after auth (default: /dashboard)</td></tr>
        </tbody>
      </table>

      <h3>POST /api/auth/wallet</h3>
      <p>Wallet-based authentication. Verifies signature, creates/signs in user.</p>
      <pre><code>{`// Request body
{
  "walletAddress": "AbC...xyz",
  "signature": "base58-signature",
  "message": "Sign in to Superteam Academy: <nonce>"
}

// Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}`}</code></pre>

      <h3>POST /api/auth/link-wallet</h3>
      <p>Link a Solana wallet to an existing OAuth account. Requires authentication.</p>
      <pre><code>{`// Request body
{
  "walletAddress": "AbC...xyz",
  "signature": "base58-signature",
  "message": "Link wallet to Superteam Academy: <nonce>"
}

// Response
{ "success": true }`}</code></pre>

      <h3>POST /api/auth/ensure-profile</h3>
      <p>Creates or updates a user profile after authentication.</p>

      <h2>Enrollment</h2>

      <h3>POST /api/enroll</h3>
      <p>Enroll a user in a course. Creates course_progress record and updates streak.</p>
      <pre><code>{`// Request body
{
  "courseId": "sanity-course-id",
  "totalLessons": 12
}

// Response
{ "success": true, "enrollment": { ... } }`}</code></pre>

      <h2>Progress</h2>

      <h3>GET /api/progress?courseId=xxx</h3>
      <p>Get progress for a specific course or all courses.</p>

      <h3>POST /api/progress</h3>
      <p>Update lesson progress.</p>
      <pre><code>{`// Request body
{
  "courseId": "sanity-course-id",
  "lessonIndex": 5,
  "xpEarned": 50
}`}</code></pre>

      <h3>POST /api/lessons/complete</h3>
      <p>Mark a lesson as complete. Rewards XP and updates streak.</p>
      <pre><code>{`// Request body
{
  "courseId": "sanity-course-id",
  "lessonIndex": 5,
  "xp": 50
}`}</code></pre>

      <h2>Profile</h2>

      <h3>GET /api/profile</h3>
      <p>Get the authenticated user&apos;s profile.</p>

      <h3>POST /api/profile</h3>
      <p>Update profile fields.</p>
      <pre><code>{`// Request body
{
  "display_name": "New Name",
  "username": "newusername",
  "language": "pt-br",
  "theme": "dark"
}`}</code></pre>

      <h3>POST /api/profile/avatar</h3>
      <p>Upload a new avatar image. Multipart form data.</p>

      <h2>Courses</h2>

      <h3>GET /api/courses/my</h3>
      <p>Get courses created by the authenticated user.</p>

      <h3>POST /api/courses/create</h3>
      <p>Submit a new course for review.</p>

      <h3>GET /api/courses/[id]</h3>
      <p>Get course details by Sanity document ID.</p>

      <h3>POST /api/courses/submit</h3>
      <p>Submit a draft course for admin review.</p>

      <h3>POST /api/courses/finalize</h3>
      <p>Finalize a completed course (awards XP, marks as complete).</p>

      <h2>Comments &amp; Forum</h2>

      <h3>GET /api/comments?courseId=xxx&amp;lessonIndex=5</h3>
      <p>Get comments for a specific lesson.</p>

      <h3>POST /api/comments</h3>
      <p>Create a new comment or reply.</p>
      <pre><code>{`// Request body
{
  "courseId": "sanity-course-id",
  "lessonIndex": 5,
  "content": "Great lesson!",
  "parentId": null  // or comment ID for replies
}`}</code></pre>

      <h3>POST /api/comments/helpful</h3>
      <p>Mark a comment as helpful.</p>
      <pre><code>{`{ "commentId": "comment-uuid" }`}</code></pre>

      <h3>GET /api/forum</h3>
      <p>Get forum posts (comments without courseId).</p>

      <h3>POST /api/forum</h3>
      <p>Create a forum post.</p>

      <h3>GET /api/forum/[id]</h3>
      <p>Get a forum post with its replies.</p>

      <h2>Achievements</h2>

      <h3>GET /api/achievements</h3>
      <p>Get all achievements for the authenticated user.</p>

      <h3>POST /api/achievements/award</h3>
      <p>Award an achievement to a user (admin/system).</p>

      <h3>POST /api/mint/achievement</h3>
      <p>Mint an achievement as an on-chain NFT.</p>

      <h3>POST /api/mint/early-adopter</h3>
      <p>Mint the Early Adopter achievement NFT.</p>

      <h2>Leaderboard</h2>

      <h3>GET /api/leaderboard</h3>
      <p>Get the XP leaderboard.</p>
      <pre><code>{`// Response
{
  "leaderboard": [
    { "userId": "...", "displayName": "...", "totalXp": 5000, "level": 7 },
    ...
  ]
}`}</code></pre>

      <h2>Metadata</h2>

      <h3>GET /api/metadata/credential/[courseId]</h3>
      <p>
        Dynamic NFT metadata endpoint. Returns JSON metadata for credential
        NFTs, used by Metaplex Core for on-chain metadata resolution.
      </p>

      <h2>Admin</h2>

      <h3>GET /api/admin/courses</h3>
      <p>List all submitted courses pending review (admin only).</p>

      <h3>POST /api/admin/courses/[id]/approve</h3>
      <p>Approve a submitted course. Creates it on-chain and publishes to Sanity.</p>

      <h3>POST /api/admin/courses/[id]/reject</h3>
      <p>Reject a submitted course with a reason.</p>
      <pre><code>{`{ "reason": "Content quality needs improvement" }`}</code></pre>

      <h2>Onboarding</h2>

      <h3>POST /api/onboarding/complete</h3>
      <p>Mark onboarding as completed for the authenticated user.</p>

      <h2>Health</h2>

      <h3>GET /api/health</h3>
      <p>Health check endpoint. Returns 200 if the server is running.</p>

      <DocsPagination />
    </article>
  );
}
