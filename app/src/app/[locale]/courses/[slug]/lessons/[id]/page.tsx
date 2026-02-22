import { notFound } from "next/navigation";
import { getLessonByIdAsync } from "@/lib/courses";
import LessonView from "./lesson-view";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const data = await getLessonByIdAsync(slug, id);

  if (!data) notFound();

  return (
    <LessonView
      lesson={data.lesson}
      mod={data.module}
      course={data.course}
      slug={slug}
      id={id}
    />
  );
}
