"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthControls() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/me" className="text-xs text-zinc-600 underline">
          {session.user.name}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link className="underline" href="/login">
      Sign in
    </Link>
  );
}
