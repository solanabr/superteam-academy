import type { Metadata } from "next";
import LessonPageClient from "./lesson-page-client";

type Props = {
  params: Promise<{ locale: string; courseId: string; lessonIndex: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, lessonIndex } = await params;
  const title = courseId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Lesson ${Number(lessonIndex) + 1} — ${title}`,
    description: `Complete Lesson ${Number(lessonIndex) + 1} of ${title} on Superteam Academy. Earn XP and credentials on Solana.`,
  };
}

export default async function LessonPage({ params }: Props) {
  const { courseId, lessonIndex } = await params;
  return (
    <LessonPageClient courseId={courseId} lessonIndex={Number(lessonIndex)} />
  );
}
