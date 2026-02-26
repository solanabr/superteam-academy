import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Troubleshooting" };

export default function TroubleshootingPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Troubleshooting</h1>
      <p className="lead">
        Common issues, their causes, and solutions. Check here before opening an
        issue.
      </p>

      <h2>Build Errors</h2>

      <h3>&quot;Module not found&quot; errors</h3>
      <p><strong>Cause</strong>: Missing dependencies or incorrect imports.</p>
      <pre><code>{`# Solution: Reinstall dependencies
cd app
rm -rf node_modules .next
pnpm install
pnpm build`}</code></pre>

      <h3>TypeScript errors on build</h3>
      <p><strong>Cause</strong>: Type mismatches or missing type declarations.</p>
      <pre><code>{`# Check types without building
npx tsc --noEmit

# Common fix: ensure @types packages match runtime versions`}</code></pre>

      <h3>&quot;pino-pretty&quot; or &quot;encoding&quot; warnings</h3>
      <p>
        <strong>Cause</strong>: These are Solana SDK dependencies that don&apos;t work
        in the browser. They&apos;re already configured as webpack externals in
        <code>next.config.ts</code> — these warnings can be safely ignored.
      </p>

      <h2>Authentication Issues</h2>

      <h3>OAuth redirect fails</h3>
      <p><strong>Causes &amp; Solutions</strong>:</p>
      <ul>
        <li>Check that the OAuth callback URL is correctly set in Google/GitHub: <code>https://your-project.supabase.co/auth/v1/callback</code></li>
        <li>Verify <code>NEXT_PUBLIC_SUPABASE_URL</code> matches the Supabase project URL</li>
        <li>Check Supabase Dashboard → Authentication → URL Configuration → Site URL</li>
      </ul>

      <h3>Wallet auth fails with &quot;Invalid signature&quot;</h3>
      <ul>
        <li>Ensure the wallet is connected to the correct network</li>
        <li>Check that <code>tweetnacl</code> is installed: <code>pnpm list tweetnacl</code></li>
        <li>Try disconnecting and reconnecting the wallet</li>
      </ul>

      <h3>Session expires immediately</h3>
      <ul>
        <li>Check Supabase JWT expiry settings (Dashboard → Auth → Settings)</li>
        <li>Verify cookies are not being blocked by browser extensions</li>
        <li>Ensure <code>@supabase/ssr</code> is configured correctly</li>
      </ul>

      <h2>Supabase Issues</h2>

      <h3>RLS (Row Level Security) blocking requests</h3>
      <p>
        <strong>Symptom</strong>: API returns empty data or 403 errors.
      </p>
      <ul>
        <li>Server-side routes should use <code>SUPABASE_SERVICE_ROLE_KEY</code> (bypasses RLS)</li>
        <li>Client-side reads need proper RLS policies</li>
        <li>Check the SQL Editor: <code>{`SELECT * FROM pg_policies;`}</code></li>
      </ul>

      <h3>Migration errors</h3>
      <pre><code>{`# View current migration status
npx supabase migration list

# Reset and re-apply (CAUTION: destroys data)
npx supabase db reset`}</code></pre>

      <h2>Sanity Issues</h2>

      <h3>Courses not showing up</h3>
      <ul>
        <li>Verify <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> are correct</li>
        <li>Check that courses are published (not drafts) in Sanity Studio</li>
        <li>Check <code>isPublished</code> and <code>isActive</code> fields are <code>true</code></li>
        <li>Test GROQ queries in Sanity&apos;s Vision tool at <code>/studio</code></li>
      </ul>

      <h3>Push scripts fail</h3>
      <ul>
        <li>Verify <code>SANITY_API_TOKEN</code> has write permissions</li>
        <li>Check CORS settings include your origin</li>
        <li>Run with verbose logging: <code>DEBUG=* npx ts-node scripts/push-courses-to-sanity.ts</code></li>
      </ul>

      <h3>/studio returns 404</h3>
      <ul>
        <li>Verify the <code>app/src/app/studio/[[...tool]]/page.tsx</code> file exists</li>
        <li>Check <code>sanity.config.ts</code> is valid</li>
        <li>Ensure <code>sanity</code> is in devDependencies</li>
      </ul>

      <h2>Solana / On-Chain Issues</h2>

      <h3>Wallet connection fails</h3>
      <ul>
        <li>Ensure a wallet extension is installed (Phantom, Solflare, etc.)</li>
        <li>Check that <code>NEXT_PUBLIC_SOLANA_NETWORK</code> matches the wallet network</li>
        <li>Try refreshing the page after installing the wallet</li>
        <li>Check browser console for Wallet Adapter errors</li>
      </ul>

      <h3>Transaction fails with &quot;insufficient funds&quot;</h3>
      <ul>
        <li>Devnet: Get free SOL with <code>solana airdrop 5</code></li>
        <li>Check the backend signer has enough SOL for transaction fees</li>
      </ul>

      <h3>PDA derivation mismatch</h3>
      <ul>
        <li>Verify <code>NEXT_PUBLIC_PROGRAM_ID</code> matches the deployed program</li>
        <li>Check that seed strings match exactly between frontend and program</li>
        <li>Ensure numeric types (u32 vs u64) match</li>
      </ul>

      <h3>&quot;Account not found&quot; errors</h3>
      <ul>
        <li>The program may need to be initialized first (Config PDA)</li>
        <li>The course may not exist on-chain (check with <code>solana account</code>)</li>
        <li>The user may not be enrolled on-chain</li>
      </ul>

      <h2>Performance Issues</h2>

      <h3>Slow page loads</h3>
      <ul>
        <li>Check Sentry Performance for slow transactions</li>
        <li>Verify RPC endpoint is responsive</li>
        <li>Check if Sanity CDN is being used (should be by default)</li>
        <li>Run Lighthouse: <code>npx playwright test --project lighthouse</code></li>
      </ul>

      <h3>Bundle size too large</h3>
      <pre><code>{`# Analyze bundle
ANALYZE=true pnpm build

# Check for duplicate dependencies
pnpm why <package-name>`}</code></pre>

      <h2>Development Environment</h2>

      <h3>Port 3000 already in use</h3>
      <pre><code>{`# Kill the process using port 3000
fuser -k 3000/tcp
# or
lsof -ti:3000 | xargs kill`}</code></pre>

      <h3>Hot reload not working</h3>
      <ul>
        <li>Check <code>node_modules/.next</code> is not corrupted: <code>rm -rf .next</code></li>
        <li>Restart the dev server</li>
        <li>Check disk space and inotify limits (Linux)</li>
      </ul>

      <h2>Getting Help</h2>
      <ul>
        <li>Check Sentry for detailed error reports</li>
        <li>Review browser DevTools console and network tab</li>
        <li>Search existing GitHub issues</li>
        <li>Open a new issue with: error message, steps to reproduce, environment info</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
