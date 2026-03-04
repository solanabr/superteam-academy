import React from 'react'
import { WithWalletProviders } from "@/components/WithWalletProviders"

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
  return (
    <WithWalletProviders>
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-10">
        {children}
      </div>
    </WithWalletProviders>
  )
}
