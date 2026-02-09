"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass Web Locks API to prevent deadlocks in React StrictMode.
        // StrictMode's mount/unmount/remount cycle causes the lock from the
        // first mount to never release, blocking all subsequent auth calls.
        // Safe because createBrowserClient is a singleton — concurrent access
        // only occurs in StrictMode's double-mount scenario.
        lock: async <R>(
          _name: string,
          _acquireTimeout: number,
          fn: () => Promise<R>
        ): Promise<R> => {
          return fn();
        },
      },
    }
  );
}
