import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CourseDetail from "@/components/course/course-detail";
import { getQueryClient } from "@/components/providers/query-client";
import { courseQueries } from "@/lib/queries";
import { Suspense } from "react";

export default async function CoursePage({
  params,
  searchParams
}: {
  params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
  const queryClient = getQueryClient();
  const courseId = resolvedParams.courseId as string;
    const language = resolvedSearchParams.lang as string;

  // Prefetch on server
  await queryClient.prefetchQuery(courseQueries.bySlug(courseId, language));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <CourseDetail />
      </Suspense>
    </HydrationBoundary>
  );
}
