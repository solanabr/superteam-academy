"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/formatters"
import { Mail, UserCircle, Calendar, BookOpen, Zap } from "lucide-react"
import Image from "next/image"

type UserDetail = {
  id: string
  name: string | null
  email: string | null
  imageUrl: string | null
  createdAt: Date
  courseCount: number
  xp: number
}

export function UserDetailModal({
  user,
  isOpen,
  onOpenChange,
}: {
  user: UserDetail | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.name ?? "User"}
                width={80}
                height={80}
                className="rounded-full object-cover size-20"
              />
            ) : (
              <div className="size-20 rounded-full bg-primary flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.name ?? "Unknown"}</h3>
              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="font-medium">{user.email ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Joined</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">XP Earned</p>
                <p className="font-medium text-primary">{user.xp.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Courses Enrolled</p>
                <p className="font-medium">{user.courseCount}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
