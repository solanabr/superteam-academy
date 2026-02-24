const STORAGE_KEY_PREFIX = "academy-display-name-";

export function getDisplayName(walletAddress: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${walletAddress}`) ?? null;
}

const DISPLAY_NAME_CHANGED_EVENT = "academy-display-name-changed";

export function setDisplayName(walletAddress: string, name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${walletAddress}`, trimmed);
  } else {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${walletAddress}`);
  }
  window.dispatchEvent(new CustomEvent(DISPLAY_NAME_CHANGED_EVENT, { detail: { walletAddress } }));
}

export function onDisplayNameChanged(callback: (walletAddress: string) => void): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<{ walletAddress: string }>).detail.walletAddress);
  };
  window.addEventListener(DISPLAY_NAME_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DISPLAY_NAME_CHANGED_EVENT, handler);
}
