import { AdminSidebar } from "@/components/sidebar/AdminSidebar"
import { getCurrentUser } from "@/lib/current-user"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "admin") redirect("/dashboard")

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
