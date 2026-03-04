"use client"

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog"
import { LessonStatus } from "@/drizzle/schema"
import { ReactNode, useState } from "react"
import { LessonForm } from "./LessonForm"

export function LessonFormDialog({
  sections,
  defaultSectionId,
  lesson,
  children,
}: {
  children: ReactNode
  sections: { id: string; name: string }[]
  defaultSectionId?: string
  lesson?: {
    id: string
    name: string
    status: LessonStatus
    youtubeVideoId: string | null
    description: string | null
    xpReward: number
    sectionId: string
  }
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lesson == null ? "New Lesson" : `Edit ${lesson.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <LessonForm
            sections={sections}
            onSuccess={() => setIsOpen(false)}
            lesson={lesson}
            defaultSectionId={defaultSectionId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
