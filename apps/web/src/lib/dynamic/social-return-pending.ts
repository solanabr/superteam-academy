/**
 * Social-return pending state, published by `DynamicAuthHandler` while the
 * redirect-return handshake runs and consumed by the sign-in buttons (via
 * `useSocialReturnPending`) so THEY carry the loading state — the owner's
 * call over a full-screen overlay. A module-level store because the handler
 * and the header render in unrelated trees; threading a context through the
 * layout for one boolean would be all ceremony.
 *
 * Its own module, free of any Dynamic SDK import: the header's sign-in
 * trigger reads this on EVERY route, and pulling `lib/dynamic/social` (which
 * imports the SDK) into that chunk is exactly what #1097 removed.
 */

let socialReturnPending = false;
const pendingListeners = new Set<() => void>();

export function setSocialReturnPending(pending: boolean): void {
  socialReturnPending = pending;
  pendingListeners.forEach((listener) => listener());
}

export function subscribeSocialReturnPending(listener: () => void): () => void {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

export function getSocialReturnPending(): boolean {
  return socialReturnPending;
}
