"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { assignmentSchema } from "../schemas/quizzes"
import { z } from "zod"
import { useEffect, useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createAssignment, updateAssignment } from "../actions/quizzes"
import { toast } from "sonner"
import { AssignmentStatus } from "@/drizzle/schema/assignment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizConfig, getQuizTotalPoints, parseQuizConfig, serializeQuizConfig } from "../lib/quiz"

type QuizFormProps = {
  courseId: string
  sections?: { id: string; name: string }[]
  assignment?: {
    id: string
    name: string
    description: string | null
    instructions: string | null
    dueDate: Date | null
    maxScore: number
    xpReward: number
    status: AssignmentStatus
    sectionId: string | null
    allowLateSubmissions: boolean
    order: number
  }
}

export function QuizForm({ courseId, sections = [], assignment }: QuizFormProps) {
  const initialQuizConfig = useMemo(() => {
    const parsed = parseQuizConfig(assignment?.instructions ?? null)
    if (parsed) return parsed
    return {
      type: "quiz",
      version: 1,
      intro: "",
      timeLimitMinutes: undefined,
      passingScore: undefined,
      questions: [
        {
          id: "q1",
          prompt: "",
          options: [
            { id: "a", text: "" },
            { id: "b", text: "" },
          ],
          correctOptionId: "a",
          points: 10,
        },
      ],
    } satisfies QuizConfig
  }, [assignment?.instructions])

  const [useQuizBuilder, setUseQuizBuilder] = useState(() =>
    assignment ? parseQuizConfig(assignment.instructions ?? null) !== null : true
  )
  const [quizConfig, setQuizConfig] = useState<QuizConfig>(initialQuizConfig)

  const form = useForm<z.input<typeof assignmentSchema>, unknown, z.output<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: assignment
      ? {
          name: assignment.name,
          description: assignment.description ?? "",
          instructions: assignment.instructions ?? "",
          dueDate: assignment.dueDate,
          maxScore: assignment.maxScore,
          xpReward: assignment.xpReward ?? 200,
          status: assignment.status,
          courseId: courseId,
          sectionId: assignment.sectionId,
          allowLateSubmissions: assignment.allowLateSubmissions,
          order: assignment.order,
        }
      : {
          name: "",
          description: "",
          instructions: "",
          dueDate: null,
          maxScore: 100,
          xpReward: 200,
          status: "draft",
          courseId: courseId,
          sectionId: null,
          allowLateSubmissions: false,
          order: 0,
        },
  })

  const quizTotalPoints = useMemo(() => getQuizTotalPoints(quizConfig), [quizConfig])

  useEffect(() => {
    if (!useQuizBuilder) return
    form.setValue("maxScore", quizTotalPoints || 0)
  }, [form, quizTotalPoints, useQuizBuilder])

  useEffect(() => {
    if (!assignment) return
    const parsed = parseQuizConfig(assignment.instructions ?? null)
    if (parsed) {
      setQuizConfig(parsed)
      setUseQuizBuilder(true)
    }
  }, [assignment])

  useEffect(() => {
    if (!useQuizBuilder) {
      const parsed = parseQuizConfig(form.getValues("instructions"))
      if (parsed) {
        form.setValue("instructions", parsed.intro ?? "")
      }
    }
  }, [form, useQuizBuilder])

  const validateQuiz = () => {
    if (!quizConfig.questions.length) {
      toast.error("Add at least one question to the quiz.")
      return false
    }
    for (const [index, question] of quizConfig.questions.entries()) {
      if (!question.prompt.trim()) {
        toast.error(`Question ${index + 1} needs a prompt.`)
        return false
      }
      if (question.options.length < 2) {
        toast.error(`Question ${index + 1} needs at least 2 options.`)
        return false
      }
      if (!question.options.every((o) => o.text.trim())) {
        toast.error(`Question ${index + 1} has empty options.`)
        return false
      }
      const optionIds = question.options.map((o) => o.id)
      if (!optionIds.includes(question.correctOptionId)) {
        toast.error(`Question ${index + 1} needs a correct option.`)
        return false
      }
      if (question.points <= 0) {
        toast.error(`Question ${index + 1} must have points greater than 0.`)
        return false
      }
    }
    return true
  }

  async function onSubmit(values: z.output<typeof assignmentSchema>) {
    if (useQuizBuilder) {
      if (!validateQuiz()) return
      values.instructions = serializeQuizConfig(quizConfig)
      values.maxScore = quizTotalPoints
    }

    const action = assignment
      ? updateAssignment(assignment.id, values)
      : createAssignment(values)

    const data = await action

    if (data?.error) {
      toast.error(data.message || "Something went wrong!")
    } else {
      toast.success(data?.message || "Quiz saved successfully!")
      if (!assignment) {
        form.reset()
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6 flex-col">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabelIcon />
                Quiz Name
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Week 1 Quiz" />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-20 resize-none"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Brief description of the quiz"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Quiz Builder</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Use builder</span>
                <Switch checked={useQuizBuilder} onCheckedChange={setUseQuizBuilder} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Build a standard multiple-choice quiz with auto-grading. If disabled, you can provide freeform instructions below.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {useQuizBuilder ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Intro / Directions</label>
                    <Textarea
                      className="min-h-24 mt-2 resize-none"
                      value={quizConfig.intro ?? ""}
                      onChange={(e) =>
                        setQuizConfig((prev) => ({
                          ...prev,
                          intro: e.target.value,
                        }))
                      }
                      placeholder="Short instructions shown at the top of the quiz."
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Time Limit (minutes)</label>
                      <Input
                        type="number"
                        min={1}
                        value={quizConfig.timeLimitMinutes ?? ""}
                        onChange={(e) =>
                          setQuizConfig((prev) => ({
                            ...prev,
                            timeLimitMinutes: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Passing Score</label>
                      <Input
                        type="number"
                        min={0}
                        value={quizConfig.passingScore ?? ""}
                        onChange={(e) =>
                          setQuizConfig((prev) => ({
                            ...prev,
                            passingScore: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. Used to show pass/fail to students.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/40">
                      <p className="text-xs text-muted-foreground">Total Points</p>
                      <p className="text-lg font-semibold">{quizTotalPoints}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {quizConfig.questions.map((question, questionIndex) => (
                    <Card key={question.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-semibold">
                            Question {questionIndex + 1}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setQuizConfig((prev) => ({
                                ...prev,
                                questions: prev.questions.filter((q) => q.id !== question.id),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Prompt</label>
                          <Textarea
                            className="min-h-20 mt-2 resize-none"
                            value={question.prompt}
                            onChange={(e) =>
                              setQuizConfig((prev) => ({
                                ...prev,
                                questions: prev.questions.map((q) =>
                                  q.id === question.id ? { ...q, prompt: e.target.value } : q
                                ),
                              }))
                            }
                            placeholder="Ask a clear, single-question prompt."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-6">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <Input
                                  value={option.text}
                                  onChange={(e) =>
                                    setQuizConfig((prev) => ({
                                      ...prev,
                                      questions: prev.questions.map((q) =>
                                        q.id === question.id
                                          ? {
                                              ...q,
                                              options: q.options.map((o) =>
                                                o.id === option.id ? { ...o, text: e.target.value } : o
                                              ),
                                            }
                                          : q
                                      ),
                                    }))
                                  }
                                  placeholder="Option text"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setQuizConfig((prev) => ({
                                      ...prev,
                                      questions: prev.questions.map((q) => {
                                        if (q.id !== question.id) return q
                                        const nextOptions = q.options.filter((o) => o.id !== option.id)
                                        const nextCorrect =
                                          q.correctOptionId === option.id
                                            ? nextOptions[0]?.id ?? ""
                                            : q.correctOptionId
                                        return {
                                          ...q,
                                          options: nextOptions,
                                          correctOptionId: nextCorrect,
                                        }
                                      }),
                                    }))
                                  }
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setQuizConfig((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((q) =>
                                    q.id === question.id
                                      ? {
                                          ...q,
                                          options: [
                                            ...q.options,
                                            {
                                              id: `opt-${Math.random().toString(36).slice(2, 8)}`,
                                              text: "",
                                            },
                                          ],
                                        }
                                      : q
                                  ),
                                }))
                              }
                            >
                              Add Option
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Correct Option</label>
                              <Select
                                value={question.correctOptionId}
                                onValueChange={(value) =>
                                  setQuizConfig((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((q) =>
                                      q.id === question.id ? { ...q, correctOptionId: value } : q
                                    ),
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select answer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((option, optionIndex) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {String.fromCharCode(65 + optionIndex)}.{" "}
                                      {option.text || "Untitled option"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Points</label>
                              <Input
                                type="number"
                                min={1}
                                value={question.points}
                                onChange={(e) =>
                                  setQuizConfig((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((q) =>
                                      q.id === question.id
                                        ? {
                                            ...q,
                                            points: parseInt(e.target.value, 10) || 0,
                                          }
                                        : q
                                    ),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Explanation (optional)</label>
                          <Textarea
                            className="min-h-20 mt-2 resize-none"
                            value={question.explanation ?? ""}
                            onChange={(e) =>
                              setQuizConfig((prev) => ({
                                ...prev,
                                questions: prev.questions.map((q) =>
                                  q.id === question.id
                                    ? { ...q, explanation: e.target.value }
                                    : q
                                ),
                              }))
                            }
                            placeholder="Shown to students after submission."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setQuizConfig((prev) => ({
                        ...prev,
                        questions: [
                          ...prev.questions,
                          (() => {
                            const first = { id: `opt-${Math.random().toString(36).slice(2, 8)}`, text: "" }
                            const second = { id: `opt-${Math.random().toString(36).slice(2, 8)}`, text: "" }
                            return {
                              id: `q-${Math.random().toString(36).slice(2, 8)}`,
                              prompt: "",
                              options: [first, second],
                              correctOptionId: first.id,
                              points: 10,
                            }
                          })(),
                        ],
                      }))
                    }
                  >
                    Add Question
                  </Button>
                </div>
              </>
            ) : (
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 resize-none"
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Detailed instructions for students..."
                      />
                    </FormControl>
                    <FormDescription>
                      Provide clear instructions on what students should submit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Maximum Score
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={useQuizBuilder}
                  />
                </FormControl>
                {useQuizBuilder && (
                  <FormDescription>
                    Auto-calculated from quiz questions.
                  </FormDescription>
                )}
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
                  Quiz XP
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabelIcon />
                  Status
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Only published quizzes are visible to students
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {sections.length > 0 && (
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section (Optional)</FormLabel>
                <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Section</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowLateSubmissions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Allow Late Submissions</FormLabel>
                  <FormDescription>
                    Students can submit after the due date
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
        </div>

        <div className="self-end">
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Saving..." : "Save Quiz"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
