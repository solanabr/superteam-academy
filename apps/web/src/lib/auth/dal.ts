import "server-only";
import { cache } from "react";
import type { JwtPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-request cached auth claims for server components (Next's documented
 * DAL pattern). `getClaims()` verifies the session JWT locally against the
 * cached JWKS (falling back to `getUser()` on HS256), and React `cache()`
 * dedupes it, so any number of pages/components in one render share a single
 * read instead of each paying their own Supabase Auth round-trip.
 *
 * Returns the verified claims (`claims.sub` is the user id) or null when
 * there is no valid session. Pages that need the full user object (email
 * change flows, identities) should keep calling `supabase.auth.getUser()`
 * directly.
 */
export const getAuthClaims = cache(async (): Promise<JwtPayload | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});
