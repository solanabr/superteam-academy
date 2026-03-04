export const DEFAULT_AVATAR_SRC = "/assets/default-avatar.svg";

export function normalizeAvatarUrl(url: string | null | undefined) {
  const value = (url ?? "").trim();
  if (!value) return "";
  // Backward-compat: older values may miss "/public/" in Supabase object URLs.
  return value.replace("/storage/v1/object/avatars/", "/storage/v1/object/public/avatars/");
}
