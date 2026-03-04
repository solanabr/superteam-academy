"use client"

import { useState } from "react"
import { ActionButton } from "@/components/ActionButton"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatPlural } from "@/lib/formatters"
import { Mail, Trash2Icon, UserCircle, Zap } from "lucide-react"
import Image from "next/image"
import { deleteUserAction } from "../actions/users"
import { UserDetailModal } from "./UserDetail"

type User = {
  id: string
  name: string | null
  email: string | null
  imageUrl: string | null
  createdAt: Date
  courseCount: number
  xp: number
}

export function UserTable({ users }: { users: User[] }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {formatPlural(users.length, {
                singular: "user",
                plural: "users",
              })}
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-center">XP</TableHead>
            <TableHead className="text-center">Courses</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.name ?? "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover size-10"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="font-semibold">{user.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user.email ?? "—"}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-center font-medium">
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Zap className="w-3.5 h-3.5" />
                  {user.xp}
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                {user.courseCount}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewUser(user)}
                  >
                    View
                  </Button>
                  <ActionButton
                    variant="destructiveOutline"
                    size="sm"
                    requireAreYouSure
                    action={deleteUserAction.bind(null, user.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </ActionButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}

export function UserTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-48" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
