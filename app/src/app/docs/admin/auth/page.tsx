import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Authentication" };

export default function AuthPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Authentication</h1>
      <p className="lead">
        Superteam Academy supports three authentication methods: Google OAuth,
        GitHub OAuth, and Solana wallet-based auth — all managed through
        Supabase Auth with custom extensions.
      </p>

      <h2>Auth Architecture</h2>
      <pre><code>{`┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Google OAuth │     │ GitHub OAuth  │     │ Wallet Auth  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌────────────────────────────────────────────────────────┐
│                    Supabase Auth                       │
│  - Session management                                  │
│  - Token refresh                                       │
│  - User table (auth.users)                             │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  profiles table     │
              │  (public schema)    │
              └─────────────────────┘`}</code></pre>

      <h2>OAuth Flow (Google / GitHub)</h2>
      <ol>
        <li>User clicks &quot;Sign in with Google/GitHub&quot;</li>
        <li>Redirected to OAuth provider</li>
        <li>After authorization, redirected to <code>/api/auth/callback</code></li>
        <li>Callback exchanges the code for a Supabase session</li>
        <li>Session cookies set automatically</li>
        <li><code>AuthProvider</code> detects the session change</li>
        <li>Profile is auto-created/updated (name, avatar from OAuth)</li>
      </ol>

      <h3>Setting Up OAuth Providers</h3>
      <p>See the <a href="/docs/admin/supabase">Supabase page</a> for detailed setup instructions.</p>

      <h2>Wallet-Based Auth Flow</h2>
      <p>
        Wallet auth creates a Supabase user without OAuth. Here&apos;s the flow:
      </p>
      <ol>
        <li>User clicks &quot;Sign in with Wallet&quot;</li>
        <li>Wallet adapter prompts for a signature</li>
        <li>Client sends wallet address + signed message to <code>POST /api/auth/wallet</code></li>
        <li>Server verifies the signature using <code>tweetnacl</code></li>
        <li>Server creates a deterministic email: <code>{`{walletAddress}@wallet.superteam.academy`}</code></li>
        <li>Server creates a deterministic password: <code>SHA-256(walletAddress)</code></li>
        <li>Server signs up or signs in via Supabase Admin API</li>
        <li>Returns access and refresh tokens to the client</li>
        <li>Client sets the session using these tokens</li>
      </ol>

      <blockquote>
        <p>
          <strong>Security note:</strong> The deterministic email/password is a
          workaround to use Supabase Auth with wallet-based auth. The actual
          authentication proof is the cryptographic signature, verified server-side.
        </p>
      </blockquote>

      <h2>Wallet Linking</h2>
      <p>
        Users who signed in with OAuth can link a Solana wallet to their account:
      </p>
      <ol>
        <li>User connects wallet via the wallet adapter</li>
        <li>Client sends wallet address + signature to <code>POST /api/auth/link-wallet</code></li>
        <li>Server verifies signature + checks uniqueness</li>
        <li>Updates <code>profiles.wallet_address</code></li>
        <li>Creates a <code>wallet_links</code> record with the signature proof</li>
      </ol>

      <h2>AuthProvider</h2>
      <p>
        The <code>AuthProvider</code> component (<code>components/providers/auth-provider.tsx</code>)
        manages auth state:
      </p>
      <ul>
        <li>Listens to <code>onAuthStateChange</code> from Supabase</li>
        <li>Auto-creates profile on first sign-in</li>
        <li>Uses a 5-second safety timeout to prevent infinite loading states</li>
        <li>Exposes context: <code>user</code>, <code>profile</code>, <code>loading</code>, <code>showOnboarding</code></li>
        <li>Methods: <code>signInWithGoogle</code>, <code>signInWithGithub</code>, <code>signInWithWallet</code>, <code>linkWallet</code>, <code>signOut</code>, <code>refreshProfile</code></li>
      </ul>

      <h2>Admin Access Control</h2>
      <p>
        Admin access is wallet-based. The <code>NEXT_PUBLIC_ADMIN_WALLETS</code>
        environment variable contains a comma-separated list of admin wallet
        addresses.
      </p>
      <ul>
        <li><code>useAdmin()</code> hook checks if the connected wallet is in the admin list</li>
        <li><code>AdminRoute</code> component wraps admin pages — redirects non-admins</li>
        <li>Admin API routes also verify the connected wallet</li>
      </ul>

      <h3>Adding an Admin</h3>
      <ol>
        <li>Get the admin&apos;s Solana wallet public key</li>
        <li>Add it to <code>NEXT_PUBLIC_ADMIN_WALLETS</code> (comma-separated)</li>
        <li>Redeploy the application</li>
      </ol>

      <h2>Protected Routes</h2>
      <p>Two protection wrappers:</p>
      <ul>
        <li><code>ProtectedRoute</code> — Requires authentication (any user)</li>
        <li><code>AdminRoute</code> — Requires authentication + admin wallet</li>
      </ul>
      <p>
        Both show a loading state while auth is being determined, then redirect
        to sign-in or home if unauthorized.
      </p>

      <h2>Session Management</h2>
      <ul>
        <li>Sessions are stored as HTTP-only cookies by Supabase SSR</li>
        <li>Tokens are auto-refreshed transparently</li>
        <li>Server-side pages can access the session via <code>createServerClient</code></li>
        <li>Client-side pages access the session via <code>AuthProvider</code> context</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
