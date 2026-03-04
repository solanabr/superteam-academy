import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseTable, UserTable } from "@/drizzle/schema"
import { countDistinct } from "drizzle-orm"
import { withDbRetry } from "@/lib/db-retry"
import { redirect } from "next/navigation"
import HomePageClient from "@/components/LandingClient"

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  const stats = await getPlatformStats()

  return (
    <HomePageClient
      totalLearners={stats.totalLearners}
      totalCourses={stats.totalCourses}
    />
  )
}

async function getPlatformStats() {
  "use cache"
  try {
    const [learners, courses] = await withDbRetry(() =>
      Promise.all([
        db.select({ count: countDistinct(UserTable.id) }).from(UserTable),
        db.select({ count: countDistinct(CourseTable.id) }).from(CourseTable),
      ])
    )
    return {
      totalLearners: learners[0]?.count ?? 0,
      totalCourses:  courses[0]?.count  ?? 0,
    }
  } catch (error) {
    console.error("Failed to load platform stats", error)
    return { totalLearners: 0, totalCourses: 0 }
  }
}