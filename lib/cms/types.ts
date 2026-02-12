export type CmsLesson = {
  _id: string;
  title: string;
  order: number;
  content: string;
  challengePrompt?: string;
};

export type CmsModule = {
  _id: string;
  title: string;
  order: number;
  lessons: CmsLesson[];
};

export type CmsCourseDifficulty = "beginner" | "intermediate" | "advanced";

export type CmsCourse = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  topic: string;
  difficulty: CmsCourseDifficulty;
  durationHours: number;
  xpReward: number;
  modules: CmsModule[];
};
