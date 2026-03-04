"use client"

import { SortableItem, SortableList } from "@/components/SortableList"
import { LessonStatus } from "@/drizzle/schema"
import { cn } from "@/lib/utils"
import { EyeClosed, Trash2Icon, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ActionButton"
import { DialogTrigger } from "@/components/ui/dialog"
import { LessonFormDialog } from "./LessonFormDialog"
import { deleteLesson, updateLessonOrders } from "../actions/lessons"

export function SortableLessonList({
  sections,
  lessons,
}: {
  sections: {
    id: string
    name: string
  }[]
  lessons: {
    id: string
    name: string
    status: LessonStatus
    youtubeVideoId: string | null
    description: string | null
    xpReward: number
    sectionId: string
  }[]
}) {
  return (
    <SortableList items={lessons} onOrderChange={updateLessonOrders}>
      {items =>
        items.map(lesson => (
          <SortableItem
            key={lesson.id}
            id={lesson.id}
            className="flex items-center gap-1"
          >
            <div
              className={cn(
                "contents",
                lesson.status === "private" && "text-muted-foreground"
              )}
            >
              {lesson.status === "private" && <EyeClosed className="size-4" />}
              {lesson.status === "preview" && <VideoIcon className="size-4" />}
              {lesson.name}
            </div>
            <LessonFormDialog lesson={lesson} sections={sections}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  Edit
                </Button>
              </DialogTrigger>
            </LessonFormDialog>
            <ActionButton
              action={deleteLesson.bind(null, lesson.id)}
              requireAreYouSure
              variant="destructiveOutline"
              size="sm"
            >
              <Trash2Icon />
              <span className="sr-only">Delete</span>
            </ActionButton>
          </SortableItem>
        ))
      }
    </SortableList>
  )
}
