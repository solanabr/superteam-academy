import type { UserIdentity } from "@supabase/supabase-js";

/**
 * A handle X itself accepts. Mirrored by `chk_profiles_x_account` in the
 * database, and it keeps the handle safe to put straight into an x.com URL.
 */
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

export interface XAccount {
  /** X's numeric user id: the identity's `sub`. */
  id: string;
  /** The handle at link time, without the `@`. */
  username: string;
}

/**
 * Read the X account off a Supabase `x` identity. GoTrue's X provider stores
 * the handle as both `user_name` and `preferred_username`. `null` when either
 * the id or a valid handle is missing.
 */
export function xAccountOf(identity: UserIdentity): XAccount | null {
  const data = identity.identity_data ?? {};
  const id = data.sub ?? data.provider_id;
  const username = data.user_name ?? data.preferred_username;
  if (typeof id !== "string" || !id) return null;
  if (typeof username !== "string" || !X_HANDLE.test(username)) return null;
  return { id, username };
}

export function xProfileUrl(username: string): string {
  return `https://x.com/${username}`;
}
