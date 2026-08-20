import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Cookieless anon client. NOT `lib/supabase/server.ts` — that reads `cookies()`,
 * which opts the calling route/page out of static rendering and stamps
 * `Set-Cookie` on responses (which disqualifies them from CDN caching).
 * Sessions are disabled: for pure reads over world-readable views/tables and
 * anon-granted RPCs only.
 */
export function createCookielessClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
