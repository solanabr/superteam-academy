import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseDetail } from "@/components/courses/course-detail"
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter"
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter"
import { notFound } from "next/navigation"

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuthenticatedUser()
  const { slug } = await params
  const snapshot = await getCourseProgressSnapshot(user.walletAddress, slug)
  if (!snapshot) return notFound()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <CourseDetail course={snapshot.course} enrolledOnChain={snapshot.enrolledOnChain} />
      </main>
      <Footer />
    </div>
  )
}
