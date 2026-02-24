import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Environment Variables" };

export default function EnvVariablesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Environment Variables</h1>
      <p className="lead">
        Every environment variable the application needs, where to get each
        value, and whether it&apos;s required or optional.
      </p>

      <p>
        Create a <code>.env.local</code> file in the <code>app/</code> directory.
        Variables prefixed with <code>NEXT_PUBLIC_</code> are exposed to the
        browser; all others are server-only.
      </p>

      <h2>Supabase (Required)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_SUPABASE_URL</code></td>
            <td>Your Supabase project URL</td>
            <td>Supabase Dashboard → Settings → API → Project URL</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></td>
            <td>Public anonymous API key (safe for browser)</td>
            <td>Supabase Dashboard → Settings → API → anon public</td>
          </tr>
          <tr>
            <td><code>SUPABASE_SERVICE_ROLE_KEY</code></td>
            <td>Admin key that bypasses Row Level Security. <strong>Server-only — never expose to browser</strong></td>
            <td>Supabase Dashboard → Settings → API → service_role (secret)</td>
          </tr>
        </tbody>
      </table>

      <h2>Sanity CMS (Required)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_SANITY_PROJECT_ID</code></td>
            <td>Sanity project ID</td>
            <td>Sanity Manage → Project → ID</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_SANITY_DATASET</code></td>
            <td>Dataset name (usually &quot;production&quot;)</td>
            <td>Sanity Manage → Datasets</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_SANITY_API_VERSION</code></td>
            <td>API version date (e.g., &quot;2026-02-19&quot;)</td>
            <td>Use today&apos;s date or latest stable</td>
          </tr>
          <tr>
            <td><code>SANITY_API_TOKEN</code></td>
            <td>Write-access token for mutations. <strong>Server-only</strong></td>
            <td>Sanity Manage → API → Tokens → Add token (Editor role)</td>
          </tr>
        </tbody>
      </table>

      <h2>Solana / Web3 (Required for on-chain features)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_PROGRAM_ID</code></td>
            <td>Deployed Solana program address</td>
            <td>From <code>anchor deploy</code> output or <code>Anchor.toml</code></td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_SOLANA_RPC_URL</code></td>
            <td>Solana RPC endpoint URL</td>
            <td>Helius Dashboard → RPC Endpoints</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_SOLANA_NETWORK</code></td>
            <td>Network identifier: &quot;devnet&quot; or &quot;mainnet-beta&quot;</td>
            <td>Set based on your deployment target</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_XP_MINT</code></td>
            <td>XP Token-2022 mint address</td>
            <td>From program initialization or <code>wallets/xp-mint-keypair.json</code></td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_HELIUS_API_KEY</code></td>
            <td>Helius API key for DAS queries</td>
            <td>Helius Dashboard → API Keys</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_HELIUS_RPC</code></td>
            <td>Helius RPC URL (may differ from above)</td>
            <td>Helius Dashboard → RPC Endpoints</td>
          </tr>
          <tr>
            <td><code>BACKEND_SIGNER_KEY</code></td>
            <td>JSON array of the backend signer keypair bytes (for server-side signing). <strong>Server-only, highly sensitive</strong></td>
            <td>Contents of <code>wallets/signer.json</code></td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_CREDENTIAL_COLLECTION</code></td>
            <td>Metaplex Core collection address for credential NFTs</td>
            <td>From collection creation transaction</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_TREASURY_WALLET</code></td>
            <td>Treasury wallet address for receiving course creation fees</td>
            <td>Your designated treasury wallet public key</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_CREATE_COURSE_TRANSFER_SIZE</code></td>
            <td>SOL amount required to create a course (e.g., &quot;0.1&quot;)</td>
            <td>Set as desired</td>
          </tr>
        </tbody>
      </table>

      <h2>Sentry (Optional)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_SENTRY_DSN</code></td>
            <td>Sentry Data Source Name</td>
            <td>Sentry Dashboard → Settings → Projects → [project] → Client Keys (DSN)</td>
          </tr>
          <tr>
            <td><code>SENTRY_ORG</code></td>
            <td>Sentry organization slug (for sourcemaps)</td>
            <td>Sentry Dashboard → Settings → Organization</td>
          </tr>
          <tr>
            <td><code>SENTRY_PROJECT</code></td>
            <td>Sentry project slug</td>
            <td>Sentry Dashboard → Settings → Projects</td>
          </tr>
        </tbody>
      </table>

      <h2>Analytics (Optional)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code></td>
            <td>Google Analytics 4 Measurement ID (e.g., G-XXXXXXXX)</td>
            <td>GA4 → Admin → Data Streams → Measurement ID</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_POSTHOG_KEY</code></td>
            <td>PostHog project API key</td>
            <td>PostHog → Settings → Project API Key</td>
          </tr>
          <tr>
            <td><code>NEXT_PUBLIC_POSTHOG_HOST</code></td>
            <td>PostHog host URL (default: https://us.i.posthog.com)</td>
            <td>PostHog → Settings (US or EU cloud)</td>
          </tr>
        </tbody>
      </table>

      <h2>Admin (Required for admin features)</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_ADMIN_WALLETS</code></td>
            <td>Comma-separated list of admin wallet addresses</td>
            <td>Public keys of admin wallets (e.g., &quot;AbC...xyz,DeF...uvw&quot;)</td>
          </tr>
        </tbody>
      </table>

      <h2>Other</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Where to Get</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NEXT_PUBLIC_PRODUCTION_URL</code></td>
            <td>Production URL for meta tags and OG images</td>
            <td>Your deployment URL (e.g., https://superteam-academy-six.vercel.app)</td>
          </tr>
        </tbody>
      </table>

      <h2>Example .env.local</h2>
      <pre><code>{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-02-19
SANITY_API_TOKEN=sk...

# Solana
NEXT_PUBLIC_PROGRAM_ID=ACAD...
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=...
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_XP_MINT=XP...
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key
NEXT_PUBLIC_HELIUS_RPC=https://rpc.helius.xyz/?api-key=...
BACKEND_SIGNER_KEY=[1,2,3,...,64]
NEXT_PUBLIC_CREDENTIAL_COLLECTION=Coll...
NEXT_PUBLIC_TREASURY_WALLET=Treas...
NEXT_PUBLIC_CREATE_COURSE_TRANSFER_SIZE=0.1

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
SENTRY_ORG=your-org
SENTRY_PROJECT=superteam-academy

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Admin
NEXT_PUBLIC_ADMIN_WALLETS=AdminWallet1PublicKey,AdminWallet2PublicKey

# General
NEXT_PUBLIC_PRODUCTION_URL=https://superteam-academy-six.vercel.app`}</code></pre>

      <DocsPagination />
    </article>
  );
}
