import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Creating an Account" };

export default function AccountPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Creating an Account</h1>
      <p className="lead">
        Superteam Academy supports three sign-in methods: Google, GitHub, and
        Solana wallet. You can use any of them to create your account.
      </p>

      <h2>Sign-In Methods</h2>

      <h3>Google</h3>
      <ol>
        <li>Click <strong>Sign In</strong> in the top navigation bar</li>
        <li>Select <strong>Continue with Google</strong></li>
        <li>Choose your Google account and authorize the app</li>
        <li>You&apos;ll be redirected back and signed in automatically</li>
      </ol>
      <p>
        Your name and avatar will be pre-filled from your Google profile. You can
        change them later in your profile settings.
      </p>

      <h3>GitHub</h3>
      <ol>
        <li>Click <strong>Sign In</strong> in the top navigation bar</li>
        <li>Select <strong>Continue with GitHub</strong></li>
        <li>Authorize the application on GitHub</li>
        <li>You&apos;ll be redirected back and signed in</li>
      </ol>
      <p>
        Your GitHub display name and avatar will be imported automatically.
      </p>

      <h3>Solana Wallet</h3>
      <ol>
        <li>Click <strong>Sign In</strong> in the top navigation bar</li>
        <li>Select <strong>Sign in with Wallet</strong></li>
        <li>Choose your wallet provider (Phantom, Solflare, Backpack, etc.)</li>
        <li>Approve the signature request — this proves you own the wallet</li>
        <li>Your account is created using your wallet address</li>
      </ol>

      <blockquote>
        <p>
          <strong>Note:</strong> Signing a message does NOT cost any SOL. It&apos;s a
          free, off-chain operation that simply proves wallet ownership.
        </p>
      </blockquote>

      <h2>First Sign-In: Onboarding</h2>
      <p>
        When you sign in for the first time, you&apos;ll see a short onboarding
        flow (4 steps):
      </p>
      <ol>
        <li><strong>Welcome</strong> — Quick intro to the platform</li>
        <li><strong>Profile Setup</strong> — Set your display name and avatar</li>
        <li><strong>Connect Wallet</strong> — Link a Solana wallet (required for enrollment; skip if you signed in with one)</li>
        <li><strong>Explore</strong> — Suggested beginner courses to get started</li>
      </ol>
      <p>
        You can skip the onboarding at any time. If you close it, it will
        resume where you left off on your next visit.
      </p>

      <h2>Account Security</h2>
      <ul>
        <li>Authentication is handled by Supabase Auth (OAuth 2.0 for Google/GitHub)</li>
        <li>Wallet auth uses cryptographic signature verification — no passwords stored</li>
        <li>Sessions expire automatically and are refreshed transparently</li>
        <li>You can sign out from any device using the user menu</li>
      </ul>

      <h2>Linking Multiple Sign-In Methods</h2>
      <p>
        If you signed in with Google or GitHub, you can also link a Solana wallet
        to your account later. This gives you the benefits of both: easy OAuth
        sign-in plus on-chain features.
      </p>
      <p>
        See <a href="/docs/wallet">Connecting a Wallet</a> for details.
      </p>

      <DocsPagination />
    </article>
  );
}
