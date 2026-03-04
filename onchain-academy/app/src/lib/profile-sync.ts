const PROFILE_UPDATED_EVENT = "academy:profile-updated";

export function emitProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function onProfileUpdated(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = () => listener();
  window.addEventListener(PROFILE_UPDATED_EVENT, wrapped);
  return () => window.removeEventListener(PROFILE_UPDATED_EVENT, wrapped);
}
