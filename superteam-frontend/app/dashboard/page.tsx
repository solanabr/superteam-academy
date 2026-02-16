import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter"

export default async function DashboardPage() {
  await requireAuthenticatedUser()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <DashboardContent />
      </main>
      <Footer />
    </div>
  )
}
