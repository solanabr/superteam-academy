import { ModuleList } from "@/components/course/module-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courseService } from "@/lib/services/course-service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await courseService.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100">
        <Link href="/courses">
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
      </Button>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/65 p-6">
        <h1 className="text-3xl font-semibold text-zinc-100">{course.title}</h1>
        <p className="mt-2 text-zinc-300">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-zinc-800 text-zinc-100">{course.difficulty}</Badge>
          {course.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-white/20 text-zinc-300">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-zinc-900/65 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Prerequisites</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.prerequisites.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-white/10 bg-zinc-900/65 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Learning outcomes</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.outcomes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">Module breakdown</h2>
        <ModuleList slug={course.slug} modules={course.modules} />
      </section>
    </div>
  );
}
