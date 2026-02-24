const isBrowser = typeof window !== "undefined";

export function getPreference<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(`sa_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setPreference<T>(key: string, value: T) {
  if (!isBrowser) return;
  localStorage.setItem(`sa_${key}`, JSON.stringify(value));
}
