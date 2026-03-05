import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { contentService } from "@/lib/services/sanity-content.service";
import { CourseDetailClient } from "./course-detail-client";

export default async function CourseDetailPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    const course = await contentService.getCourseBySlug(slug);
    if (!course) notFound();

    return <CourseDetailClient course={course} />;
}
