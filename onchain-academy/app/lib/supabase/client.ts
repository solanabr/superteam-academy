/**
 * lib/supabase/client.ts
 *
 * Browser-only Supabase client. Manages the auth session in cookies so the
 * server can read it via lib/supabase/server.ts.
 *
 * Uses @supabase/ssr instead of raw @supabase/supabase-js to ensure cookies
 * are shared correctly between client and server in Next.js App Router.
 *
 * Import this in 'use client' components — never in server code.
 *
 * Requires: npm install @supabase/ssr
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabaseClient';

let _browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a singleton browser client.
 * Safe to call on every render — the instance is memoised.
 */
export function createSupabaseBrowserClient() {
  if (_browserClient) return _browserClient;

  _browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return _browserClient;
}
