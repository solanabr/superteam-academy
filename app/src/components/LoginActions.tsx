"use client";

import { signIn } from "next-auth/react";

export function LoginActions({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <button
      type="button"
      disabled={!googleEnabled}
      onClick={() => signIn("google", { callbackUrl: "/me" })}
      className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      Continue with Google
    </button>
  );
}
