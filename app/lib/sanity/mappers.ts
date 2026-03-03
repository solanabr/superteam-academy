import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { sanityClient } from "./client";
import type {
  Course,
  ContentLesson,
  ChallengeLesson,
  Module,
  Difficulty,
} from "@/lib/data/types";

const builder = createImageUrlBuilder(sanityClient);

function urlFor(source: SanityImageSource | null | undefined): string {
  if (!source) return "";
  return builder
    .image(source)
    .width(800)
    .quality(75)
    .auto("format")
    .fit("max")
    .url();
}

type SanityLesson =
  | {
      _type: "contentLesson";
      id: string;
      title: string;
      duration: number;
      xp: number;
      body: string;
      videoUrl?: string;
    }
  | {
      _type: "challengeLesson";
      id: string;
      title: string;
      duration: number;
      xp: number;
      prompt: string;
      starterCode: string;
      language: "rust" | "typescript";
      testCases: Array<{ input: string; expectedOutput: string; label: string }>;
    };

type SanityModule = {
  id: string;
  title: string;
  description?: string;
  lessons: SanityLesson[];
};

type SanityCourse = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: SanityImageSource;
  trackId: string;
  difficulty: number;
  xpReward: number;
  prerequisiteSlug?: string | null;
  isActive: boolean;
  tags: string[];
  modules: SanityModule[];
};

function mapLesson(lesson: SanityLesson): ContentLesson | ChallengeLesson {
  if (lesson._type === "contentLesson") {
    return {
      id: lesson.id,
      title: lesson.title,
      type: "content",
      duration: lesson.duration,
      xp: lesson.xp,
      body: lesson.body,
      videoUrl: lesson.videoUrl,
    };
  }
  return {
    id: lesson.id,
    title: lesson.title,
    type: "challenge",
    duration: lesson.duration,
    xp: lesson.xp,
    prompt: lesson.prompt,
    starterCode: lesson.starterCode,
    language: lesson.language,
    testCases: lesson.testCases ?? [],
  };
}

function mapModule(mod: SanityModule): Module {
  return {
    id: mod.id,
    title: mod.title,
    description: mod.description ?? "",
    lessons: mod.lessons?.map(mapLesson) ?? [],
  };
}

export function mapSanityCourseToCourse(doc: SanityCourse | null): Course | null {
  if (!doc) return null;
  const onChainCourseId = doc.slug?.trim();
  if (!onChainCourseId) return null;

  const modules = doc.modules?.map(mapModule) ?? [];
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalDuration = modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((s, l) => s + l.duration, 0),
    0
  );

  const thumbnail = urlFor(doc.thumbnail) || "";

  return {
    id: onChainCourseId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    shortDescription: doc.shortDescription,
    thumbnail: thumbnail || "/thumbnails/intro-solana.png",
    trackId: doc.trackId,
    difficulty: doc.difficulty as Difficulty,
    modules,
    totalLessons,
    totalDuration,
    xpReward: doc.xpReward,
    enrollmentCount: 0,
    creator: { name: "—", avatar: "", title: "—" },
    prerequisiteSlug: doc.prerequisiteSlug ?? null,
    isActive: doc.isActive ?? true,
    tags: doc.tags ?? [],
  };
}
