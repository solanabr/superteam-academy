/**
 * src/services/types.ts
 *
 * TypeScript interfaces for Superteam Academy Service Layer.
 */

export interface Progress {
  userId: string;
  courseId: string;
  lessonIndex: number;
  completed: boolean;
  xpEarned: number;
  completedAt?: Date;
}

export interface CredentialMetadata {
  name: string;
  image?: string;
  description?: string;
}

export interface Credential {
  mintAddress: string;
  track: string;
  level: number;
  metadata: CredentialMetadata;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  freezeAvailable: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  xpReward: number;
  track: string;
  published: boolean;
  language: 'en' | 'pt' | 'es';
}

export type PortableTextContent = Record<string, unknown>;

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface ChallengeConfig {
  starterCode: string;
  testCases: TestCase[];
  language: 'rust' | 'typescript';
}

export interface Lesson {
  id: string;
  title: string;
  type: 'content' | 'challenge';
  content: PortableTextContent[]; // Portable Text from Sanity
  challengeConfig?: ChallengeConfig;
  xpReward: number;
  order: number;
}

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface HeliusAsset {
  id: string;
  metadata?: {
    track?: string;
    level?: number;
    name?: string;
    image?: string;
    description?: string;
  };
}
