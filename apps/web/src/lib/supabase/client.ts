"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createDemoBrowserClient();
  }

  return createBrowserClient<Database>(
    url,
    anonKey,
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

function createDemoBrowserClient() {
  const emptyListResult = { data: [], error: null, count: 0 };
  const emptySingleResult = { data: null, error: null, count: 0 };

  const createQuery = (single = false): unknown => {
    const result = single ? emptySingleResult : emptyListResult;
    const query = {
      select() {
        return query;
      },
      eq() {
        return query;
      },
      neq() {
        return query;
      },
      in() {
        return query;
      },
      order() {
        return query;
      },
      limit() {
        return query;
      },
      single() {
        return createQuery(true);
      },
      maybeSingle() {
        return createQuery(true);
      },
      insert() {
        return query;
      },
      update() {
        return query;
      },
      upsert() {
        return query;
      },
      delete() {
        return query;
      },
      then(resolve: (value: typeof result) => void) {
        return Promise.resolve(result).then(resolve);
      },
    };

    return query;
  };

  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signOut() {
        return { error: null };
      },
      async signInWithOAuth() {
        return { data: null, error: null };
      },
    },
    from() {
      return createQuery();
    },
    rpc() {
      return createQuery();
    },
  } as unknown as ReturnType<typeof createBrowserClient<Database>>;
}
