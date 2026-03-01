import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your-project-id",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});

export interface CMSCourse {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  thumbnail?: { asset: { url: string } };
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  track: string;
  duration: string;
  xp: number;
  badge: string;
  prerequisites?: CMSCourse[];
  modules?: CMSModule[];
  isPublished: boolean;
}

export interface CMSModule {
  _id: string;
  title: string;
  order: number;
  lessons?: CMSLesson[];
}

export interface CMSLesson {
  _id: string;
  title: string;
  type: "video" | "reading" | "challenge";
  duration: string;
  content?: string;
  starterCode?: string;
  solution?: string;
  testCases?: { name: string; description: string; check: string }[];
  xpReward: number;
  order: number;
}

export const cms = {
  async getCourses(): Promise<CMSCourse[]> {
    return sanityClient.fetch(`*[_type == "course" && isPublished == true]{
      _id,
      title,
      slug,
      description,
      thumbnail,
      difficulty,
      track,
      duration,
      xp,
      badge,
      "prerequisites": prerequisites[]->{_id, title, slug},
      isPublished
    }`);
  },

  async getCourse(slug: string): Promise<CMSCourse | null> {
    return sanityClient.fetch(`*[_type == "course" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      description,
      thumbnail,
      difficulty,
      track,
      duration,
      xp,
      badge,
      "prerequisites": prerequisites[]->{_id, title, slug},
      "modules": modules[]->{
        _id,
        title,
        order,
        "lessons": lessons[]->{
          _id,
          title,
          type,
          duration,
          content,
          starterCode,
          solution,
          testCases,
          xpReward,
          order
        }
      },
      isPublished
    }`, { slug });
  },

  async getAchievements() {
    return sanityClient.fetch(`*[_type == "achievement"]{
      _id,
      name,
      description,
      icon,
      category,
      xpReward,
      supplyCap
    }`);
  },
};

// Mock data fallback for development
export const mockCourses = [
  {
    id: "anchor-fundamentals",
    title: "Anchor Fundamentals",
    description: "Build secure Solana programs with Anchor",
    lessons: 12,
    xp: 1200,
    difficulty: "Beginner" as const,
    track: "Development",
    duration: "6 hours",
    badge: "Anchor Beginner",
  },
];

export function getCourses() {
  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return cms.getCourses();
  }
  return Promise.resolve(mockCourses as any);
}
