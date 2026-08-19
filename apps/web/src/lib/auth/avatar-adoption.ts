/**
 * Shared avatar-adoption rule for the auth chokepoints (#1070).
 *
 * Owner ruling 2026-08-18: a provider profile photo is adopted on FIRST
 * login only — once any avatar exists (provider photo or custom upload),
 * no sign-in ever changes it. Alternating Google/GitHub logins were
 * ping-ponging the learner's face; the cost is that a rotated provider
 * CDN URL no longer self-heals (the learner replaces it in settings).
 *
 * This predicate decides adoption only. Callers own URL vetting: the
 * Dynamic bridge filters non-https photos at the credential boundary
 * (before this check), and the OAuth callback takes the provider URL
 * from Supabase user_metadata as-is. Do not add scheme/host checks here.
 */
export function shouldAdoptAvatar(
  storedAvatarUrl: string | null,
  candidatePhotoUrl: string | null | undefined
): boolean {
  if (!candidatePhotoUrl) return false;
  return storedAvatarUrl === null;
}
