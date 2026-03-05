"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "~/sanity/lib/client";


export interface SanityLesson {
   title: string;
   duration: string;
   lessonType: 1 | 2 | 3; // 1=video, 2=doc, 3=challenge
   videoUrl?: string;
   markdownContent?: string;
   body?: any[];
   objective?: string;
   starterCode?: { _type: "code"; code: string; language: string };
   solutionCode?: { _type: "code"; code: string; language: string };
   hints?: string[];
   testCases?: { input: string; expectedOutput: string }[];
}

export interface SanityModule {
   title: string;
   description: string;
   lessons: SanityLesson[];
}

export interface SanityCourseData {
   courseId: string;
   _id: string;
   title: string;
   description: string;
   thumbnail: string;
   slug: { current: string, _type: string };
   difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
   xpPerLesson: number;
   lessonCount: number;
   modules: SanityModule[];
   creator: { creatorName: string; creatorPubKey?: string };
   track: { trackId: number; trackLevel: number; name: string };
}

const COURSE_QUERY = `
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    courseId,
    title,
    description,
    thumbnail,
    "slug": slug.current,
    difficulty,
    xpPerLesson,
    lessonCount,
    creator,
    track,
    modules[] {
      title,
      description,
      lessons[] {
        title,
        lessonType,
        duration,
        videoUrl,
        markdownContent,
        body,
        objective,
        starterCode,
        solutionCode,
        hints,
        testCases
      }
    }
  }
`;

const COURSE_LIST_QUERY = `*[_type == "course"]{
   courseId,
   slug,
   title,
   description,
   thumbnail,
   creator,
   difficulty,
   lessonCount,
   xpPerLesson,
   track,
   prerequisite
}`;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCourseList() {
   return useQuery<SanityCourseData[]>({
      queryKey: ["course-list"],
      staleTime: 1000 * 60 * 10, // 10 min — content changes rarely
      queryFn: () => client.fetch<SanityCourseData[]>(COURSE_LIST_QUERY),
   });
}

export function useCourseData(slug: string) {
   return useQuery<SanityCourseData | null>({
      queryKey: ["course-data", slug],
      enabled: !!slug,
      staleTime: 1000 * 60 * 10, // 10 min — content changes rarely
      queryFn: () => client.fetch<SanityCourseData>(COURSE_QUERY, { slug }),
   });
}

// ── Lesson lookup helper ──────────────────────────────────────────────────────

/** Find a lesson across all modules by its global index */
export function findLesson(course: SanityCourseData, lessonIndex: number): { lesson: SanityLesson; lessonIndex: number; module: SanityModule } | null {
   let globalIndex = 0;
   for (const mod of course.modules || []) {
      for (const lesson of mod.lessons || []) {
         if (globalIndex === lessonIndex) {
            return { lesson, lessonIndex: globalIndex, module: mod };
         }
         globalIndex++;
      }
   }
   return null;
}
