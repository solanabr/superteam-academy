import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/content/queries";
import { resolvePublicProfileByWallet } from "@/lib/profiles/public-profile";
import { getCourseChangelog } from "@/lib/courses/changelog";
import { createClient } from "@/lib/supabase/server";
import { CourseDetailClient } from "./course-detail-client";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  // Resolve the instructor's public academy profile server-side (issue
  // #478, B4) so the client never has to fetch it — falls back to `null`
  // (rendered as a truncated wallet) when there's no creator or no public
  // profile linked to that wallet.
  const instructorProfile = course.creator
    ? await resolvePublicProfileByWallet(await createClient(), course.creator)
    : null;

  // Course changelog (#654) — the post-deployment evolution log, read server-
  // side through the public RLS policy and passed down already decoded.
  const changelog = await getCourseChangelog(course._id);

  return (
    <CourseDetailClient
      course={course}
      instructorProfile={instructorProfile}
      changelog={changelog}
    />
  );
}
