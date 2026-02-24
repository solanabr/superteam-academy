import type { Metadata } from "next";
import CourseDetailClient from "./course-detail-client";

type Props = { params: Promise<{ locale: string; courseId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const title = courseId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title,
    description: `Enroll in ${title} on Superteam Academy. Earn XP and credentials on Solana.`,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  return <CourseDetailClient courseId={courseId} />;
}
