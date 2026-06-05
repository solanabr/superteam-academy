import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createDemoServerClient();
  }

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

function createDemoServerClient() {
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
    },
    from() {
      return createQuery();
    },
    rpc() {
      return createQuery();
    },
  } as unknown as ReturnType<typeof createServerClient<Database>>;
}
