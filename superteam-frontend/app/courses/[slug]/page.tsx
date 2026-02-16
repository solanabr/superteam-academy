import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseDetail } from "@/components/courses/course-detail"
import { courses } from "@/lib/mock-data"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }))
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) return notFound()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <CourseDetail course={course} />
      </main>
      <Footer />
    </div>
  )
}
