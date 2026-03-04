"use client"

import { useMemo, useRef, useState } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { courseSchema } from "../schemas/courses"
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createCourse, updateCourse } from "../actions/courses"
import { toast } from "sonner"
import { difficultyLevels, courseTracks } from "@/drizzle/schema"
import { Loader2, Upload, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CourseForm({
  course,
}: {
  course?: {
    id: string
    name: string
    description: string
    slug: string | null
    onchainCourseId: string | null
    difficulty: (typeof difficultyLevels)[number]
    track: (typeof courseTracks)[number]
    durationHours: number
    xpReward: number
    instructorName: string | null
    thumbnailUrl: string | null
  }
}) {
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema) as Resolver<z.infer<typeof courseSchema>>,
    defaultValues: {
      name: course?.name ?? "",
      description: course?.description ?? "",
      onchainCourseId: course?.onchainCourseId ?? "",
      difficulty: course?.difficulty ?? "beginner",
      track: course?.track ?? "fundamentals",
      durationHours: course?.durationHours ?? 0,
      xpReward: course?.xpReward ?? 0,
      instructorName: course?.instructorName ?? "",
      thumbnailUrl: course?.thumbnailUrl ?? "",
    },
  })
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const watchedName = form.watch("name")
  const urlSlug = useMemo(
    () => (course?.slug?.trim() ? course.slug : toSlug(watchedName ?? "")),
    [course?.slug, watchedName]
  )

  async function uploadThumbnail(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Thumbnail must be 5MB or less")
      return
    }

    setIsUploadingThumbnail(true)
    setThumbnailUploadProgress(0)

    try {
      const urlResponse = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          courseId: course?.id ?? "draft-course",
        }),
      })

      if (!urlResponse.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, fileUrl } = (await urlResponse.json()) as {
        uploadUrl: string
        fileUrl: string
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setThumbnailUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        })
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error("Failed to upload thumbnail"))
        })
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      form.setValue("thumbnailUrl", fileUrl, {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success("Thumbnail uploaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload thumbnail"
      toast.error(message)
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    const action = course == null ? createCourse : updateCourse.bind(null, course.id)
    const data = await action(values)

    if (data?.error) {
      toast.error(data.message || "Something went wrong!")
    } else {
      if (course != null) {
        toast.success(data?.message || "Course updated successfully!")
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabelIcon />
                Description
              </FormLabel>
              <FormControl>
                <Textarea className="min-h-20 resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">URL Slug (auto)</label>
          <Input value={urlSlug} readOnly disabled />
          <p className="text-xs text-muted-foreground">
            Used for page URL only. This is not used for on-chain PDA derivation.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="onchainCourseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>On-chain Course ID</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Must exactly match on-chain course_id (e.g. anchor-101)"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep this course off-chain only for now.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instructorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructor</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Jane Builder" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Difficulty
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="track"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Track
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courseTracks.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Duration (hours)
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
        </div>
        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://... (optional)"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        void uploadThumbnail(file)
                        e.currentTarget.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingThumbnail}
                    >
                      {isUploadingThumbnail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload to R2
                    </Button>
                    {!!field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          form.setValue("thumbnailUrl", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {isUploadingThumbnail && (
                    <p className="text-xs text-muted-foreground">
                      Uploading thumbnail... {thumbnailUploadProgress}%
                    </p>
                  )}
                  {!!field.value && (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline underline-offset-2 break-all"
                    >
                      Preview uploaded thumbnail
                    </a>
                  )}
                </div>
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
