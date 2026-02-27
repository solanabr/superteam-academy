import { getAdminCourse } from '@/actions/admin-courses';
import { CourseEditor } from '@/components/admin/CourseEditor';
import { notFound } from 'next/navigation';

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getAdminCourse(id);

  if (!course) notFound();

  return <CourseEditor course={course} />;
}
