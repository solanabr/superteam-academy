import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseDetail } from "@/components/courses/course-detail"
import { courses } from "@/lib/mock-data"
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter"
import { notFound } from "next/navigation"

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAuthenticatedUser()
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
