import { CourseDetail } from "@/components/courses/course-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  // In production, fetch course data for SEO
  return {
    title: `Course - ${slug}`,
    description: `Learn Solana development with our ${slug} course`,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <CourseDetail slug={slug} />;
}
