"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LessonStatus, lessonStatuses } from "@/drizzle/schema"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"
import { lessonSchema } from "../schemas/lessons"
import { Textarea } from "@/components/ui/textarea"
import { createLesson, updateLesson } from "../actions/lessons"
import { toast } from "sonner"

export function LessonForm({
  sections,
  defaultSectionId,
  onSuccess,
  lesson,
}: {
  sections: {
    id: string
    name: string
  }[]
  onSuccess?: () => void
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
  const form = useForm<z.input<typeof lessonSchema>, unknown, z.output<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: lesson?.name ?? "",
      status: lesson?.status ?? "public",
      youtubeVideoId: lesson?.youtubeVideoId ?? "",
      description: lesson?.description ?? "",
      xpReward: lesson?.xpReward ?? 25,
      sectionId: lesson?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? "",
    },
  })

  async function onSubmit(values: z.output<typeof lessonSchema>) {
    const action =
      lesson == null ? createLesson : updateLesson.bind(null, lesson.id)
    const data = await action(values)
    if (data?.error) {
      toast.error(data.message || "Something went wrong!")
    } else {
      toast.success(data.message || "Lesson saved successfully!")
      form.reset()
      if (onSuccess) onSuccess()
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col @container"
      >
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Name
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional Video ID */}
          <FormField
            control={form.control}
            name="youtubeVideoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube Video ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="dQw4w9WgXcQ"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="xpReward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Lesson XP
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Section */}
          <FormField
            control={form.control}
            name="sectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Content */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lesson Content (Markdown/Text)</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-48 resize-y font-mono text-sm"
                  {...field}
                  value={field.value ?? ""}
                  placeholder={"# Lesson content\n\nWrite your lesson in markdown or plain text."}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="self-end">
          <Button disabled={form.formState.isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
