export type ChallengeType =
  | "complete_lesson"
  | "complete_quiz"
  | "maintain_streak"
  | "earn_xp"
  | "enroll_course";

export interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  xpReward: number;
  icon: string;
}

export const challengePool: ChallengeDefinition[] = [
  {
    id: "cl-1",
    type: "complete_lesson",
    title: "Quick Learner",
    description: "Complete 1 lesson today",
    target: 1,
    xpReward: 25,
    icon: "BookOpen",
  },
  {
    id: "cl-2",
    type: "complete_lesson",
    title: "Dedicated Student",
    description: "Complete 3 lessons today",
    target: 3,
    xpReward: 75,
    icon: "GraduationCap",
  },
  {
    id: "cl-3",
    type: "earn_xp",
    title: "XP Hunter",
    description: "Earn 100 XP today",
    target: 100,
    xpReward: 50,
    icon: "Zap",
  },
  {
    id: "cl-4",
    type: "earn_xp",
    title: "XP Master",
    description: "Earn 250 XP today",
    target: 250,
    xpReward: 100,
    icon: "Star",
  },
  {
    id: "cl-5",
    type: "maintain_streak",
    title: "Streak Keeper",
    description: "Maintain your learning streak",
    target: 1,
    xpReward: 30,
    icon: "Flame",
  },
  {
    id: "cl-6",
    type: "enroll_course",
    title: "Explorer",
    description: "Enroll in a new course",
    target: 1,
    xpReward: 40,
    icon: "Compass",
  },
  {
    id: "cl-7",
    type: "complete_quiz",
    title: "Quiz Master",
    description: "Complete a coding challenge",
    target: 1,
    xpReward: 60,
    icon: "Code",
  },
  {
    id: "cl-8",
    type: "complete_lesson",
    title: "Marathon Runner",
    description: "Complete 5 lessons today",
    target: 5,
    xpReward: 150,
    icon: "Trophy",
  },
];
