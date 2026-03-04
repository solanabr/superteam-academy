import { PageHeader } from "@/components/PageHeader";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { R2FileUploadForm } from "@/features/courses/components/R2FileUploadForm";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function CourseFilesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  
  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  });

  if (!course) return notFound();

  return (
    <div className="container my-6">
      <PageHeader title={`Manage Files - ${course.name}`} />
      <R2FileUploadForm courseId={courseId} />
    </div>
  );
}