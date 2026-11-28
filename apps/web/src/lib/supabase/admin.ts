import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { requireServiceRoleKey } from "@/lib/supabase/admin-unavailable";
import type { Database } from "@/lib/supabase/types";

/** Throws AdminClientUnavailableError when the service-role key is unset. */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requireServiceRoleKey()
  );
}
