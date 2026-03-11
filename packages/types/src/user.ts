export interface UserProfile {
  id: string;
  walletAddress: string | null;
  googleId: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks?: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  isPublic: boolean;
  nameRerollsUsed: number;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "progress" | "streaks" | "skills" | "community" | "special";
  unlockedAt?: Date;
  explorerUrl?: string;
  assetAddress?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  mintAddress: string | null;
  metadataUri: string | null;
  mintedAt: Date;
}
