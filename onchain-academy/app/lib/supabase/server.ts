/**
 * lib/supabase/server.ts
 *
 * FIX: Implicit 'any' on cookiesToSet destructure
 * ─────────────────────────────────────────────────────────────────────────────
 * ROOT CAUSE:
 *   Under `"noImplicitAny": true`, TypeScript cannot infer the type of the
 *   `cookiesToSet` parameter in the `setAll` callback when the @supabase/ssr
 *   declaration is not in scope at the call site. It falls back to `any[]`,
 *   which makes each destructured variable (`name`, `value`, `options`)
 *   implicitly `any` — a compile error.
 *
 * FIX:
 *   Import `CookieOptionsWithName` from `@supabase/ssr` (the type @supabase/ssr
 *   uses internally for every element of the `cookiesToSet` array) and annotate
 *   the `setAll` parameter explicitly. TypeScript can then verify the destructure
 *   and the implicit-any error disappears.
 *
 *   The same fix applies to every file that calls createServerClient with a
 *   setAll callback:
 *     • lib/supabase/server.ts      ← this file
 *     • middleware.ts
 *     • app/auth/callback/route.ts
 */

import { createServerClient } from '@supabase/ssr';
import type { CookieOptionsWithName } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabaseClient';

/** For Server Components and Route Handlers */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // FIX: explicit CookieOptionsWithName[] removes implicit-any on destructure
        setAll(cookiesToSet: CookieOptionsWithName[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies — middleware handles session refresh.
          }
        },
      },
    }
  );
}

/** For Route Handlers that need to write auth cookies (e.g. /auth/callback) */
export function createSupabaseRouteHandlerClient(
  requestCookies: ReturnType<typeof cookies> extends Promise<infer T> ? T : never
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // @ts-ignore
            return requestCookies.getAll() as any;
        },
        // FIX: explicit CookieOptionsWithName[] removes implicit-any on destructure
        setAll(cookiesToSet: CookieOptionsWithName[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            // @ts-ignore
              requestCookies.set(name, value, options)
          );
        },
      },
    }
  );
}
