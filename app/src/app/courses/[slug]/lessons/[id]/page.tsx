import { LessonView } from "@/components/lessons/lesson-view";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, id } = await params;
  return {
    title: `Lesson - ${id}`,
    description: `Learn Solana development`,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug, id } = await params;
  return <LessonView courseSlug={slug} lessonId={id} />;
}
