/**
 * A handle X itself accepts. Mirrored by `chk_profiles_x_username` in the
 * database, and it keeps the handle safe to put straight into an x.com URL.
 */
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

const PROFILE_URL =
  /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/([^/?#]+)\/?(?:[?#].*)?$/i;

/**
 * The bare handle from what an admin typed: `handle`, `@handle`, or an x.com /
 * twitter.com profile URL. `null` when it is not a valid handle.
 */
export function parseXHandle(input: string): string | null {
  let value = input.trim();
  const url = value.match(PROFILE_URL);
  if (url) value = url[1]!;
  value = value.replace(/^@/, "");
  return X_HANDLE.test(value) ? value : null;
}

export function xProfileUrl(username: string): string {
  return `https://x.com/${username}`;
}
