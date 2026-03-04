"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { gradingSchema } from "../schemas/quizzes"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { gradeSubmission } from "../actions/grading"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type GradingFormProps = {
  submissionId: string
  maxScore: number
  currentScore?: number | null
  currentFeedback?: string | null
  studentName: string
}

export function GradingForm({
  submissionId,
  maxScore,
  currentScore,
  currentFeedback,
  studentName,
}: GradingFormProps) {
  const router = useRouter()

  const form = useForm<z.infer<typeof gradingSchema>>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      submissionId,
      score: currentScore ?? 0,
      feedback: currentFeedback ?? "",
      sendNotification: true,
    },
  })

  async function onSubmit(values: z.infer<typeof gradingSchema>) {
    const result = await gradeSubmission(values)

    if (result.error) {
      toast.error(result.message || "Failed to grade submission")
    } else {
      toast.success(result.message || "Submission graded successfully")
      router.refresh()
    }
  }

  const quickGrades = [
    { label: "A", value: Math.round(maxScore * 0.9) },
    { label: "B", value: Math.round(maxScore * 0.8) },
    { label: "C", value: Math.round(maxScore * 0.7) },
    { label: "D", value: Math.round(maxScore * 0.6) },
    { label: "F", value: Math.round(maxScore * 0.5) },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6 flex-col">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Grading submission from</p>
          <p className="font-semibold">{studentName}</p>
        </div>

        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabelIcon />
                Score (out of {maxScore})
              </FormLabel>
              <FormControl>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    min={0}
                    max={maxScore}
                    className="w-32"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  <div className="flex gap-2">
                    {quickGrades.map((grade) => (
                      <Button
                        key={grade.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue("score", grade.value)}
                      >
                        {grade.label} ({grade.value})
                      </Button>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Click a quick grade or enter a custom score
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-32 resize-none"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Provide feedback to the student..."
                />
              </FormControl>
              <FormDescription>
                This feedback will be visible to the student
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendNotification"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Send Email Notification</FormLabel>
                <FormDescription>
                  Notify the student by email when grading is complete
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Saving..." : "Save Grade"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
