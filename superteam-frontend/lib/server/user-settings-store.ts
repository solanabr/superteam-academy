import "server-only";

import { unstable_cache } from "next/cache";
import { getDb } from "./mongodb";
import { CacheTags } from "./cache-tags";

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

async function _getUserSettings(walletAddress: string): Promise<UserSettings> {
  const db = await getDb();
  const doc = await db
    .collection("user_settings")
    .findOne({ wallet: walletAddress });
  if (!doc) return { ...defaultSettings };
  const { _id, wallet, ...settings } = doc;
  return { ...defaultSettings, ...settings } as UserSettings;
}

function cachedGetUserSettings(wallet: string) {
  return unstable_cache(
    () => _getUserSettings(wallet),
    ["getUserSettings", wallet],
    { tags: [CacheTags.userSettings(wallet)], revalidate: 300 },
  );
}

export async function getUserSettings(
  walletAddress: string,
): Promise<UserSettings> {
  return cachedGetUserSettings(walletAddress)();
}

export async function updateUserSettings(
  walletAddress: string,
  updates: Partial<UserSettings>,
): Promise<UserSettings> {
  const db = await getDb();
  const result = await db
    .collection("user_settings")
    .findOneAndUpdate(
      { wallet: walletAddress },
      { $set: updates },
      { upsert: true, returnDocument: "after" },
    );
  const { _id, wallet, ...settings } = result!;
  return { ...defaultSettings, ...settings } as UserSettings;
}
