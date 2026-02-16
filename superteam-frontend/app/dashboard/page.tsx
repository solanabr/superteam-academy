import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter"
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter"
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter"

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser()
  const snapshot = await getIdentitySnapshotForUser(user)
  const courses = (await getAllCourseProgressSnapshots(user.walletAddress)).map((item) => item.course)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <DashboardContent identity={snapshot} coursesData={courses} />
      </main>
      <Footer />
    </div>
  )
}
