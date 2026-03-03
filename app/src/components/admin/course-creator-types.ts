// Types for the CMS Course Creator wizard

export interface DraftLesson {
  id: string;
  title: string;
  type: "content" | "challenge";
  xpReward: number;
  duration: string;
}

export interface DraftModule {
  id: string;
  title: string;
  description: string;
  lessons: DraftLesson[];
}

export interface DraftCourse {
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  trackId: number;
  creator: string;
  tags: string[];
  modules: DraftModule[];
  xpTotal: number;
  duration: string;
  isActive: boolean;
  prerequisites: string[];
}

export type CreatorStep = "basic" | "modules" | "settings" | "preview";

export const CREATOR_STEPS: { key: CreatorStep; labelKey: string }[] = [
  { key: "basic", labelKey: "basic" },
  { key: "modules", labelKey: "modules" },
  { key: "settings", labelKey: "settings" },
  { key: "preview", labelKey: "preview" },
];

export const INITIAL_DRAFT: DraftCourse = {
  title: "",
  slug: "",
  description: "",
  difficulty: "beginner",
  trackId: 0,
  creator: "",
  tags: [],
  modules: [],
  xpTotal: 0,
  duration: "",
  isActive: false,
  prerequisites: [],
};

/** Converts a title string into a URL-safe slug */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Calculates total XP from all module lessons */
export function calcTotalXP(modules: DraftModule[]): number {
  return modules.reduce(
    (sum, mod) => sum + mod.lessons.reduce((s, l) => s + l.xpReward, 0),
    0,
  );
}

/** Counts total lessons and challenges across all modules */
export function calcCourseCounts(modules: DraftModule[]): {
  lessonCount: number;
  challengeCount: number;
} {
  let lessonCount = 0;
  let challengeCount = 0;
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      lessonCount++;
      if (lesson.type === "challenge") challengeCount++;
    }
  }
  return { lessonCount, challengeCount };
}
