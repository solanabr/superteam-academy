import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  profileVisibility: "public" | "private";
  setDisplayName: (name: string | null) => void;
  setBio: (bio: string | null) => void;
  setAvatar: (avatar: string | null) => void;
  setProfileVisibility: (visibility: "public" | "private") => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      displayName: null,
      bio: null,
      avatar: null,
      profileVisibility: "public",
      setDisplayName: (displayName) => set({ displayName }),
      setBio: (bio) => set({ bio }),
      setAvatar: (avatar) => set({ avatar }),
      setProfileVisibility: (profileVisibility) => set({ profileVisibility }),
      reset: () => set({ displayName: null, bio: null, avatar: null, profileVisibility: "public" }),
    }),
    { name: "superteam-user" }
  )
);
