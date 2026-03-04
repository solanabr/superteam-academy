import { getCurrentUser } from "@/lib/current-user"
import { canAccessAdminPages } from "@/permissions/general"
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar"
import { Footer } from "@/components/Footer"
import { PublicNav } from "@/components/PublicNav"
import { WithWalletProviders } from "@/components/WithWalletProviders"
import { getXPBalance } from "@/services/xp"
import { ReactNode } from "react"

export default async function ConsumerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser()
  const isAdmin = canAccessAdminPages(user)
  const isAuthenticated = !!user

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="grow">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  const userXp = user ? await getXPBalance(user.id) : 0

  return (
    <WithWalletProviders>
      <div className="min-h-screen flex">
        <DashboardSidebar
          isAdmin={isAdmin}
          userXp={userXp}
          userStreak={user?.streak ?? 0}
        />

        <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
          <main className="grow p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </WithWalletProviders>
  )
}
