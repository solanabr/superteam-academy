import Link from "next/link";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { LoginActions } from "@/components/LoginActions";

export default async function LoginPage() {
  const googleEnabled = await isGoogleAuthEnabled();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in with Google and optionally link your Solana wallet.
        </p>

        <div className="mt-6 space-y-3">
          <LoginActions googleEnabled={googleEnabled} />
          {!googleEnabled ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Google OAuth is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
            </p>
          ) : null}
        </div>

        <div className="mt-6 text-sm">
          <Link className="text-zinc-700 underline" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
