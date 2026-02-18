export type IdentityAchievement = {
  name: string;
  earned: boolean;
};

export type IdentityCertificate = {
  id: string;
  course: string;
  date: string;
  mintAddress: string;
};

export type IdentityProfile = {
  userId: string;
  walletAddress: string;
  username: string;
  name: string;
  bio: string;
  joinDate: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  rank: number;
  totalCompleted: number;
  badges: IdentityAchievement[];
  certificates: IdentityCertificate[];
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
};

export type IdentitySnapshot = {
  profile: IdentityProfile;
  chain: {
    programId: string;
    cluster: string;
    learnerPda: string;
    hasLearnerProfile: boolean;
  };
};
