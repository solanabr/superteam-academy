import "server-only";

export type UserSettings = {
  name: string;
  bio: string;
  avatar: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  profilePublic: boolean;
};

const defaultSettings: UserSettings = {
  name: "",
  bio: "",
  avatar: "",
  twitter: "",
  github: "",
  linkedin: "",
  website: "",
  language: "en",
  theme: "dark",
  emailNotifications: true,
  profilePublic: true,
};

const settingsByWallet = new Map<string, UserSettings>();

export function getUserSettings(walletAddress: string): UserSettings {
  return settingsByWallet.get(walletAddress) ?? { ...defaultSettings };
}

export function updateUserSettings(
  walletAddress: string,
  updates: Partial<UserSettings>,
): UserSettings {
  const current = getUserSettings(walletAddress);
  const updated = { ...current, ...updates };
  settingsByWallet.set(walletAddress, updated);
  return updated;
}
