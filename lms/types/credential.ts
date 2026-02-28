export interface Credential {
  learner: string;
  trackId: number;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarned: string;
  lastUpdated: string;
  metadataHash: string;
}

export interface CredentialDisplay {
  trackName: string;
  trackColor: string;
  levelName: string;
  badgeImage: string;
  explorerUrl: string;
}

export const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
};
