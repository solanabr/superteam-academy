import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Project Setup" };

export default function SetupPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Project Setup</h1>
      <p className="lead">
        This guide walks you through cloning the repository, installing
        dependencies, configuring services, and running Superteam Academy
        locally. Follow every step — this is designed for beginners.
      </p>

      <h2>Prerequisites</h2>
      <p>Install the following before starting:</p>
      <table>
        <thead>
          <tr><th>Tool</th><th>Version</th><th>Installation</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Node.js</strong></td><td>18.x or later</td><td><code>https://nodejs.org</code></td></tr>
          <tr><td><strong>pnpm</strong></td><td>8.x or later</td><td><code>npm install -g pnpm</code></td></tr>
          <tr><td><strong>Git</strong></td><td>Any recent</td><td><code>https://git-scm.com</code></td></tr>
          <tr><td><strong>Rust</strong></td><td>1.82+</td><td><code>curl --proto &apos;=https&apos; --tlsv1.2 -sSf https://sh.rustup.rs | sh</code></td></tr>
          <tr><td><strong>Solana CLI</strong></td><td>1.18+</td><td><code>sh -c &quot;$(curl -sSfL https://release.anza.xyz/stable/install)&quot;</code></td></tr>
          <tr><td><strong>Anchor CLI</strong></td><td>0.31+</td><td><code>cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.1 anchor-cli</code></td></tr>
        </tbody>
      </table>

      <h2>Step 1: Clone the Repository</h2>
      <pre><code>{`git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy`}</code></pre>

      <h2>Step 2: Install Dependencies</h2>
      <pre><code>{`# Frontend (Next.js app)
cd app
pnpm install

# Solana program (if you need to build/test the on-chain program)
cd ../onchain-academy
pnpm install  # for TS integration tests`}</code></pre>

      <h2>Step 3: Set Up External Services</h2>
      <p>
        You need accounts on the following services. Each section has its
        own detailed page — here&apos;s the quick summary:
      </p>

      <h3>3a. Supabase (Required)</h3>
      <ol>
        <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> and create a new project</li>
        <li>Note your <strong>Project URL</strong> and <strong>Anon Key</strong> (Settings → API)</li>
        <li>Note your <strong>Service Role Key</strong> (Settings → API → service_role)</li>
        <li>Run the database migrations (see <a href="/docs/admin/supabase">Supabase</a> page)</li>
        <li>Set up authentication providers (Google, GitHub) in Supabase Dashboard → Authentication → Providers</li>
      </ol>

      <h3>3b. Sanity CMS (Required)</h3>
      <ol>
        <li>Go to <a href="https://sanity.io" target="_blank" rel="noopener noreferrer">sanity.io</a> and create a new project</li>
        <li>Note your <strong>Project ID</strong> and <strong>Dataset</strong> (usually &quot;production&quot;)</li>
        <li>Create an API token with write access (Manage → API → Tokens)</li>
        <li>See <a href="/docs/admin/sanity">Sanity CMS</a> for schema setup</li>
      </ol>

      <h3>3c. Sentry (Optional but recommended)</h3>
      <ol>
        <li>Go to <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">sentry.io</a> and create a new Next.js project</li>
        <li>Note your <strong>DSN</strong>, <strong>org slug</strong>, and <strong>project slug</strong></li>
        <li>See <a href="/docs/admin/sentry">Sentry Monitoring</a> for configuration</li>
      </ol>

      <h3>3d. Analytics (Optional)</h3>
      <ul>
        <li><strong>Google Analytics</strong> — Create a GA4 property at <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">analytics.google.com</a></li>
        <li><strong>PostHog</strong> — Create a project at <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">posthog.com</a></li>
        <li>See <a href="/docs/admin/analytics">Analytics</a> for details</li>
      </ul>

      <h3>3e. Helius (Required for on-chain features)</h3>
      <ol>
        <li>Go to <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">helius.dev</a> and create a free account</li>
        <li>Create an API key</li>
        <li>Note your <strong>API Key</strong> and <strong>RPC URL</strong></li>
      </ol>

      <h2>Step 4: Configure Environment Variables</h2>
      <p>
        Create the <code>.env.local</code> file in the <code>app/</code> directory:
      </p>
      <pre><code>{`cd app
cp .env.example .env.local  # if .env.example exists, otherwise create manually`}</code></pre>
      <p>
        Fill in all required variables. See <a href="/docs/admin/env-variables">Environment Variables</a> for
        the complete list with descriptions.
      </p>

      <h2>Step 5: Run Database Migrations</h2>
      <p>
        Apply the Supabase migrations in order. You can run them via the
        Supabase Dashboard SQL Editor or use the Supabase CLI:
      </p>
      <pre><code>{`# Option 1: Supabase CLI
cd app
npx supabase db push

# Option 2: Manually via SQL Editor
# Copy and run each migration file from app/supabase/migrations/ in order`}</code></pre>

      <h2>Step 6: Push Course Content to Sanity</h2>
      <pre><code>{`# From the root of the monorepo
cd scripts
npx ts-node push-courses-to-sanity.ts`}</code></pre>
      <p>
        This pushes all predefined courses to your Sanity project. Individual
        course scripts are also available (e.g., <code>push-solana-getting-started.ts</code>).
      </p>

      <h2>Step 7: Run the Development Server</h2>
      <pre><code>{`cd app
pnpm dev`}</code></pre>
      <p>
        Open <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">http://localhost:3000</a> in
        your browser. You should see the landing page.
      </p>

      <h2>Step 8: Build the Solana Program (Optional)</h2>
      <p>
        If you need to build or modify the on-chain program:
      </p>
      <pre><code>{`cd onchain-academy
anchor build
cargo fmt
cargo clippy -- -W clippy::all

# Run tests
cargo test --manifest-path tests/rust/Cargo.toml  # unit tests
anchor test                                        # integration tests`}</code></pre>

      <h2>Step 9: Verify Everything Works</h2>
      <ol>
        <li>Visit <code>http://localhost:3000</code> — Landing page loads</li>
        <li>Visit <code>http://localhost:3000/courses</code> — Course catalog shows courses</li>
        <li>Try signing in with Google or GitHub — Auth flow redirects correctly</li>
        <li>Visit <code>http://localhost:3000/studio</code> — Sanity Studio loads</li>
        <li>Check browser console — No critical errors</li>
      </ol>

      <h2>Quick Reference: Common Commands</h2>
      <pre><code>{`# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server

# Code quality
pnpm lint                   # Run ESLint
npx tsc --noEmit            # Type check

# Testing
npx playwright test         # Run E2E tests

# Solana program
anchor build                # Build program
anchor test                 # Run integration tests
anchor deploy               # Deploy to configured cluster`}</code></pre>

      <DocsPagination />
    </article>
  );
}
