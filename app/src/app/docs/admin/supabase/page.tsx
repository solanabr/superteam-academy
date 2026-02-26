import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Supabase" };

export default function SupabasePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Supabase</h1>
      <p className="lead">
        Supabase provides the PostgreSQL database, authentication, and real-time
        subscriptions. It stores all user data, progress, achievements, and
        community content.
      </p>

      <h2>What Supabase Does</h2>
      <ul>
        <li><strong>Database</strong> — PostgreSQL with 8 tables for all app data</li>
        <li><strong>Authentication</strong> — OAuth (Google/GitHub) and custom wallet-based auth</li>
        <li><strong>Row Level Security</strong> — Ensures users can only access their own data</li>
        <li><strong>Storage</strong> — Avatar uploads and static assets</li>
      </ul>

      <h2>Setting Up a Supabase Project</h2>
      <ol>
        <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">supabase.com/dashboard</a></li>
        <li>Click <strong>New project</strong></li>
        <li>Choose an organization (or create one)</li>
        <li>Enter a project name (e.g., &quot;superteam-academy&quot;)</li>
        <li>Set a database password (save it securely)</li>
        <li>Select a region close to your target audience</li>
        <li>Click <strong>Create new project</strong></li>
      </ol>

      <h3>Get Your API Keys</h3>
      <p>
        Go to <strong>Settings → API</strong>:
      </p>
      <ul>
        <li><strong>Project URL</strong> → <code>NEXT_PUBLIC_SUPABASE_URL</code></li>
        <li><strong>anon public</strong> key → <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
        <li><strong>service_role</strong> key → <code>SUPABASE_SERVICE_ROLE_KEY</code> (keep secret!)</li>
      </ul>

      <h2>Database Schema</h2>
      <p>The application uses 8 tables:</p>
      <table>
        <thead>
          <tr><th>Table</th><th>Purpose</th><th>Key Columns</th></tr>
        </thead>
        <tbody>
          <tr><td><code>profiles</code></td><td>User profiles (extends auth.users)</td><td>id, wallet_address, username, display_name, avatar_url, language, theme, onboarding_completed</td></tr>
          <tr><td><code>wallet_links</code></td><td>Wallet linking records</td><td>user_id, wallet_address, signature</td></tr>
          <tr><td><code>course_progress</code></td><td>Enrollment &amp; lesson progress</td><td>user_id, course_id, completed_lessons (bitmap), xp_earned, is_finalized</td></tr>
          <tr><td><code>streaks</code></td><td>Learning streak tracking</td><td>user_id, current_streak, longest_streak, last_activity_date, streak_history</td></tr>
          <tr><td><code>user_achievements</code></td><td>Achievement records</td><td>user_id, achievement_id, unlocked_at, minted</td></tr>
          <tr><td><code>activities</code></td><td>Activity log</td><td>user_id, type, metadata, created_at</td></tr>
          <tr><td><code>comments</code></td><td>Lesson comments + forum posts</td><td>user_id, course_id, lesson_index, content, parent_id, helpful_count</td></tr>
          <tr><td><code>community_help</code></td><td>Help tracking for achievements</td><td>helper_id, helped_id, comment_id</td></tr>
        </tbody>
      </table>

      <h2>Running Migrations</h2>
      <p>
        Migrations are located in <code>app/supabase/migrations/</code>. Apply them
        in order:
      </p>

      <h3>Option 1: Supabase CLI</h3>
      <pre><code>{`# Install Supabase CLI
npm install -g supabase

# Link to your project
cd app
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push`}</code></pre>

      <h3>Option 2: SQL Editor</h3>
      <ol>
        <li>Open <strong>Supabase Dashboard → SQL Editor</strong></li>
        <li>Open each migration file in order from <code>app/supabase/migrations/</code></li>
        <li>Paste the SQL and click <strong>Run</strong></li>
      </ol>

      <h3>Migration Files</h3>
      <ul>
        <li><code>001_initial.sql</code> — Core schema: profiles, course_progress, streaks, achievements, activities</li>
        <li><code>002_comments.sql</code> — Comments table and community_help</li>
        <li><code>003_onboarding.sql</code> — Onboarding columns on profiles</li>
      </ul>

      <h2>Setting Up OAuth Providers</h2>

      <h3>Google OAuth</h3>
      <ol>
        <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → Credentials</a></li>
        <li>Create an OAuth 2.0 Client ID</li>
        <li>Set authorized redirect URI: <code>https://your-project.supabase.co/auth/v1/callback</code></li>
        <li>Copy the Client ID and Client Secret</li>
        <li>In Supabase: <strong>Authentication → Providers → Google</strong></li>
        <li>Enable it and paste the Client ID and Secret</li>
      </ol>

      <h3>GitHub OAuth</h3>
      <ol>
        <li>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">GitHub → Settings → Developer settings → OAuth Apps</a></li>
        <li>Create a new OAuth App</li>
        <li>Set callback URL: <code>https://your-project.supabase.co/auth/v1/callback</code></li>
        <li>Copy the Client ID and Secret</li>
        <li>In Supabase: <strong>Authentication → Providers → GitHub</strong></li>
        <li>Enable it and paste the Client ID and Secret</li>
      </ol>

      <h2>Row Level Security (RLS)</h2>
      <p>
        All tables have RLS enabled. The key policies:
      </p>
      <ul>
        <li><strong>Profiles</strong> — Users can read all profiles, update only their own</li>
        <li><strong>Course Progress</strong> — Users can read/insert/update only their own rows</li>
        <li><strong>Streaks</strong> — Users can read/update only their own</li>
        <li><strong>Comments</strong> — Anyone can read; authenticated users can insert; authors can update/delete their own</li>
      </ul>

      <blockquote>
        <p>
          <strong>Important:</strong> API routes use the <code>SUPABASE_SERVICE_ROLE_KEY</code>
          which bypasses RLS. This is intentional — server-side operations need
          full access. Never expose this key to the client.
        </p>
      </blockquote>

      <h2>Supabase in the Codebase</h2>
      <p>Three client configurations:</p>
      <ul>
        <li><code>lib/supabase/browser.ts</code> — Browser client (uses anon key, respects RLS)</li>
        <li><code>lib/supabase/server.ts</code> — Server client for SSR (cookie-based auth)</li>
        <li><code>lib/supabase/client.ts</code> — Admin client (service role key, bypasses RLS)</li>
      </ul>

      <h2>Common Operations</h2>

      <h3>Check Database Health</h3>
      <p>Go to Supabase Dashboard → Table Editor to browse data.</p>

      <h3>Reset a User&apos;s Progress</h3>
      <pre><code>{`-- In Supabase SQL Editor
DELETE FROM course_progress WHERE user_id = 'user-uuid';
DELETE FROM activities WHERE user_id = 'user-uuid';
UPDATE streaks SET current_streak = 0 WHERE user_id = 'user-uuid';`}</code></pre>

      <h3>Mark All Existing Users as Onboarded</h3>
      <pre><code>{`UPDATE profiles SET onboarding_completed = true WHERE created_at < NOW();`}</code></pre>

      <DocsPagination />
    </article>
  );
}
