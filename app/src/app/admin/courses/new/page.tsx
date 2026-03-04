import { PageHeader } from "@/components/PageHeader"
import { CourseForm } from "@/features/courses/components/CourseForm"

export default function NewCoursePage() {
  return (
    <div className="container my-6">
      <PageHeader title="New Course" />
      <CourseForm />
    </div>
  )
}