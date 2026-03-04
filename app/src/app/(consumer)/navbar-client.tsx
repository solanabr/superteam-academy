"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"

export function NavbarClient() {
  const { data: session } = useSession()

  if (!session?.user) {
    return <div className="size-8" />
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U"

  return (
    <Avatar className="size-8">
      <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
      <AvatarFallback className="text-xs bg-primary text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
