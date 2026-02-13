export type AuthProvider = 'wallet' | 'google' | 'github' | 'credentials';

export interface RegistrationRecord {
  id: string;
  name: string;
  email: string;
  username: string;
  providers: AuthProvider[];
  walletAddress?: string;
  bio?: string;
  darkModeDefault?: boolean;
  emailNotifications?: boolean;
  publicProfile?: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'superteam.registration.v1';
export const REGISTRATION_CHANGED_EVENT = 'superteam.registration.changed';

function notifyRegistrationChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(REGISTRATION_CHANGED_EVENT));
}

function isProvider(value: string): value is AuthProvider {
  return value === 'wallet' || value === 'google' || value === 'github' || value === 'credentials';
}

export function getRegistrationRecord(): RegistrationRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<RegistrationRecord>;

    if (!parsed.id || !parsed.name || !parsed.email || !parsed.username || !parsed.createdAt) {
      return null;
    }

    const providers = (parsed.providers ?? []).filter((provider): provider is AuthProvider =>
      isProvider(provider)
    );

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      username: parsed.username,
      providers,
      walletAddress: parsed.walletAddress,
      bio: typeof parsed.bio === 'string' ? parsed.bio : undefined,
      darkModeDefault:
        typeof parsed.darkModeDefault === 'boolean' ? parsed.darkModeDefault : undefined,
      emailNotifications:
        typeof parsed.emailNotifications === 'boolean' ? parsed.emailNotifications : undefined,
      publicProfile:
        typeof parsed.publicProfile === 'boolean' ? parsed.publicProfile : undefined,
      createdAt: parsed.createdAt
    };
  } catch {
    return null;
  }
}

export function saveRegistrationRecord(record: RegistrationRecord): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    notifyRegistrationChanged();
  } catch {
    // Ignore storage failures (private mode/quota) to avoid breaking the UI.
  }
}

export function updateRegistrationRecord(
  patch: Partial<Omit<RegistrationRecord, 'id' | 'createdAt'>>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getRegistrationRecord();
  if (!current) {
    return;
  }

  saveRegistrationRecord({
    ...current,
    ...patch
  });
}

export function clearRegistrationRecord(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyRegistrationChanged();
  } catch {
    // Ignore storage failures (private mode/quota) to avoid breaking the UI.
  }
}
