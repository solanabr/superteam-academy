const ENROLLMENT_UPDATED_EVENT = "academy:enrollment-updated";

export function emitEnrollmentUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ENROLLMENT_UPDATED_EVENT));
}

export function onEnrollmentUpdated(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = () => listener();
  window.addEventListener(ENROLLMENT_UPDATED_EVENT, wrapped);
  return () => window.removeEventListener(ENROLLMENT_UPDATED_EVENT, wrapped);
}
