"use client";

import { use } from "react";
import { CourseFormComponent } from "@/components/admin/course-form";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="container max-w-4xl py-8">
      <CourseFormComponent editId={id} />
    </div>
  );
}
